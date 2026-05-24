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
