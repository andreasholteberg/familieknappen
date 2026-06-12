-- Familieknappen - Fase 2A: daglig kjøring av purge-accounts.
-- Selve webhook-secret ligger i Supabase Vault som
-- purge_accounts_webhook_secret og skal aldri inn i repoet.

create extension if not exists pg_cron;
create extension if not exists pg_net;

do $$
begin
  if not exists (
    select 1
      from vault.decrypted_secrets
     where name = 'purge_accounts_webhook_secret'
  ) then
    raise exception 'Missing Vault secret: purge_accounts_webhook_secret';
  end if;
end;
$$;

do $$
begin
  perform cron.unschedule('familieknappen-purge-accounts');
exception
  when others then
    null;
end;
$$;

select cron.schedule(
  'familieknappen-purge-accounts',
  '17 3 * * *',
  $$
  select net.http_post(
    url := 'https://vjddppqsbrafcywwjnpf.supabase.co/functions/v1/purge-accounts',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-webhook-secret', (
        select decrypted_secret
          from vault.decrypted_secrets
         where name = 'purge_accounts_webhook_secret'
      )
    ),
    body := jsonb_build_object(
      'source', 'pg_cron',
      'job', 'familieknappen-purge-accounts'
    )
  );
  $$
);
