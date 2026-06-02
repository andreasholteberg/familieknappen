-- Familieknappen - sett approlle naar invitasjon godtas
-- En senior-invitasjon maa ogsaa sette profiles.role = 'senior', ellers rutes
-- brukeren til paarorende-flaten etter forste innlogging.

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

  insert into public.family_members (group_id, user_id, member_role)
  values (inv.family_group_id, v_uid, inv.invited_role)
  on conflict (group_id, user_id) do update
    set member_role = excluded.member_role;

  update public.profiles
    set role = case
      when inv.invited_role = 'senior' then 'senior'::public.app_role
      else 'relative'::public.app_role
    end
    where id = v_uid;

  update public.group_invitations set accepted_at = now() where id = inv.id;

  return jsonb_build_object(
    'family_group_id', inv.family_group_id,
    'role', inv.invited_role
  );
end;
$$;

grant execute on function public.accept_group_invitation(text) to authenticated;
