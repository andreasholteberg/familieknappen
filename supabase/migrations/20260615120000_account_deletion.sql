-- Familieknappen - Fase 2A (F-036): konto-/datasletting med 30 dagers
-- angrefrist. Brukeren ber om sletting i appen; endelig sletting gjøres av
-- purge-accounts-funksjonen (service role + auth admin) etter fristen.
-- FK-kjeden auth.users -> profiles -> (members/requests/responses/tokens/
-- activity) er ON DELETE CASCADE, så én auth-sletting fjerner brukerens data.

alter table public.profiles
  add column if not exists deletion_requested_at timestamptz;

create or replace function public.request_account_deletion()
returns timestamptz
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid uuid := auth.uid();
  v_at  timestamptz := now();
begin
  if v_uid is null then
    raise exception 'Ikke innlogget';
  end if;
  update public.profiles
     set deletion_requested_at = v_at
   where id = v_uid
     and deletion_requested_at is null;
  return v_at;
end;
$$;

create or replace function public.cancel_account_deletion()
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Ikke innlogget';
  end if;
  update public.profiles
     set deletion_requested_at = null
   where id = v_uid;
end;
$$;

grant execute on function public.request_account_deletion() to authenticated;
grant execute on function public.cancel_account_deletion() to authenticated;
