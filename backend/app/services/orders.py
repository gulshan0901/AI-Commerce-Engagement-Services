from datetime import datetime, timezone
from threading import RLock
from uuid import uuid4

import httpx

from ..config import Settings
from ..models import Order, OrderItem


class LocalOrderStore:
    """Credential-free order repository used by tests and local demos."""

    def __init__(self) -> None:
        self.orders: list[Order] = []
        self.lock = RLock()

    async def create(
        self, user_id: str, items: list[OrderItem], total: float,
        delivery_name: str, delivery_email: str, delivery_address: str,
    ) -> Order:
        now = datetime.now(timezone.utc)
        order = Order(
            id=str(uuid4()), user_id=user_id, status="confirmed", total=total, items=items,
            delivery_name=delivery_name, delivery_email=delivery_email,
            delivery_address=delivery_address, created_at=now, updated_at=now,
        )
        with self.lock:
            self.orders.insert(0, order)
        return order

    async def list(self, user_id: str) -> list[Order]:
        with self.lock:
            return [order for order in self.orders if order.user_id == user_id]

    async def get(self, user_id: str, order_id: str) -> Order | None:
        with self.lock:
            return next((order for order in self.orders if order.user_id == user_id and order.id == order_id), None)

    async def request_return(self, user_id: str, order_id: str, reason: str) -> Order | None:
        with self.lock:
            order = next((order for order in self.orders if order.user_id == user_id and order.id == order_id), None)
            if not order:
                return None
            updated = order.model_copy(update={
                "status": "return_requested", "return_reason": reason,
                "return_requested_at": datetime.now(timezone.utc), "updated_at": datetime.now(timezone.utc),
            })
            self.orders = [updated if item.id == order_id else item for item in self.orders]
            return updated


class SupabaseOrderStore:
    """Backend-only Supabase PostgREST order repository."""

    def __init__(self, url: str, service_role_key: str) -> None:
        self.client = httpx.AsyncClient(
            base_url=f"{url.rstrip('/')}/rest/v1/",
            headers={
                "apikey": service_role_key,
                "Authorization": f"Bearer {service_role_key}",
                "Content-Type": "application/json",
            },
            timeout=15,
        )

    async def create(
        self, user_id: str, items: list[OrderItem], total: float,
        delivery_name: str, delivery_email: str, delivery_address: str,
    ) -> Order:
        order_id = str(uuid4())
        payload = {
            "id": order_id,
            "user_id": user_id,
            "status": "confirmed",
            "total": total,
            "items": [item.model_dump() for item in items],
            "delivery_name": delivery_name,
            "delivery_email": delivery_email,
            "delivery_address": delivery_address,
        }
        response = await self.client.post("orders", json=payload, headers={"Prefer": "return=representation"})
        response.raise_for_status()
        return self._order(response.json()[0])

    async def list(self, user_id: str) -> list[Order]:
        response = await self.client.get(
            "orders", params={"user_id": f"eq.{user_id}", "select": "*", "order": "created_at.desc"}
        )
        response.raise_for_status()
        return [self._order(row) for row in response.json()]

    async def get(self, user_id: str, order_id: str) -> Order | None:
        response = await self.client.get(
            "orders", params={"id": f"eq.{order_id}", "user_id": f"eq.{user_id}", "select": "*"}
        )
        response.raise_for_status()
        rows = response.json()
        return self._order(rows[0]) if rows else None

    async def request_return(self, user_id: str, order_id: str, reason: str) -> Order | None:
        response = await self.client.patch(
            "orders",
            params={"id": f"eq.{order_id}", "user_id": f"eq.{user_id}", "status": "in.(confirmed,shipped,delivered)"},
            json={"status": "return_requested", "return_reason": reason, "return_requested_at": datetime.now(timezone.utc).isoformat()},
            headers={"Prefer": "return=representation"},
        )
        response.raise_for_status()
        rows = response.json()
        return self._order(rows[0]) if rows else None

    @staticmethod
    def _order(row: dict) -> Order:
        return Order(
            id=row["id"], user_id=row["user_id"], status=row["status"], total=float(row["total"]),
            items=[OrderItem.model_validate(item) for item in row.get("items", [])],
            tracking_number=row.get("tracking_number"),
            delivery_name=row.get("delivery_name", ""), delivery_email=row.get("delivery_email", ""),
            delivery_address=row.get("delivery_address", ""),
            return_reason=row.get("return_reason"),
            return_requested_at=(datetime.fromisoformat(row["return_requested_at"].replace("Z", "+00:00")) if row.get("return_requested_at") else None),
            created_at=datetime.fromisoformat(row["created_at"].replace("Z", "+00:00")),
            updated_at=datetime.fromisoformat(row["updated_at"].replace("Z", "+00:00")),
        )


def build_order_store(settings: Settings) -> LocalOrderStore | SupabaseOrderStore:
    if settings.supabase_url and settings.supabase_service_role_key:
        return SupabaseOrderStore(settings.supabase_url, settings.supabase_service_role_key)
    return LocalOrderStore()
