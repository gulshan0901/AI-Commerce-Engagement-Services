-- Supabase pgvector retrieval replaces the external vector database.
alter table public.embeddings enable row level security;

create or replace function public.match_product_embeddings(
  query_embedding vector(1536),
  match_count integer default 6
)
returns table (
  source_id text,
  similarity double precision,
  metadata jsonb
)
language sql
stable
as $$
  select
    e.source_id,
    1 - (e.embedding <=> query_embedding) as similarity,
    e.metadata
  from public.embeddings e
  where e.source_type = 'product' and e.embedding is not null
  order by e.embedding <=> query_embedding
  limit greatest(match_count, 1);
$$;

revoke execute on function public.match_product_embeddings(vector, integer) from public, anon, authenticated;
grant execute on function public.match_product_embeddings(vector, integer) to service_role;
