# Pilotrapport – Familieknappen

Status før pilot med ekte familier. Bygget i lag (Supabase-grunnmur → RLS →
invitasjoner → push → eskalering → loading/feil → personvern → opprydding) og
verifisert statisk (all SQL parser mot Postgres-grammatikken; alle TS/TSX-filer
og begge Edge Functions parser uten syntaksfeil; alle interne importer løses opp).
Kjøretidsverifisering på ekte enhet gjenstår – se røyktesten (`PILOT_RØYKTEST.md`).

## Hva fungerer (i koden, klart til å testes)

- **Auth** – passordløs magisk lenke (PKCE), vedvarende økt, auth-gate som ruter
  etter profil-rolle, robust `auth-callback`, og logg ut.
- **Kjerneflyt** – senior sender bildeforespørsel → pårørende mottar (realtime +
  polling-fallback) → svarer (hurtigsvar/fritekst) → senior ser svaret. Bilde
  lastes opp til privat Storage med signerte visnings-URL-er.
- **Loading/feil** – send og svar venter på faktisk resultat: spinner ved
  sending, rolige feilmeldinger ved Supabase-/nettfeil (ingen falsk «sendt»),
  egen notis hvis bildet ikke ble med, vakt mot manglende kontakt og dobbelttrykk.
- **Invitasjoner** – primærkontakt oppretter/lister/trekker tilbake; `accept_group_invitation`
  validerer token/utløp/revoked/e-post; minimal aksept-flyt med deep link.
- **Roller & RLS** – kun gruppemedlemmer ser gruppedata; kun primærkontakt kan
  legge til/fjerne medlemmer og endre roller; ingen kan gjøre seg selv til primær
  (trigger + unik indeks); primæroverføring via egen RPC.
- **Push** – token registreres ved login, fjernes ved logout; Edge Function
  `send-push` ved nye forespørsler/svar; status vises rolig i innstillinger.
- **Eskalering** – `escalation_due_at` settes ved oppretting; `escalate` varsler
  sekundærkontakt og setter `ESCALATED`; senior ser rolig status.
- **Personvern/samtykke** – egne, rolige tekstseksjoner for både senior og
  pårørende; av/på for `activity_sharing_enabled` som faktisk styrer deling.

## Hva må konfigureres manuelt før pilot

- **`.env`** med Supabase URL + anon key.
- **Migreringer** kjørt (CLI `db push` eller `combined_setup.sql`).
- **Auth Redirect URLs** whitelistet (`familieknappen://auth-callback`, `familieknappen://invite`
  + Expo-variant for dev client).
- **Edge Functions** deployet (`send-push`, `escalate`, `--no-verify-jwt`), ev.
  `PUSH_WEBHOOK_SECRET`.
- **Database Webhooks** for INSERT på `help_requests` og `help_responses`.
- **Cron** som kaller `escalate` jevnlig.
- **EAS `projectId`** (`eas init`) + dev-build for ekte push-tokens.
- **Bootstrapping** av første gruppe/primærkontakt via SQL (ingen onboarding-UI).

## Kjente begrensninger

- **Krever dev/EAS-build** – push, magisk lenke og bildeopplasting er ikke
  pålitelige i Expo Go.
- **PKCE** forutsetter at lenken åpnes på samme enhet som ba om den.
- **Ett eskaleringsnivå** (primær → sekundær); ingen av-eskalering av `escalation_level`.
- **Eskaleringsfrist** settes ved oppretting (klient-konstant, 10 min) – gjelder
  bare nye forespørsler hvis den endres.
- **Push er ett forsøk** – ingen retry, ingen opprydding av ugyldige tokens, ingen
  forgrunns-visning konfigurert.
- **Ingen onboarding-UI** – grupper og primærkontakt må settes opp manuelt.
- **Innstillinger som UI-only** – `notifyPush`/`notifySms`-bryterne og avledede
  samtykker er ikke persistente; «Ring»/«Video» er placeholders.
- **Aktivitetsdeling-toggel** oppdaterer egen profil (RLS) – senior styrer sin egen,
  som er den som vises på dashbordet.

## Hva som ikke er produksjonsklart

- **`seed.sql`** lager demo-kontoer med kjent passord – kun dev, aldri prod.
- **Webhook-/funksjons-sikkerhet** hviler på `--no-verify-jwt` + valgfri delt
  hemmelighet; bør strammes (signaturverifisering) før bredere bruk.
- **`family_groups`-insert** er åpen for alle innloggede (ingen onboarding-kontroll).
- **Ingen full `tsc`-typesjekk eller enhetstest** er kjørt herfra – må gjøres.
- **Ingen e-postsending** fra appen (invitasjon deles manuelt via lenke i pilot).
- **GDPR/sletting** er foreløpig kun en tekstlig lovnad, ikke en funksjon.

## Anbefalt neste steg etter pilot

1. Kjør `PILOT_RØYKTEST.md` på to fysiske enheter mot et dedikert pilotprosjekt;
   kjør også `npx tsc --noEmit`.
2. Bygg **onboarding** (opprett gruppe, koble senior, inviter primær) med
   strammere RLS for medlemshåndtering – dette er den største manuelle gjenstående
   biten.
3. Herd push: receipts/opprydding av tokens, forgrunns-handler, signaturverifisert
   webhook.
4. Implementer faktisk **konto-/datasletting** for å innfri personvernløftet.
5. Vurder persistente varslingsinnstillinger og ekte «Ring»/«Video».
