# Fase 1B-leveranse – lisens, eskaleringsstopp, varsle alle, veiviser, RLS

Fortsettelse av Fase 1 etter planens § 12 (P1). Statisk verifisert:
`tsc --noEmit` grønn, all SQL parser mot Postgres-grammatikken.

## Hva som er gjort

**F-018/F-019/F-020 – Lisens uten betaling**
- Migrering `20260614100000_subscription_status.sql`: `subscription_status`
  (default `manual_review` = åpen), `billing_admin_user_id`, `trial_end`,
  `current_period_end`, `created_by` på `family_groups`. Eksisterende grupper
  sperres ALDRI av denne endringen.
- Lisensfeltene kan ikke skrives fra klient (kolonnenivå-grant: kun `name`).
- Ny nøytral sperreskjerm `app/license.tsx` – ingen kjøps-UI eller lenker
  (App Store-policy), bare rolig tekst + «Prøv igjen»/«Logg ut».
- Auth-gaten ruter til sperreskjermen når status er `canceled`/`expired`.

**F-024 – Eskalering stopper ved svar**
- `help_requests.escalation_stopped_at` + DB-trigger ved første svar.
- `escalate`-funksjonen hopper over stoppede forespørsler.

**F-029 – «Varsle alle» ved Ring familien**
- Ny Edge Function `notify-call` (krever JWT): push til alle pårørende
  «{navn} prøver å nå deg» når senior trykker Ring. Logger i
  `notification_log` (`call_alert`). Appen kaller den ikke-blokkerende –
  ringingen påvirkes aldri av at push feiler.

**F-032 – Onboarding-veiviser for pårørende**
- Ny skjerm `app/relative/welcome.tsx`: tre korte steg (hva er appen →
  inviter familien → legg inn nummer). Vises automatisk etter at
  familiegruppen er opprettet; ut til innstillinger eller oversikten.

**F-033 – RLS-revisjon**
- Se `RLS_REVISJON.md`. To funn rettet: åpen `family_groups`-insert er
  lukket (`20260614120000_tighten_group_insert.sql`), og lisensfeltene er
  beskyttet på kolonnenivå.

## Må gjøres manuelt før test
1. Kjør migreringene (`supabase db push` eller oppdatert `combined_setup.sql`).
2. Deploy ny funksjon: `supabase functions deploy notify-call` (MED
   JWT-verifisering – ikke bruk `--no-verify-jwt` her).
3. Redeploy `escalate`: `supabase functions deploy escalate --no-verify-jwt`.
4. Ny APK når dere vil teste på enhet.

## Testpunkter
1. Vanlig familie (manual_review): alt som før, ingen sperreskjerm.
2. Sett `subscription_status='expired'` på en testgruppe i SQL → medlemmene
   ser sperreskjermen; sett tilbake til `manual_review` → «Prøv igjen» slipper inn.
3. Send forespørsel, svar før fristen → `escalation_stopped_at` satt, ingen
   eskalering selv om cron kjører.
4. Senior trykker «Ring» → alle pårørende (unntatt den som ringes opp får
   også, de er alle mål) får push innen sekunder; `notification_log` har
   `call_alert`-rader.
5. Ny pårørende oppretter gruppe → veiviseren vises → «Gå til innstillinger».
6. Forsøk å oppdatere `subscription_status` fra appen/anon-klient → avvises.

## Forslag til forbedringer (vurdert underveis)
1. **Eskaleringsfrist bør settes av databasen**, ikke klienten (R5 i
   revisjonen) – DB-default `now() + interval '10 minutes'` fjerner både
   klient-konstanten og manipulasjonsmuligheten. Liten migrering.
2. **Sperreskjermen sjekkes bare i auth-gaten.** En gruppe som utløper midt
   i en økt merkes først ved neste oppstart/refresh-rute. Godt nok nå;
   flytt sjekken inn i store/refresh hvis betalt pilot krever det.
3. **Veiviseren vises bare ved gruppeoppretting.** Inviterte pårørende ser
   den ikke – vurder å vise den også etter akseptert invitasjon.
4. **`notification_log` vokser fritt** (nå også call_alert). En enkel
   cron-sletting av rader eldre enn 90 dager dekker både logg og
   `pairing_attempts`.
5. **Versjonsmerke i innstillinger** («Familieknappen v1.0.0 · build …») gjør
   pilot-support mye lettere – dere ser hvilken APK mor faktisk har.
