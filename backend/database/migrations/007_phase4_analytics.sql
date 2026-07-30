alter table public.analytics enable row level security;

create index if not exists analytics_user_created_idx
  on public.analytics (user_id, created_at desc);

create index if not exists feedback_user_created_idx
  on public.feedback (user_id, created_at desc);

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'analytics'
      and policyname = 'users read own analytics'
  ) then
    create policy "users read own analytics"
      on public.analytics for select using (auth.uid() = user_id);
  end if;
end $$;
