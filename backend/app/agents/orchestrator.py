"""Route customer requests to the appropriate specialized commerce agent."""

import re

from ..config import Settings
from ..models import ChatRequest, ChatResponse, SearchRequest
from ..models import CompareRequest, Recommendation, SupportRequest
from ..catalogue import all_products
from ..services.dependencies import get_memory_store, get_order_store, get_retrieval_service
from .comparison_agent import ComparisonAgent
from .intent_agent import IntentAgent
from .memory_agent import MemoryAgent
from .order_agent import OrderAgent
from .shopping_agent import ShoppingAgent
from .support_agent import SupportAgent


class Orchestrator:
    """Routes shopping requests through Phase 2 retrieval and memory services."""

    def __init__(self) -> None:
        self.shopping = ShoppingAgent()
        self.memory = MemoryAgent(get_memory_store())
        self.retrieval = get_retrieval_service()
        self.intent = IntentAgent()
        self.comparison = ComparisonAgent()
        self.support = SupportAgent()
        self.orders = OrderAgent(get_order_store())

    async def run(self, request: ChatRequest, settings: Settings, user_id: str) -> ChatResponse:
        conversation_id, history, profile = await self.memory.prepare(
            user_id, request.conversation_id, request.message
        )
        intent = self.intent.detect(request.message)
        if intent.intent == "support":
            support = self.support.run(SupportRequest(question=request.message))
            return await self._finish(conversation_id, ChatResponse(
                conversation_id=conversation_id, answer=support.answer, recommendations=[],
                source="fallback", memory_used=bool(history), intent="support",
            ))
        if intent.intent == "comparison":
            mentioned = self._mentioned_products(request.message)
            if len(mentioned) < 2:
                return await self._finish(conversation_id, ChatResponse(
                    conversation_id=conversation_id,
                    answer="Tell me the names of at least two catalogue products to compare.",
                    recommendations=[], source="fallback", memory_used=bool(history), intent="comparison",
                ))
            comparison = self.comparison.run(CompareRequest(product_ids=mentioned[:4]))
            return await self._finish(conversation_id, ChatResponse(
                conversation_id=conversation_id, answer=comparison.verdict,
                recommendations=[Recommendation(product=product, reasons=["Included in the grounded comparison"]) for product in comparison.products],
                source="fallback", memory_used=bool(history), intent="comparison",
            ))
        if intent.intent in {"order_tracking", "return"}:
            order_id = self._order_id(request.message)
            if not order_id:
                return await self._finish(conversation_id, ChatResponse(
                    conversation_id=conversation_id, answer="Please include the order ID from your Orders page.",
                    recommendations=[], source="fallback", memory_used=bool(history), intent=intent.intent,
                ))
            if intent.intent == "order_tracking":
                tracking = await self.orders.track(user_id, order_id)
                answer = tracking.summary if tracking else "I couldn't find that order in your account."
            else:
                returned = await self.orders.request_return(user_id, order_id, request.message)
                answer = returned.message if returned else "That order could not be returned. Check its status and order ID."
            return await self._finish(conversation_id, ChatResponse(
                conversation_id=conversation_id, answer=answer, recommendations=[], source="fallback",
                memory_used=bool(history), intent=intent.intent,
            ))
        price = re.search(r"(?:under|below|less than|max(?:imum)?(?: of)?)\s*\$?([0-9,]+)", request.message, re.I)
        search_request = SearchRequest(
            query=request.message,
            max_price=float(price.group(1).replace(",", "")) if price else profile.budget,
        )
        retrieval = await self.retrieval.search(search_request, limit=3)
        contextual_request = request.model_copy(update={"conversation_id": conversation_id})
        response = await self.shopping.run(
            contextual_request, settings, retrieval.items, history, profile
        )
        response.intent = "shopping"
        return await self._finish(conversation_id, response)

    async def _finish(self, conversation_id: str, response: ChatResponse) -> ChatResponse:
        await self.memory.remember_answer(conversation_id, response.answer)
        return response

    @staticmethod
    def _mentioned_products(message: str) -> list[str]:
        text = message.lower()
        message_tokens = set(re.findall(r"[a-z0-9]+", text))
        scored = []
        for product in all_products():
            aliases = [product.name.lower(), product.brand.lower()]
            score = sum(3 for alias in aliases if alias in text)
            name_tokens = set(re.findall(r"[a-z0-9]+", product.name.lower()))
            score += len(name_tokens & message_tokens)
            if score:
                scored.append((score, product.id))
        return [product_id for _, product_id in sorted(scored, reverse=True)]

    @staticmethod
    def _order_id(message: str) -> str | None:
        match = re.search(r"\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b", message, re.I)
        return match.group(0) if match else None
