# Fase 2A-leveranse – robusthet, ro og personvern

Bygget videre etter planens § 12 (P2) + forbedringsforslagene fra Fase 1B.
Statisk verifisert: `tsc --noEmit` grønn, all SQL parser mot Postgres-grammatikken.

## Hva som er gjort

**Småforbedringer (fra Fase 1B-notatet)**
- Eskaleringsfristen settes nå av databasen (`escalation_due_at` har default
  `now() + 10 min`); klient-konstanten er fjernet. Lukker R5 fra RLS-revisjonen.
- `purge_old_records()`: rydder notification_log (>90 dg), pairing_attempts
  (>30 dg) og brukte/utløpte paringskoder (>30 dg). Kun service role.
- Versjonsmerke nederst i pårørende-innstillinger («Familieknappen v1.0.0»).
- Veiviseren vises nå også for pårørende som godtar en invitasjon (ikke bare
  ved gruppeoppretting). Senior sendes rett til sin hjemskjerm.
- Ærlighetsfiks: dashbordet viste «Åpnet appen i dag ✓» hardkodet – nå vises
  det bare når det stemmer.

**F-034 – Error Boundary**
- `src/components/ErrorBoundary.tsx` rundt hele appen i rot-layout: uventede
  krasj gir en rolig norsk skjerm med «Prøv igjen» – aldri hvit skjerm.
  (Sentry/sentral logging er bevisst utsatt til F-035.)

**F-045 – Rolig status-stripe i dashbordet**
- Øverst: «Alt ser rolig ut i dag.» / «{navn} har fått hjelp i dag.» /
  «{navn} venter på svar nå.» / «Ingen aktivitet registrert i dag.»
  Observasjoner, aldri konklusjoner – i tråd med tekstprinsippene (§ 7.5).

**F-036 – Konto-/datasletting med 30 dagers angrefrist**
- Migrering: `profiles.deletion_requested_at` + RPC-ene
  `request_account_deletion()` og `cancel_account_deletion()`.
- Ny Edge Function `purge-accounts`: sletter auth-brukere der fristen er ute
  (FK-kaskaden tar profil og brukerdata) og kjører `purge_old_records()`.
  Kjøres daglig via cron/Schedules.
- UI: «Slett kontoen min» i pårørende-innstillinger og en diskret lenke på
  seniorens personvernskjerm – begge med dobbel bekreftelse, tydelig
  angrefrist og «Angre sletting»-knapp så lenge fristen løper.
- Personvernløftet («du kan be om sletting») er dermed en faktisk funksjon.

## Må gjøres manuelt
1. Kjør migreringene (db push / combined_setup.sql – idempotent).
2. `supabase functions deploy purge-accounts --no-verify-jwt` + daglig cron
   (samme mønster som escalate; bruk gjerne samme x-webhook-secret).
3. Ny APK for å teste på enhet.

## Testpunkter
1. Krasjtest i dev: kast en feil i en skjerm → rolig feilskjerm, «Prøv igjen»
   bringer appen tilbake.
2. Dashbord: stripen endrer seg med åpne forespørsler/svar i dag/ro.
3. Sletting: be om sletting → status vises begge steder → angre → borte.
   Sett `deletion_requested_at` 31 dager tilbake i SQL, kjør purge-accounts →
   brukeren er borte (auth + data), gruppen og andres data består.
4. Ny forespørsel får `escalation_due_at` fra databasen (sjekk raden).
5. Invitert pårørende ser veiviseren etter aksept; invitert senior gjør ikke.

## Forslag videre (neste naturlige steg)
1. **Personvernerklæring + brukervilkår-utkast (F-038/F-039)** – tekstarbeid
   vi kan gjøre sammen; sletting og samtykke-UI finnes nå, så dokumentene kan
   beskrive faktisk funksjonalitet.
2. **Versjonsmerket samtykke (F-041)** når tekstene over er klare.
3. **Sentry med scrubbing (F-035)** – krever konto/DSN fra deg.
4. **Bildedeling fra pårørende til senior** – den sterkeste
   attråverdighets-funksjonen fra produktdiskusjonen; liten datamodell
   (family_photos + privat bucket) og to enkle skjermer.
