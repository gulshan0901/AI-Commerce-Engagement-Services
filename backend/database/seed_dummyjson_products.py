"""Idempotently import the DummyJSON catalogue into Supabase PostgreSQL."""

import httpx

from app.config import get_settings


def row(item: dict) -> dict:
    dimensions = item.get("dimensions") or {}
    specs = {
        "SKU": str(item.get("sku") or "Not specified"),
        "Stock": str(item.get("stock") or 0),
        "Discount": f"{item.get('discountPercentage', 0)}%",
        "Shipping": str(item.get("shippingInformation") or "Not specified"),
        "Warranty": str(item.get("warrantyInformation") or "Not specified"),
        "Return policy": str(item.get("returnPolicy") or "Not specified"),
    }
    if dimensions:
        specs["Dimensions"] = " × ".join(str(dimensions.get(key, "-")) for key in ("width", "height", "depth"))
    images = item.get("images") or []
    return {
        "external_id": f"dj-{item['id']}", "source": "dummyjson", "sku": item["sku"],
        "name": item.get("title") or "Untitled product", "brand": item.get("brand") or "Independent",
        "category": item.get("category") or "other", "description": item.get("description") or "",
        "price": item.get("price") or 0, "rating": item.get("rating") or 0,
        "inventory_count": item.get("stock") or 0,
        "image_url": item.get("thumbnail") or (images[0] if images else None),
        "specs": specs, "tags": [str(tag) for tag in item.get("tags") or []],
    }


def main() -> None:
    settings = get_settings()
    if not settings.supabase_url or not settings.supabase_service_role_key:
        raise RuntimeError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required")
    products_response = httpx.get(settings.product_api_url, timeout=30, follow_redirects=True)
    products_response.raise_for_status()
    rows = [row(item) for item in products_response.json()["products"]]
    endpoint = f"{settings.supabase_url.rstrip('/')}/rest/v1/products"
    headers = {
        "apikey": settings.supabase_service_role_key,
        "Authorization": f"Bearer {settings.supabase_service_role_key}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates,return=minimal",
    }
    for start in range(0, len(rows), 50):
        response = httpx.post(endpoint, params={"on_conflict": "sku"}, headers=headers, json=rows[start:start + 50], timeout=30)
        response.raise_for_status()
    print(f"Imported {len(rows)} DummyJSON products into Supabase.")


if __name__ == "__main__":
    main()
