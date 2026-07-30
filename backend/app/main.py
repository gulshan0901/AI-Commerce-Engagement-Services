import asyncio
from time import perf_counter
from typing import Annotated

import httpx

from fastapi import Depends, FastAPI, HTTPException, Query, Response
from fastapi.middleware.cors import CORSMiddleware

from .agents.orchestrator import Orchestrator
from .agents.comparison_agent import ComparisonAgent
from .agents.order_agent import OrderAgent
from .agents.recommendation_agent import RecommendationAgent
from .agents.search_agent import SearchAgent
from .agents.support_agent import SupportAgent
from .auth import current_user
from .catalogue import search_products
from .config import Settings, get_settings
from .models import (
    AnalyticsResponse, ChatRequest, ChatResponse, CheckoutRequest, CompareRequest, CompareResponse, ConversationDetail,
    ConversationSummary, Order, OrderItem, PhaseStatus, ProductList, Recommendation,
    FeedbackRequest, FeedbackResponse, RecommendRequest, ReturnRequest, ReturnResponse, SearchRequest, SemanticSearchResponse,
    SupportRequest, SupportResponse, TrackOrderRequest, TrackOrderResponse, User,
)
from .services.faqs import all_faqs
from .services.dependencies import get_analytics_store, get_memory_store, get_order_store, get_retrieval_service

settings = get_settings()
orchestrator = Orchestrator()
search_agent = SearchAgent()
recommendation_agent = RecommendationAgent()
comparison_agent = ComparisonAgent()
support_agent = SupportAgent()
order_agent = OrderAgent(get_order_store())
app = FastAPI(title=settings.app_name, version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/v1/me", response_model=User)
async def me(user: Annotated[User, Depends(current_user)]) -> User:
    return user


@app.get("/api/v1/products", response_model=ProductList)
async def products(
    user: Annotated[User, Depends(current_user)],
    query: str = Query(default="", max_length=120),
    category: str | None = None,
    max_price: float | None = Query(default=None, gt=0),
) -> ProductList:
    items = search_products(query, category, max_price)
    return ProductList(items=items, total=len(items))


@app.post("/api/v1/chat", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    user: Annotated[User, Depends(current_user)],
    app_settings: Annotated[Settings, Depends(get_settings)],
) -> ChatResponse:
    return await run_instrumented_chat(request, app_settings, user.id)


# Public contract aliases. Versioned routes above remain available for clients
# that prefer an explicit API version.
@app.get("/products", response_model=ProductList)
async def public_products(
    response: Response,
    query: str = Query(default="", max_length=120),
    category: str | None = None,
    max_price: float | None = Query(default=None, gt=0),
) -> ProductList:
    response.headers["Cache-Control"] = "public, max-age=30, stale-while-revalidate=120"
    items = search_products(query, category, max_price)
    return ProductList(items=items, total=len(items))


@app.get("/products/{product_id}")
async def product_detail(product_id: str, response: Response):
    item = next((product for product in search_products() if product.id == product_id), None)
    if not item:
        raise HTTPException(status_code=404, detail="Product not found")
    response.headers["Cache-Control"] = "public, max-age=60, stale-while-revalidate=300"
    return item


@app.get("/categories", response_model=list[str])
async def categories(response: Response) -> list[str]:
    response.headers["Cache-Control"] = "public, max-age=60, stale-while-revalidate=300"
    return sorted({product.category for product in search_products()})


@app.get("/categories/summary")
async def category_summaries(response: Response) -> list[dict]:
    response.headers["Cache-Control"] = "public, max-age=60, stale-while-revalidate=300"
    grouped: dict[str, list] = {}
    for product in search_products():
        grouped.setdefault(product.category, []).append(product)
    return [
        {
            "slug": category,
            "image_url": max(products, key=lambda product: product.rating).image_url,
            "product_count": len(products),
        }
        for category, products in sorted(grouped.items())
    ]


@app.post("/search", response_model=ProductList)
async def search(request: SearchRequest, user: Annotated[User, Depends(current_user)]) -> ProductList:
    items = search_agent.run(request)
    return ProductList(items=items, total=len(items))


@app.post("/search/semantic", response_model=SemanticSearchResponse)
async def semantic_search(
    request: SearchRequest, user: Annotated[User, Depends(current_user)]
) -> SemanticSearchResponse:
    return await get_retrieval_service().search(request)


@app.post("/recommend", response_model=list[Recommendation])
async def recommend(request: RecommendRequest, user: Annotated[User, Depends(current_user)]) -> list[Recommendation]:
    return recommendation_agent.run(request)


@app.post("/compare", response_model=CompareResponse)
async def compare(
    request: CompareRequest, user: Annotated[User, Depends(current_user)]
) -> CompareResponse:
    try:
        return comparison_agent.run(request)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@app.get("/faqs")
async def faqs() -> list[dict]:
    return all_faqs()


@app.post("/support", response_model=SupportResponse)
async def support(request: SupportRequest) -> SupportResponse:
    return support_agent.run(request)


@app.post("/chat", response_model=ChatResponse)
async def public_chat(
    request: ChatRequest,
    user: Annotated[User, Depends(current_user)],
    app_settings: Annotated[Settings, Depends(get_settings)],
) -> ChatResponse:
    return await run_instrumented_chat(request, app_settings, user.id)


async def run_instrumented_chat(request: ChatRequest, app_settings: Settings, user_id: str) -> ChatResponse:
    started = perf_counter()
    response = await orchestrator.run(request, app_settings, user_id)
    latency_ms = round((perf_counter() - started) * 1000)
    input_tokens = max(1, len(request.message) // 4)
    output_tokens = max(1, len(response.answer) // 4)
    escalated = "human support specialist" in response.answer.lower()
    await get_analytics_store().record(
        user_id, "chat.completed", response.intent, latency_ms, input_tokens, output_tokens,
        properties={"source": response.source, "grounded": not escalated, "escalated": escalated,
                    "confidence": 0.0 if escalated else 1.0, "tool": response.intent},
    )
    return response


@app.get("/conversations", response_model=list[ConversationSummary])
async def conversations(user: Annotated[User, Depends(current_user)]) -> list[ConversationSummary]:
    return await asyncio.to_thread(get_memory_store().list_conversations, user.id)


@app.get("/conversations/{conversation_id}", response_model=ConversationDetail)
async def conversation(
    conversation_id: str, user: Annotated[User, Depends(current_user)]
) -> ConversationDetail:
    result = await asyncio.to_thread(get_memory_store().conversation, user.id, conversation_id)
    if not result:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return result


@app.post("/orders", response_model=Order, status_code=201)
async def create_order(
    request: CheckoutRequest, user: Annotated[User, Depends(current_user)]
) -> Order:
    product_map = {product.id: product for product in search_products()}
    quantities: dict[str, int] = {}
    for line in request.lines:
        quantities[line.product_id] = quantities.get(line.product_id, 0) + line.quantity
        if quantities[line.product_id] > 20:
            raise HTTPException(status_code=422, detail="Maximum quantity per product is 20")
    missing = [product_id for product_id in quantities if product_id not in product_map]
    unavailable = [product_id for product_id in quantities if product_id in product_map and not product_map[product_id].in_stock]
    if missing:
        raise HTTPException(status_code=422, detail=f"Unknown products: {', '.join(missing)}")
    if unavailable:
        raise HTTPException(status_code=409, detail=f"Products are unavailable: {', '.join(unavailable)}")
    items = [
        OrderItem(
            product_id=product_id, name=product_map[product_id].name, price=product_map[product_id].price,
            quantity=quantity, image_url=product_map[product_id].image_url,
        )
        for product_id, quantity in quantities.items()
    ]
    total = round(sum(item.price * item.quantity for item in items), 2)
    try:
        return await get_order_store().create(
            user.id, items, total, request.delivery_name, request.delivery_email, request.delivery_address
        )
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=503, detail="Order database is temporarily unavailable") from exc


@app.get("/orders", response_model=list[Order])
async def list_orders(user: Annotated[User, Depends(current_user)]) -> list[Order]:
    try:
        return await get_order_store().list(user.id)
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=503, detail="Order database is temporarily unavailable") from exc


@app.get("/orders/{order_id}", response_model=Order)
async def order_detail(order_id: str, user: Annotated[User, Depends(current_user)]) -> Order:
    try:
        order = await get_order_store().get(user.id, order_id)
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=503, detail="Order database is temporarily unavailable") from exc
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


def planned(phase: int, feature: str) -> PhaseStatus:
    return PhaseStatus(phase=phase, message=f"{feature} is scheduled for Phase {phase}.")


@app.post("/orders/track", response_model=TrackOrderResponse)
async def track_order(
    request: TrackOrderRequest, user: Annotated[User, Depends(current_user)]
) -> TrackOrderResponse:
    try:
        result = await order_agent.track(user.id, request.order_id)
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=503, detail="Order database is temporarily unavailable") from exc
    if not result:
        raise HTTPException(status_code=404, detail="Order not found")
    return result


@app.post("/returns", response_model=ReturnResponse)
async def returns(
    request: ReturnRequest, user: Annotated[User, Depends(current_user)]
) -> ReturnResponse:
    try:
        result = await order_agent.request_return(user.id, request.order_id, request.reason)
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=503, detail="Order database is temporarily unavailable") from exc
    if not result:
        raise HTTPException(status_code=409, detail="Order is not eligible for return or was not found")
    return result


@app.get("/analytics", response_model=AnalyticsResponse)
async def analytics(user: Annotated[User, Depends(current_user)]) -> AnalyticsResponse:
    try:
        orders = await get_order_store().list(user.id)
        return await get_analytics_store().dashboard(user.id, len(orders))
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=503, detail="Analytics database is temporarily unavailable") from exc


@app.post("/feedback", response_model=FeedbackResponse, status_code=201)
async def feedback(request: FeedbackRequest, user: Annotated[User, Depends(current_user)]) -> FeedbackResponse:
    if request.conversation_id:
        conversation = await asyncio.to_thread(get_memory_store().conversation, user.id, request.conversation_id)
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
    try:
        return await get_analytics_store().feedback(user.id, request)
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=503, detail="Feedback database is temporarily unavailable") from exc
