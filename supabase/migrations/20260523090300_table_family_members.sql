-- Familieknappen - Lag 3 - 04 family_members
-- Knytter en profil til en familiegruppe med en rolle. En rad per (gruppe, bruker).
create table if not exists public.family_members (
  id            uuid primary key default gen_random_uuid(),
  group_id      uuid not null references public.family_groups (id) on delete cascade,
  user_id       uuid not null references public.profiles (id) on delete cascade,
  relationship  text,
  member_role   public.member_role not null default 'secondary_contact',
  created_at    timestamptz not null default now(),
  unique (group_id, user_id)
);

create index if not exists family_members_user_idx  on public.family_members (user_id);
create index if not exists family_members_group_idx on public.family_members (group_id);
