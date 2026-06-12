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
