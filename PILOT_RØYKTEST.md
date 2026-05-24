# Pilot-røyktest – Familieknappen

Konkret plan for å verifisere at appen kan testes med ekte familier, på en
**EAS dev-build** på to fysiske enheter. Bruk et **dedikert pilot-/utviklings-
Supabase-prosjekt** (ikke ett der `seed.sql` har kjørt mot «ekte» data).

> Push, magisk lenke (deep links) og bildeopplasting fungerer **ikke** pålitelig
> i Expo Go. Bruk en dev client / EAS-build.

---

## Del A · Supabase-konfigurasjonssjekkliste

Kryss av før røyktesten starter.

### 1. Miljøvariabler (app)
- [ ] `cp .env.example .env`
- [ ] `EXPO_PUBLIC_SUPABASE_URL` satt (Project Settings → API → Project URL)
- [ ] `EXPO_PUBLIC_SUPABASE_ANON_KEY` satt (anon/public key)
- [ ] App startet med tom cache: `npx expo start -c`

### 2. Database / migreringer
- [ ] Kjørt enten `supabase db push` (CLI) **eller** limt inn
      `supabase/combined_setup.sql` i SQL Editor (idempotent)
- [ ] 20 migreringer er anvendt (tabeller: profiles, family_groups,
      family_members, help_requests, help_responses, calendar_events,
      activity_status, group_invitations, notification_tokens, notification_log)
- [ ] (Kun dev/pilot) `supabase/seed.sql` kjørt for demodata **ELLER** en ekte
      gruppe bootstrappet manuelt (se «Bootstrapping» nederst)

### 3. Auth (magisk lenke)
- [ ] Auth → Providers → Email er på, med «Confirm email»/magic link aktivert
- [ ] Auth → URL Configuration → Redirect URLs inneholder appens deep links:
      `familieknappen://auth-callback` og `familieknappen://invite`
- [ ] (For dev client) også Expo-varianten som skrives ut av `Linking.createURL`
      (f.eks. `exp+familieknappen://…` / `exp://…/--/auth-callback`)

### 4. Storage
- [ ] Bucket `help-images` finnes og er **privat** (opprettet av migrering 11)
- [ ] Storage-policyer `help_images_select/insert/update` finnes

### 5. RLS
- [ ] RLS er på for alle sju kjernetabeller + group_invitations +
      notification_tokens + notification_log
- [ ] Funksjonene finnes: `is_group_member`, `shares_group_with`,
      `request_group`, `is_primary_contact`, `group_has_members`,
      `activity_sharing_on`, `transfer_primary_contact`, `accept_group_invitation`
- [ ] Isolasjonstest: en bruker i gruppe A ser ikke gruppe B sine data

### 6. Realtime
- [ ] `help_requests` og `help_responses` ligger i publikasjonen
      `supabase_realtime` (migrering 12)

### 7. Edge Functions
- [ ] `supabase functions deploy send-push --no-verify-jwt`
- [ ] `supabase functions deploy escalate --no-verify-jwt`
- [ ] (Valgfritt) `supabase secrets set PUSH_WEBHOOK_SECRET=<hemmelighet>`

### 8. Database Webhooks (utløser send-push)
- [ ] Webhook 1: INSERT på `public.help_requests` → POST til
      `https://<ref>.supabase.co/functions/v1/send-push`
- [ ] Webhook 2: INSERT på `public.help_responses` → samme URL
- [ ] Hvis hemmelighet er satt: header `x-webhook-secret: <hemmelighet>` på begge

### 9. Planlagt eskalering (escalate)
- [ ] Cron som kaller `escalate` hvert minutt (pg_cron + pg_net, eller Dashboard
      → Edge Functions → Schedules). Se snippet i `LAG3_SUPABASE.md` § Lag 7.

### 10. Push / EAS
- [ ] `eas init` kjørt → prosjektet har en `projectId`
- [ ] Dev client bygget: `eas build --profile development` (eller
      `npx expo run:android` / `run:ios`)
- [ ] (Android prod senere) FCM-credentials i EAS

---

## Del B · Røyktest steg for steg

To enheter: **Enhet 1 = senior**, **Enhet 2 = pårørende**. Demo-kontoer:
`astrid@example.no` (senior), `anne@example.no` (primær), `per@example.no` (sekundær).

### 1. Senior-login (Enhet 1)
1. Åpne appen → «Familieknappen»-innlogging.
2. Skriv `astrid@example.no` → «Send innloggingslenke» → «Sjekk e-posten din».
3. Åpne e-posten **på samme enhet**, trykk lenken → appen åpnes via
   `auth-callback` → ruter til seniorens hjem.
- ✅ Forventet: seniorens hjem med tre store knapper + diskret «Personvern og samtykke».
- 🔎 Verifiser: `auth.users`/`profiles` har raden; `activity_status` oppdateres ved åpning.

### 2. Pårørende-login (Enhet 2)
1. Logg inn som `anne@example.no` på samme måte.
- ✅ Forventet: pårørende-dashbordet med seniorens navn, «sist aktiv», forespørsler, kalender.

### 3. Invitasjon (Enhet 2 → ny bruker)
1. Som Anne (primær): Innstillinger → «INVITER FAMILIEMEDLEM» → e-post + rolle → «Send invitasjon».
2. Kopier lenken/token som vises → åpne `familieknappen://invite?token=…` på en enhet
   som ikke er innlogget → logg inn med den inviterte e-posten → «Du er med i familien».
- ✅ Forventet: ny `family_members`-rad; invitasjonen får status «Brukt».
- 🔎 Negativt: gjenbruk token → «allerede brukt»; feil e-post → «sendt til en annen e-postadresse».

### 4. Bildeforespørsel (Enhet 1)
1. Som Astrid: «Spør familien» → Ta bilde / Velg bilde → velg kontakt → «Send».
- ✅ Forventet: «Sender …», deretter «Sendt til Anne. Vent på svar …».
- 🔎 Verifiser: ny `help_requests`-rad (status DELIVERED, `escalation_due_at` ~10 min frem),
   bilde i `help-images/<group>/<request>.jpg`.
- 🔎 Feiltest: skru av nett → send → «Vi fikk ikke sendt … prøv igjen» (ingen falsk bekreftelse).

### 5. Mottak + svar (Enhet 2)
1. Forespørselen dukker opp på Annes dashbord (realtime, ev. innen 20 s polling).
2. Åpne → se bildet → trykk et hurtigsvar eller skriv fritekst.
- ✅ Forventet: «Sender svar …», deretter tilbake; status blir ANSWERED.
- 🔎 Feiltest: skru av nett, trykk svar → «Vi fikk ikke sendt svaret …» (blir på skjermen).

### 6. Senior ser svar (Enhet 1)
- ✅ Forventet: hjemskjermen viser «Se svar fra familien» → åpne → stort, tydelig svar.

### 7. Push (begge veier)
1. Lukk/bakgrunnslegg appen på mottakerenheten.
2. Send en ny forespørsel (senior) → Enhet 2 skal få push «… ber om hjelp».
3. Svar (pårørende) → Enhet 1 skal få push «Svar fra familien».
- 🔎 Verifiser: `notification_tokens` har rader for begge; `notification_log` viser `sent`.
- ⚠ Ingen push? Sjekk EAS `projectId`, tillatelse, webhooks, og `notification_log` (`no_token`/`error`).

### 8. Eskalering
1. Send en forespørsel og **ikke** svar.
2. Tving frist i fortid: `update help_requests set escalation_due_at = now() - interval '1 min' where id = '<id>';`
3. Kjør `escalate` (cron, eller `curl -X POST https://<ref>.supabase.co/functions/v1/escalate`).
- ✅ Forventet: status `ESCALATED`; sekundærkontakt får push; `notification_log` har `escalation`.
- ✅ Seniorens hjem viser rolig status «Vi prøver å få tak i familien.»

### 9. Personvern / samtykke
1. Senior (Enhet 1): hjem → «Personvern og samtykke» → se de seks punktene.
2. Pårørende (Enhet 2): Innstillinger → «PERSONVERN OG SAMTYKKE» → samme punkter.
- ✅ Forventet: rolig språk, ingen teknisk sjargong, ingen «demo»-tekst.

### 10. Aktivitetsdeling av/på
1. Senior: på Personvern-skjermen, velg «Nei».
- ✅ Forventet: `profiles.activity_sharing_enabled = false` for Astrid; hint «Familien ser ikke aktiviteten din.»
2. På Annes dashbord skal seniorens «sist aktiv» nå skjules (RLS via `activity_sharing_on`).
3. Velg «Ja» igjen → status deles på nytt.

---

## Bootstrapping av en ekte familie (uten onboarding-UI)
Det finnes ingen gruppe-opprettings-UI ennå. For en ekte pilotfamilie:
1. Opprett senior- og primær-konto (la dem logge inn én gang så `profiles` lages),
   eller bruk `seed.sql`-mønsteret tilpasset ekte e-poster.
2. Kjør SQL for å lage `family_groups` + `family_members` (senior = `senior`,
   forelder = `primary_contact`).
3. Resten (invitere sekundær) gjøres i appen via «Inviter familiemedlem».

## Akseptkriterier (pilot-klar hvis alle er grønne)
- [ ] Begge roller kan logge inn med magisk lenke
- [ ] Senior kan sende bildeforespørsel; pårørende mottar og svarer; senior ser svar
- [ ] Invitasjon kan opprettes, godtas, trekkes tilbake
- [ ] Push virker i minst én retning på fysisk enhet
- [ ] Eskalering setter ESCALATED og varsler sekundær
- [ ] Personvurderingstekst vises for begge roller; aktivitetsdeling av/på virker
- [ ] Ingen stille feil: nett-av gir rolige feilmeldinger, ikke falsk suksess

---

## Feilsøking · oppdaget under første utrulling

- **`gen_random_bytes does not exist`** ved `db push`: pgcrypto ligger i
  `extensions`-skjemaet, som ikke er på search_path i migrerings-sesjonen.
  Løst: invitasjons-token bruker nå `replace(gen_random_uuid()::text,'-','')`
  (ingen pgcrypto). I `seed.sql` er `crypt`/`gen_salt` kvalifisert som
  `extensions.crypt` / `extensions.gen_salt`.
- **`syntax error at or near "﻿"` (BOM):** ikke rediger SQL med PowerShell
  `Set-Content -Encoding UTF8` (Windows PowerShell 5.1 legger til BOM og kan
  ødelegge æ/ø/å). Bruk `utf8NoBOM` (PowerShell 7+), en vanlig editor som lagrer
  UTF-8 uten BOM, eller la verktøyet skrive fila.
- **`config.toml`:** `major_version` satt til 17 for å matche prosjektet.
