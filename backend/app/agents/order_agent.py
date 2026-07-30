from ..models import ReturnResponse, TrackOrderResponse
from ..services.orders import LocalOrderStore, SupabaseOrderStore


class OrderAgent:
    """Provides ownership-scoped tracking and return workflows."""

    def __init__(self, store: LocalOrderStore | SupabaseOrderStore) -> None:
        self.store = store

    async def track(self, user_id: str, order_id: str) -> TrackOrderResponse | None:
        order = await self.store.get(user_id, order_id)
        if not order:
            return None
        summary = f"Order {order.id} is {order.status.replace('_', ' ')}."
        if order.tracking_number:
            summary += f" Tracking number: {order.tracking_number}."
        return TrackOrderResponse(order=order, summary=summary)

    async def request_return(self, user_id: str, order_id: str, reason: str) -> ReturnResponse | None:
        order = await self.store.request_return(user_id, order_id, reason)
        if not order:
            return None
        return ReturnResponse(order=order, message="Your return request has been recorded for review.")
