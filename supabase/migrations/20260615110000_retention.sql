-- Familieknappen - Fase 2A: nøktern datahygiene. Kjøres av cron via
-- purge-accounts-funksjonen (service role). Ikke kallbar fra klient.

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
begin
  delete from public.notification_log where created_at < now() - interval '90 days';
  get diagnostics v_logs = row_count;

  delete from public.pairing_attempts where attempted_at < now() - interval '30 days';
  get diagnostics v_attempts = row_count;

  delete from public.pairing_codes
   where created_at < now() - interval '30 days'
     and (used_at is not null or revoked_at is not null or expires_at < now());
  get diagnostics v_codes = row_count;

  return jsonb_build_object('logs', v_logs, 'attempts', v_attempts, 'codes', v_codes);
end;
$$;

revoke execute on function public.purge_old_records() from public;
revoke execute on function public.purge_old_records() from authenticated;
grant execute on function public.purge_old_records() to service_role;
