from functools import lru_cache

from ..config import get_settings
from .memory import MemoryStore, SupabaseMemoryStore
from .retrieval import RetrievalService
from .orders import LocalOrderStore, SupabaseOrderStore, build_order_store
from .analytics import LocalAnalyticsStore, SupabaseAnalyticsStore


@lru_cache
def get_memory_store() -> MemoryStore | SupabaseMemoryStore:
    settings = get_settings()
    if settings.supabase_url and settings.supabase_service_role_key:
        return SupabaseMemoryStore(settings.supabase_url, settings.supabase_service_role_key)
    return MemoryStore(settings.memory_database_path)


@lru_cache
def get_retrieval_service() -> RetrievalService:
    return RetrievalService(get_settings())


@lru_cache
def get_order_store() -> LocalOrderStore | SupabaseOrderStore:
    return build_order_store(get_settings())


@lru_cache
def get_analytics_store() -> LocalAnalyticsStore | SupabaseAnalyticsStore:
    settings = get_settings()
    if settings.supabase_url and settings.supabase_service_role_key:
        return SupabaseAnalyticsStore(settings.supabase_url, settings.supabase_service_role_key)
    return LocalAnalyticsStore(settings.memory_database_path)
