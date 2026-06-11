-- Familieknappen - Fase 1 (F-021): eksplisitt kvittering fra senior.
-- «Jeg har sett svaret»-knappen setter acknowledged_at. seen_by_senior
-- beholdes som rask flagg for hjem-kortet; acknowledged_at er den varige
-- kvitteringen med tidsstempel (brukes av historikk og senere pårørende-UI).

alter table public.help_requests
  add column if not exists acknowledged_at timestamptz;

comment on column public.help_requests.acknowledged_at is
  'Når senior eksplisitt kvitterte for at svaret er sett (F-021/F-022).';
