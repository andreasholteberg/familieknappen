-- Familieknappen - Lag 3 - 09 Funksjoner og triggere
-- SECURITY DEFINER-funksjoner brukes i RLS for a unnga rekursjon (policy som
-- spor family_members ville ellers utlost family_members-policyen pa nytt).

-- Er innlogget bruker medlem av gruppe g?
create or replace function public.is_group_member(g uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.family_members
    where group_id = g and user_id = auth.uid()
  );
$$;

-- Deler innlogget bruker minst en gruppe med "other"?
create or replace function public.shares_group_with(other uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.family_members me
    join public.family_members them on them.group_id = me.group_id
    where me.user_id = auth.uid() and them.user_id = other
  );
$$;

-- Hvilken gruppe horer en foresporsel til? (brukes i help_responses-policy)
create or replace function public.request_group(req uuid)
returns uuid
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select family_group_id from public.help_requests where id = req;
$$;

-- Opprett appprofil automatisk nar en auth-bruker opprettes.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.profiles (id, email, name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Hold updated_at oppdatert.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_updated_at on public.profiles;
create trigger set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at on public.help_requests;
create trigger set_updated_at before update on public.help_requests
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at on public.activity_status;
create trigger set_updated_at before update on public.activity_status
  for each row execute function public.set_updated_at();
