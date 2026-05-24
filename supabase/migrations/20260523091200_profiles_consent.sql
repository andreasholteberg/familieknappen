-- Familieknappen - Lag 4 - 13 Minimum samtykke
-- Senior (eller en hvilken som helst bruker) kan sla av deling av aktivitetsstatus.
-- Standard: pa, slik at eksisterende dashbord-oppforsel bevares.

alter table public.profiles
  add column if not exists activity_sharing_enabled boolean not null default true;
