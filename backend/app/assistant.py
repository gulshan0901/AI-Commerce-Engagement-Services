"""Generate grounded shopping answers through OpenAI or local fallbacks."""

import json
from uuid import uuid4

from openai import AsyncOpenAI

from .config import Settings
from .models import ChatRequest, ChatResponse, ConversationMessage, MemoryProfile, Product, Recommendation


SYSTEM_PROMPT = """You are a concise shopping assistant. Use only the provided catalogue.
Never invent products, prices, availability, or specifications. Recommend at most three products.
Explain each recommendation using concrete budget, rating, availability, or specification evidence.
Return JSON with keys `answer` and `recommendations`; each recommendation has `product_id` and `reasons` (an array of short strings).
If nothing fits, say so and suggest how the customer could adjust the request."""


def fallback_response(request: ChatRequest, products: list[Product], memory_used: bool = False) -> ChatResponse:
    recommendations = [
        Recommendation(
            product=product,
            reasons=[f"Rated {product.rating}/5", f"Costs ${product.price:,.0f}", "Available now"],
        )
        for product in products
    ]
    answer = (
        f"I found {len(products)} strong match{'es' if len(products) != 1 else ''}. "
        "I prioritized relevance, rating, price, and current availability."
        if products
        else "I couldn't find an in-stock product matching that request. Try a different category or budget."
    )
    return ChatResponse(
        conversation_id=request.conversation_id or str(uuid4()), answer=answer,
        recommendations=recommendations, source="fallback", memory_used=memory_used,
    )


async def answer_shopping_request(
    request: ChatRequest,
    settings: Settings,
    products: list[Product],
    history: list[ConversationMessage] | None = None,
    profile: MemoryProfile | None = None,
) -> ChatResponse:
    history = history or []
    profile = profile or MemoryProfile()
    memory_used = bool(history or profile.favorite_brands or profile.budget or profile.sizes)
    if not settings.openai_api_key:
        return fallback_response(request, products, memory_used)
    catalogue = json.dumps([product.model_dump() for product in products])
    memory = json.dumps(profile.model_dump())
    recent_history = json.dumps([{"role": item.role, "content": item.content} for item in history])
    client = AsyncOpenAI(api_key=settings.openai_api_key)
    response = await client.responses.create(
        model=settings.openai_model,
        input=[
            {"role": "developer", "content": SYSTEM_PROMPT},
            {"role": "user", "content": f"Customer memory: {memory}\nRecent conversation: {recent_history}\nCustomer request: {request.message}\nRetrieved catalogue candidates: {catalogue}"},
        ],
    )
    try:
        payload = json.loads(response.output_text)
        product_by_id = {product.id: product for product in products}
        recommendations = [
            Recommendation(product=product_by_id[item["product_id"]], reasons=item["reasons"][:4])
            for item in payload.get("recommendations", [])
            if item.get("product_id") in product_by_id
        ]
        return ChatResponse(
            conversation_id=request.conversation_id or str(uuid4()),
            answer=payload["answer"], recommendations=recommendations, source="openai", memory_used=memory_used,
        )
    except (KeyError, TypeError, json.JSONDecodeError):
        return fallback_response(request, products, memory_used)
