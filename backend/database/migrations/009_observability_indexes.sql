create index if not exists analytics_conversation_created_idx
  on public.analytics (conversation_id, created_at)
  where conversation_id is not null;
