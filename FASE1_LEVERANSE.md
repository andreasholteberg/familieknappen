# Fase 1-leveranse – funksjonell MVP (F-015–F-028)

Bygget etter `COMMERCIAL_APP_COMPLETION_PLAN.md` § 12 (P1) og § 14.5.
Statisk verifisert: `tsc --noEmit` grønn, all ny SQL parser mot
Postgres-grammatikken. Krever migrering i Supabase og ny APK før test.

## Hva som er gjort

**F-025 – «Min familie» (+ telefonnummer-UI)**
- Ny skjerm `app/senior/family.tsx`: store kontaktkort per pårørende med
  Ring-knapp (vises kun med nummer) og «Spør om hjelp» som starter
  spør-flyten med kontakten forhåndsvalgt (`/senior/ask?contact=…`).
- «Min familie»-knapp på seniorens hjem (4 hovedvalg: Spør familien,
  Min familie, Min dag, Ring familien).
- Nytt felt «Mitt telefonnummer» i pårørende-innstillinger som lagrer til
  `profiles.phone` (kun egen profil, RLS). Fjerner SQL-steget før ringeflyt.

**F-021/F-022/F-023 – Kvittering + Tidligere svar**
- Migrering `20260613100000_acknowledged_at.sql`: `help_requests.acknowledged_at`.
- «Jeg har sett svaret» setter nå både `seen_by_senior` og `acknowledged_at`.
- Ny skjerm `app/senior/history.tsx`: siste 10 besvarte spørsmål, trykk for å
  se hele svaret igjen. Diskret lenke «Tidligere svar» på hjem-skjermen.

**F-026/F-027/F-028 – Senior-kalender + feilhåndtering**
- Ny skjerm `app/senior/add-event.tsx`: tre store felt (hva/dag/klokke),
  rolig bekreftelse, ingen slette-/redigeringsmulighet for senior.
- «Legg til avtale»-knapp på «Min dag».
- `addEvent`/`updateEvent`/`deleteEvent` i store er nå async og kaster feil
  til UI: pårørende-skjermene viser «Fikk ikke lagret/slettet avtalen. Sjekk
  nettet og prøv igjen.» i stedet for stillhet. Sletting ruller tilbake
  optimistisk fjerning ved feil.
- Pårørende-kalenderen viser «Lagt til av {navn}» når senior har laget avtalen.

**F-015/F-016/F-017 – Paringskode**
- Beslutning F-015 (tatt med Andreas): koden brukes PÅ TOPPEN av e-post-OTP.
  Senior logger inn som i dag og taster koden én gang. Ingen anonym auth.
- Migrering `20260613110000_pairing_codes.sql`: tabellene `pairing_codes` og
  `pairing_attempts`, RLS (medlemmer leser, kun primær oppretter), og to
  SECURITY DEFINER-RPC-er:
  - `create_pairing_code(p_group, p_role)` – kun primærkontakt; trekker
    tilbake gruppas aktive koder; kryptografisk tilfeldig 6-sifret kode;
    15 min levetid; aldri primærkontakt-rolle.
  - `pair_with_code(p_code)` – engangsbruk, utløpssjekk, maks 5 forsøk per
    15 min per bruker (brute force-brems), melder bruker inn i gruppa og
    setter `profiles.role` (senior/relative).
- Innstillinger (kun primær): «Lag paringskode» med stor kodevisning;
  rollevalget (Senior/Pårørende) gjenbrukes fra invitasjonen.
- Velkomstskjermen har nå «Har du fått en 6-sifret kode fra familien?» med
  stort kodefelt øverst – «eller» opprett egen gruppe under.

## Må gjøres manuelt før test
1. Kjør migreringene i Supabase (`supabase db push`, eller de to nye filene /
   oppdatert `combined_setup.sql` i SQL Editor – idempotent).
2. Bygg ny APK (native endringer er ikke nødvendige, men JS-en må med):
   `eas build --profile preview --platform android`.

## Testpunkter
1. Pårørende: lagre eget telefonnummer i innstillinger → seniorens
   «Ring familien» og «Min familie» viser ring-knapp uten SQL.
2. Senior: «Min familie» → Ring og «Spør om hjelp» (forhåndsvalgt kontakt).
3. Senior: svar → «Jeg har sett svaret» → sjekk `acknowledged_at` satt;
   «Tidligere svar» viser saken.
4. Senior: «Min dag» → «Legg til avtale» → vises hos pårørende med
   «Lagt til av …»-tag; pårørende kan fortsatt redigere/slette (F-027).
5. Kalender i flymodus → rolig feilmelding, ingen stille feil (F-028).
6. Paring: primær lager kode → ny bruker logger inn med OTP → taster koden
   på velkomstskjermen → havner i gruppa med riktig rolle. Negativt: feil
   kode (rolig melding), utløpt kode, 6. forsøk på kvarteret (brems).

## Kjente begrensninger / neste
- Paringskoden krever fortsatt at senior har e-post (bevisst F-015-valg).
- `pairing_attempts` ryddes ikke automatisk (ufarlig vekst; kan få cron senere).
- Senior kan ikke redigere/slette egne avtaler (bevisst MVP-avgrensning).
- Gjenstår av P1: F-018–F-020 (lisens/sperreskjerm), F-024, F-029 (varsle
  alle), F-030–F-033 (verifisering, onboarding-veiviser, RLS-revisjon).
