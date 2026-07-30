alter table public.orders
  add column if not exists delivery_name text not null default '',
  add column if not exists delivery_email text not null default '',
  add column if not exists delivery_address text not null default '';

create index if not exists orders_user_created_idx
  on public.orders (user_id, created_at desc);
