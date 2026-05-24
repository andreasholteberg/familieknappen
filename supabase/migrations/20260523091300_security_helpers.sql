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
