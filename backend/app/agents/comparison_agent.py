from ..catalogue import all_products
from ..models import CompareRequest, CompareResponse, ComparisonRow, Product


class ComparisonAgent:
    """Builds a factual comparison matrix from catalogue records only."""

    def run(self, request: CompareRequest) -> CompareResponse:
        product_map = {product.id: product for product in all_products()}
        products = [product_map[product_id] for product_id in dict.fromkeys(request.product_ids) if product_id in product_map]
        if len(products) < 2:
            raise ValueError("At least two valid, distinct products are required")
        spec_names = sorted({key for product in products for key in product.specs})
        rows = [
            ComparisonRow(attribute="Price", values={product.id: f"${product.price:,.0f}" for product in products}),
            ComparisonRow(attribute="Rating", values={product.id: f"{product.rating}/5" for product in products}),
            ComparisonRow(attribute="Availability", values={product.id: "In stock" if product.in_stock else "Unavailable" for product in products}),
            *[
                ComparisonRow(attribute=spec, values={product.id: product.specs.get(spec, "—") for product in products})
                for spec in spec_names
            ],
        ]
        best = max(products, key=self._score)
        verdict = f"{best.name} is the strongest overall choice based on availability, rating, and value."
        return CompareResponse(products=products, rows=rows, verdict=verdict, best_product_id=best.id)

    @staticmethod
    def _score(product: Product) -> float:
        return (2 if product.in_stock else -5) + product.rating * 2 - product.price / 1000

