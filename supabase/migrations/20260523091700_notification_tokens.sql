-- Familieknappen - Lag 6 - 18 notification_tokens
-- Expo push-tokens per bruker/enhet. Brukeren styrer kun sine egne tokens (RLS);
-- Edge Function leser alle via service role.

create table if not exists public.notification_tokens (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles (id) on delete cascade,
  expo_push_token text not null,
  platform        text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  last_used_at    timestamptz,
  unique (user_id, expo_push_token)
);

create index if not exists notification_tokens_user_idx on public.notification_tokens (user_id);

alter table public.notification_tokens enable row level security;

drop policy if exists notification_tokens_select on public.notification_tokens;
create policy notification_tokens_select on public.notification_tokens
  for select to authenticated using (user_id = auth.uid());

drop policy if exists notification_tokens_insert on public.notification_tokens;
create policy notification_tokens_insert on public.notification_tokens
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists notification_tokens_update on public.notification_tokens;
create policy notification_tokens_update on public.notification_tokens
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists notification_tokens_delete on public.notification_tokens;
create policy notification_tokens_delete on public.notification_tokens
  for delete to authenticated using (user_id = auth.uid());

drop trigger if exists set_updated_at on public.notification_tokens;
create trigger set_updated_at before update on public.notification_tokens
  for each row execute function public.set_updated_at();
