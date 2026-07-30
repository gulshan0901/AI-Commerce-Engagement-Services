"""Index product embeddings and perform semantic catalogue retrieval."""

import math

import httpx

from ..catalogue import all_products
from ..config import Settings
from ..models import Product, SearchRequest, SemanticSearchResponse
from .embeddings import EmbeddingService


def product_document(product: Product) -> str:
    specs = " ".join(f"{key} {value}" for key, value in product.specs.items())
    return " ".join([
        product.name, product.brand, product.category, product.description,
        *product.tags, specs, f"price {product.price}", f"rating {product.rating}",
    ])


class RetrievalService:
    """Semantic product retrieval using Supabase pgvector or local vectors."""

    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self.embeddings = EmbeddingService(settings)
        self.client = None
        if settings.supabase_url and settings.supabase_service_role_key and settings.openai_api_key:
            self.client = httpx.AsyncClient(
                base_url=f"{settings.supabase_url.rstrip('/')}/rest/v1/",
                headers={
                    "apikey": settings.supabase_service_role_key,
                    "Authorization": f"Bearer {settings.supabase_service_role_key}",
                    "Content-Type": "application/json",
                },
                timeout=20,
            )
        self._indexed = False

    async def search(self, request: SearchRequest, limit: int = 6) -> SemanticSearchResponse:
        if self.client:
            await self.ensure_index()
            query_vector = (await self.embeddings.embed([request.query]))[0]
            response = await self.client.post(
                "rpc/match_product_embeddings",
                json={"query_embedding": query_vector, "match_count": max(limit * 2, 10)},
            )
            response.raise_for_status()
            product_map = {product.id: product for product in all_products()}
            items = [product_map[row["source_id"]] for row in response.json() if row.get("source_id") in product_map]
            items = self._constraints(items, request)[:limit]
            return SemanticSearchResponse(items=items, total=len(items), source="supabase")
        return await self._local_search(request, limit)

    async def ensure_index(self) -> None:
        if not self.client or self._indexed:
            return
        products = all_products()
        vectors = await self.embeddings.embed([product_document(product) for product in products])
        response = await self.client.post(
            "embeddings",
            params={"on_conflict": "source_type,source_id"},
            headers={"Prefer": "resolution=merge-duplicates"},
            json=[
                {
                    "source_type": "product",
                    "source_id": product.id,
                    "content": product_document(product),
                    "embedding": vector,
                    "metadata": {"category": product.category, "price": product.price},
                }
                for product, vector in zip(products, vectors, strict=True)
            ],
        )
        response.raise_for_status()
        self._indexed = True

    async def _local_search(self, request: SearchRequest, limit: int) -> SemanticSearchResponse:
        products = self._constraints(list(all_products()), request)
        vectors = await self.embeddings.embed([request.query, *[product_document(product) for product in products]])
        query_vector, product_vectors = vectors[0], vectors[1:]
        ranked = sorted(
            zip(products, product_vectors, strict=True),
            key=lambda item: self._cosine(query_vector, item[1]),
            reverse=True,
        )
        items = [product for product, _ in ranked[:limit]]
        return SemanticSearchResponse(items=items, total=len(items), source="local")

    @staticmethod
    def _constraints(products: list[Product], request: SearchRequest) -> list[Product]:
        return [
            product for product in products
            if (not request.category or product.category.lower() == request.category.lower())
            and (request.max_price is None or product.price <= request.max_price)
            and product.in_stock
        ]

    @staticmethod
    def _cosine(left: list[float], right: list[float]) -> float:
        left_norm = math.sqrt(sum(value * value for value in left)) or 1.0
        right_norm = math.sqrt(sum(value * value for value in right)) or 1.0
        return sum(a * b for a, b in zip(left, right, strict=True)) / (left_norm * right_norm)
