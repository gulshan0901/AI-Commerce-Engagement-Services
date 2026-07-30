import hashlib
import math
import re

from openai import AsyncOpenAI

from ..config import Settings


class EmbeddingService:
    local_dimensions = 256
    openai_dimensions = 1536

    def __init__(self, settings: Settings) -> None:
        self.settings = settings

    @property
    def uses_openai(self) -> bool:
        return bool(
            self.settings.openai_api_key
            and self.settings.supabase_url
            and self.settings.supabase_service_role_key
        )

    @property
    def dimensions(self) -> int:
        return self.openai_dimensions if self.uses_openai else self.local_dimensions

    async def embed(self, texts: list[str]) -> list[list[float]]:
        if self.uses_openai:
            response = await AsyncOpenAI(api_key=self.settings.openai_api_key).embeddings.create(
                model=self.settings.embedding_model, input=texts, dimensions=self.openai_dimensions
            )
            return [item.embedding for item in response.data]
        return [self._local_embedding(text) for text in texts]

    def _local_embedding(self, text: str) -> list[float]:
        vector = [0.0] * self.local_dimensions
        for token in re.findall(r"[a-z0-9]+", text.lower()):
            digest = hashlib.sha256(token.encode()).digest()
            index = int.from_bytes(digest[:4], "big") % self.local_dimensions
            vector[index] += -1.0 if digest[4] & 1 else 1.0
        norm = math.sqrt(sum(value * value for value in vector)) or 1.0
        return [value / norm for value in vector]
