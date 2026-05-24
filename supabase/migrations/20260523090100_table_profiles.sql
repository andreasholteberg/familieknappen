-- Familieknappen - Lag 3 - 02 profiles
-- Appens brukerprofil. Koblet 1:1 til auth.users via id (= auth.users.id).
-- Skiller tydelig mellom Supabase Auth-bruker (auth.users) og appprofil (profiles).

create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  name        text not null default '',
  role        public.app_role not null default 'relative',
  phone       text,
  email       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.profiles is 'Appprofil koblet til auth.users via id.';
