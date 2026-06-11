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
