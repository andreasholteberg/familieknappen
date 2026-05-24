-- Familieknappen - Lag 6 - 19 notification_log
-- Enkel logg over push-forsok. Skrives av Edge Function (service role).
-- Brukere kan lese sine egne loggrader.

create table if not exists public.notification_log (
  id                      uuid primary key default gen_random_uuid(),
  user_id                 uuid references public.profiles (id) on delete set null,
  type                    text not null,
  related_help_request_id uuid references public.help_requests (id) on delete set null,
  status                  text not null,
  error_message           text,
  created_at              timestamptz not null default now()
);

create index if not exists notification_log_user_idx on public.notification_log (user_id, created_at desc);

alter table public.notification_log enable row level security;

-- Kun lesing av egne rader. Innsetting skjer via service role (omgar RLS).
drop policy if exists notification_log_select on public.notification_log;
create policy notification_log_select on public.notification_log
  for select to authenticated using (user_id = auth.uid());
