"""Define validated backend environment settings and cached configuration."""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Commerce AI API"
    environment: str = "development"
    frontend_url: str = "http://localhost:3000"
    supabase_url: str | None = None
    supabase_jwt_secret: str | None = None
    supabase_service_role_key: str | None = None
    openai_api_key: str | None = None
    openai_model: str = "gpt-5.6-sol"
    embedding_model: str = "text-embedding-3-small"
    memory_database_path: str = ":memory:"
    product_api_url: str = "https://dummyjson.com/products?limit=0"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


@lru_cache
def get_settings() -> Settings:
    return Settings()
