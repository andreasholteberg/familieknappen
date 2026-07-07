-- Familieknappen – Videosamtale (Nivå 2, ekstern lenke)
-- Legger til en valgfri, fast videolenke på profilen. Pårørende lagrer sin
-- egen lenke (FaceTime/Meet/Whereby/Jitsi …); senior kan da starte en
-- videosamtale fra «Min familie». Appen åpner bare lenken – ingen video lagres.
--
-- RLS: krever INGEN nye policyer. `profiles_update` (id = auth.uid()) lar
-- pårørende sette sin egen lenke, og `profiles_select` (egen profil eller
-- delt familiegruppe) lar senior lese den – nøyaktig som `phone`.

alter table public.profiles
  add column if not exists video_call_url text;

comment on column public.profiles.video_call_url is
  'Valgfri ekstern videolenke (https/facetime) som familien kan starte videosamtale med. Åpnes av klienten; ingen video lagres i Familieknappen.';
