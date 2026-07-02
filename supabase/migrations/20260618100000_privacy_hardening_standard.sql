-- Familieknappen - Personvern-herding for Standard (før lukket test).
-- Kodeforankret i Datakartlegging_og_protokoll_v0.1. Ingen nye funksjoner,
-- ingen nye leverandører. Idempotent der mulig.
--
-- 1) Aktivitetsdeling er opt-in (default av) + backfill til av.
-- 2) «Brukt i dag» eksponeres som avledet BOOLSK verdi; presist last_seen_at
--    holdes internt (gruppemedlemmer leser ikke andres rader direkte).
-- 3) Auto-eskalering er av i Standard (ingen escalation_due_at som default).
-- 4) Utløpte/avsluttede invitasjoner ryddes av purge_old_records.

-- 1) Aktivitetsdeling: opt-in --------------------------------------------------
alter table public.profiles
  alter column activity_sharing_enabled set default false;

-- Eksisterende rader ble satt til true av en tidligere default UTEN at det
-- finnes et eksplisitt, loggført samtykke. Trygt valg: tilbakestill til av,
-- slik at deling må slås aktivt på igjen av brukeren.
update public.profiles
   set activity_sharing_enabled = false
 where activity_sharing_enabled is true;

-- 2) «Brukt i dag» som avledet boolsk verdi -----------------------------------
-- Returnerer kun true/false, aldri presist tidspunkt. Respekterer samtykke og
-- at kaller deler gruppe med p_user (eller er p_user selv). Tidssone Europe/Oslo
-- gir naturlig nullstilling ved midnatt.
create or replace function public.activity_used_today(p_user uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(
    (
      select a.last_seen_at is not null
         and (a.last_seen_at at time zone 'Europe/Oslo')::date
             = (now() at time zone 'Europe/Oslo')::date
        from public.activity_status a
        join public.profiles p on p.id = a.user_id
       where a.user_id = p_user
         and coalesce(p.activity_sharing_enabled, false)
         and (a.user_id = auth.uid() or public.shares_group_with(a.user_id))
    ),
    false
  );
$$;

revoke execute on function public.activity_used_today(uuid) from public;
grant execute on function public.activity_used_today(uuid) to authenticated;

-- Stram inn direkte lesing: en bruker leser bare SIN EGEN activity_status-rad.
-- Gruppemedlemmer får «brukt i dag» via activity_used_today() (kun boolsk),
-- slik at presist last_seen_at ikke eksponeres i Standard.
drop policy if exists activity_status_select on public.activity_status;
create policy activity_status_select on public.activity_status
  for select to authenticated
  using (user_id = auth.uid());

-- 3) Auto-eskalering av i Standard --------------------------------------------
-- Fjern default-fristen, slik at nye forespørsler ikke får escalation_due_at.
-- escalate-funksjonen matcher kun rader der escalation_due_at <= now(), så
-- NULL betyr «eskaleres ikke». Eskalering hører til Premium (egen DPIA).
alter table public.help_requests
  alter column escalation_due_at drop default;

-- Nullstill fristen på allerede åpne, ikke-eskalerte forespørsler.
update public.help_requests
   set escalation_due_at = null
 where escalated_at is null
   and escalation_stopped_at is null;

-- 4) Rydd utløpte/avsluttede invitasjoner i datahygienen ----------------------
create or replace function public.purge_old_records()
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_logs int;
  v_attempts int;
  v_codes int;
  v_invites int;
begin
  delete from public.notification_log where created_at < now() - interval '90 days';
  get diagnostics v_logs = row_count;

  delete from public.pairing_attempts where attempted_at < now() - interval '30 days';
  get diagnostics v_attempts = row_count;

  delete from public.pairing_codes
   where created_at < now() - interval '30 days'
     and (used_at is not null or revoked_at is not null or expires_at < now());
  get diagnostics v_codes = row_count;

  -- Utløpte/aksepterte/tilbaketrukne invitasjoner eldre enn 30 dager.
  delete from public.group_invitations
   where (accepted_at is not null and accepted_at < now() - interval '30 days')
      or (revoked_at  is not null and revoked_at  < now() - interval '30 days')
      or (expires_at < now() - interval '30 days');
  get diagnostics v_invites = row_count;

  return jsonb_build_object(
    'logs', v_logs, 'attempts', v_attempts, 'codes', v_codes, 'invitations', v_invites
  );
end;
$$;

revoke execute on function public.purge_old_records() from public;
revoke execute on function public.purge_old_records() from authenticated;
grant execute on function public.purge_old_records() to service_role;
