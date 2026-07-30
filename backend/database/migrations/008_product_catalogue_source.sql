alter table public.products
  add column if not exists external_id text,
  add column if not exists source text not null default 'local';

create unique index if not exists products_source_external_idx
  on public.products (source, external_id)
  where external_id is not null;

create index if not exists products_category_rating_idx
  on public.products (category, rating desc);
