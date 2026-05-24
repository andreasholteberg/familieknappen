-- Familieknappen - Lag 3 - 07 calendar_events
-- Enkel kalender. Ingen gjentakelser i MVP.
create table if not exists public.calendar_events (
  id              uuid primary key default gen_random_uuid(),
  family_group_id uuid not null references public.family_groups (id) on delete cascade,
  title           text not null,
  description     text,
  start_time      timestamptz not null,
  end_time        timestamptz,
  created_by      uuid references public.profiles (id) on delete set null,
  created_at      timestamptz not null default now()
);

create index if not exists calendar_events_group_idx on public.calendar_events (family_group_id, start_time);
