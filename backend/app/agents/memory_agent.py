import asyncio

from ..services.memory import MemoryStore, SupabaseMemoryStore


class MemoryAgent:
    """Stores conversation turns and learns explicit customer preferences."""

    def __init__(self, store: MemoryStore | SupabaseMemoryStore) -> None:
        self.store = store

    async def prepare(self, user_id: str, conversation_id: str | None, message: str):
        return await asyncio.to_thread(self._prepare, user_id, conversation_id, message)

    def _prepare(self, user_id: str, conversation_id: str | None, message: str):
        conversation_id = self.store.ensure_conversation(user_id, conversation_id, message)
        history = self.store.recent_messages(conversation_id)
        profile = self.store.learn_preferences(user_id, message)
        self.store.add_message(conversation_id, "user", message)
        return conversation_id, history, profile

    async def remember_answer(self, conversation_id: str, answer: str) -> None:
        await asyncio.to_thread(self.store.add_message, conversation_id, "assistant", answer)
