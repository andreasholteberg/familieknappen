-- Familieknappen - Lag 3 - 01 Extensions og enum-typer
-- Idempotent: kan kjores flere ganger uten a feile.

create extension if not exists pgcrypto;

-- App-rolle (styrer hvilken skjermstabel brukeren ser).
do $$ begin
  if not exists (select 1 from pg_type where typname = 'app_role') then
    create type public.app_role as enum ('senior', 'relative');
  end if;
end $$;

-- Medlemsrolle i en familiegruppe (tilgang/primaerkontakt).
do $$ begin
  if not exists (select 1 from pg_type where typname = 'member_role') then
    create type public.member_role as enum ('senior', 'primary_contact', 'secondary_contact');
  end if;
end $$;

-- Livssyklus for en hjelpeforesporsel. ESCALATED er med i schemaet, men brukes
-- ikke i MVP (eskaleringsmotor kommer senere).
do $$ begin
  if not exists (select 1 from pg_type where typname = 'request_status') then
    create type public.request_status as enum (
      'CREATED', 'SENT', 'DELIVERED', 'VIEWED', 'ANSWERED', 'ESCALATED', 'CLOSED'
    );
  end if;
end $$;

-- Hurtigsvar-typer. Fritekst lagres separat (free_text).
do $$ begin
  if not exists (select 1 from pg_type where typname = 'quick_reply_type') then
    create type public.quick_reply_type as enum ('DO_NOT_REPLY', 'LOOKS_OK', 'I_WILL_CALL');
  end if;
end $$;
