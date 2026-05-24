# Lag 3 – Supabase-grunnmur: teknisk rapport

Kort status for overgangen fra mockdata til ekte dataflyt på Supabase.
Kjerneprinsippet er holdt: alt som er bygget støtter flyten
«Jeg er usikker → jeg får hjelp raskt». Ingen ekstra kompleksitet utover det.

## 1. Hva som er implementert

Datakilden er nå Supabase – mocklaget er fjernet helt (ingen stille fallback).
Hvis `.env` mangler nøkler, kaster klienten en tydelig feil og appen viser en
feilskjerm i stedet for å starte i en uklar tilstand.

- **Supabase-klient** (`src/lib/supabase.ts`): økt lagres i AsyncStorage,
  `autoRefreshToken`, PKCE-flyt. Feiler hardt uten konfigurasjon.
- **Passordløs auth (magisk lenke)** (`src/services/auth.ts`): `sendMagicLink`,
  `completeSignInFromUrl` (deep link `?code=…`), `getSession`,
  `onAuthStateChange`, `signOut`. Deep link fanges i `app/_layout.tsx`. En
  auth-gate i `app/index.tsx` ruter etter profil-rolle, og `app/sign-in.tsx` er
  innloggingsskjermen. Etter første innlogging holder den lagrede økten
  brukeren innlogget «automatisk».
- **Rent service-lag** (`src/services/*`): `group`, `profiles`, `helpRequests`,
  `helpResponses`, `calendar`, `activity`, `storage`, `realtime`, `mappers` og
  en samlet `index`-barrel. Komponenter kaller aldri Supabase direkte – de går
  via store, som går via service-laget.
- **Store** (`src/store/useAppStore.ts`) er skrevet om til å hente fra Supabase,
  men beholder nøyaktig samme offentlige API (state, actions, selektorer), så
  alle skjermene er uendret.
- **Realtime + polling-fallback**: abonnement på `help_requests` og
  `help_responses`, med polling hvert 20. sekund som sikkerhetsnett.
- **Bilder**: lastes opp til privat Storage-bucket `help-images`; signerte
  URL-er (1 time) hentes ved visning.
- **SQL**: 12 idempotente migreringer + `seed.sql` + `combined_setup.sql`,
  alle validert mot Postgres-grammatikken.
- **TypeScript-typer** (`src/types/database.types.ts`) speiler schemaet og kan
  byttes ut med autogenererte typer senere.

## 2. Hva som fortsatt er mock / forenklet (bevisst)

- **Push-varsler**: ikke bygget. Nye forespørsler/svar oppdages via
  realtime/polling i appen, ikke push. `expo-notifications` er urørt.
- **Video** og **«Ring familien»**: fortsatt placeholders (Alert).
- **Varslingsinnstillinger** (`notifyPush`/`notifySms`) og **samtykker**:
  kun UI. Innstillinger lagres ikke i DB; samtykker avledes fra medlemskap
  (ingen egen consents-tabell). `escalationDelayMinutes` er en konstant.
- **Eskalering** (`ESCALATED`): finnes i enum/schema, men ingen logikk ennå.
- **Onboarding/invitasjoner**: ikke bygget. Grupper og medlemmer settes opp via
  seed eller manuelt.
- **Seed** oppretter demo-brukere direkte i `auth.users` – kun for utvikling.

## 3. Tabeller

| Tabell | Formål |
|---|---|
| `profiles` | Appprofil, 1:1 med `auth.users` via `id`. Felt: `name`, `role` (senior/relative), `phone`, `email`. |
| `family_groups` | Én familiegruppe. |
| `family_members` | Kobler profil ↔ gruppe med `member_role` (senior / primary_contact / secondary_contact). |
| `help_requests` | Kjernen. `senior_id`, `family_group_id`, `recipient_id`, `image_path`, `message`, `status` (CREATED→…→CLOSED, + ESCALATED i enum), tidsstempler, `seen_by_senior`. |
| `help_responses` | `help_request_id`, `responder_id`, `quick_reply_type` (DO_NOT_REPLY/LOOKS_OK/I_WILL_CALL), `free_text`. Minst ett av de to må være satt. |
| `calendar_events` | `family_group_id`, `title`, `description`, `start_time`, `end_time`, `created_by`. Ingen gjentakelser. |
| `activity_status` | Nøktern status per bruker: `last_seen_at`, `app_opened_today`. Ingen GPS. |

Storage: privat bucket `help-images`, filsti `<family_group_id>/<request_id>.jpg`.

## 4. Hvordan auth og brukere henger sammen

Det er et tydelig skille mellom **Supabase Auth-brukeren** (`auth.users`, eid av
Supabase) og **appprofilen** (`public.profiles`, eid av oss). De kobles 1:1 via
`profiles.id = auth.users.id`.

Når en auth-bruker opprettes, lager triggeren `on_auth_user_created` →
`handle_new_user()` automatisk en profil (rolle `relative` som standard; senior
settes av pårørende eller av seed). I appen er `currentUserId` alltid lik
`auth.uid()`.

## 5. RLS-regler

RLS er på alle sju tabeller. Hovedregelen: **ingen kan lese gruppedata uten å
være medlem av samme `family_group`.** For å unngå policy-rekursjon brukes tre
`SECURITY DEFINER`-funksjoner: `is_group_member(group)`,
`shares_group_with(other)` og `request_group(request)`.

- **profiles** – les egen + profiler man deler gruppe med; opprett/endre kun egen.
- **family_groups** – les/endre for medlemmer; opprett for innloggede (onboarding).
- **family_members** – les/endre/slett styrt av medlemskap; opprett tillater å
  legge til seg selv eller andre i en gruppe man selv er medlem av.
- **help_requests** – all CRUD for gruppemedlemmer.
- **help_responses** – les for gruppemedlemmer (via `request_group`); opprett
  krever `responder_id = auth.uid()`.
- **calendar_events** – all CRUD for gruppemedlemmer.
- **activity_status** – les egen + delt gruppe; opprett/endre kun egen.
- **storage (help-images)** – lese/skrive kun for medlemmer av gruppa i første
  mappeledd av filstien.

## 6. Kjente sikkerhetsrisikoer og forbehold

- **Bred tillit innad i gruppa**: ethvert medlem kan opprette forespørsler (også
  på vegne av senior), redigere kalender, gjøre seg selv til primærkontakt og
  degradere andre. Greit for en liten familie, men ikke for større grupper eller
  ved mistillit. Bør strammes inn med rollebaserte regler senere.
- **Ingen invitasjons-/medlemskontroll**: å legge til medlemmer krever bare at man
  selv er medlem av gruppa. Ekte onboarding (invitasjoner) mangler.
- **anon-nøkkelen er offentlig** (som forventet). All beskyttelse hviler på RLS –
  korrekte policyer er derfor kritiske. Test RLS grundig før produksjon.
- **Seed** skriver direkte til `auth.users`/`auth.identities` (versjonsavhengig)
  og setter demo-passord `familieknappen`. Kun for dev – aldri i produksjon.
- **Magisk lenke** krever at redirect-URL-en (deep link) er whitelistet i
  Supabase Auth. PKCE forutsetter at lenken åpnes på samme enhet som ba om den.
- **Signerte bilde-URL-er** utløper etter 1 time; de fornyes ved neste
  henting/polling. Bilder kan vises «brutt» hvis appen står åpen veldig lenge
  uten oppdatering.
- **Aktivitetsstatus** deles med hele gruppa. Nøktern, men vurder eksplisitt
  samtykke i en senere versjon.
- Ingen rate-limiting/misbrukskontroll utover Supabase-standard.

## 7. Hvordan kjøre

### Forutsetninger
1. Opprett et Supabase-prosjekt. Kopier `.env.example` → `.env` og fyll inn
   `EXPO_PUBLIC_SUPABASE_URL` og `EXPO_PUBLIC_SUPABASE_ANON_KEY`.
2. I Supabase → Authentication → URL Configuration: legg til appens deep link
   som Redirect URL (f.eks. `familieknappen://auth-callback`, samt Expo Go-/dev
   client-varianten du ser i konsollen når du kaller `Linking.createURL`).
3. Installer avhengigheter med native-kompatible versjoner:
   `npx expo install` (eller `npm install`).

### Alternativ 1 – Samlet script (raskest å komme i gang)
1. Supabase Dashboard → SQL Editor.
2. Lim inn `supabase/combined_setup.sql` og kjør (idempotent – trygt å gjenta).
3. (Kun dev) Lim inn `supabase/seed.sql` og kjør for demodata.

### Alternativ 2 – Supabase CLI-migreringer
1. `supabase link --project-ref <ref>`
2. `supabase db push` – kjører `supabase/migrations/*.sql` i rekkefølge.
3. (Lokal dev) `supabase db reset` kjører migreringene + `seed.sql` automatisk.

### Start appen
- `npx expo start -c`
- Logg inn med magisk lenke. Demodata gir: `astrid@example.no` (senior),
  `anne@example.no` (primær kontakt), `per@example.no` (sekundær).

## 8. Anbefalt neste lag

- **Onboarding/invitasjoner**: opprett gruppe, inviter pårørende via e-post/SMS,
  koble senior – med strammere RLS for medlemshåndtering.
- **Push-varsler** (Expo Notifications + token-tabell + trigger/edge function).
- **Eskalering**: ta i bruk `ESCALATED` med tidsbasert trigger når ingen svarer.
- **Video og ekte telefoni** (WebRTC eller ekstern lenke).
- **Persistente innstillinger og ekte samtykkemodell** (egne tabeller).
- **Autogenererte typer** (`supabase gen types`) i CI, og **RLS-tester** (pgTAP).

---

## Lag 4 – Innstramming av sikkerhet (tillegg)

Bygget kun som SQL/RLS (ingen UI, push eller onboarding-flyt).

**Strammere RLS på `family_members`:**
- Kun **primærkontakt** kan legge til (`insert`), endre roller (`update`) og fjerne
  (`delete`) medlemmer. `secondary_contact` når ikke `update`-policyen og kan derfor
  ikke endre roller.
- **Ingen kan gjøre seg selv til primærkontakt** – håndhevet av triggeren
  `enforce_member_role_rules` (blokkerer `member_role='primary_contact'` på egen rad)
  og av et **delvis unikt indeks** som tillater maks én primær per gruppe.
- Bootstrapping: første bruker kan opprette sitt eget medlemskap i en tom gruppe
  (men ikke som primær).
- Primæroverføring skjer via RPC-en `transfer_primary_contact(p_group, p_new_user)`
  (SECURITY DEFINER): demote + promote atomisk, kun nåværende primær kan kalle den.
  Appens `setPrimaryContact` bruker nå denne RPC-en.

**Invitasjoner (`group_invitations`):** datamodell + tilgang. Gruppemedlemmer kan
lese gruppas invitasjoner; kun primærkontakt kan opprette/endre/slette. `token`
genereres med `gen_random_bytes`. Selve aksept-/onboarding-flyten er ikke bygget ennå.

**Minimum samtykke:** `profiles.activity_sharing_enabled` (boolean, standard `true`).
`activity_status` deles nå bare med gruppa hvis eieren har samtykket
(via `activity_sharing_on()`); egen status ser man alltid selv.

**Merk for senere UI:** «Gjør primær»-knappen i innstillinger bør skjules for
ikke-primærkontakter, siden RPC-en avviser kallet for dem.

---

## Lag 5 – Aksept av invitasjoner (tillegg)

Gjør `group_invitations` brukbare uten full onboarding eller nytt design.

**RPC `accept_group_invitation(p_token)`** (SECURITY DEFINER, returnerer
`{ family_group_id, role }`): validerer at token finnes, ikke er utløpt, ikke
trukket tilbake og ikke allerede brukt, at `auth.email()` matcher `invited_email`,
og melder så innlogget bruker inn i gruppa med `invited_role` (idempotent
`on conflict do nothing`) og setter `accepted_at`. En check-constraint hindrer at
en invitasjon kan gi `primary_contact` (selv-promotering er ikke tillatt).

**Service** (`src/services/invitations.ts`): `createInvitation`, `revokeInvitation`,
`acceptInvitation`, `listInvitationsForGroup`.

**Minimal flyt**:
- `app/invite.tsx` leser `token` fra deep link (`familieknappen://invite?token=…`).
  Ikke innlogget → token lagres og brukeren sendes til innlogging; auth-gaten
  kommer tilbake hit etter login. Innlogget → `acceptInvite` kalles, bekreftelse
  vises, og brukeren rutes til riktig startskjerm.
- `app/auth-callback.tsx` er en robust landingsskjerm for den magiske lenken.
- Store fikk `pendingInviteToken` + `acceptInvite`; gaten (`app/index.tsx`) ruter
  til `/invite` når et token venter.

**Testbeskrivelse**
1. Logg inn som primærkontakt (`anne@example.no`).
2. Lag en invitasjon: `createInvitation({ groupId, email: 'ny@bruker.no' })` –
   noter `token` (kjør evt. fra en testknapp eller direkte mot servicen).
3. Åpne `familieknappen://invite?token=<token>` på en enhet som ikke er innlogget.
   Appen ber om innlogging.
4. Logg inn som `ny@bruker.no` (magisk lenke) → appen kommer tilbake til
   invitasjonen, godtar den, og viser «Du er med i familien».
5. Bekreft i Supabase at det finnes en ny `family_members`-rad og at
   invitasjonens `accepted_at` er satt.
6. Negativt: prøv samme token igjen (→ «allerede brukt»), en utløpt/revoked token,
   og innlogging med feil e-post (→ «sendt til en annen e-postadresse»).

---

## Lag 6 – Push-varsler (tillegg)

Pårørende får beskjed når senior sender en ny forespørsel – uten å ha appen åpen.
Ingen SMS, ingen avansert eskalering, ingen kompleks retry.

**Tabeller**
- `notification_tokens` (`user_id`, `expo_push_token`, `platform`, tidsstempler,
  `last_used_at`, unik per bruker+token). RLS: brukeren styrer kun sine egne.
- `notification_log` (`user_id`, `type`, `related_help_request_id`, `status`,
  `error_message`, `created_at`). RLS: les egne; innsetting skjer via service role.

**Edge Function `supabase/functions/send-push`**
Kalles av en Database Webhook ved INSERT i `help_requests`/`help_responses`,
finner mottakere (pårørende ved forespørsel, senior ved svar), henter tokens via
service role, sender via Expo Push API, og logger hvert forsøk i `notification_log`.

**App** (`src/services/push.ts` + store): ber om tillatelse, henter Expo-token,
lagrer den ved innlogging, og fjerner den ved utlogging. Alt er ikke-blokkerende –
sier brukeren nei (eller token ikke kan hentes), fungerer appen som før uten push.

### Slik tester du
1. Kjør de nye migreringene (`combined_setup.sql` på nytt, eller `supabase db push`).
2. Deploy funksjonen: `supabase functions deploy send-push --no-verify-jwt`.
   Valgfri hemmelighet: `supabase secrets set PUSH_WEBHOOK_SECRET=…`.
3. I Supabase → Database → Webhooks: lag to webhooks (INSERT på `help_requests` og
   `help_responses`) som POST-er til funksjonens URL. Hvis du satte hemmelighet,
   legg den som header `x-webhook-secret`.
4. Bygg en dev client (`eas init` + `npx expo run:android`/`run:ios` eller EAS build)
   – ekte push krever en EAS `projectId`. Logg inn som pårørende på enheten; godta
   push-tillatelse. Sjekk at det er kommet en rad i `notification_tokens`.
5. Logg inn som senior på en annen enhet og send en forespørsel → pårørende-enheten
   skal få et varsel. Svar som pårørende → senior-enheten får et varsel.
6. Inspiser `notification_log` for status (`sent` / `error` / `no_token`).

### Kjente begrensninger
- **Krever dev/EAS-build**: Expo Go støtter ikke lenger eksterne push-tokens fullt
  ut, og `getExpoPushTokenAsync` trenger en EAS `projectId`. Uten det returnerer
  registreringen `null` (appen kjører videre uten push).
- **Android prod** krever FCM-oppsett via EAS-credentials.
- **Webhook-oppsett er manuelt** (dashbord). Ingen verifisering utover en valgfri
  delt hemmelighet.
- **Ett forsøk per varsel** – ingen retry, og Expo «receipts» sjekkes ikke
  (avmeldte/ugyldige tokens ryddes ikke automatisk).
- **Ingen forgrunns-visning** er konfigurert (`setNotificationHandler` er utelatt);
  varsler vises av OS når appen er i bakgrunnen.
- Push er «best effort» og forsterker, men erstatter ikke, in-app realtime/polling.

---

## Lag 7 – Enkel tidsbasert eskalering (tillegg)

Hvis primærkontakten ikke svarer innen en frist, varsles sekundærkontakt(ene).
Kun ett nivå – ingen regelmotor, ingen SMS.

**SQL**: `help_requests` fikk `escalation_due_at` og `escalation_level`
(`escalated_at` og status `ESCALATED` fantes fra før). Ved oppretting settes
`escalation_due_at = now() + 10 min` (konstant `ESCALATION_DELAY_MINUTES` i
`src/services/helpRequests.ts`).

**Edge Function `supabase/functions/escalate`**: finner åpne, ubesvarte
forespørsler der `escalation_due_at` har passert og `escalation_level = 0`,
markerer dem `ESCALATED` (level 1) først (så de ikke prøves igjen), varsler
sekundærkontaktene (fallback: alle pårørende utenom senior og opprinnelig
mottaker) via Expo Push, og logger i `notification_log`.

**App**: seniorens hjemskjerm viser rolig status uten teknisk språk –
«Vi prøver å få tak i familien.» når en forespørsel er eskalert, «Familien har
fått spørsmålet ditt.» mens den venter, ellers «Familien din ser at alt er bra.»
Ingen røde alarmfarger.

### Planlegging (cron)
Deploy: `supabase functions deploy escalate --no-verify-jwt`. Kjør den jevnlig.
Eksempel med pg_cron + pg_net (kjør i SQL Editor, bytt inn URL og service-nøkkel):

```sql
-- create extension if not exists pg_cron;  create extension if not exists pg_net;
select cron.schedule('familieknappen-escalate', '* * * * *', $$
  select net.http_post(
    url := 'https://DITT-PROSJEKT.supabase.co/functions/v1/escalate',
    headers := jsonb_build_object('Content-Type','application/json','x-webhook-secret','<din-hemmelighet>')
  );
$$);
```
(Alternativt: Supabase Dashboard → Edge Functions → Schedules.)

### Slik tester du
1. Kjør migreringene på nytt (`combined_setup.sql` / `supabase db push`) og deploy `escalate`.
2. For rask test: sett en kort frist. Enten senk `ESCALATION_DELAY_MINUTES`, eller
   oppdater en eksisterende rad: `update help_requests set escalation_due_at = now() - interval '1 min' where id = '<id>';`.
3. Send en forespørsel som senior, ikke svar som primærkontakt.
4. Kall funksjonen (cron, eller manuelt `curl -X POST .../functions/v1/escalate`).
5. Sjekk at forespørselen er `ESCALATED`, at sekundærkontakten fikk push, og at
   `notification_log` har en `escalation`-rad. Seniorens hjemskjerm viser
   «Vi prøver å få tak i familien.»

### Kjente begrensninger
- **Ett nivå**: primær → sekundær. Ingen videre opptrapping.
- **Frist settes ved oppretting** (klient-konstant). Endrer du delayet, gjelder det
  bare nye forespørsler.
- **Granularitet** følger cron-intervallet (anbefalt hvert minutt).
- Eskalering markeres selv om ingen tokens finnes (status blir `ESCALATED`,
  logg `no_token`/`no_recipient`) – så in-app-status er riktig selv uten push.
- Samme push-begrensninger som Lag 6 (krever EAS-build for ekte tokens).
- Ingen «av-eskalering»: svarer noen etter at det er eskalert, settes status til
  ANSWERED som normalt, men `escalation_level` forblir 1.
