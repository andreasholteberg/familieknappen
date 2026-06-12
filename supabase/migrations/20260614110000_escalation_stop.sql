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
