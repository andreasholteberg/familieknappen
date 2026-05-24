-- Familieknappen - Lag 3 - 12 Realtime-publisering
-- Tabeller ma ligge i publikasjonen supabase_realtime for at klient-abonnement
-- skal motta endringer. Idempotent.

do $$ begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'help_requests'
  ) then
    alter publication supabase_realtime add table public.help_requests;
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'help_responses'
  ) then
    alter publication supabase_realtime add table public.help_responses;
  end if;
end $$;
