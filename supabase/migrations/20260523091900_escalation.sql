-- Familieknappen - Lag 7 - 20 Eskaleringsfelter
-- Enkel, tidsbasert eskalering: hvis ingen svarer innen escalation_due_at,
-- eskaleres foresporselen til sekundaerkontakt(er). Kun ett niva.
-- (escalated_at finnes fra for; status ESCALATED finnes i enum.)

alter table public.help_requests
  add column if not exists escalation_due_at timestamptz,
  add column if not exists escalation_level integer not null default 0;

-- Hjelpeindeks for a finne forfalte, ikke-eskalerte foresporsler raskt.
create index if not exists help_requests_escalation_due_idx
  on public.help_requests (escalation_due_at)
  where escalation_level = 0;
