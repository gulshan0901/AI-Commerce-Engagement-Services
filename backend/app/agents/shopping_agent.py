"""Coordinate natural-language shopping assistance and recommendations."""

from ..assistant import answer_shopping_request
from ..config import Settings
from ..models import ChatRequest, ChatResponse, ConversationMessage, MemoryProfile, Product


class ShoppingAgent:
    """Handles natural-language product discovery and explanation."""

    async def run(
        self, request: ChatRequest, settings: Settings, products: list[Product],
        history: list[ConversationMessage], profile: MemoryProfile,
    ) -> ChatResponse:
        return await answer_shopping_request(request, settings, products, history, profile)
