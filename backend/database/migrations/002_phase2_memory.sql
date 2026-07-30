-- Phase 2 policies for browser-authenticated history access. Production backend
-- writes may also use a service-role connection, which bypasses RLS.
create policy "users create own messages" on public.messages for insert with check (
  exists (
    select 1 from public.conversations c
    where c.id = conversation_id and c.user_id = auth.uid()
  )
);

create policy "users update own conversations" on public.conversations for update using (
  auth.uid() = user_id
) with check (auth.uid() = user_id);

create index conversations_user_updated_idx on public.conversations (user_id, updated_at desc);
create index feedback_conversation_idx on public.feedback (conversation_id, created_at desc);
