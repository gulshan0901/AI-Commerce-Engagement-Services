"""Translate analytics stores into dashboard-ready operational metrics."""

from ..services.analytics import LocalAnalyticsStore, SupabaseAnalyticsStore


class AnalyticsAgent:
    """Builds a user-scoped quality, performance, cost, and commerce dashboard."""

    def __init__(self, store: LocalAnalyticsStore | SupabaseAnalyticsStore) -> None:
        self.store = store

    async def run(self, user_id: str, order_count: int):
        return await self.store.dashboard(user_id, order_count)
