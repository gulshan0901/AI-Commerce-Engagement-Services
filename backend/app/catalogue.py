import json
import re
from functools import lru_cache
from pathlib import Path
from threading import RLock
from time import monotonic

import httpx

from .config import get_settings
from .models import Product

_remote_cache: list[Product] = []
_remote_cache_until = 0.0
_remote_lock = RLock()
_database_cache: list[Product] = []
_database_cache_until = 0.0


@lru_cache
def local_products() -> list[Product]:
    path = Path(__file__).parent / "data" / "products.json"
    return [Product.model_validate(item) for item in json.loads(path.read_text())]


def _text(value: object, fallback: str = "Not specified") -> str:
    return str(value) if value not in (None, "") else fallback


def _map_dummy_product(item: dict) -> Product:
    dimensions = item.get("dimensions") or {}
    specs = {
        "SKU": _text(item.get("sku")),
        "Stock": str(item.get("stock", 0)),
        "Discount": f"{item.get('discountPercentage', 0)}%",
        "Shipping": _text(item.get("shippingInformation")),
        "Warranty": _text(item.get("warrantyInformation")),
        "Return policy": _text(item.get("returnPolicy")),
    }
    if dimensions:
        specs["Dimensions"] = " × ".join(_text(dimensions.get(key), "-") for key in ("width", "height", "depth"))
    images = item.get("images") or []
    stock = int(item.get("stock") or 0)
    return Product(
        id=f"dj-{item['id']}", name=item.get("title") or "Untitled product",
        brand=item.get("brand") or "Independent", category=item.get("category") or "other",
        description=item.get("description") or "", price=float(item.get("price") or 0),
        rating=float(item.get("rating") or 0), in_stock=stock > 0 and item.get("availabilityStatus") != "Out of Stock",
        image_url=item.get("thumbnail") or (images[0] if images else ""), specs=specs,
        tags=[str(tag) for tag in item.get("tags") or []],
    )


def _map_database_product(item: dict) -> Product:
    return Product(
        id=item.get("external_id") or item["sku"], name=item["name"], brand=item["brand"],
        category=item["category"], description=item.get("description") or "", price=float(item["price"]),
        rating=float(item.get("rating") or 0), in_stock=int(item.get("inventory_count") or 0) > 0,
        image_url=item.get("image_url") or "", specs=item.get("specs") or {}, tags=item.get("tags") or [],
    )


def database_products() -> list[Product]:
    global _database_cache, _database_cache_until
    settings = get_settings()
    if not settings.supabase_url or not settings.supabase_service_role_key:
        return []
    now = monotonic()
    with _remote_lock:
        if _database_cache and now < _database_cache_until:
            return _database_cache
        try:
            response = httpx.get(
                f"{settings.supabase_url.rstrip('/')}/rest/v1/products",
                params={"select": "external_id,sku,name,brand,category,description,price,rating,inventory_count,image_url,specs,tags", "order": "rating.desc", "limit": "1000"},
                headers={"apikey": settings.supabase_service_role_key, "Authorization": f"Bearer {settings.supabase_service_role_key}"},
                timeout=8,
            )
            response.raise_for_status()
            _database_cache = [_map_database_product(item) for item in response.json()]
            _database_cache_until = now + 60
        except (httpx.HTTPError, KeyError, TypeError, ValueError):
            pass
        return _database_cache


def remote_products() -> list[Product]:
    global _remote_cache, _remote_cache_until
    url = get_settings().product_api_url.strip()
    if not url:
        return []
    now = monotonic()
    with _remote_lock:
        if _remote_cache and now < _remote_cache_until:
            return _remote_cache
        try:
            response = httpx.get(url, timeout=8, follow_redirects=True)
            response.raise_for_status()
            _remote_cache = [_map_dummy_product(item) for item in response.json().get("products", [])]
            _remote_cache_until = now + 600
        except (httpx.HTTPError, KeyError, TypeError, ValueError):
            # Keep the previous remote snapshot if the demo API is temporarily unavailable.
            pass
        return _remote_cache


def all_products() -> list[Product]:
    primary = database_products() or remote_products()
    known_ids = {product.id for product in primary}
    return [*primary, *(product for product in local_products() if product.id not in known_ids)]


def search_products(query: str = "", category: str | None = None, max_price: float | None = None) -> list[Product]:
    terms = set(re.findall(r"[a-z0-9]+", query.lower()))
    results: list[tuple[int, Product]] = []
    for product in all_products():
        if category and product.category.lower() != category.lower():
            continue
        if max_price is not None and product.price > max_price:
            continue
        haystack = " ".join([product.name, product.brand, product.category, product.description, *product.tags]).lower()
        score = sum(term in haystack for term in terms)
        if not terms or score:
            results.append((score, product))
    return [item[1] for item in sorted(results, key=lambda item: (item[0], item[1].rating), reverse=True)]


def products_for_message(message: str) -> list[Product]:
    price_match = re.search(r"(?:under|below|less than|max(?:imum)?(?: of)?)\s*\$?([0-9,]+)", message, re.I)
    max_price = float(price_match.group(1).replace(",", "")) if price_match else None
    stopwords = {"i", "a", "an", "the", "need", "want", "find", "show", "me", "under", "below", "for", "with", "best", "please"}
    query = " ".join(word for word in re.findall(r"[a-z0-9-]+", message.lower()) if word not in stopwords and not word.isdigit())
    matches = search_products(query=query, max_price=max_price)
    return [product for product in matches if product.in_stock][:3]
