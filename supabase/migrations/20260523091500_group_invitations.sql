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
