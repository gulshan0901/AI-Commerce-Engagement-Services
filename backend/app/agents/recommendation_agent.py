"""Rank catalogue products and explain why each recommendation fits."""

from ..catalogue import products_for_message
from ..models import Product, RecommendRequest, Recommendation


class RecommendationAgent:
    """Ranks available products and supplies auditable recommendation reasons."""

    def run(self, request: RecommendRequest) -> list[Recommendation]:
        return [
            Recommendation(
                product=product,
                reasons=self._reasons(product),
            )
            for product in products_for_message(request.message)
        ]

    @staticmethod
    def _reasons(product: Product) -> list[str]:
        return [f"Rated {product.rating}/5", f"Costs ${product.price:,.0f}", "Available now"]
