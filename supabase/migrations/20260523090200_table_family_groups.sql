-- Familieknappen - Lag 3 - 03 family_groups
create table if not exists public.family_groups (
  id          uuid primary key default gen_random_uuid(),
  name        text not null default 'Familien',
  created_at  timestamptz not null default now()
);
