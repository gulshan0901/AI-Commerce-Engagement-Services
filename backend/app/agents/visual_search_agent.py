import json
import re
from difflib import SequenceMatcher

from openai import AsyncOpenAI

from ..catalogue import all_products, search_products
from ..config import Settings
from ..models import Product, Recommendation, VisualSearchRequest, VisualSearchResponse


def _json_payload(text: str) -> dict:
    """Accept plain JSON or JSON wrapped in a Markdown fence."""
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", text, re.S)
        return json.loads(match.group(0)) if match else {}


def _tokens(value: str) -> set[str]:
    return set(re.findall(r"[a-z0-9]+", value.lower()))


def _product_type_tokens(product: Product) -> set[str]:
    generic = {"the", "and", "with", "for", "product", "independent", *product.category.split("-")}
    values = _tokens(" ".join([product.name, *product.tags])) - _tokens(product.brand) - generic
    return {value[:-1] if value.endswith("s") and len(value) > 3 else value for value in values}


ACCESSORY_CATEGORIES: dict[str, set[str]] = {
    "laptops": {"mobile-accessories"},
    "smartphones": {"mobile-accessories"},
    "tablets": {"mobile-accessories"},
    "mens-shoes": {"sports-accessories"},
    "womens-shoes": {"sports-accessories"},
}


class VisualSearchAgent:
    """Lets vision rank valid catalogue IDs; all returned records remain repository-grounded."""

    async def run(self, request: VisualSearchRequest, settings: Settings) -> VisualSearchResponse:
        catalogue = all_products()
        product_map = {product.id: product for product in catalogue}
        attributes: dict = {}
        source = "fallback"
        if settings.openai_api_key:
            compact_catalogue = [
                {"id": product.id, "name": product.name, "brand": product.brand, "category": product.category}
                for product in catalogue
            ]
            try:
                client = AsyncOpenAI(api_key=settings.openai_api_key)
                response = await client.responses.create(
                    model=settings.openai_model,
                    input=[{
                        "role": "user",
                        "content": [
                            {"type": "input_text", "text": (
                                "Analyze the product photo and select only from the supplied catalogue. "
                                "Return JSON with summary, category, brand, product_name, keywords, "
                                "accessory_keywords, and candidate_ids (best match first, maximum 4). "
                                "Use only IDs present in this catalogue; prefer an exact visible brand/model match. "
                                f"CATALOGUE={json.dumps(compact_catalogue, separators=(',', ':'))}"
                            )},
                            {"type": "input_image", "image_url": request.image_data_url},
                        ],
                    }],
                )
                attributes = _json_payload(response.output_text)
                source = "openai"
            except Exception:
                attributes = {}

        selected_ids = [str(item) for item in attributes.get("candidate_ids", []) if str(item) in product_map]
        selected = [product_map[product_id] for product_id in selected_ids]
        filename_terms = " ".join(re.findall(r"[a-z0-9]+", request.filename.rsplit(".", 1)[0].lower()))
        if not selected:
            selected = self._rank_fallback(catalogue, attributes, filename_terms)[:4]
        # Keep the exact match visible even when it is currently out of stock.
        if selected:
            anchor_types = _product_type_tokens(selected[0])
            selected = [selected[0], *[
                product for product in selected[1:]
                if product.category == selected[0].category and anchor_types & _product_type_tokens(product)
            ]]
        similar_products = selected[:4]
        anchor = similar_products[0] if similar_products else None
        anchor_price = anchor.price if anchor else float("inf")
        anchor_category = anchor.category if anchor else str(attributes.get("category") or "")
        anchor_types = _product_type_tokens(anchor) if anchor else set()
        cheaper = [
            product for product in catalogue
            if product.in_stock and product.category == anchor_category and product.price < anchor_price
            and product.id not in {item.id for item in similar_products}
            and bool(anchor_types & _product_type_tokens(product))
        ]
        cheaper.sort(key=lambda product: (-product.rating, product.price))
        accessory_query = " ".join(str(term) for term in attributes.get("accessory_keywords", []))
        permitted_accessory_categories = ACCESSORY_CATEGORIES.get(anchor_category, set())
        accessories = search_products(accessory_query) if accessory_query and permitted_accessory_categories else []
        accessories = [
            product for product in accessories
            if product.in_stock and product.category in permitted_accessory_categories
            and product.id not in {item.id for item in similar_products}
        ][:3]
        summary = attributes.get("summary") or (
            f"I matched the strongest catalogue candidates using {filename_terms or 'the available visual clues'}."
        )
        return VisualSearchResponse(
            analysis=str(summary), source=source,
            similar=[Recommendation(
                product=product,
                reasons=["Exact catalogue candidate" if product.id in selected_ids else "Best catalogue attribute match",
                         f"{product.brand} · {product.category.replace('-', ' ')}"],
            ) for product in similar_products],
            cheaper_alternatives=[Recommendation(
                product=product, reasons=[f"${anchor_price - product.price:,.2f} cheaper", f"Rated {product.rating}/5"],
            ) for product in cheaper[:3]],
            matching_accessories=[Recommendation(product=product, reasons=["Relevant matching accessory"]) for product in accessories],
        )

    @staticmethod
    def _rank_fallback(products: list[Product], attributes: dict, filename_terms: str) -> list[Product]:
        product_name = str(attributes.get("product_name") or "").lower()
        brand = str(attributes.get("brand") or "").lower()
        category = str(attributes.get("category") or "").lower().replace(" ", "-")
        keyword_text = " ".join(str(term) for term in attributes.get("keywords", []))
        query = " ".join(filter(None, [product_name, brand, category, keyword_text, filename_terms]))
        query_tokens = _tokens(query)

        def score(product: Product) -> tuple[float, float]:
            name = product.name.lower()
            name_tokens = _tokens(name)
            brand_tokens = _tokens(product.brand)
            category_tokens = _tokens(product.category)
            tag_tokens = _tokens(" ".join(product.tags))
            value = len(query_tokens & name_tokens) * 5
            value += len(query_tokens & brand_tokens) * 6
            value += len(query_tokens & category_tokens) * 3
            value += len(query_tokens & tag_tokens) * 2
            if product_name:
                value += SequenceMatcher(None, product_name, name).ratio() * 12
            if brand and brand == product.brand.lower():
                value += 10
            if category and (category == product.category or category in product.category or product.category in category):
                value += 8
            return value, product.rating

        ranked = sorted(products, key=score, reverse=True)
        return [product for product in ranked if score(product)[0] > 0] or ranked
