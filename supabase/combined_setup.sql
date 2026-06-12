-- Familieknappen - SAMLET OPPSETT (combined_setup.sql)
-- Lim inn i Supabase SQL Editor for rask oppstart. Idempotent.
-- Kjor deretter seed.sql separat for demodata (kun utvikling).


-- ============================================================
-- 20260523090000_extensions_and_enums.sql
-- ============================================================
-- Familieknappen - Lag 3 - 01 Extensions og enum-typer
-- Idempotent: kan kjores flere ganger uten a feile.

create extension if not exists pgcrypto;

-- App-rolle (styrer hvilken skjermstabel brukeren ser).
do $$ begin
  if not exists (select 1 from pg_type where typname = 'app_role') then
    create type public.app_role as enum ('senior', 'relative');
  end if;
end $$;

-- Medlemsrolle i en familiegruppe (tilgang/primaerkontakt).
do $$ begin
  if not exists (select 1 from pg_type where typname = 'member_role') then
    create type public.member_role as enum ('senior', 'primary_contact', 'secondary_contact');
  end if;
end $$;

-- Livssyklus for en hjelpeforesporsel. ESCALATED er med i schemaet, men brukes
-- ikke i MVP (eskaleringsmotor kommer senere).
do $$ begin
  if not exists (select 1 from pg_type where typname = 'request_status') then
    create type public.request_status as enum (
      'CREATED', 'SENT', 'DELIVERED', 'VIEWED', 'ANSWERED', 'ESCALATED', 'CLOSED'
    );
  end if;
end $$;

-- Hurtigsvar-typer. Fritekst lagres separat (free_text).
do $$ begin
  if not exists (select 1 from pg_type where typname = 'quick_reply_type') then
    create type public.quick_reply_type as enum ('DO_NOT_REPLY', 'LOOKS_OK', 'I_WILL_CALL');
  end if;
end $$;


-- ============================================================
-- 20260523090100_table_profiles.sql
-- ============================================================
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


-- ============================================================
-- 20260523090200_table_family_groups.sql
-- ============================================================
-- Familieknappen - Lag 3 - 03 family_groups
create table if not exists public.family_groups (
  id          uuid primary key default gen_random_uuid(),
  name        text not null default 'Familien',
  created_at  timestamptz not null default now()
);


-- ============================================================
-- 20260523090300_table_family_members.sql
-- ============================================================
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


-- ============================================================
-- 20260523090400_table_help_requests.sql
-- ============================================================
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


-- ============================================================
-- 20260523090500_table_help_responses.sql
-- ============================================================
-- Familieknappen - Lag 3 - 06 help_responses
-- Hurtigsvar eller fritekst fra en parorende. Minst ett av feltene ma vaere satt.
create table if not exists public.help_responses (
  id               uuid primary key default gen_random_uuid(),
  help_request_id  uuid not null references public.help_requests (id) on delete cascade,
  responder_id     uuid not null references public.profiles (id) on delete cascade,
  quick_reply_type public.quick_reply_type,
  free_text        text,
  created_at       timestamptz not null default now(),
  constraint help_responses_has_content
    check (quick_reply_type is not null or nullif(btrim(free_text), '') is not null)
);

create index if not exists help_responses_request_idx on public.help_responses (help_request_id, created_at desc);


-- ============================================================
-- 20260523090600_table_calendar_events.sql
-- ============================================================
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


-- ============================================================
-- 20260523090700_table_activity_status.sql
-- ============================================================
-- Familieknappen - Lag 3 - 08 activity_status
-- Noktern trygghetsstatus. Ingen GPS, ingen alarmerende data. En rad per bruker.
create table if not exists public.activity_status (
  user_id          uuid primary key references public.profiles (id) on delete cascade,
  last_seen_at     timestamptz not null default now(),
  app_opened_today boolean not null default false,
  updated_at       timestamptz not null default now()
);


-- ============================================================
-- 20260523090800_functions_and_triggers.sql
-- ============================================================
-- Familieknappen - Lag 3 - 09 Funksjoner og triggere
-- SECURITY DEFINER-funksjoner brukes i RLS for a unnga rekursjon (policy som
-- spor family_members ville ellers utlost family_members-policyen pa nytt).

-- Er innlogget bruker medlem av gruppe g?
create or replace function public.is_group_member(g uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.family_members
    where group_id = g and user_id = auth.uid()
  );
$$;

-- Deler innlogget bruker minst en gruppe med "other"?
create or replace function public.shares_group_with(other uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.family_members me
    join public.family_members them on them.group_id = me.group_id
    where me.user_id = auth.uid() and them.user_id = other
  );
$$;

-- Hvilken gruppe horer en foresporsel til? (brukes i help_responses-policy)
create or replace function public.request_group(req uuid)
returns uuid
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select family_group_id from public.help_requests where id = req;
$$;

-- Opprett appprofil automatisk nar en auth-bruker opprettes.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.profiles (id, email, name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Hold updated_at oppdatert.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_updated_at on public.profiles;
create trigger set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at on public.help_requests;
create trigger set_updated_at before update on public.help_requests
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at on public.activity_status;
create trigger set_updated_at before update on public.activity_status
  for each row execute function public.set_updated_at();


-- ============================================================
-- 20260523090900_rls_policies.sql
-- ============================================================
-- Familieknappen - Lag 3 - 10 Row Level Security
-- Hovedregel: ingen kan lese gruppedata uten a vaere medlem av samme family_group.
-- Idempotent: drop policy if exists for create.

alter table public.profiles        enable row level security;
alter table public.family_groups   enable row level security;
alter table public.family_members  enable row level security;
alter table public.help_requests   enable row level security;
alter table public.help_responses  enable row level security;
alter table public.calendar_events enable row level security;
alter table public.activity_status enable row level security;

-- ---------- profiles ----------
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.shares_group_with(id));

drop policy if exists profiles_insert on public.profiles;
create policy profiles_insert on public.profiles
  for insert to authenticated
  with check (id = auth.uid());

drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- ---------- family_groups ----------
drop policy if exists family_groups_select on public.family_groups;
create policy family_groups_select on public.family_groups
  for select to authenticated
  using (public.is_group_member(id));

drop policy if exists family_groups_insert on public.family_groups;
create policy family_groups_insert on public.family_groups
  for insert to authenticated
  with check (true);

drop policy if exists family_groups_update on public.family_groups;
create policy family_groups_update on public.family_groups
  for update to authenticated
  using (public.is_group_member(id))
  with check (public.is_group_member(id));

-- ---------- family_members ----------
drop policy if exists family_members_select on public.family_members;
create policy family_members_select on public.family_members
  for select to authenticated
  using (public.is_group_member(group_id));

drop policy if exists family_members_insert on public.family_members;
create policy family_members_insert on public.family_members
  for insert to authenticated
  with check (user_id = auth.uid() or public.is_group_member(group_id));

drop policy if exists family_members_update on public.family_members;
create policy family_members_update on public.family_members
  for update to authenticated
  using (public.is_group_member(group_id))
  with check (public.is_group_member(group_id));

drop policy if exists family_members_delete on public.family_members;
create policy family_members_delete on public.family_members
  for delete to authenticated
  using (public.is_group_member(group_id));

-- ---------- help_requests ----------
drop policy if exists help_requests_select on public.help_requests;
create policy help_requests_select on public.help_requests
  for select to authenticated
  using (public.is_group_member(family_group_id));

drop policy if exists help_requests_insert on public.help_requests;
create policy help_requests_insert on public.help_requests
  for insert to authenticated
  with check (public.is_group_member(family_group_id));

drop policy if exists help_requests_update on public.help_requests;
create policy help_requests_update on public.help_requests
  for update to authenticated
  using (public.is_group_member(family_group_id))
  with check (public.is_group_member(family_group_id));

-- ---------- help_responses ----------
drop policy if exists help_responses_select on public.help_responses;
create policy help_responses_select on public.help_responses
  for select to authenticated
  using (public.is_group_member(public.request_group(help_request_id)));

drop policy if exists help_responses_insert on public.help_responses;
create policy help_responses_insert on public.help_responses
  for insert to authenticated
  with check (
    responder_id = auth.uid()
    and public.is_group_member(public.request_group(help_request_id))
  );

drop policy if exists help_responses_update on public.help_responses;
create policy help_responses_update on public.help_responses
  for update to authenticated
  using (responder_id = auth.uid())
  with check (responder_id = auth.uid());

-- ---------- calendar_events ----------
drop policy if exists calendar_events_select on public.calendar_events;
create policy calendar_events_select on public.calendar_events
  for select to authenticated
  using (public.is_group_member(family_group_id));

drop policy if exists calendar_events_insert on public.calendar_events;
create policy calendar_events_insert on public.calendar_events
  for insert to authenticated
  with check (public.is_group_member(family_group_id));

drop policy if exists calendar_events_update on public.calendar_events;
create policy calendar_events_update on public.calendar_events
  for update to authenticated
  using (public.is_group_member(family_group_id))
  with check (public.is_group_member(family_group_id));

drop policy if exists calendar_events_delete on public.calendar_events;
create policy calendar_events_delete on public.calendar_events
  for delete to authenticated
  using (public.is_group_member(family_group_id));

-- ---------- activity_status ----------
drop policy if exists activity_status_select on public.activity_status;
create policy activity_status_select on public.activity_status
  for select to authenticated
  using (user_id = auth.uid() or public.shares_group_with(user_id));

drop policy if exists activity_status_insert on public.activity_status;
create policy activity_status_insert on public.activity_status
  for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists activity_status_update on public.activity_status;
create policy activity_status_update on public.activity_status
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());


-- ============================================================
-- 20260523091000_storage.sql
-- ============================================================
-- Familieknappen - Lag 3 - 11 Storage (bilder til hjelpeforesporsler)
-- Privat bucket. Filsti-konvensjon: "<family_group_id>/<request_id>.jpg".
-- Lesing/opplasting kun for medlemmer av gruppa i forste mappeledd.

insert into storage.buckets (id, name, public)
values ('help-images', 'help-images', false)
on conflict (id) do nothing;

drop policy if exists "help_images_select" on storage.objects;
create policy "help_images_select" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'help-images'
    and public.is_group_member(((storage.foldername(name))[1])::uuid)
  );

drop policy if exists "help_images_insert" on storage.objects;
create policy "help_images_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'help-images'
    and public.is_group_member(((storage.foldername(name))[1])::uuid)
  );

drop policy if exists "help_images_update" on storage.objects;
create policy "help_images_update" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'help-images'
    and public.is_group_member(((storage.foldername(name))[1])::uuid)
  );


-- ============================================================
-- 20260523091100_realtime_publication.sql
-- ============================================================
-- Familieknappen - Lag 3 - 12 Realtime-publisering
-- Tabeller ma ligge i publikasjonen supabase_realtime for at klient-abonnement
-- skal motta endringer. Idempotent.

do $$ begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'help_requests'
  ) then
    alter publication supabase_realtime add table public.help_requests;
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'help_responses'
  ) then
    alter publication supabase_realtime add table public.help_responses;
  end if;
end $$;


-- ============================================================
-- 20260523091200_profiles_consent.sql
-- ============================================================
-- Familieknappen - Lag 4 - 13 Minimum samtykke
-- Senior (eller en hvilken som helst bruker) kan sla av deling av aktivitetsstatus.
-- Standard: pa, slik at eksisterende dashbord-oppforsel bevares.

alter table public.profiles
  add column if not exists activity_sharing_enabled boolean not null default true;


-- ============================================================
-- 20260523091300_security_helpers.sql
-- ============================================================
-- Familieknappen - Lag 4 - 14 Sikkerhetshjelpere, rolleregler og primaeroverforing
-- SECURITY DEFINER for a unnga RLS-rekursjon. Idempotent.

-- Er innlogget bruker primaerkontakt i gruppe g?
create or replace function public.is_primary_contact(g uuid)
returns boolean
language sql stable security definer set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.family_members
    where group_id = g and user_id = auth.uid() and member_role = 'primary_contact'
  );
$$;

-- Finnes det allerede medlemmer i gruppa? (brukes til bootstrapping av insert)
create or replace function public.group_has_members(g uuid)
returns boolean
language sql stable security definer set search_path = public, pg_temp
as $$
  select exists (select 1 from public.family_members where group_id = g);
$$;

-- Har bruker u slatt pa deling av aktivitetsstatus?
create or replace function public.activity_sharing_on(u uuid)
returns boolean
language sql stable security definer set search_path = public, pg_temp
as $$
  select coalesce((select activity_sharing_enabled from public.profiles where id = u), false);
$$;

-- Handhev rolleregler ved insert/update av medlemskap.
-- Hovedpoeng: ingen kan gjore seg selv til primaerkontakt (auth.uid() = egen rad).
-- (At kun primary kan endre roller handheves av RLS-policyene under.)
create or replace function public.enforce_member_role_rules()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if tg_op = 'INSERT' then
    if new.member_role = 'primary_contact' and new.user_id = auth.uid() then
      raise exception 'Du kan ikke gjore deg selv til primaerkontakt';
    end if;
  elsif tg_op = 'UPDATE' then
    if new.member_role is distinct from old.member_role
       and new.member_role = 'primary_contact'
       and new.user_id = auth.uid() then
      raise exception 'Du kan ikke gjore deg selv til primaerkontakt';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_member_role_rules on public.family_members;
create trigger enforce_member_role_rules
  before insert or update on public.family_members
  for each row execute function public.enforce_member_role_rules();

-- Trygg overforing av primaerrollen: kun navaerende primaer kan overfore, og kun
-- til et eksisterende medlem. Kjorer som definer slik at demote+promote skjer
-- atomisk uten at kalleren mister tilgang underveis.
create or replace function public.transfer_primary_contact(p_group uuid, p_new_user uuid)
returns void
language plpgsql security definer set search_path = public, pg_temp
as $$
begin
  if not public.is_primary_contact(p_group) then
    raise exception 'Bare primaerkontakten kan overfore primaerrollen';
  end if;
  if not exists (
    select 1 from public.family_members where group_id = p_group and user_id = p_new_user
  ) then
    raise exception 'Mottaker er ikke medlem av gruppa';
  end if;

  update public.family_members
    set member_role = 'secondary_contact'
    where group_id = p_group and member_role = 'primary_contact';

  update public.family_members
    set member_role = 'primary_contact'
    where group_id = p_group and user_id = p_new_user;
end;
$$;

grant execute on function public.transfer_primary_contact(uuid, uuid) to authenticated;


-- ============================================================
-- 20260523091400_tighten_access.sql
-- ============================================================
-- Familieknappen - Lag 4 - 15 Strammere tilgang
-- - Kun primaerkontakt kan legge til/fjerne medlemmer og endre roller.
-- - secondary_contact kan ikke endre roller (de nar ikke UPDATE-policyen).
-- - Ingen kan gjore seg selv til primaer (trigger + indeks under).
-- - Aktivitetsstatus deles bare hvis brukeren har samtykket.
-- Idempotent.

-- Maks en primaerkontakt per gruppe (gjor "to primaerer" umulig pa DB-niva).
create unique index if not exists family_members_one_primary
  on public.family_members (group_id)
  where member_role = 'primary_contact';

-- ----- family_members: erstatt insert/update/delete -----
drop policy if exists family_members_insert on public.family_members;
create policy family_members_insert on public.family_members
  for insert to authenticated
  with check (
    -- primaerkontakten legger til medlemmer ...
    public.is_primary_contact(group_id)
    -- ... eller forste bruker oppretter sitt eget medlemskap i en tom gruppe
    -- (bootstrapping; trigger hindrer at dette gjores som primaerkontakt).
    or (user_id = auth.uid() and not public.group_has_members(group_id))
  );

drop policy if exists family_members_update on public.family_members;
create policy family_members_update on public.family_members
  for update to authenticated
  using (public.is_primary_contact(group_id))
  with check (public.is_primary_contact(group_id));

drop policy if exists family_members_delete on public.family_members;
create policy family_members_delete on public.family_members
  for delete to authenticated
  using (public.is_primary_contact(group_id));

-- (family_members_select beholdes uendret: alle gruppemedlemmer kan lese.)

-- ----- activity_status: les bare hvis eier ELLER samtykke er pa -----
drop policy if exists activity_status_select on public.activity_status;
create policy activity_status_select on public.activity_status
  for select to authenticated
  using (
    user_id = auth.uid()
    or (public.shares_group_with(user_id) and public.activity_sharing_on(user_id))
  );


-- ============================================================
-- 20260523091500_group_invitations.sql
-- ============================================================
-- Familieknappen - Lag 4 - 16 group_invitations
-- Enkel invitasjonsmodell (datamodell + tilgang). Selve akseptflyten/onboarding
-- bygges senere (vil bli en SECURITY DEFINER-funksjon som slar opp token).
-- Token = 32 hex-tegn fra en uuid (unngar pgcrypto/gen_random_bytes som ligger i
-- extensions-skjemaet og ikke er pa search_path i migrerings-sesjonen).

create table if not exists public.group_invitations (
  id               uuid primary key default gen_random_uuid(),
  family_group_id  uuid not null references public.family_groups (id) on delete cascade,
  invited_email    text not null,
  invited_role     public.member_role not null default 'secondary_contact',
  token            text not null unique default replace(gen_random_uuid()::text, '-', ''),
  expires_at       timestamptz not null default (now() + interval '7 days'),
  accepted_at      timestamptz,
  created_by       uuid references public.profiles (id) on delete set null,
  revoked_at       timestamptz,
  created_at       timestamptz not null default now()
);

create index if not exists group_invitations_group_idx on public.group_invitations (family_group_id);
create index if not exists group_invitations_email_idx on public.group_invitations (lower(invited_email));

alter table public.group_invitations enable row level security;

-- Gruppemedlemmer kan se invitasjonene for sin egen gruppe.
drop policy if exists group_invitations_select on public.group_invitations;
create policy group_invitations_select on public.group_invitations
  for select to authenticated
  using (public.is_group_member(family_group_id));

-- Kun primaerkontakt kan opprette invitasjoner (og ma sta som created_by).
drop policy if exists group_invitations_insert on public.group_invitations;
create policy group_invitations_insert on public.group_invitations
  for insert to authenticated
  with check (public.is_primary_contact(family_group_id) and created_by = auth.uid());

-- Kun primaerkontakt kan endre (f.eks. trekke tilbake / sette revoked_at).
drop policy if exists group_invitations_update on public.group_invitations;
create policy group_invitations_update on public.group_invitations
  for update to authenticated
  using (public.is_primary_contact(family_group_id))
  with check (public.is_primary_contact(family_group_id));

-- Kun primaerkontakt kan slette.
drop policy if exists group_invitations_delete on public.group_invitations;
create policy group_invitations_delete on public.group_invitations
  for delete to authenticated
  using (public.is_primary_contact(family_group_id));


-- ============================================================
-- 20260523091600_accept_invitation.sql
-- ============================================================
-- Familieknappen - Lag 5 - 17 Aksept av invitasjon
-- Gjor group_invitations brukbare: en SECURITY DEFINER-RPC slar opp token,
-- validerer den, og melder innlogget bruker inn i gruppa. Idempotent.

-- Invitasjoner kan ikke gi primaerrollen (selv-promotering er ikke tillatt;
-- primaer settes ved gruppeoppsett eller via transfer_primary_contact).
do $$ begin
  if not exists (
    select 1 from pg_constraint where conname = 'group_invitations_role_not_primary'
  ) then
    alter table public.group_invitations
      add constraint group_invitations_role_not_primary
      check (invited_role <> 'primary_contact');
  end if;
end $$;

create or replace function public.accept_group_invitation(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  inv    public.group_invitations;
  v_uid  uuid := auth.uid();
  v_mail text := auth.email();
begin
  if v_uid is null then
    raise exception 'Du ma vaere innlogget for a godta en invitasjon';
  end if;

  select * into inv from public.group_invitations where token = p_token;

  if inv.id is null then
    raise exception 'Ugyldig invitasjon';
  end if;
  if inv.revoked_at is not null then
    raise exception 'Invitasjonen er trukket tilbake';
  end if;
  if inv.accepted_at is not null then
    raise exception 'Invitasjonen er allerede brukt';
  end if;
  if inv.expires_at <= now() then
    raise exception 'Invitasjonen er utlopt';
  end if;
  if inv.invited_role = 'primary_contact' then
    raise exception 'Ugyldig invitasjonsrolle';
  end if;
  if v_mail is null or lower(v_mail) <> lower(inv.invited_email) then
    raise exception 'Invitasjonen er sendt til en annen e-postadresse';
  end if;

  -- Meld inn (idempotent hvis allerede medlem).
  insert into public.family_members (group_id, user_id, member_role)
  values (inv.family_group_id, v_uid, inv.invited_role)
  on conflict (group_id, user_id) do nothing;

  update public.group_invitations set accepted_at = now() where id = inv.id;

  return jsonb_build_object(
    'family_group_id', inv.family_group_id,
    'role', inv.invited_role
  );
end;
$$;

grant execute on function public.accept_group_invitation(text) to authenticated;


-- ============================================================
-- 20260523091700_notification_tokens.sql
-- ============================================================
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


-- ============================================================
-- 20260523091800_notification_log.sql
-- ============================================================
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


-- ============================================================
-- 20260523091900_escalation.sql
-- ============================================================
-- Familieknappen - Lag 7 - 20 Eskaleringsfelter
-- Enkel, tidsbasert eskalering: hvis ingen svarer innen escalation_due_at,
-- eskaleres foresporselen til sekundaerkontakt(er). Kun ett niva.
-- (escalated_at finnes fra for; status ESCALATED finnes i enum.)

alter table public.help_requests
  add column if not exists escalation_due_at timestamptz,
  add column if not exists escalation_level integer not null default 0;

-- Hjelpeindeks for a finne forfalte, ikke-eskalerte foresporsler raskt.
create index if not exists help_requests_escalation_due_idx
  on public.help_requests (escalation_due_at)
  where escalation_level = 0;


-- ============================================================
-- 20260524100000_onboarding.sql
-- ============================================================
-- Familieknappen - Lag 8 - Onboarding (opprett egen familiegruppe)
-- To ting:
-- 1) Forfin enforce_member_role_rules: tillat at den FORSTE brukeren i en TOM
--    gruppe melder seg inn som primaerkontakt (bootstrapping). Selv-promotering
--    i en gruppe som allerede har medlemmer er fortsatt blokkert.
-- 2) create_family_group(p_name): atomisk oppretting av gruppe + medlemskap som
--    primaerkontakt + profiles.role = 'relative'. SECURITY DEFINER.

create or replace function public.enforce_member_role_rules()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if tg_op = 'INSERT' then
    -- Blokker selv-primaer KUN hvis gruppa allerede har medlemmer.
    if new.member_role = 'primary_contact'
       and new.user_id = auth.uid()
       and public.group_has_members(new.group_id) then
      raise exception 'Du kan ikke gjore deg selv til primaerkontakt';
    end if;
  elsif tg_op = 'UPDATE' then
    if new.member_role is distinct from old.member_role
       and new.member_role = 'primary_contact'
       and new.user_id = auth.uid() then
      raise exception 'Du kan ikke gjore deg selv til primaerkontakt';
    end if;
  end if;
  return new;
end;
$$;

create or replace function public.create_family_group(p_name text)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid   uuid := auth.uid();
  v_group uuid;
begin
  if v_uid is null then
    raise exception 'Ikke innlogget';
  end if;
  if exists (select 1 from public.family_members where user_id = v_uid) then
    raise exception 'Du er allerede medlem av en familiegruppe';
  end if;

  insert into public.family_groups (name)
    values (coalesce(nullif(btrim(p_name), ''), 'Min familie'))
    returning id into v_group;

  insert into public.family_members (group_id, user_id, relationship, member_role)
    values (v_group, v_uid, null, 'primary_contact');

  update public.profiles set role = 'relative' where id = v_uid;

  return v_group;
end;
$$;

grant execute on function public.create_family_group(text) to authenticated;

-- Familieknappen - Fase 1 (F-021): eksplisitt kvittering fra senior.
-- «Jeg har sett svaret»-knappen setter acknowledged_at. seen_by_senior
-- beholdes som rask flagg for hjem-kortet; acknowledged_at er den varige
-- kvitteringen med tidsstempel (brukes av historikk og senere pårørende-UI).

alter table public.help_requests
  add column if not exists acknowledged_at timestamptz;

comment on column public.help_requests.acknowledged_at is
  'Når senior eksplisitt kvitterte for at svaret er sett (F-021/F-022).';
-- (slutt acknowledged_at)
-- Familieknappen - Fase 1 (F-016): paringskode for å koble senior til familien.
-- Beslutning F-015: koden brukes PÅ TOPPEN av e-post-OTP-innlogging. Senior
-- logger inn som vanlig, taster så en 6-sifret kode fra pårørende, og blir
-- medlem av gruppa med riktig rolle. Kort levetid (15 min), engangsbruk,
-- og en nøktern brems mot gjetting (maks 5 forsøk per kvarter per bruker).

create table if not exists public.pairing_codes (
  id              uuid primary key default gen_random_uuid(),
  family_group_id uuid not null references public.family_groups(id) on delete cascade,
  code            text not null,
  invited_role    public.member_role not null default 'senior',
  created_by      uuid references public.profiles(id) on delete set null,
  created_at      timestamptz not null default now(),
  expires_at      timestamptz not null default now() + interval '15 minutes',
  used_at         timestamptz,
  used_by         uuid references public.profiles(id) on delete set null,
  revoked_at      timestamptz,
  constraint pairing_codes_no_primary check (invited_role <> 'primary_contact'),
  constraint pairing_codes_code_format check (code ~ '^[0-9]{6}$')
);

create index if not exists pairing_codes_active_idx
  on public.pairing_codes (code)
  where used_at is null and revoked_at is null;

create table if not exists public.pairing_attempts (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null,
  attempted_at timestamptz not null default now()
);

create index if not exists pairing_attempts_user_idx
  on public.pairing_attempts (user_id, attempted_at);

alter table public.pairing_codes enable row level security;
alter table public.pairing_attempts enable row level security;
-- pairing_attempts har ingen policies: kun SECURITY DEFINER-RPC-en når den.

drop policy if exists pairing_codes_select on public.pairing_codes;
create policy pairing_codes_select on public.pairing_codes
  for select using (public.is_group_member(family_group_id));

drop policy if exists pairing_codes_insert on public.pairing_codes;
create policy pairing_codes_insert on public.pairing_codes
  for insert with check (public.is_primary_contact(family_group_id));

drop policy if exists pairing_codes_update on public.pairing_codes;
create policy pairing_codes_update on public.pairing_codes
  for update using (public.is_primary_contact(family_group_id));

-- Lag en ny kode (kun primærkontakt). Trekker tilbake gruppas aktive koder
-- først, slik at det alltid bare finnes én gyldig kode per gruppe.
create or replace function public.create_pairing_code(
  p_group uuid,
  p_role public.member_role default 'senior'
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid  uuid := auth.uid();
  v_code text;
  v_row  public.pairing_codes%rowtype;
begin
  if v_uid is null then
    raise exception 'Ikke innlogget';
  end if;
  if not public.is_primary_contact(p_group) then
    raise exception 'Bare kontaktpersonen kan lage paringskode';
  end if;
  if p_role = 'primary_contact' then
    raise exception 'Paringskode kan ikke gi kontaktperson-rolle';
  end if;

  update public.pairing_codes
     set revoked_at = now()
   where family_group_id = p_group
     and used_at is null
     and revoked_at is null;

  loop
    v_code := lpad((((('x' || encode(gen_random_bytes(4), 'hex'))::bit(32)::bigint) & 2147483647) % 1000000)::text, 6, '0');
    exit when not exists (
      select 1 from public.pairing_codes
       where code = v_code and used_at is null and revoked_at is null and expires_at > now()
    );
  end loop;

  insert into public.pairing_codes (family_group_id, code, invited_role, created_by)
    values (p_group, v_code, p_role, v_uid)
    returning * into v_row;

  return jsonb_build_object('code', v_row.code, 'expires_at', v_row.expires_at, 'invited_role', v_row.invited_role);
end;
$$;

-- Løs inn en kode. Validerer levetid/engangsbruk, bremser gjetting, melder
-- innlogget bruker inn i gruppa og setter profilrollen.
create or replace function public.pair_with_code(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid      uuid := auth.uid();
  v_clean    text := regexp_replace(coalesce(p_code, ''), '\D', '', 'g');
  v_attempts int;
  v_row      public.pairing_codes%rowtype;
  v_existing uuid;
begin
  if v_uid is null then
    raise exception 'Ikke innlogget';
  end if;

  select count(*) into v_attempts
    from public.pairing_attempts
   where user_id = v_uid and attempted_at > now() - interval '15 minutes';
  if v_attempts >= 5 then
    raise exception 'For mange forsøk. Vent litt og prøv igjen.';
  end if;
  insert into public.pairing_attempts (user_id) values (v_uid);

  select * into v_row
    from public.pairing_codes
   where code = v_clean
     and used_at is null
     and revoked_at is null
     and expires_at > now()
   limit 1;
  if not found then
    raise exception 'Koden er feil eller utløpt. Be familien om en ny kode.';
  end if;

  select group_id into v_existing
    from public.family_members
   where user_id = v_uid
   limit 1;
  if v_existing is not null and v_existing <> v_row.family_group_id then
    raise exception 'Du er allerede med i en annen familiegruppe.';
  end if;

  insert into public.family_members (group_id, user_id, relationship, member_role)
    values (v_row.family_group_id, v_uid, null, v_row.invited_role)
    on conflict do nothing;

  update public.profiles
     set role = case when v_row.invited_role = 'senior' then 'senior'::public.app_role else 'relative'::public.app_role end
   where id = v_uid;

  update public.pairing_codes
     set used_at = now(), used_by = v_uid
   where id = v_row.id;

  return jsonb_build_object('family_group_id', v_row.family_group_id, 'role', v_row.invited_role);
end;
$$;

grant execute on function public.create_pairing_code(uuid, public.member_role) to authenticated;
grant execute on function public.pair_with_code(text) to authenticated;
-- (slutt pairing_codes)
-- Familieknappen - Fase 1 (F-018): lisensfelter uten betaling.
-- subscription_status styrer en nøytral sperreskjerm i appen (F-019/F-020).
-- Ingen Stripe/kjøp ennå. Eksisterende grupper får 'manual_review' (åpen),
-- slik at mor-piloten aldri sperres. Klienter kan IKKE skrive lisensfeltene
-- (kolonnenivå-grant); de settes senere av stripe-webhook (service role).

alter table public.family_groups
  add column if not exists subscription_status text not null default 'manual_review',
  add column if not exists billing_admin_user_id uuid references public.profiles(id) on delete set null,
  add column if not exists trial_end timestamptz,
  add column if not exists current_period_end timestamptz,
  add column if not exists created_by uuid references public.profiles(id) on delete set null;

alter table public.family_groups
  drop constraint if exists family_groups_subscription_status_check;
alter table public.family_groups
  add constraint family_groups_subscription_status_check
  check (subscription_status in ('manual_review', 'trialing', 'active', 'past_due', 'canceled', 'expired'));

-- Klienter kan bare oppdatere gruppenavnet. Lisensfeltene er service-role-only.
revoke update on table public.family_groups from authenticated;
grant update (name) on table public.family_groups to authenticated;

-- create_family_group setter nå også created_by og billing_admin_user_id.
create or replace function public.create_family_group(p_name text)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid   uuid := auth.uid();
  v_group uuid;
begin
  if v_uid is null then
    raise exception 'Ikke innlogget';
  end if;
  if exists (select 1 from public.family_members where user_id = v_uid) then
    raise exception 'Du er allerede medlem av en familiegruppe';
  end if;

  insert into public.family_groups (name, created_by, billing_admin_user_id)
    values (coalesce(nullif(btrim(p_name), ''), 'Min familie'), v_uid, v_uid)
    returning id into v_group;

  insert into public.family_members (group_id, user_id, relationship, member_role)
    values (v_group, v_uid, null, 'primary_contact');

  update public.profiles set role = 'relative' where id = v_uid;

  return v_group;
end;
$$;
-- Familieknappen - Fase 1 (F-024): eskalering stopper når noen svarer.
-- En trigger setter escalation_stopped_at ved første svar, og escalate-
-- funksjonen hopper over forespørsler der den er satt.

alter table public.help_requests
  add column if not exists escalation_stopped_at timestamptz;

create or replace function public.stop_escalation_on_response()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  update public.help_requests
     set escalation_stopped_at = now()
   where id = new.help_request_id
     and escalation_stopped_at is null;
  return new;
end;
$$;

drop trigger if exists on_help_response_stop_escalation on public.help_responses;
create trigger on_help_response_stop_escalation
  after insert on public.help_responses
  for each row execute function public.stop_escalation_on_response();
-- Familieknappen - Fase 1 (F-033): lukk åpen insert på family_groups.
-- Onboarding bruker create_family_group() (SECURITY DEFINER), så klienter
-- trenger ikke å sette inn rader direkte. Uten insert-policy nekter RLS alt.

drop policy if exists family_groups_insert on public.family_groups;
