create extension if not exists pgcrypto;
create extension if not exists vector;

create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  preferences jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  sku text unique not null,
  name text not null,
  brand text not null,
  category text not null,
  description text not null default '',
  price numeric(12,2) not null check (price >= 0),
  rating numeric(2,1) check (rating between 0 and 5),
  inventory_count integer not null default 0 check (inventory_count >= 0),
  image_url text,
  specs jsonb not null default '{}'::jsonb,
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete restrict,
  status text not null check (status in ('pending','confirmed','shipped','delivered','return_requested','returned','cancelled')),
  total numeric(12,2) not null check (total >= 0),
  items jsonb not null default '[]'::jsonb,
  tracking_number text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  title text,
  status text not null default 'active' check (status in ('active','resolved','escalated')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  role text not null check (role in ('user','assistant','tool','human')),
  content text not null,
  agent_name text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  conversation_id uuid references public.conversations(id) on delete set null,
  message_id uuid references public.messages(id) on delete set null,
  rating smallint not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);

create table public.analytics (
  id bigint generated always as identity primary key,
  user_id uuid references public.users(id) on delete set null,
  conversation_id uuid references public.conversations(id) on delete set null,
  event_name text not null,
  agent_name text,
  latency_ms integer check (latency_ms >= 0),
  input_tokens integer check (input_tokens >= 0),
  output_tokens integer check (output_tokens >= 0),
  estimated_cost numeric(12,6) check (estimated_cost >= 0),
  properties jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.embeddings (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete cascade,
  source_type text not null,
  source_id text not null,
  content text not null,
  embedding vector(1536),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (source_type, source_id)
);

create index products_search_idx on public.products using gin (to_tsvector('english', name || ' ' || description));
create index messages_conversation_idx on public.messages (conversation_id, created_at);
create index analytics_created_idx on public.analytics (created_at desc);
create index embeddings_vector_idx on public.embeddings using hnsw (embedding vector_cosine_ops);

alter table public.users enable row level security;
alter table public.orders enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.feedback enable row level security;

create policy "users read own profile" on public.users for select using (auth.uid() = id);
create policy "users update own profile" on public.users for update using (auth.uid() = id);
create policy "users read own orders" on public.orders for select using (auth.uid() = user_id);
create policy "users manage own conversations" on public.conversations for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users read own messages" on public.messages for select using (
  exists (select 1 from public.conversations c where c.id = conversation_id and c.user_id = auth.uid())
);
create policy "users create own feedback" on public.feedback for insert with check (auth.uid() = user_id);
create policy "users read own feedback" on public.feedback for select using (auth.uid() = user_id);
