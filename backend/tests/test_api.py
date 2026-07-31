import asyncio
import os
from unittest.mock import AsyncMock

import httpx
from fastapi.testclient import TestClient

os.environ["MEMORY_DATABASE_PATH"] = ":memory:"
os.environ["SUPABASE_SERVICE_ROLE_KEY"] = ""
os.environ["OPENAI_API_KEY"] = ""
os.environ["PRODUCT_API_URL"] = ""

from app.config import Settings
from app.main import app
from app.models import SearchRequest
from app.services.retrieval import RetrievalService

client = TestClient(app)


def test_health() -> None:
    assert client.get("/health").json() == {"status": "ok"}


def test_catalogue_search_and_price_filter() -> None:
    response = client.get("/api/v1/products", params={"query": "gaming", "max_price": 1200})
    assert response.status_code == 200
    payload = response.json()
    assert payload["total"] == 2
    assert all(item["price"] <= 1200 for item in payload["items"])


def test_public_commerce_catalogue_contract() -> None:
    assert client.get("/categories").json() == ["audio", "laptops", "shoes"]
    detail = client.get("/products/lap-001")
    assert detail.status_code == 200
    assert detail.json()["name"] == "Apex G15"
    assert client.get("/products/missing").status_code == 404


def test_catalogue_pagination_preserves_filtered_total() -> None:
    first = client.get("/products", params={"offset": 0, "limit": 2}).json()
    second = client.get("/products", params={"offset": 2, "limit": 2}).json()

    assert first["total"] >= 4
    assert len(first["items"]) == 2
    assert len(second["items"]) == 2
    assert {item["id"] for item in first["items"]}.isdisjoint(item["id"] for item in second["items"])

    filtered = client.get("/products", params={"category": "laptops", "offset": 0, "limit": 1}).json()
    assert filtered["total"] == 3
    assert len(filtered["items"]) == 1


def test_chat_recommends_explainable_products_without_api_key() -> None:
    response = client.post("/chat", json={"message": "I need a gaming laptop under $1200"})
    assert response.status_code == 200
    payload = response.json()
    assert payload["source"] == "fallback"
    assert payload["recommendations"]
    assert all(item["reasons"] for item in payload["recommendations"])
    assert all(item["product"]["price"] <= 1200 for item in payload["recommendations"])


def test_search_and_recommend_contract_routes() -> None:
    search = client.post("/search", json={"query": "running", "max_price": 140})
    assert search.status_code == 200
    assert search.json()["items"][0]["id"] == "shoe-001"

    recommend = client.post("/recommend", json={"message": "running shoes under $140"})
    assert recommend.status_code == 200
    assert recommend.json()[0]["reasons"]


def test_grounded_comparison_and_support_agents() -> None:
    comparison = client.post("/compare", json={"product_ids": ["lap-001", "lap-002"]})
    assert comparison.status_code == 200
    assert comparison.json()["best_product_id"] in {"lap-001", "lap-002"}
    assert any(row["attribute"] == "Price" for row in comparison.json()["rows"])

    support = client.post("/support", json={"question": "What is the return window?"})
    assert support.status_code == 200
    assert "30 days" in support.json()["answer"]
    assert support.json()["sources"]


def test_semantic_search_uses_local_vector_fallback() -> None:
    response = client.post("/search/semantic", json={"query": "portable gaming laptop", "max_price": 1300})
    assert response.status_code == 200
    payload = response.json()
    assert payload["source"] == "local"
    assert payload["items"][0]["id"] == "lap-002"


def test_conversation_history_and_memory_are_persisted() -> None:
    first = client.post("/chat", json={"message": "I prefer NovaTech and need a gaming laptop under $1200"})
    assert first.status_code == 200
    conversation_id = first.json()["conversation_id"]

    second = client.post("/chat", json={"message": "What else would suit me?", "conversation_id": conversation_id})
    assert second.status_code == 200
    assert second.json()["memory_used"] is True

    detail = client.get(f"/conversations/{conversation_id}")
    assert detail.status_code == 200
    messages = detail.json()["messages"]
    assert [message["role"] for message in messages] == ["user", "assistant", "user", "assistant"]
    assert client.get("/conversations").json()[0]["id"] == conversation_id


def test_supabase_pgvector_rpc_path_and_result_mapping() -> None:
    seen_path = ""

    def handler(request: httpx.Request) -> httpx.Response:
        nonlocal seen_path
        seen_path = request.url.path
        return httpx.Response(200, json=[{"source_id": "lap-002", "similarity": 0.94, "metadata": {}}])

    settings = Settings(
        supabase_url="https://example.supabase.co",
        supabase_service_role_key="test-service-key",
        openai_api_key="test-openai-key",
    )
    service = RetrievalService(settings)
    assert service.client is not None
    original_client = service.client
    service.client = httpx.AsyncClient(
        base_url="https://example.supabase.co/rest/v1/",
        transport=httpx.MockTransport(handler),
    )
    service._indexed = True
    service.embeddings.embed = AsyncMock(return_value=[[0.0] * 1536])

    result = asyncio.run(service.search(SearchRequest(query="portable laptop")))
    asyncio.run(original_client.aclose())
    asyncio.run(service.client.aclose())

    assert seen_path == "/rest/v1/rpc/match_product_embeddings"
    assert result.source == "supabase"
    assert result.items[0].id == "lap-002"


def test_database_order_contract_reprices_and_persists_items() -> None:
    checkout = client.post("/orders", json={
        "lines": [{"product_id": "lap-001", "quantity": 2}],
        "delivery_name": "Test Customer",
        "delivery_email": "customer@example.com",
        "delivery_address": "123 Commerce Street",
    })
    assert checkout.status_code == 201
    order = checkout.json()
    assert order["total"] == 2198
    assert order["items"][0]["name"] == "Apex G15"

    listing = client.get("/orders")
    assert listing.status_code == 200
    assert listing.json()[0]["id"] == order["id"]
    assert client.get(f"/orders/{order['id']}").status_code == 200

    tracking = client.post("/orders/track", json={"order_id": order["id"]})
    assert tracking.status_code == 200
    assert order["id"] in tracking.json()["summary"]

    returned = client.post("/returns", json={"order_id": order["id"], "reason": "The laptop is no longer needed"})
    assert returned.status_code == 200
    assert returned.json()["order"]["status"] == "return_requested"


def test_checkout_rejects_unknown_or_unavailable_products() -> None:
    base = {
        "delivery_name": "Test Customer", "delivery_email": "customer@example.com",
        "delivery_address": "123 Commerce Street",
    }
    unknown = client.post("/orders", json={**base, "lines": [{"product_id": "missing", "quantity": 1}]})
    assert unknown.status_code == 422
    unavailable = client.post("/orders", json={**base, "lines": [{"product_id": "lap-003", "quantity": 1}]})
    assert unavailable.status_code == 409


def test_chat_intent_router_handles_support_and_comparison() -> None:
    support = client.post("/chat", json={"message": "What is your return policy?"})
    assert support.status_code == 200
    assert support.json()["intent"] == "support"
    assert "30 days" in support.json()["answer"]

    comparison = client.post("/chat", json={"message": "Compare Apex G15 versus Stratus 14"})
    assert comparison.status_code == 200
    assert comparison.json()["intent"] == "comparison"
    assert len(comparison.json()["recommendations"]) == 2


def test_phase4_feedback_and_user_scoped_analytics() -> None:
    chat = client.post("/chat", json={"message": "Recommend running shoes under $140"})
    assert chat.status_code == 200
    conversation_id = chat.json()["conversation_id"]

    feedback = client.post("/feedback", json={
        "conversation_id": conversation_id, "rating": 5, "comment": "Grounded and useful",
    })
    assert feedback.status_code == 201
    assert feedback.json()["rating"] == 5

    dashboard = client.get("/analytics")
    assert dashboard.status_code == 200
    cards = {card["label"]: card["value"] for card in dashboard.json()["cards"]}
    assert cards["AI requests"] >= 1
    assert cards["Customer satisfaction"] == 5
    assert cards["Grounded response rate"] == 100
    assert dashboard.json()["tool_usage"]["shopping"] >= 1


def test_agent_observability_conversation_trace_and_optimization() -> None:
    chat = client.post("/chat", json={"message": "Find a gaming laptop under $1200"})
    assert chat.status_code == 200
    conversation_id = chat.json()["conversation_id"]

    listing = client.get("/analytics/conversations")
    assert listing.status_code == 200
    assert any(item["id"] == conversation_id for item in listing.json())

    detail = client.get(f"/analytics/conversations/{conversation_id}")
    assert detail.status_code == 200
    assert detail.json()["turns"][0]["spans"]
    assert detail.json()["conversation"]["total_tokens"] > 0

    review = client.post(f"/analytics/conversations/{conversation_id}/review")
    assert review.status_code == 200
    assert 1 <= review.json()["score"] <= 5

    improvement = client.post(f"/analytics/conversations/{conversation_id}/improvements", json={
        "feedback": "Ask a clarifying question before recommending products.",
        "conversation_area": "All turns", "improvement_focus": "Accuracy",
    })
    assert improvement.status_code == 200
    assert improvement.json()["ideas"]


def test_feedback_rejects_conversation_not_owned_by_user() -> None:
    response = client.post("/feedback", json={"conversation_id": "missing", "rating": 4})
    assert response.status_code == 404


def test_visual_search_falls_back_to_grounded_filename_matching() -> None:
    response = client.post("/search/visual", json={
        "image_data_url": "data:image/png;base64,aGVsbG8td29ybGQ=",
        "filename": "running-shoes.png",
    })
    assert response.status_code == 200
    payload = response.json()
    assert payload["source"] == "fallback"
    assert payload["similar"]
    assert all(item["product"]["id"].startswith("shoe-") for item in payload["similar"])
