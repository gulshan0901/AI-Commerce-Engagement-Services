import json
import re
from functools import lru_cache
from pathlib import Path

from .models import Product


@lru_cache
def all_products() -> list[Product]:
    path = Path(__file__).parent / "data" / "products.json"
    return [Product.model_validate(item) for item in json.loads(path.read_text())]


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

