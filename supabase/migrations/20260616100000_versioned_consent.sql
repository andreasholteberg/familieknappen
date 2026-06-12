-- Familieknappen - Fase 2B (F-041): versjonsmerket samtykke.
-- Appen ber om nytt samtykke når dokumentversjonene endres. Feltene settes
-- av brukeren selv (RLS: kun egen profil) via vanlig update.

alter table public.profiles
  add column if not exists consented_terms_at timestamptz,
  add column if not exists consented_privacy_at timestamptz,
  add column if not exists terms_version text,
  add column if not exists privacy_version text;
