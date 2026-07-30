alter table public.orders
  add column if not exists return_reason text,
  add column if not exists return_requested_at timestamptz;

create table if not exists public.faqs (
  id text primary key,
  question text not null,
  answer text not null,
  keywords text[] not null default '{}',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.faqs enable row level security;

insert into public.faqs (id, question, answer, keywords) values
  ('returns-window', 'What is the return window?', 'Eligible products can be returned within 30 days of delivery. Items must be in their original condition with included accessories and packaging.', array['return','returns','return window','send back']),
  ('refund-timing', 'When will I receive my refund?', 'Approved refunds are issued to the original payment method within 5 to 10 business days after the returned item is inspected.', array['refund','money back','refund timing']),
  ('shipping', 'How long does shipping take?', 'In-stock products normally leave the warehouse within one business day. Standard delivery typically takes 3 to 5 business days.', array['shipping','delivery','arrive','how long']),
  ('order-tracking', 'How do I track an order?', 'Open Orders while signed in to see the latest status and tracking number for every order associated with your account.', array['track','tracking','order status','where is my order']),
  ('recommendations', 'How are AI recommendations generated?', 'ACE retrieves products from the application catalogue, applies your stated constraints, and asks the model to explain only those verified records.', array['recommendation','recommended','ai','why selected'])
on conflict (id) do update set
  question = excluded.question,
  answer = excluded.answer,
  keywords = excluded.keywords,
  updated_at = now();

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'faqs'
      and policyname = 'public read active faqs'
  ) then
    create policy "public read active faqs"
      on public.faqs for select using (active = true);
  end if;
end $$;
