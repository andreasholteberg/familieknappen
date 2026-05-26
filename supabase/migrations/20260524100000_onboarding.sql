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
