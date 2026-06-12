-- Familieknappen - Fase 2A: eskaleringsfristen settes av databasen (R5 i
-- RLS-revisjonen). Klienten slutter å sende escalation_due_at; default
-- gjelder alle nye forespørsler og kan ikke manipuleres fra klient.

alter table public.help_requests
  alter column escalation_due_at set default (now() + interval '10 minutes');
