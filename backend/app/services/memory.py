"""Persist conversations, messages, and user preferences locally or remotely."""

import json
import re
import sqlite3
from datetime import datetime, timezone
from threading import RLock
from uuid import uuid4

import httpx

from ..models import ConversationDetail, ConversationMessage, ConversationSummary, MemoryProfile


class MemoryStore:
    """Durable local conversation store with a Supabase-compatible domain model."""

    def __init__(self, path: str = ":memory:") -> None:
        self.connection = sqlite3.connect(path, check_same_thread=False)
        self.connection.row_factory = sqlite3.Row
        self.lock = RLock()
        self._create_schema()

    def _create_schema(self) -> None:
        with self.lock, self.connection:
            self.connection.executescript(
                """
                create table if not exists conversations (
                  id text primary key, user_id text not null, title text not null,
                  created_at text not null, updated_at text not null
                );
                create table if not exists messages (
                  id text primary key, conversation_id text not null,
                  role text not null, content text not null, created_at text not null,
                  foreign key (conversation_id) references conversations(id) on delete cascade
                );
                create table if not exists preferences (
                  user_id text primary key, profile text not null
                );
                """
            )

    def ensure_conversation(self, user_id: str, conversation_id: str | None, first_message: str) -> str:
        now = datetime.now(timezone.utc).isoformat()
        with self.lock, self.connection:
            if conversation_id:
                row = self.connection.execute(
                    "select id from conversations where id = ? and user_id = ?", (conversation_id, user_id)
                ).fetchone()
                if row:
                    return conversation_id
            conversation_id = str(uuid4())
            title = first_message.strip()[:60] or "New conversation"
            self.connection.execute(
                "insert into conversations values (?, ?, ?, ?, ?)",
                (conversation_id, user_id, title, now, now),
            )
            return conversation_id

    def add_message(self, conversation_id: str, role: str, content: str) -> ConversationMessage:
        message_id, now = str(uuid4()), datetime.now(timezone.utc).isoformat()
        with self.lock, self.connection:
            self.connection.execute(
                "insert into messages values (?, ?, ?, ?, ?)",
                (message_id, conversation_id, role, content, now),
            )
            self.connection.execute(
                "update conversations set updated_at = ? where id = ?", (now, conversation_id)
            )
        return ConversationMessage(
            id=message_id, conversation_id=conversation_id, role=role, content=content,
            created_at=datetime.fromisoformat(now),
        )

    def recent_messages(self, conversation_id: str, limit: int = 8) -> list[ConversationMessage]:
        with self.lock:
            rows = self.connection.execute(
                "select * from (select * from messages where conversation_id = ? order by created_at desc limit ?) order by created_at",
                (conversation_id, limit),
            ).fetchall()
        return [self._message(row) for row in rows]

    def list_conversations(self, user_id: str) -> list[ConversationSummary]:
        with self.lock:
            rows = self.connection.execute(
                "select * from conversations where user_id = ? order by updated_at desc", (user_id,)
            ).fetchall()
        return [self._conversation(row) for row in rows]

    def conversation(self, user_id: str, conversation_id: str) -> ConversationDetail | None:
        with self.lock:
            row = self.connection.execute(
                "select * from conversations where id = ? and user_id = ?", (conversation_id, user_id)
            ).fetchone()
            if not row:
                return None
            messages = self.connection.execute(
                "select * from messages where conversation_id = ? order by created_at", (conversation_id,)
            ).fetchall()
        return ConversationDetail(
            conversation=self._conversation(row), messages=[self._message(item) for item in messages]
        )

    def profile(self, user_id: str) -> MemoryProfile:
        with self.lock:
            row = self.connection.execute("select profile from preferences where user_id = ?", (user_id,)).fetchone()
        return MemoryProfile.model_validate(json.loads(row["profile"])) if row else MemoryProfile()

    def learn_preferences(self, user_id: str, message: str) -> MemoryProfile:
        profile = self.profile(user_id)
        budget = re.search(r"(?:under|below|max(?:imum)?(?: of)?)\s*\$?([0-9,]+)", message, re.I)
        if budget:
            profile.budget = float(budget.group(1).replace(",", ""))
        brands = re.findall(r"(?:like|love|prefer|favorite brand is)\s+([A-Z][\w-]+)", message)
        profile.favorite_brands = list(dict.fromkeys([*profile.favorite_brands, *brands]))[-5:]
        sizes = re.findall(r"\bsize\s+([0-9]{1,2}(?:\.[05])?)\b", message, re.I)
        profile.sizes = list(dict.fromkeys([*profile.sizes, *sizes]))[-5:]
        with self.lock, self.connection:
            self.connection.execute(
                "insert into preferences (user_id, profile) values (?, ?) on conflict(user_id) do update set profile = excluded.profile",
                (user_id, profile.model_dump_json()),
            )
        return profile

    @staticmethod
    def _conversation(row: sqlite3.Row) -> ConversationSummary:
        return ConversationSummary(
            id=row["id"], title=row["title"], created_at=datetime.fromisoformat(row["created_at"]),
            updated_at=datetime.fromisoformat(row["updated_at"]),
        )

    @staticmethod
    def _message(row: sqlite3.Row) -> ConversationMessage:
        return ConversationMessage(
            id=row["id"], conversation_id=row["conversation_id"], role=row["role"], content=row["content"],
            created_at=datetime.fromisoformat(row["created_at"]),
        )


class SupabaseMemoryStore:
    """Supabase PostgREST implementation used when backend credentials are configured."""

    def __init__(self, url: str, service_role_key: str) -> None:
        self.client = httpx.Client(
            base_url=f"{url.rstrip('/')}/rest/v1/",
            headers={
                "apikey": service_role_key,
                "Authorization": f"Bearer {service_role_key}",
                "Content-Type": "application/json",
            },
            timeout=10,
        )

    def ensure_conversation(self, user_id: str, conversation_id: str | None, first_message: str) -> str:
        if conversation_id:
            rows = self._get("conversations", {"id": f"eq.{conversation_id}", "user_id": f"eq.{user_id}", "select": "id"})
            if rows:
                return conversation_id
        conversation_id = str(uuid4())
        response = self.client.post(
            "conversations", json={"id": conversation_id, "user_id": user_id, "title": first_message.strip()[:60] or "New conversation"}
        )
        response.raise_for_status()
        return conversation_id

    def add_message(self, conversation_id: str, role: str, content: str) -> ConversationMessage:
        now, message_id = datetime.now(timezone.utc), str(uuid4())
        response = self.client.post(
            "messages",
            json={"id": message_id, "conversation_id": conversation_id, "role": role, "content": content},
        )
        response.raise_for_status()
        self.client.patch(
            "conversations", params={"id": f"eq.{conversation_id}"}, json={"updated_at": now.isoformat()}
        ).raise_for_status()
        return ConversationMessage(id=message_id, conversation_id=conversation_id, role=role, content=content, created_at=now)

    def recent_messages(self, conversation_id: str, limit: int = 8) -> list[ConversationMessage]:
        rows = self._get("messages", {
            "conversation_id": f"eq.{conversation_id}", "select": "*", "order": "created_at.desc", "limit": str(limit),
        })
        return [self._message(row) for row in reversed(rows)]

    def list_conversations(self, user_id: str) -> list[ConversationSummary]:
        return [self._conversation(row) for row in self._get("conversations", {
            "user_id": f"eq.{user_id}", "select": "*", "order": "updated_at.desc",
        })]

    def conversation(self, user_id: str, conversation_id: str) -> ConversationDetail | None:
        rows = self._get("conversations", {
            "id": f"eq.{conversation_id}", "user_id": f"eq.{user_id}", "select": "*",
        })
        if not rows:
            return None
        messages = self._get("messages", {
            "conversation_id": f"eq.{conversation_id}", "select": "*", "order": "created_at.asc",
        })
        return ConversationDetail(conversation=self._conversation(rows[0]), messages=[self._message(row) for row in messages])

    def profile(self, user_id: str) -> MemoryProfile:
        rows = self._get("users", {"id": f"eq.{user_id}", "select": "preferences"})
        return MemoryProfile.model_validate(rows[0].get("preferences", {})) if rows else MemoryProfile()

    def learn_preferences(self, user_id: str, message: str) -> MemoryProfile:
        profile = self.profile(user_id)
        budget = re.search(r"(?:under|below|max(?:imum)?(?: of)?)\s*\$?([0-9,]+)", message, re.I)
        if budget:
            profile.budget = float(budget.group(1).replace(",", ""))
        brands = re.findall(r"(?:like|love|prefer|favorite brand is)\s+([A-Z][\w-]+)", message)
        profile.favorite_brands = list(dict.fromkeys([*profile.favorite_brands, *brands]))[-5:]
        sizes = re.findall(r"\bsize\s+([0-9]{1,2}(?:\.[05])?)\b", message, re.I)
        profile.sizes = list(dict.fromkeys([*profile.sizes, *sizes]))[-5:]
        self.client.patch("users", params={"id": f"eq.{user_id}"}, json={"preferences": profile.model_dump()}).raise_for_status()
        return profile

    def _get(self, table: str, params: dict[str, str]) -> list[dict]:
        response = self.client.get(table, params=params)
        response.raise_for_status()
        return response.json()

    @staticmethod
    def _conversation(row: dict) -> ConversationSummary:
        return ConversationSummary(
            id=row["id"], title=row.get("title") or "Conversation",
            created_at=datetime.fromisoformat(row["created_at"].replace("Z", "+00:00")),
            updated_at=datetime.fromisoformat(row["updated_at"].replace("Z", "+00:00")),
        )

    @staticmethod
    def _message(row: dict) -> ConversationMessage:
        return ConversationMessage(
            id=row["id"], conversation_id=row["conversation_id"], role=row["role"], content=row["content"],
            created_at=datetime.fromisoformat(row["created_at"].replace("Z", "+00:00")),
        )
