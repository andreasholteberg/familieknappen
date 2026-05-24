-- Familieknappen - Lag 3 - 08 activity_status
-- Noktern trygghetsstatus. Ingen GPS, ingen alarmerende data. En rad per bruker.
create table if not exists public.activity_status (
  user_id          uuid primary key references public.profiles (id) on delete cascade,
  last_seen_at     timestamptz not null default now(),
  app_opened_today boolean not null default false,
  updated_at       timestamptz not null default now()
);
