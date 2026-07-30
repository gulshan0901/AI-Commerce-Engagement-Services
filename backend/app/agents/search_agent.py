from ..catalogue import search_products
from ..models import Product, SearchRequest


class SearchAgent:
    """Applies catalogue search and hard customer constraints."""

    def run(self, request: SearchRequest) -> list[Product]:
        return search_products(request.query, request.category, request.max_price)

