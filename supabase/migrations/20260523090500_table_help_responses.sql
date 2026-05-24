-- Familieknappen - Lag 3 - 06 help_responses
-- Hurtigsvar eller fritekst fra en parorende. Minst ett av feltene ma vaere satt.
create table if not exists public.help_responses (
  id               uuid primary key default gen_random_uuid(),
  help_request_id  uuid not null references public.help_requests (id) on delete cascade,
  responder_id     uuid not null references public.profiles (id) on delete cascade,
  quick_reply_type public.quick_reply_type,
  free_text        text,
  created_at       timestamptz not null default now(),
  constraint help_responses_has_content
    check (quick_reply_type is not null or nullif(btrim(free_text), '') is not null)
);

create index if not exists help_responses_request_idx on public.help_responses (help_request_id, created_at desc);
