-- Familieknappen - Lag 3 - 05 help_requests
-- Kjernen i flyten: "Jeg er usikker -> jeg far hjelp raskt".
create table if not exists public.help_requests (
  id              uuid primary key default gen_random_uuid(),
  family_group_id uuid not null references public.family_groups (id) on delete cascade,
  senior_id       uuid not null references public.profiles (id) on delete cascade,
  -- Hvem foresporselen primaert ble rettet til (valgfritt; tilgang styres av gruppe).
  recipient_id    uuid references public.profiles (id) on delete set null,
  -- Bilde lagres i Storage; vi lagrer stien, ikke en offentlig URL.
  image_path      text,
  message         text,
  status          public.request_status not null default 'DELIVERED',
  -- UX-flagg: har senior sett svaret? (driver "nytt svar"-kortet)
  seen_by_senior  boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  delivered_at    timestamptz,
  viewed_at       timestamptz,
  answered_at     timestamptz,
  escalated_at    timestamptz,
  closed_at       timestamptz
);

create index if not exists help_requests_group_idx  on public.help_requests (family_group_id, created_at desc);
create index if not exists help_requests_senior_idx on public.help_requests (senior_id);
