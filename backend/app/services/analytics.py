import json
import sqlite3
from datetime import datetime, timezone
from threading import RLock
from uuid import uuid4

import httpx

from ..models import AgentMetric, AnalyticsResponse, FeedbackRequest, FeedbackResponse, MetricCard


def _dashboard(events: list[dict], feedback: list[dict], order_count: int) -> AnalyticsResponse:
    chat = [event for event in events if event.get("event_name") == "chat.completed"]
    ratings = [int(item["rating"]) for item in feedback]
    latency = [int(event.get("latency_ms") or 0) for event in chat]
    input_tokens = sum(int(event.get("input_tokens") or 0) for event in events)
    output_tokens = sum(int(event.get("output_tokens") or 0) for event in events)
    cost = sum(float(event.get("estimated_cost") or 0) for event in events)
    properties = [event.get("properties") or {} for event in chat]
    resolved = sum(1 for item in properties if not item.get("escalated", False))
    grounded = sum(1 for item in properties if item.get("grounded", False))
    satisfaction = round(sum(ratings) / len(ratings), 2) if ratings else 0
    grounded_rate = round(grounded / len(chat) * 100, 1) if chat else 0
    quality_score = round(satisfaction / 5 * 100, 1) if ratings else grounded_rate
    agents: dict[str, list[dict]] = {}
    tools: dict[str, int] = {}
    for event in events:
        agent = event.get("agent_name") or "platform"
        agents.setdefault(agent, []).append(event)
        tool = (event.get("properties") or {}).get("tool")
        if tool:
            tools[tool] = tools.get(tool, 0) + 1
    agent_rows = [AgentMetric(
        agent=name, requests=len(rows),
        average_latency_ms=round(sum(int(row.get("latency_ms") or 0) for row in rows) / len(rows), 1),
        satisfaction=satisfaction or None,
    ) for name, rows in sorted(agents.items())]
    return AnalyticsResponse(cards=[
        MetricCard(label="AI requests", value=len(chat)),
        MetricCard(label="Average latency", value=round(sum(latency) / len(latency), 1) if latency else 0, unit="ms"),
        MetricCard(label="Customer satisfaction", value=satisfaction, unit="/5"),
        MetricCard(label="Response quality", value=quality_score, unit="%"),
        MetricCard(label="Hallucination risk", value=round(100 - grounded_rate, 1) if chat else 0, unit="%"),
        MetricCard(label="AI resolution rate", value=round(resolved / len(chat) * 100, 1) if chat else 0, unit="%"),
        MetricCard(label="Grounded response rate", value=grounded_rate, unit="%"),
        MetricCard(label="Estimated token usage", value=input_tokens + output_tokens, unit="tokens"),
        MetricCard(label="Estimated AI cost", value=round(cost, 6), unit="USD"),
        MetricCard(label="Orders created", value=order_count),
    ], agent_performance=agent_rows, tool_usage=tools, recent_events=len(events))


class LocalAnalyticsStore:
    def __init__(self, path: str = ":memory:") -> None:
        self.connection = sqlite3.connect(path, check_same_thread=False)
        self.connection.row_factory = sqlite3.Row
        self.lock = RLock()
        with self.connection:
            self.connection.executescript("""
            create table if not exists local_analytics (id text primary key, user_id text, event_name text,
              agent_name text, latency_ms integer, input_tokens integer, output_tokens integer,
              estimated_cost real, properties text, created_at text);
            create table if not exists local_feedback (id text primary key, user_id text, conversation_id text,
              message_id text, rating integer, comment text, created_at text);
            """)

    async def record(self, user_id: str, event_name: str, agent_name: str, latency_ms: int = 0,
                     input_tokens: int = 0, output_tokens: int = 0, estimated_cost: float = 0,
                     properties: dict | None = None) -> None:
        with self.lock, self.connection:
            self.connection.execute("insert into local_analytics values (?,?,?,?,?,?,?,?,?,?)", (
                str(uuid4()), user_id, event_name, agent_name, latency_ms, input_tokens, output_tokens,
                estimated_cost, json.dumps(properties or {}), datetime.now(timezone.utc).isoformat()))

    async def feedback(self, user_id: str, request: FeedbackRequest) -> FeedbackResponse:
        feedback_id = str(uuid4())
        with self.lock, self.connection:
            self.connection.execute("insert into local_feedback values (?,?,?,?,?,?,?)", (
                feedback_id, user_id, request.conversation_id, request.message_id, request.rating,
                request.comment, datetime.now(timezone.utc).isoformat()))
        await self.record(user_id, "feedback.submitted", "feedback", properties={"rating": request.rating})
        return FeedbackResponse(id=feedback_id, rating=request.rating)

    async def dashboard(self, user_id: str, order_count: int) -> AnalyticsResponse:
        with self.lock:
            events = [dict(row) for row in self.connection.execute(
                "select * from local_analytics where user_id=? order by created_at desc limit 500", (user_id,))]
            feedback = [dict(row) for row in self.connection.execute(
                "select * from local_feedback where user_id=? order by created_at desc limit 500", (user_id,))]
        for event in events:
            event["properties"] = json.loads(event["properties"])
        return _dashboard(events, feedback, order_count)


class SupabaseAnalyticsStore:
    def __init__(self, url: str, service_role_key: str) -> None:
        self.client = httpx.AsyncClient(base_url=f"{url.rstrip('/')}/rest/v1/", headers={
            "apikey": service_role_key, "Authorization": f"Bearer {service_role_key}",
            "Content-Type": "application/json",
        }, timeout=10)

    async def record(self, user_id: str, event_name: str, agent_name: str, latency_ms: int = 0,
                     input_tokens: int = 0, output_tokens: int = 0, estimated_cost: float = 0,
                     properties: dict | None = None) -> None:
        response = await self.client.post("analytics", json={"user_id": user_id, "event_name": event_name,
            "agent_name": agent_name, "latency_ms": latency_ms, "input_tokens": input_tokens,
            "output_tokens": output_tokens, "estimated_cost": estimated_cost, "properties": properties or {}})
        response.raise_for_status()

    async def feedback(self, user_id: str, request: FeedbackRequest) -> FeedbackResponse:
        feedback_id = str(uuid4())
        response = await self.client.post("feedback", json={"id": feedback_id, "user_id": user_id, **request.model_dump()})
        response.raise_for_status()
        await self.record(user_id, "feedback.submitted", "feedback", properties={"rating": request.rating})
        return FeedbackResponse(id=feedback_id, rating=request.rating)

    async def dashboard(self, user_id: str, order_count: int) -> AnalyticsResponse:
        params = {"user_id": f"eq.{user_id}", "select": "*", "order": "created_at.desc", "limit": "500"}
        events_response, feedback_response = await self.client.get("analytics", params=params), await self.client.get(
            "feedback", params={**params, "select": "id,rating,created_at"})
        events_response.raise_for_status(); feedback_response.raise_for_status()
        return _dashboard(events_response.json(), feedback_response.json(), order_count)
