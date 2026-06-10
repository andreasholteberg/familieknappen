# COMMERCIAL_APP_COMPLETION_PLAN.md

Status: utkast – seksjon 1–4. Seksjon 5–13 skrives senere.

Dokumentet er en kritisk analyse av Familieknappen slik den ser ut i koden nå
(snapshot: pilot-APK bygget, OTP-flyt klar i kode, ny APK ikke verifisert på enhet
ennå). Det er ikke en pitch. Der hvor noe kun er dokumentert, er det merket. Der
hvor noe ikke kan bekreftes fra kode (f.eks. Supabase-dashbord-konfig), er det
også merket.

---

## 1. Kort sammendrag

**Hva appen er.**
Familieknappen er en mobil/web-app for én senior pluss én eller flere pårørende
i samme familiegruppe. Hovedflyten er: senior trykker «Spør familien», skriver
en kort melding og/eller tar et bilde, velger en mottaker, og sender. Pårørende
mottar i en dashbordvisning, åpner forespørselen, svarer (hurtigsvar eller
fritekst), og senior ser svaret. I tillegg finnes en kalender (pårørende
administrerer, senior ser «Min dag»), invitasjoner, personvern-/samtykketekst,
nøktern aktivitetsstatus og struktur for push og eskalering på server-siden.

**Hva appen faktisk kan nå (verifisert i kode):**
- Innlogging med 6-sifret OTP-kode i e-post (primær), med magic link / deep
  link bevart som backup.
- Onboarding: ny bruker oppretter sin egen familiegruppe via en RPC og blir
  primærkontakt.
- Send-flyt med tekst, bilde eller begge, og robust bildeopplasting via
  expo-file-system (base64) på native; fetch på web.
- Pårørende ser dashbord med realtime + 20 s polling-fallback, åpner
  forespørsel, svarer med hurtigsvar eller fritekst.
- Senior ser «Se svar fra familien»-kort, åpner stort svar, og kan ringe
  («Ring familien»-knappen er fortsatt en placeholder for telefonifunksjonen).
- Kalender CRUD for pårørende. Senior har lesevisning i «Min dag».
- Invitasjonsflyt: primærkontakt sender invitasjon, mottaker godtar via deep
  link med token og settes nå også til riktig rolle (senior / pårørende) på
  profilen (ny migrering `20260602100000_accept_invitation_sets_profile_role.sql`).
- Personvern-/samtykkeskjerm for både senior og pårørende, pluss en toggle for
  aktivitetsdeling.
- Designsystem med Nunito-font, logo i header og som anker på sign-in /
  onboarding, store knapper og rolig palett.

**Hvor langt unna en kommersiell MVP appen virker å være.**
Pilot-MVP for én familie (mor + barn) er innen rekkevidde — koden henger
sammen, og det vesentligste står klart. **Kommersiell MVP** for ukjente
sluttbrukere ligger lenger unna. Hovedhindringene er ikke ny kode, men:
- ende-til-ende verifisering på ekte enheter etter OTP-overgangen
- onboarding for nye familier uten å gå via SQL
- pushvarsler verifisert i produksjon (Database Webhook + cron må fortsatt
  konfigureres manuelt i dashbordet)
- GDPR / personvern-formalisering (sletting av konto/data, samtykke-logging)
- App Store / Play Store-løp
- support, observability og en eksplisitt feilhåndteringsstrategi

**Største tekniske risikoer.**
- OTP-overgangen er kun verifisert lokalt (`typecheck` + `build:web`).
  Faktisk innlogging på Android via OTP er **ikke** verifisert i ny APK ennå.
- E-postleveranse hviler på Resend SMTP via Supabase Auth. Verken Resend-config,
  DNS-records på Cloudflare eller Supabase-malen kan bekreftes fra kode.
  Dette er det enkeltpunktet som mest sannsynlig kan stoppe en ekte bruker.
- Push og eskalering avhenger av manuell Dashboard-konfig (Database Webhooks,
  cron). Disse kan ikke verifiseres fra kode.
- Image-opplasting er gjort robust, men er fortsatt avhengig av at moren din
  faktisk klarer å ta et bilde gjennom kamera-tillatelser i en preview-APK.
  Ikke verifisert på fysisk enhet i siste runde.

**Største produktmessige hull.**
- Ingen UI for å invitere uten å vite e-postadresse på forhånd; ingen
  re-send-invitasjon-flyt utenom listevisning hos primær.
- «Ring familien» og «Videosamtale» er fortsatt placeholders med tekstdialog.
- Senior kan ikke legge til kalenderhendelser (kun se og navigere). Det er en
  bevisst forenkling, men må eksplisitt dokumenteres mot produktforventning.
- Ingen «slett konto / mine data»-funksjon i appen (kun tekst om at man kan be
  om det).
- Ingen onboarding-veiviser eller forklaringsskjerm etter første innlogging
  («hva nå?»-følelse for førstegangsbruker).

**Hva som må avklares før appen kan kalles kommersielt klar.**
- Hvem er den faktiske målgruppen — gratis familievennlig pilot, eller betalt
  abonnement? Det styrer alt fra Stripe/betalingsmodell til personvernkrav.
- Skal Familieknappen være web-først (PWA), Android-først (Play Store) eller
  begge? I dag fungerer begge, men ingen er produksjonssatt.
- Hvilket nivå av personvern/GDPR-arbeid er minimumskravet før første betalte
  bruker? Dette bestemmer datamodellen for «slett konto», loggingspolitikk og
  databehandleravtaler.
- Hva er supportmodellen for eldre brukere som ikke kommer videre?
- Skal pilot 1 være lukket (deg + moren din) eller en åpen registreringsside?

**Hva overgangen til 6-sifret OTP betyr for stabilitet og pilotklarhet.**
Positivt: vi har fjernet den største enkeltårsaken til at e-postinnlogging
feilet på mobil (link-forhåndshenting i Gmail/Android). Brukeren skal ikke
lenger klikke på en lenke i e-posten, men taste en 6-sifret kode i appen.
Risikoen flyttes derfor fra «klikk på lenke» til «e-posten må leveres pålitelig
og malen må vise koden stort». Dette er **gjort i kode**, men avhenger
kritisk av at Resend SMTP og Supabase e-postmalen er korrekt konfigurert
(kan ikke verifiseres fra kode). Dette må verifiseres ende-til-ende på den nye
APK-en før vi kan kalle pilotinnlogging robust.

---

## 2. Nåværende arkitektur

### 2.1 Frontend-struktur

Faktisk i kode:

```
app/                        Expo Router-skjermer (file-based)
├── _layout.tsx             Rot: laster Nunito-fontene + holder splash-screen
│                           til de er klare, kjører useAppStore.init() én gang.
├── +html.tsx               Web HTML-mal (Expo Router web): lang="nb",
│                           manifest.webmanifest, theme-color.
├── +native-intent.tsx      Deep link-fanger på native: ruter
│                           familieknappen://auth-callback?… og
│                           familieknappen://invite?… inn på riktige ruter.
├── index.tsx               Auth-gate: ruter etter status (loading, signedOut,
│                           ready, error) og profil-rolle.
├── sign-in.tsx             E-post + 6-sifret kodeflyt + valgfri testinnlogging.
├── auth-callback.tsx       Mellomskjerm for magic link-fallback (PKCE eller
│                           hash-token).
├── invite.tsx              Aksept-skjerm for invitasjonstoken.
├── onboarding.tsx          Opprett egen familiegruppe (kaller
│                           create_family_group-RPC).
├── senior/                 Seniorens stack
│   ├── _layout.tsx         Header med Logo + tittel + «Logg ut»
│   ├── index.tsx           Hjem (3 store hovedvalg + diskret personvernlenke)
│   ├── ask.tsx             Spør familien-flyt (tekst, bilde, kontaktvalg)
│   ├── answer.tsx          Stort, rolig svar
│   ├── day.tsx             Min dag (lesevisning kalender)
│   └── privacy.tsx         Personvern + Ja/Nei-bryter for aktivitetsdeling
└── relative/               Pårørendes stack
    ├── _layout.tsx         Header med Logo + tittel + «Logg ut»
    ├── index.tsx           Dashboard: senior-banner, åpne forespørsler, kalender
    ├── request/[id].tsx    Forespørsel-detalj + hurtigsvar + fritekst + video-stub
    ├── calendar.tsx        Liste, slett (rediger via /event)
    ├── event.tsx           Legg til / rediger / slett kalenderhendelse
    ├── history.tsx         Historikk over forespørsler og svar
    └── settings.tsx        Familiegruppe, primærkontakt, invitasjoner,
                            varsling-toggle (UI-only), personvern, push-status,
                            aktivitetsdeling-toggle, logg ut

src/
├── assets/logo-familieknappen.png
├── components/             Avatar, BigButton, Card, DateTimeField (+ .native),
│                           HeaderTitle, Logo, QuickReply, RelativeTabs,
│                           RoleSwitchButton, Screen, SmsPreview, StatusBadge
├── lib/supabase.ts         Supabase-klient (anon key, AsyncStorage,
│                           autoRefreshToken, detectSessionInUrl=false, PKCE)
├── services/               Rent datalag — komponenter kaller aldri Supabase direkte
│   ├── auth.ts             sendMagicLink, verifyEmailOtp, completeSignInFromUrl
│   │                       (PKCE + hash-token), signInWithPassword (test),
│   │                       getSession, onAuthStateChange, signOut
│   ├── activity, calendar, group, helpRequests, helpResponses, invitations,
│   ├── mappers, profiles, push, realtime, storage, index
├── store/useAppStore.ts    Zustand: auth-livssyklus, gruppe-kontekst, requests,
│                           responses, events, activity, invitations, settings,
│                           push-status; realtime + polling-fallback
├── theme/theme.ts          Farger, radius, spacing, fontSize, fontWeight,
│                           fontFamily (Nunito), shadow
├── types/                  models.ts (domene), database.types.ts (DB), assets.d.ts
└── utils/                  appLinks.ts (createAppUrl med GitHub Pages base path
                            og isTripleSlashed på native), authErrors.ts
                            (humanizeAuthError), format.ts, pickImage.ts
```

Hovedlogikken er **konsentrert i `useAppStore.ts` (Zustand)** og service-laget.
Skjermene er bevisst tynne wrappere over store-handlinger og selektorer.
Det er en konsistent og forståelig modell.

### 2.2 Routing

Expo Router file-based på app-mappen, både for web og native.

- **Auth-gate** i `app/index.tsx` ruter etter status:
  `idle/loading` → spinner, `error` → feilskjerm, `signedOut` → `/sign-in`,
  `ready` + pendingInviteToken → `/invite?token=…`, `ready` + ingen
  currentUser → `/onboarding`, ellers `/senior` eller `/relative`.
- **Native deep links** håndteres via `+native-intent.tsx` som tar
  `familieknappen://auth-callback?…` og `familieknappen://invite?…` og mapper
  dem til de respektive rutene. Ukjente baner faller tilbake til `path`.
- **Web base path** `/familieknappen` settes via `experiments.baseUrl` i
  `app.json` (kontrolleres også av `appLinks.createAppUrl` for å gi web-callback
  riktig prefiks). På native brukes `isTripleSlashed: true`.
- **auth-callback-ruten** prøver først PKCE `?code=`, deretter
  `#access_token=…&refresh_token=…` (hash-token-flow). Den rydder `window.location`
  på web etter suksess.
- **invite-ruten** lagrer token i store hvis bruker ikke er innlogget, sender
  til sign-in, og kommer tilbake hit etter login.

Vurdering:
- For **web på `familieknappen.app`** er base-path-håndteringen ren, men dette
  er testet primært mot `andreasholteberg.github.io/familieknappen`. Et bytte
  til `familieknappen.app` som rot innebærer at `experiments.baseUrl` må endres
  (eller fjernes), og at både `appLinks.ts` og `+html.tsx` (manifest-href) må
  reflektere det. **Uklart** om dette er gjort i `app.json` mot det nye domenet
  (jeg har ikke sett bytte i `baseUrl`). Må verifiseres.
- For **Android APK** er deep links robust nok i koden. Auth-callback fungerer
  som backup hvis noen klikker lenken; OTP-flyten omgår problemet helt.
- For **intern pilot** er routing-arkitekturen klar.
- Risiko: hvis Cloudflare/Supabase Redirect URLs-allowlisten ikke er
  oppdatert til både `familieknappen://*` og evt. nytt web-domene, kommer
  fallback-lenker til å feile (men OTP virker uansett).

### 2.3 Auth

**Primær flyt (verifisert i kode, ikke i ny APK ennå):** 6-sifret OTP-kode på e-post.

- `services/auth.ts` har `sendMagicLink(email)` som kaller
  `supabase.auth.signInWithOtp({ email, options: { emailRedirectTo } })`.
  emailRedirectTo settes via `createAppUrl('auth-callback')`. Funksjonsnavnet
  er historisk («Magic Link») men den faktiske flyten i pilot er OTP-kode —
  e-posten inneholder både kode og lenke.
- `verifyEmailOtp(email, token)` kaller
  `supabase.auth.verifyOtp({ email, token, type: 'email' })` og returnerer
  session.
- `sign-in.tsx` har to faser:
  1. **E-post-inntasting** → «Send kode»-knapp → `sendMagicLink`.
  2. **Kode-inntasting** → 6-sifret numerisk felt, autoFocus, maxLength 6,
     placeholderTextColor og inputMode `numeric` → «Logg inn»-knapp →
     `verifyEmailOtp`. Etter suksess settes session i store og `refresh()`
     kjøres; auth-gaten håndterer videreruting.
- **Test-innlogging** (`signInWithPassword`) er gated av
  `EXPO_PUBLIC_ENABLE_TEST_LOGIN === 'true'` **OG** (`__DEV__` eller
  `EXPO_PUBLIC_APP_ENV` i {`preview`, `development`}). En whiteliste av
  `EXPO_PUBLIC_TEST_LOGIN_EMAILS` styrer hvilke kontoer som godtas.
  Test-panelet er bevisst varslet i UI som «kun preview». Riktig isolert mot
  produksjon, men må verifiseres at `APP_ENV` ikke ved et uhell er satt i
  produksjons-/release-builden.
- **Magic link / deep link fallback:** `completeSignInFromUrl` håndterer både
  PKCE `?code=` og hash-token-flow (`access_token`/`refresh_token`). Den kan
  brukes hvis e-postmalen fortsatt sender lenker. Lenkeflyten kalles ikke
  lenger fra UI som primær.
- **Norsk feilhåndtering:** `humanizeAuthError` i `utils/authErrors.ts`
  oversetter de viktigste Supabase-feilene til rolige norske meldinger
  (rate limit, utløpt kode, nettverk, ugyldig e-post, manglende auth-kode).
- **Session og store:** `onAuthStateChange` driver store-status; ved INITIAL
  session eller SIGNED_IN kjøres `refresh()`, ved SIGNED_OUT ryddes alt
  (realtime-channel, poll-timer, push-state, gruppedata).
- **Session-lagring:** AsyncStorage, autoRefreshToken på, detectSessionInUrl=false
  (vi håndterer URL-er manuelt), flowType PKCE.

Hva som er **modent**: kodeflyten er strukturert, og feilhåndteringen er
oversatt. Kodeendringen er statisk grønn (`typecheck` + `build:web`).

Hva som fortsatt **må testes på enhet**, særlig i den nye APK-en:
- At Supabase-e-postmalen faktisk viser `{{ .Token }}` stort.
- At Resend SMTP leverer e-posten til hovedinnboksen, ikke spam.
- At `verifyOtp` aksepterer koden, og at `refresh()` fører videre uten
  navigasjons-låsing.
- At rate-limit-meldingen utløses på rolig måte ved gjentatte send-forsøk.
- At deep link `familieknappen://auth-callback` fortsatt fungerer som backup
  hvis brukeren klikker lenken i stedet for å lese koden.

### 2.4 Supabase

Det jeg kan bekrefte fra kode og SQL-filer:

**Tabeller** (definert i migrasjonsfiler):
`profiles`, `family_groups`, `family_members`, `help_requests`, `help_responses`,
`calendar_events`, `activity_status`, `group_invitations`,
`notification_tokens`, `notification_log`. Enums: `app_role` (senior|relative),
`member_role` (senior|primary_contact|secondary_contact), `request_status`
(CREATED/SENT/DELIVERED/VIEWED/ANSWERED/ESCALATED/CLOSED), `quick_reply_type`.

**Migrasjoner:** 22 stk., navngitt med tidsstempler, dekker:
schema (tabellene), `functions_and_triggers` (handle_new_user, set_updated_at),
`rls_policies` (per-tabell), `storage` (privat bucket `help-images` +
policyer på `(storage.foldername(name))[1]::uuid` mot `is_group_member`),
`realtime_publication` (help_requests + help_responses i `supabase_realtime`),
`profiles_consent` (`activity_sharing_enabled boolean`), `security_helpers`
(`is_primary_contact`, `group_has_members`, `activity_sharing_on`,
`transfer_primary_contact`, `enforce_member_role_rules`-trigger),
`tighten_access` (stram RLS på family_members + unik indeks på maks én
primær per gruppe), `group_invitations`, `accept_invitation`,
`notification_tokens`, `notification_log`, `escalation`
(`escalation_due_at`, `escalation_level`), `onboarding`
(`create_family_group`-RPC + relakset trigger ved tom gruppe), og helt nylig
`accept_invitation_sets_profile_role` (RPC oppdaterer `profiles.role` så en
invitert «senior» faktisk havner på senior-flyten).

**Services som kaller Supabase:**
`auth.ts`, `activity.ts`, `calendar.ts`, `group.ts`, `helpRequests.ts`,
`helpResponses.ts`, `invitations.ts`, `profiles.ts`, `push.ts`, `realtime.ts`,
`storage.ts`. Komponentene importerer aldri direkte fra `@/lib/supabase` —
kun via service-laget eller storen.

**Edge Functions** (verifisert i `supabase/functions/`):
`send-push` og `escalate`. Begge bruker Deno og service_role-nøkkelen
(`SUPABASE_SERVICE_ROLE_KEY`) som er trygt fordi det er server-side.

**Storage:** privat bucket `help-images`, sti `<family_group_id>/<request_id>.jpg`,
RLS som leser gruppe-ID fra første mappeledd. Service-laget henter signerte
URL-er (1 time) ved visning.

**Anon vs service_role:** grep gjennom `src/` og `app/` viser **ingen**
referanser til `service_role` eller `SUPABASE_SERVICE_ROLE_KEY`. Frontend
bruker kun anon/publishable key. Bra.

**Det jeg ikke kan bekrefte fra kode:**
- Om alle migrasjoner faktisk er anvendt mot remote nå.
- Om webhooks (DB → `send-push`) faktisk er konfigurert.
- Om cron (kalle `escalate` jevnlig) faktisk kjører.
- Om bucket og RLS faktisk eksisterer i prosjektet (de _skal_ etter `supabase
  db push`, men jeg ser det ikke).
- Om Supabase Auth-malen er endret til `{{ .Token }}`.

Det finnes ingen reset-/test-SQL-script i `supabase/`. Tidligere demo-seed-fila
(`seed.sql`) er ikke lenger i mappen, sannsynligvis fjernet bevisst.

### 2.5 Roller og tilgang

**Roller på to nivåer:**

1. App-rolle (`profiles.role`): `senior` eller `relative`. Driver rutingen
   etter login (senior-stack vs relative-stack).
2. Gruppe-rolle (`family_members.member_role`): `senior`,
   `primary_contact`, `secondary_contact`. Driver RLS-tilgang og
   primærkontakt-status.

Disse er nå koblet via to mekanismer:
- `create_family_group`-RPC setter `profiles.role = 'relative'` for første
  bruker (primærkontakt).
- Den nye `accept_group_invitation`-RPC setter `profiles.role = 'senior'`
  hvis invitasjonen var for en senior, ellers `'relative'`.

**RLS-modellen** (fra `rls_policies.sql` + `tighten_access.sql`):
- Bare gruppemedlemmer kan lese gruppedata. SECURITY DEFINER-hjelpefunksjoner
  (`is_group_member`, `shares_group_with`, `request_group`,
  `is_primary_contact`, `group_has_members`, `activity_sharing_on`) brukes for
  å unngå policy-rekursjon.
- Kun primærkontakt kan legge til/fjerne medlemmer og endre roller. Self-
  promotering til primær er blokkert av en trigger (med unntak av tom gruppe i
  bootstrapping).
- Maks én primær per gruppe via en partial unique index.
- `family_groups` insert er åpen for alle innloggede (krevd for
  onboarding/`create_family_group`). Det betyr i prinsippet at en autentisert
  bruker kan opprette grupper de selv blir primær i — ikke en sikkerhetsfeil,
  men noe som bør tenkes på for misbruk hvis appen blir offentlig.
- `help_requests`, `help_responses`, `calendar_events` styres av `is_group_member`.
- Storage (`help-images`) styres av gruppemedlemskap fra filsti.
- Aktivitetsstatus respekterer `activity_sharing_enabled`-toggelen.

Senior- og pårørende-flatene er **adskilt** i kode via separate stacker
(`/senior` vs `/relative`) med eget header, valg og språk. Auth-gaten ruter
basert på `profile.role`.

**Svakheter / uklarheter:**
- Det er ingen UI for å degradere en primær eller bytte primær uten
  `transfer_primary_contact`-RPC og «Gjør primær»-knapp i settings. Knappen er
  riktig nok i UI, men ble ikke gjemt for ikke-primær — den vil bare feile
  med en RLS-melding hvis en sekundær trykker. Liten UX-svakhet, ikke en
  sikkerhetsfeil.
- Det er ingen «forlat gruppen»-funksjon. En bruker kan ikke selv melde seg ut
  av en familie uten at primær fjerner dem.
- Det er ingen «slett konto»-funksjon (kun tekstmessig løfte).

Helhetsvurdering: rollemodellen er **tett nok for pilot**, men en kommersiell
app vil måtte gjennomgå RLS-policyene grundig, særlig insert-policyene på
`family_groups`, og legge til misbrukskontroll (rate limits per IP, anti-
spam invitasjoner, etc.).

### 2.6 E-post / Resend / Supabase Auth

Hvordan e-post forventes sendt (fra kode + dokumentasjon):
- `signInWithOtp` kaller Supabase Auth, som sender e-posten via prosjektets
  SMTP-konfigurasjon.
- For pilot er denne SMTP-konfigurasjonen Resend, med avsender
  `noreply@familieknappen.app` og «Familieknappen» som sender name.

Dette er **ikke** representert i kode. Det ligger i Supabase Dashboard og er
dokumentert i `APK_TESTING.md`, `DEPLOYMENT.md` og `KLAR_TIL_APK.md`. Kan ikke
verifiseres fra kodebasen.

**OTP-flyt avhenger av e-postmalen.** Pilotflyten leser ikke lenger lenken,
men koden brukeren taster inn. Det forutsetter at Supabase-malen viser
`{{ .Token }}` stort og at koden ikke er gjemt under en lang lenke. Dette må
endres manuelt i Dashboard → Authentication → Email Templates → «Magic Link».
Kan ikke verifiseres fra kode.

Hva som **ikke kan bekreftes fra kode**:
- Om SMTP-credentials er korrekte i Supabase.
- Om DNS-records for `familieknappen.app` er korrekt satt i Cloudflare
  (SPF, DKIM, ev. DMARC) — og at de er satt som «DNS only» (grå sky), ikke
  proxied.
- Om e-postmalen faktisk er endret.
- Om Resend-domenet er verifisert.

**Resterende risikoer rundt e-post/SMTP/pilot:**
- Resend gratis-tier: 100 e-poster/dag / 3 000 per måned per avsender. Holder
  langt for pilot, men ikke ved skalering.
- Spam/bounce: hvis DNS-records ikke er korrekte, kan e-postene fortsatt havne
  i spam. Da feiler OTP-flyten silent (bruker ser ingen kode).
- Rate limit i Supabase Auth (kort embargo per e-postadresse) håndteres med
  norsk melding via `humanizeAuthError`, men brukeren kan likevel oppleve
  frustrasjon hvis hen sender flere koder etter hverandre.

### 2.7 Deploy og bygg

**Web-deploy** (fra `.github/workflows/pages.yml` + `app.json` + `DEPLOYMENT.md`):
- GitHub Pages, manuell trigger (`workflow_dispatch`).
- Bruker `actions/setup-node@v4` med node 22 og `npm ci`.
- Bygger med `npm run build:web` som internt kjører `expo export --platform web
  --output-dir dist && node scripts/prepare-github-pages.cjs`.
- `EXPO_PUBLIC_SUPABASE_URL` og `EXPO_PUBLIC_SUPABASE_ANON_KEY` settes fra
  `vars` (GitHub Actions variables), ikke secrets — riktig, siden anon-nøkkelen
  er offentlig.
- `experiments.baseUrl = "/familieknappen"` i `app.json` gjør at appen kjører
  under `https://andreasholteberg.github.io/familieknappen`.

**Web på `familieknappen.app`** er ikke konfigurert i `app.json` eller workflowen
ennå. Hvis det nye domenet skal peke direkte til appen (uten `/familieknappen`-
prefiks), må `experiments.baseUrl` justeres og `appLinks.ts`/`+html.tsx`
oppdateres. **Ikke gjort i koden ennå.**

**APK-deploy** (fra `eas.json`):
- Profil `preview`: `distribution: internal`, `environment: preview`,
  `android.buildType: apk`. Gir en installerbar APK uten Play Store.
- Profil `development`: `developmentClient: true, distribution: internal` for
  dev-client-bygg.
- Profil `production`: kun `autoIncrement: true` — ikke ferdig konfigurert for
  Play Store-utgivelse.
- `app.json`: scheme `familieknappen`, package `com.ahdigital.familieknappen`,
  owner `ah-digital`, EAS projectId satt, `expo-notifications` registrert som
  plugin, `expo-image-picker`-permissions konfigurert.

**Miljøvariabler i preview-builden:**
- `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY` settes via
  `eas env:create --environment preview` (manuell konfig, kan ikke bekreftes
  fra kode).
- `EXPO_PUBLIC_ENABLE_TEST_LOGIN`, `EXPO_PUBLIC_APP_ENV`,
  `EXPO_PUBLIC_TEST_LOGIN_EMAILS`, `EXPO_PUBLIC_PREVIEW_BUILD_LABEL` —
  må verifiseres at de er satt i preview, og at `APP_ENV` ikke ved et uhell
  blir satt for produksjon.

**Sårbare punkter:**
- Anon-nøkkel-rotasjon: hvis Supabase-nøkkelen byttes, må EAS env oppdateres
  + ny APK bygges. Det finnes ingen runtime-konfig-mekanisme.
- `experiments.baseUrl` er statisk; web-domenebytte krever rebuild.
- Push-notification-config (FCM-credentials) er ikke verifisert i kode — kan
  trenge eget oppsett i EAS.

**Hva som må testes etter ny APK-build:**
- OTP-innlogging ende-til-ende på Android.
- Onboarding → opprett familiegruppe → ruting til pårørende-dashbord.
- Send-flyt med kamerabilde (krever kamera-tillatelse-flyt).
- Realtime mottak på pårørende-enhet.
- Logg ut og inn igjen — session-persistens.

### 2.8 Designsystem / UI

Fra `src/theme/theme.ts`:
- **Farger:** rolig blå (`brand: '#2b6cb0'`, `brandDark: '#234e7d'`), nøytrale
  grå-toner, dempet rav for «attention» (ikke alarmrødt), `calmGreen` for «ok».
  Bevisst valgt for å unngå stress.
- **Radius:** 12 / 18 / 26 — myke hjørner.
- **Spacing:** 4 px base.
- **Typografi:** 14 / 16 / 18 (generelt) og 20 / 28 / 32 / 26 (senior, store).
  `fontFamily` brukes for Nunito 400/700/800. Fontene lastes i rot-layoutet og
  splash-screen holdes til de er klare.
- **Skygger:** `shadow.card` og `shadow.raised` for kort/modaler.

**Komponentstruktur:**
- `BigButton` med varianter (`primary`, `day`, `attention`, `call`),
  Nunito ExtraBold på etiketten.
- `HeaderTitle` med `Logo` + tittel i header (samme komponent for senior og
  pårørende, ulik tekststørrelse).
- `Logo`-komponent med justerbar `size`.
- `DateTimeField` (plattformsplittet `.tsx` for web, `.native.tsx` for native):
  HTML date/time-input på web, native picker på mobil. Samme `YYYY-MM-DD` /
  `HH:mm`-strenger ut.
- `Card`, `Avatar`, `Screen`, `QuickReply`, `StatusBadge`, `RelativeTabs`,
  `RoleSwitchButton` («Logg ut» i headeren), `SmsPreview` (kun
  utviklingsmodus for senior-eksempelbilde).

**Senior-vennlighet** (verifisert i kode):
- Maks tre store hovedvalg på seniorens hjem + diskret tekstlenke til
  personvern.
- Store skriftstørrelser (body 20, title 28, button 26).
- Få valg per skjerm (steg-for-steg send-flyt).
- Rolig språk: «Spør familien», «Min dag», «Vent på svar», «Vi prøver å få tak
  i familien» (eskalering — ikke alarmerende).
- Ingen alarmrødt — `attention` er rav.
- Pronomenfjerning (`hun` → navn / nøytralt) er gjort i pårørende-skjermer,
  push-melding, og i kalenderintro.

**Hva som fortsatt er skjørt eller åpent:**
- Pårørende-dashbordet kan bli «trangt» når en familie får mange åpne
  forespørsler eller mye kalender. Ikke designet for skalering ennå.
- Feiltekstene i UI er stort sett gode, men noen steder (kalender CRUD)
  feiler fortsatt stille (fire-and-forget i store).
- Knapper og trykkflater er store, men noen lenker (som «Personvern og
  samtykke» på seniorens hjem) er små. Trolig OK fordi de er sekundære.
- DateTimeField på native krever ny APK-bygg for å bli synlig (ny native
  modul).
- «Ring familien» og «Videosamtale» er fortsatt placeholders, og brukeren får
  en nøytral melding («Ringefunksjonen er ikke koblet på ennå»). Dette er
  bevisst gjort, men er en forventningssvikt mot produktnavnet.

Helhetsvurdering: designet er **faktisk** seniorvennlig — ikke bare «pent».
Men det forventer en relativt enkel familiekontekst (én senior, én primær,
moderat med data), og er ikke designet for mange-til-mange.

---

## 3. Funksjoner som allerede finnes

| Funksjon | Status | Hvor i koden | Kommentar | Må testes? |
| --- | --- | --- | --- | --- |
| Innlogging med 6-sifret OTP | fungerer trolig | `app/sign-in.tsx`, `src/services/auth.ts` | Statisk grønn (`typecheck` + `build:web`). Avhenger av Resend + e-postmal i Dashboard. | Ja — på ny APK |
| `signInWithOtp` | fungerer trolig | `src/services/auth.ts:sendMagicLink` | Funksjonen heter fortsatt `sendMagicLink` historisk. | Ja — verifiser at e-posten leveres |
| `verifyOtp` | fungerer trolig | `src/services/auth.ts:verifyEmailOtp` | Type `'email'`. | Ja — verifiser kodeinntasting |
| Norsk auth-feilhåndtering | fungerer trolig | `src/utils/authErrors.ts` | Dekker rate limit, utløpt, nettverk, ugyldig e-post m.fl. | Ja — visuelt under ekte feil |
| Magic link fallback | fungerer trolig | `auth.ts:completeSignInFromUrl` + `app/auth-callback.tsx` | PKCE `?code=` + hash-token. | Ja — hvis bruker klikker lenken |
| Deep link fallback | fungerer trolig | `app/+native-intent.tsx` + `app/invite.tsx` | Mapper `familieknappen://`-baner. | Ja — på ny APK |
| Testinnlogging | fungerer trolig | `app/sign-in.tsx` + `auth.ts:signInWithPassword` | Gated av `EXPO_PUBLIC_ENABLE_TEST_LOGIN` og `APP_ENV`. | Ja — verifiser at den er av i prod |
| Senior-rolle (UI + ruting) | fungerer trolig | `app/senior/*`, `index.tsx` auth-gate | Senior-stack rendres når `profile.role === 'senior'`. | Ja — etter senior-invitasjon |
| Pårørende-rolle (UI + ruting) | fungerer trolig | `app/relative/*`, `index.tsx` auth-gate | Ruting via `profile.role`. | Nei (testet) |
| Familiegruppe | fungerer trolig | `services/group.ts`, `family_groups`-tabellen | Maks én primær per gruppe (unique index). | Ja — fra ny APK |
| Onboarding (opprett gruppe) | fungerer trolig | `app/onboarding.tsx`, `create_family_group`-RPC | Trigger relaksert for bootstrapping. | Ja — fra ny APK |
| Invitasjoner (opprett/liste/trekk tilbake) | fungerer trolig | `services/invitations.ts`, `relative/settings.tsx` | Kun primær kan opprette (RLS). | Ja — ende-til-ende |
| Aksept av invitasjon | fungerer trolig | `accept_group_invitation`-RPC + `app/invite.tsx` | Setter nå også `profiles.role` korrekt (ny migrering). | Ja — særlig senior-invitasjon |
| Hjelpeforespørsler (send) | fungerer trolig | `app/senior/ask.tsx`, `services/helpRequests.ts` | Tekst, bilde eller begge. Robust bildeopplasting. | Ja — ny APK med expo-file-system |
| Svar på forespørsler | fungerer trolig | `app/relative/request/[id].tsx`, `services/helpResponses.ts` | Hurtigsvar + fritekst. | Nei (testet i kode) |
| Historikk/logg | fungerer trolig | `app/relative/history.tsx` | Liste over forespørsler + svar. | Nei |
| Kalender (pårørende CRUD) | fungerer trolig | `app/relative/calendar.tsx`, `event.tsx`, `services/calendar.ts` | DateTimeField for dato/tid (HTML på web, native picker). | Ja — på ny APK |
| Senior kan se aktiviteter | fungerer trolig | `app/senior/day.tsx` | Lesevisning «Min dag». | Nei |
| Senior kan legge til aktiviteter | mangler | — | Bevisst forenkling. Senior har ingen UI for å opprette eller endre kalender. | — |
| Pårørende kan legge til aktiviteter | fungerer trolig | `app/relative/event.tsx` | Full CRUD. | Nei |
| Notifikasjoner / push | delvis implementert | `services/push.ts`, `notification_tokens`-tabellen, Edge Function `send-push` | Klient registrerer token; serverdel finnes; **Database Webhook + cron i Supabase er manuelt** og kan ikke bekreftes fra kode. | Ja — ende-til-ende |
| Push-tokens | fungerer trolig | `services/push.ts:registerForPushNotifications` | Bruker `Notifications.getExpoPushTokenAsync` med EAS `projectId`. | Ja — på ny APK med tillatelser |
| Bilder / storage | fungerer trolig | `services/storage.ts:uploadHelpImage` | Plattformsplittet: expo-file-system base64 på native, fetch på web. 0-bytes-guard. | Ja — kamerabilde på ekte Android |
| Eskalering | delvis implementert | `escalate` Edge Function + `escalation_due_at` på request | Krever cron som ikke kan bekreftes fra kode. | Ja — eller dokumentert som ikke i pilot 1 |
| Aktivitetsstatus (sist aktiv) | fungerer trolig | `services/activity.ts`, dashboard-banner | Respekterer `activity_sharing_enabled`. | Nei |
| Personvern-/samtykkeskjerm (senior) | fungerer trolig | `app/senior/privacy.tsx` | Stor Ja/Nei for aktivitetsdeling. | Nei |
| Personvern-seksjon (pårørende) | fungerer trolig | `app/relative/settings.tsx` | Bullet-tekst + toggle. | Nei |
| APK-build | fungerer trolig | `eas.json:preview` | `internal`, `apk`. | Ja — den nye OTP-APK |
| Webdeploy | fungerer trolig | `.github/workflows/pages.yml` | Manuell trigger. | Ja — på `familieknappen.app` |
| Resend / Supabase SMTP-forventning | bare dokumentert | `APK_TESTING.md`, `DEPLOYMENT.md`, `KLAR_TIL_APK.md` | Ikke i kode. | Ja — ende-til-ende |
| E-postmal med `{{ .Token }}` | bare dokumentert | (kun i prompt-historie) | Må endres i Supabase Dashboard. | Ja — visuelt i innboks |
| UI / designsystem | fungerer trolig | `src/theme/theme.ts`, `src/components/*` | Nunito-font, logo i header, store senior-knapper. | Nei (testet i kode) |
| Onboarding-UI | fungerer trolig | `app/onboarding.tsx` | Lager gruppe med ett tekstfelt. | Ja — ny APK |
| Test-/reset-data-script | mangler | — | Tidligere `seed.sql` er fjernet. | — |
| Versjon/build-label i UI | delvis | `EXPO_PUBLIC_PREVIEW_BUILD_LABEL` i test-panel | Vises kun når testinnlogging er aktivert. | Nei |
| Avlogging (logg ut) | fungerer trolig | `RoleSwitchButton` + `store.signOut` | Rydder realtime, polling, push-state. | Ja — særlig i APK |

---

## 4. Mangler før kommersiell MVP

### 4.1 Kritiske tekniske mangler

- **OTP-flyten må verifiseres på ny APK.** Statisk grønt er ikke det samme som
  fungerende innlogging på Android.
- **E-postleveranse er uavklart i praksis.** Resend + DNS + Supabase-mal kan
  ikke bekreftes fra kode. Hvis én av disse er feil, virker ikke piloten — og
  bruker ser ingen ting.
- **Database Webhooks (send-push) er manuelt.** Hvis de ikke er satt opp,
  virker ikke push.
- **Cron for eskalering er manuelt.** Hvis det ikke er satt opp, eskalerer
  ingenting.
- **Reset/seed-script mangler.** Det er ingen lett måte å rydde / fylle på
  testdata mot et lokalt Supabase-prosjekt for en utvikler som ikke har full
  oversikt.
- **Observability/logging er ikke-eksisterende.** Vi har `console.error` i
  `__DEV__`, og `notification_log`-tabellen for push, men ingen sentral
  feillogging (Sentry, LogRocket eller lignende). En kommersiell pilot uten
  observability er blind.
- **Ingen automatiserte tester.** Det finnes ingen unit-/integration-tester
  i `package.json`-skriptene. Alt er manuell testing.
- **Type-config:** TypeScript kjører i strict, men ingen CI-kjøring av
  `typecheck`/`build:web` automatisk på PR. GitHub Actions kjører kun deploy
  manuelt.
- **Web-domeneoppsett for `familieknappen.app`** ikke gjort i koden ennå
  (`baseUrl` peker fortsatt på `/familieknappen`).
- **Feilhåndtering på kalender-CRUD** er fortsatt fire-and-forget i store.
  Hvis et nettverkskall feiler, ser pårørende ingen ting.
- **APP_ENV-disiplin** mellom preview og produksjon må kontrolleres så
  testinnlogging ikke ved et uhell havner i produksjon.
- **App.json bundle-id og `package`** er `com.ahdigital.familieknappen` — det
  er fint, men låser deg til ah-digital-eierskap. Hvis Familieknappen senere
  selges/skilles ut, må navnet være rett.

### 4.2 Kritiske produktmangler

- **Senior kan ikke selv legge til avtaler i kalenderen** — kun pårørende.
  Bevisst i dag, men må eksplisitt være en produktbeslutning, ikke en
  tilfeldighet.
- **«Ring familien» og «Videosamtale» er placeholders.** Brukeren får en
  rolig melding om at det ikke er klart ennå. Det er ærlig, men strider mot
  produktforventningen «kommunikasjon med familien».
- **Ingen onboarding-veiviser etter innlogging.** Når en ny senior logger inn,
  havner hen rett i hjem-skjermen uten forklaring. For digitalt utrygge eldre
  er det en høy terskel.
- **Ingen «invitasjons-mottatt»-skjerm utenfor deep-link.** En bruker som får
  en tekstmelding med en kode (ikke en deep link), har ingen måte å bruke
  invitasjonen på inne i appen i dag.
- **Historikk er kun for pårørende.** Senior har ingen historikk over egne
  spørsmål og svar.
- **Ingen «slett denne forespørselen»-funksjon** etter at den er besvart.
  Besvarte spørsmål blir liggende.
- **Ingen «svar er feil / spør på nytt»-flyt.** Hvis pårørende har misforstått,
  må senior starte en helt ny forespørsel.
- **«Trygghetsstatus»** er kun en banner med «sist aktiv». Ingen indikator for
  «hørt fra i dag», «savnet» eller lignende — som var et tema i pitch-tekster.

### 4.3 Sikkerhet / personvern / GDPR-mangler

- **Ingen personvernerklæring** som juridisk dokument.
- **Ingen brukervilkår.**
- **Ingen aktiv samtykkelogging.** Aktivitetsdeling-toggelen er der, men det
  finnes ingen tidsstempelt logg over når brukeren har samtykket.
- **«Slett konto»-funksjonen finnes ikke** i app. Det er kun et tekstløfte
  i personvern-seksjonen.
- **Eksport av data** er ikke implementert. Lovkravet (data portability i
  GDPR) er ikke oppfylt.
- **`family_groups` insert er åpen.** Misbruk kan i prinsippet skje hvis
  appen åpnes for offentlig registrering.
- **Logging unngår sensitive data i `authErrors`**, men det finnes ingen
  policy som sier «log aldri e-post / token». En automatisert lint-regel
  hadde vært tryggere.
- **Storage-bucket er privat med RLS — bra.** Men signerte URL-er har 1 t
  TTL og kan deles videre uten kontroll i den tiden. For et pilotsystem er
  det greit; for kommersiell drift er det en risiko.
- **Push-meldinger inneholder navn og setningen «ber om hjelp».** Lavt
  sensitivt, men for noen brukere kan det være privat informasjon synlig
  på låseskjerm. Bør være en bevisst beslutning.
- **Databehandleravtaler** med Supabase og Resend må formaliseres for
  kommersiell drift.
- **EU-data-residens:** Supabase tilbyr EU-regioner, men det er **uklart**
  hvor prosjektet `vjddppqsbrafcywwjnpf` faktisk er hostet. Må bekreftes.

### 4.4 Drifts- og kommersialiseringsmangler

- **Ingen support-flyt.** Hva skjer hvis en eldre bruker ikke kommer videre?
  Det finnes ingen «kontakt oss»-funksjon i appen.
- **Ingen administrasjonsside.** Hverken pårørende eller du selv har
  oversikt over alle familier, kontoer eller bruken.
- **Ingen feillogging/observability** (gjentas her fordi det også er en
  driftsting).
- **Ingen betalingsmodell.** Hvis Familieknappen skal være kommersiell, må
  Stripe/abonnement på plass. Ikke i kode ennå.
- **Ingen Play Store-eller App Store-tilstedeværelse.** APK distribueres
  som lenke fra EAS — det er ikke en kommersiell distribusjonskanal.
- **Ingen backup/restore-strategi.** Supabase tar daglige backups på
  betalte planer; uklart om dette prosjektet er på rett plan.
- **Ingen versjonering av appen.** `app.json` har `version: 1.0.0` som ikke
  inkrementeres automatisk for preview. EAS production har `autoIncrement: true`
  men brukes ikke ennå.
- **Ingen dokumentert pilot-/supportprosedyre.** Hvis moren din møter en feil,
  hva er steg én, to, tre?
- **Ingen brukertesting** annet enn deg + moren din. Ingen ekstern pilot.
- **Dokumentasjonen er konsentrert i `.md`-filer i repoet** — bra for utvikler,
  men ingen brukerrettet hjelp.

### 4.5 Første realistiske MVP-grense

**Den minste realistiske MVP-en (pilot 1: deg + moren din):**
- Innlogging med 6-sifret OTP-kode, verifisert på Android APK.
- Onboarding: senior eller pårørende kan logge inn og bli del av en gruppe
  uten å gå via SQL.
- Hjelpeforespørsel (tekst, bilde, begge), svar (hurtigsvar + fritekst),
  realtime mottak.
- Min dag (lesevisning for senior).
- Pårørende kan opprette og slette kalenderavtaler.
- «Logg ut» og inn igjen virker.
- Klar, varm UI med Nunito-font og rolig palett.
- Resend + Supabase-mal verifisert (e-post leveres + viser kode).

**Hva som IKKE bør være med i første kommersielle versjon:**
- Videochat / WebRTC (utenfor scope for MVP).
- Adminpanel (ikke nødvendig for én familie).
- Betalingsmodell (kommer i versjon 2).
- App Store / Play Store-distribusjon (kommer etter brukertesting).
- Eskalering (kan dokumenteres som «kommer senere» hvis det forenkler).
- Push for andre handlinger enn forespørsel/svar.
- Avansert analytics, A/B-testing, eller produktdashbord.

**Hva som må være stabilt før mor/senior-pilot (intern, dvs. én familie):**
- OTP-flyten må fungere ende-til-ende, inkludert ny APK.
- Send-flyt med kamera må fungere på Android.
- Realtime + polling-fallback må vise svar uten manuell refresh.
- Pårørende må kunne invitere senior via e-post **eller** SQL.
- Logg ut + tilbake må ikke låse appen.

**Hva som må være stabilt før betalt pilot (ekstern, 3–10 familier):**
- Alt fra intern pilot, **pluss**:
- Personvernerklæring + brukervilkår.
- Slett-konto-funksjon i app.
- Datapunkt for samtykke (tidsstempel).
- Sentral feillogging (Sentry e.l.).
- En supportkontakt-vei (i app eller via e-post).
- Push verifisert ende-til-ende.
- Eskalering eller eksplisitt «ikke i pilot 2»-merking i UI.
- En klar onboarding-veiviser.
- Resend på betalt plan, eller egen SMTP, hvis volum tilsier det.

**OTP-innloggingens rolle i første pilot:**
OTP-kode er **primær** fra dag én. Magic link/deep link beholdes som backup
hvis brukeren ved et uhell klikker lenken i e-posten, men det er ikke
hovedstrategi. Det betyr at pilot 1 kan starte selv om deep-link-flyten på
APK-en aldri er testet ferdig — så lenge OTP-koden virker.

**Hva som bør vente til etter at én senior + én pårørende fungerer stabilt:**
- Inviter flere familier.
- Bygg adminpanel.
- Implementer betaling.
- Forfine push-eskalering.
- Bygg videochat eller telefoni.
- Publiser i Play Store.
- Markedsføring og bredere distribusjon.

---

## Stopp etter seksjon 4

Seksjon 5–13 er ikke skrevet ennå, etter instruks.

---

## 5. Spesifikke funksjonsendringer som bør planlegges

Denne seksjonen baker inn de strategiske føringene: pårørende er kjøper og
administrator, senior er ren bruker, betaling skjer på `familieknappen.app`
(ikke i appen), år 1 sikter mot 100–500 familier. Hver del skiller mellom
MVP-løsning og robust senere løsning, og merker antakelser eksplisitt.

### 5.1 Pårørende-first onboarding og senior som enkel bruker

**Hva som finnes i koden i dag (verifisert):**

- `app/onboarding.tsx` lar første bruker opprette egen gruppe via
  `create_family_group`-RPC. Brukeren blir primærkontakt. Profil-rollen
  settes til `relative`.
- `relative/settings.tsx` har «Inviter familiemedlem» med e-post og rollevalg
  (sekundærkontakt / senior). Token genereres serverside, lagres i
  `group_invitations`.
- `app/invite.tsx` tar token fra deep link, kaller `accept_group_invitation`,
  og setter `profiles.role` korrekt via den nye migreringen.
- `app/sign-in.tsx` har 6-sifret OTP-kode som primær flyt. Magic link bevart
  som backup.

**Mismatch mot pårørende-first markedsføring:**

I dagens kode forutsetter både onboarding og invitasjon at hver bruker (også
senior) selv kan:

- motta og forstå en e-post,
- åpne sin egen innboks på sin telefon,
- klikke en deep link eller taste en 6-sifret kode.

For en sårbar senior på 75–90 år er dette **ikke** triviell friksjon.
Pårørende-first markedsføring forutsetter at pårørende kan klargjøre senior med
minst mulig friksjon.

**Vurdering av koblingsmetoder:**

| Metode | Friksjon for senior | Friksjon for pårørende | Sikkerhet | Krever ekstra UI/kode |
| --- | --- | --- | --- | --- |
| Senior bruker egen e-post + OTP (nåværende) | Høy | Lav | Middels (link/kode kan lekke) | Ingen |
| Pårørende setter opp senior fysisk på seniors telefon (logger inn én gang med seniors e-post) | Lav (ingen) | Middels (engangsjobb) | Middels | Ingen |
| 6-sifret paringskode (pårørende lager kode, senior taster den) | Middels (taste 6 siffer) | Lav | Bedre hvis kort levetid | Krever ny tabell + skjerm + service |
| Paringslenke (pårørende sender SMS/MMS, senior trykker én lenke) | Lav (én trykk) | Lav | Lavere (lenke kan lekke) | Krever route + token-håndtering |
| QR-kode | Lav (skanne) | Lav | Middels (krever fysisk nærhet) | Krever kamera/skanner i app |
| Pre-account på web (pårørende setter opp senior på `familieknappen.app`, senior bare logger inn med e-post) | Middels (én OTP) | Middels (jobb i nettleser) | Middels | Krever web-portal funksjonalitet |

**Sentrale risikoer på tvers:**

- Feil familie kobles til feil senior (alvorlig — kan eksponere fremmedes
  data). Må håndteres med tids- og enhetsbegrenset paringskode pluss
  bekreftelse fra pårørende.
- Senior uten egen e-post (vanlig i målgruppen) er ikke håndtert i dag.
- Senior med felles familie-Gmail (vanlig) kan ved en feiltagelse logge på
  feil konto.
- Pårørende som administrerer fra avstand (typisk: voksent barn i annet land)
  kan ikke fysisk hjelpe senior med oppsett.

**MVP-forslag (mor/senior-pilot — én familie):**

Hold dagens kode. Anbefal pårørende:

1. Pårørende logger inn på sin egen telefon, oppretter familiegruppe via
   onboarding, blir primærkontakt.
2. Pårørende inviterer senior på seniors e-postadresse, velger rolle «Senior».
3. Pårørende sitter fysisk sammen med senior, hjelper med å installere
   appen, motta OTP-kode i seniors e-postapp, og taste den inn. (Eventuelt
   åpner pårørende invitasjonslenken på seniors telefon for å trigge aksept.)
4. Etter første innlogging holder seniors økt seg «automatisk» (AsyncStorage
   + autoRefreshToken).

**Risiko ved MVP:** krever at senior har egen e-post, og at pårørende er
fysisk til stede én gang. Ikke skalerbart, men det er én familie. Akseptabelt.

**Robust senere løsning (funksjonell MVP og videre — 10–500 familier):**

Bygg en **paringsflyt med 6-sifret kode**, supplert med pre-account på web:

1. Pårørende oppretter konto + betaler på `familieknappen.app`.
2. Pårørende oppretter familiegruppe på web.
3. Pårørende fyller inn senior-profil på web (navn, valgfritt telefonnummer
   for «Ring»-knapp, valgfritt e-post). Web genererer en **6-sifret
   paringskode** med kort levetid (anbefalt 15 minutter).
4. Pårørende viser paringskoden til senior (på samme skjerm, eller leser den
   høyt).
5. Senior åpner appen, ser «Skriv inn paringskoden», taster den inn.
6. Appen kaller en SECURITY DEFINER RPC `pair_with_code(p_code)` som finner
   en ledig senior-slot, oppretter `profiles`-rad for seniors auth-bruker,
   og setter rollen til `senior`.
7. Senior trenger ingen e-post i denne flyten, men må ha en auth-bruker.
   Dette kan løses ved at appen lager en anonym Supabase-bruker (eller egen
   «pairing-bruker») som pares til den pre-opprettede slotten. Detaljen må
   verifiseres i Supabase Auth-arkitekturen.

**Hva som må verifiseres for paringsflyt:**

- Supabase Auth støtter «anonymous sign-in» (kan brukes hvis senior ikke har
  e-post). `må verifiseres` mot prosjektets Auth-innstillinger.
- Alternativt: pårørende fyller inn seniors e-post på web, senior logger inn
  med OTP én gang. Dette krever fortsatt at senior har e-post.
- Paringskode-tabell må ha kort levetid (15 min), én bruk, og knyttet til en
  konkret gruppe-slot. Brute-force-beskyttelse (maks N forsøk per IP/enhet
  innen tidsvindu).

**Risikoer i robust løsning:**

- Anonyme Supabase-brukere mister tilgang hvis de logges ut — senior har
  ingen «innloggings-identitet» å gjenopprette med.
- Paringskode lekket via skulder-kikk eller SMS gir tilgang til familien
  for fremmede. Korte tidsvinduer + IP-throttling reduserer dette.
- Familiegruppen blir «foreldreløs» hvis pårørende mister enhet uten å ha
  gjenopprettings-konto satt opp.

**Testkriterier for onboarding (begge nivåer):**

- Pårørende kan opprette gruppe + invitere senior i under 5 minutter (uten
  hjelp).
- Senior kan komme «inn i appen» (logget inn, ser hjem-skjerm) i under 60
  sekunder med fysisk hjelp.
- Ved feiltrykk i paringskode 3 ganger får senior en rolig melding, ikke en
  blokade.
- Senior kan ikke ved et uhell pares til feil familiegruppe (testes med to
  parallelle paringskoder fra to ulike familier).
- Hvis pårørende ombestemmer seg, kan paringskoden tilbakekalles (analogt
  med invitasjonstilbaketrekking).

**Status og merking:**

- MVP-løsningen (e-post + OTP for senior) er `fungerer trolig` men krever
  fysisk hjelp.
- Paringskode-løsningen er `må bygges`, ikke i kode i dag.
- Pre-account på web er `må bygges` og avhenger av web-portal arkitektur som
  ennå ikke finnes.

### 5.2 Senior skal kunne legge til aktiviteter

**Hva som finnes i koden i dag (verifisert):**

- `calendar_events`-tabellen har: `id`, `family_group_id`, `title`,
  `description`, `start_time`, `end_time`, `created_by`, `created_at`.
- `relative/event.tsx` har full CRUD: `addEvent`, `updateEvent`,
  `deleteEvent`. Bruker `DateTimeField` for dato/tid.
- `relative/calendar.tsx` viser liste, gir tilgang til redigering/sletting.
- `senior/day.tsx` er **lesevisning** av dagens hendelser.
- `useAppStore.addEvent/updateEvent/deleteEvent` er fire-and-forget (kjører
  service-kall i `void (async …)`, fanger feil til `logError`, viser ikke
  feil i UI).
- RLS: alle gruppemedlemmer kan opprette, endre og slette kalenderhendelser
  i gruppa. (Krever ikke noen ekstra rolle.)

Senior kan altså **ikke** legge til aktiviteter i appen i dag. Dette er en
forenkling fra tidligere designvalg.

**Hva analysen tilsier for pårørende-first kontekst:**

- Senior bør kunne legge inn enkle påminnelser («Tann-time», «Anne kommer»)
  uten å måtte be pårørende om det. Det styrker autonomi-følelsen og
  reduserer henvendelser til pårørende.
- Pårørende bør fortsatt være «sekundær administrator» og kunne legge til /
  endre / slette på vegne av senior.
- Pårørende bør se hvem som har lagt til hva (`created_by` finnes allerede).
- Push til pårørende ved senior-opprettelse er ikke nødvendig i MVP — det
  ville bli «støy». Kan vurderes senere som opt-in.

**MVP-forslag:**

- Legg til en stor «Legg til avtale»-knapp på seniorens «Min dag», eller en
  egen knapp på seniors hjem. Format: 3 store felt — Tittel, Dato, Klokke —
  ingen beskrivelse. Bruker eksisterende `DateTimeField`.
- Senior kan ikke slette hendelser i MVP. Sletting overlates til pårørende
  (lav risiko for utilsiktet permanent tap av informasjon).
- Senior kan ikke redigere hendelser i MVP.
- Pårørende ser hendelser slik som før, men kan se hvem som har laget den
  (lite «Av: Mor» tag).
- Ingen push til pårørende ved senior-opprettelse.

**Robust senere løsning:**

- Senior kan redigere og «angre» egne hendelser (med soft-delete +
  «Angre»-knapp i 30 sekunder).
- Push til pårørende valgfritt (innstilling per pårørende).
- Senior ser tydelig «Lagt til av deg» / «Lagt til av Anne».
- Hendelser kan ha typisk gjentakelse (hver uke / hver dag) — vanskelig for
  senior å konfigurere, så denne kun via pårørende.
- Auto-arkivering av gamle hendelser (mer enn N dager bak).

**Risikoer:**

- Senior taster feil tid og blir forvirret når pårørende ser noe annet.
  Mitigering: store, runde tids-pickers, og pårørende kan korrigere.
- Senior trykker «Slett» ved et uhell. Mitigering i MVP: senior har ikke
  «Slett»-knapp.
- Hendelser i feil tidssone hvis senior reiser eller pårørende er i annet
  land. Bør lagres i UTC, vises i lokal tid. (`må verifiseres` om dette er
  riktig håndtert i `mappers.ts` i dag.)
- Pårørende blir overrasket over senior-opprettelse, lurer på om mor «har
  glemt» avtalen som ble lagt inn av pårørende.

**Testkriterier:**

- Senior kan legge til en avtale på under 30 sekunder uten hjelp.
- Avtalen vises på «Min dag» neste gang den datoen kommer.
- Pårørende ser avtalen i sin kalender innen 20 sekunder (realtime + poll).
- Pårørende ser tydelig at avtalen er laget av senior.
- Hvis senior taster feil dato (f.eks. fortid), gir appen en rolig melding
  («Dato kan ikke være i fortid») uten å være streng.

**Status og merking:**

- Senior kan ikke legge til aktiviteter i dag — `mangler`.
- MVP-forslag krever én ny skjerm/knapp + tilkobling til eksisterende
  `addEvent`. Ingen DB-endringer nødvendig for MVP.
- Robust løsning krever soft-delete + push-toggle + DB-felter
  (`archived_at`, evt. `acknowledged_by_recipient_at`).

### 5.3 Besvarte spørsmål skal være synlige, men varsler kan fjernes

**Hva som finnes i koden i dag (verifisert):**

- `help_requests` har felter: `status` (CREATED/SENT/DELIVERED/VIEWED/
  ANSWERED/ESCALATED/CLOSED), `seen_by_senior` (boolean), `delivered_at`,
  `viewed_at`, `answered_at`, `escalated_at`, `closed_at`.
- `selectUnseenAnswer` finner første `status === 'ANSWERED'` med
  `!seenBySenior`. Driver «Se svar fra familien»-banneret på seniors hjem.
- `senior/answer.tsx` har en `useFocusEffect` som kaller `markAnswerSeen` i
  det øyeblikket skjermen får fokus. Dvs.: bare det å åpne svaret = «sett».
- Det finnes ingen `acknowledged_at`, ingen `archived_at`, ingen
  «historikk»-skjerm for senior, ingen midnight-cleanup.
- Pårørendes `history.tsx` viser besvarte forespørsler, men det er ingen
  tilsvarende for senior.

**Problemet, helt konkret:**

- Senior trykker «Se svar fra familien» → svaret vises → senior trykker
  «Ferdig» eller går tilbake → banneret er borte → om senior to minutter
  senere vil sjekke «hva var det Anne svarte?», er det ingen vei tilbake til
  svaret uten å vite hvilken forespørsel det var.
- Hvis senior ved et feiltrykk åpner og lukker raskt, mister hen varslet,
  men har ingen «historikk» å gå til.

**Ønsket logikk:**

- Banneret («Se svar») fjernes når senior eksplisitt trykker «Sett» eller
  «Ferdig».
- Svaret er fortsatt synlig i en historikk-/logg-visning.
- Besvarte og bekreftede forespørsler ryddes vekk fra aktiv visning, men
  ikke slettes — flyttes til historikk.
- Eskalering stopper umiddelbart når en forespørsel besvares.

**Foreslått statusmodell-utvidelse:**

Skille `viewed_at` (åpnet skjermen) fra `acknowledged_at` (eksplisitt
bekreftet). Foreslå nye felter på `help_requests`:

- `viewed_at` (allerede finnes — pårørende åpner og setter VIEWED).
- `acknowledged_at` (`må vurderes` — ny: når senior trykker «Sett/Ferdig»).
- `archived_at` (`må vurderes` — ny: når forespørselen ryddes fra banner).
- `escalation_stopped_at` (`må vurderes` — ny: når eskalering stoppes pga.
  besvart).

Statusenum `request_status` kan utvides eller bli mer skjevt — bedre å
bruke timestamps for å beskrive hva som har skjedd, og la enum holdes til
overordnede stadier (DELIVERED/ANSWERED/ESCALATED/CLOSED).

**Midnight-cleanup — bør den finnes?**

For en enkelt familie er det neppe nødvendig — listen blir aldri lang. For
100–500 familier kan banneret bli støy hvis ikke besvarte rydres.

- **MVP-løsning:** klientlogikk. `selectUnseenAnswer` viser kun
  `status === 'ANSWERED'` AND `acknowledged_at === null`. Når senior
  trykker «Sett», settes `acknowledged_at = now()`. Det er nok.
- **Robust senere løsning:** Edge Function eller pg_cron som setter
  `archived_at` etter f.eks. 24t for alle `acknowledged_at IS NOT NULL`,
  slik at queries kan filtrere `archived_at IS NULL`.

**MVP-forslag (mor/senior-pilot):**

1. Ny migrering: legg til `acknowledged_at timestamptz` på `help_requests`.
   Ikke obligatorisk for MVP, men billig å legge til nå mens man uansett
   migrerer.
2. `senior/answer.tsx`: fjern `markAnswerSeen` fra `useFocusEffect`. Vis
   svaret normalt. Legg til en stor «Sett»-knapp som kaller en ny store-
   action `acknowledgeAnswer(requestId)` som setter `acknowledged_at = now()`
   og oppdaterer lokal state.
3. `selectUnseenAnswer` endres: viser kun `ANSWERED` med
   `acknowledged_at IS NULL`. (Behold `seenBySenior` for bakoverkomp om
   migreringen ikke har kjørt enda, men det er valgfritt.)
4. Eskalering: når svar settes inn (helpResponses insert), sett samtidig
   `escalation_stopped_at = now()` på request. `escalate`-funksjonen
   filtrerer da bort disse.
5. Senior-historikk: legg til en lett «Tidligere svar»-lenke på seniors hjem
   (under den eksisterende personvern-lenken). Viser de siste 10 besvarte
   forespørsler.

**Robust senere løsning:**

- Migrering legger til `archived_at` på request.
- Daglig pg_cron eller Edge Function arkiverer requests med
  `acknowledged_at < now() - interval '24 hour'`.
- «Tidligere svar»-skjerm støtter paginering og søk.
- «Vis nytt svar igjen»-knapp i historikk hvis senior angrer på å ha trykket
  «Sett».

**Risikoer:**

- Migreringer på eksisterende `help_requests`-tabell må være idempotent og
  bakoverkompatible (alle nullable). Allerede vanlig praksis.
- Hvis `acknowledged_at` ikke fylles ut korrekt, kan banneret bli sittende
  igjen «for alltid». Klar test: hva skjer hvis senior har en gammel
  uavklart forespørsel i databasen?
- Tidssoner: midnight-cleanup må ta hensyn til seniors lokale tid, ikke UTC,
  ellers «ryddes» rett etter midnatt UTC = 01:00–02:00 lokal tid i Norge.
- Eskaleringens forhold til besvart-status: hvis senior bekrefter et svar
  før eskalering kjører, må eskalering ikke trigge. Hvis svaret kommer
  etter eskalering har startet, skal eskaleringen markeres som «mottok svar
  etter eskalering» (kanskje noe pårørende vil se).

**Testkriterier:**

- Senior åpner svar, går tilbake uten å trykke «Sett», banner er fortsatt
  der.
- Senior trykker «Sett», banner forsvinner.
- Svaret er synlig i «Tidligere svar» etter «Sett».
- Hvis pårørende svarer på en eskalert forespørsel, eskalering stopper.
- Hvis nettet faller ut mens senior trykker «Sett», får senior en rolig
  feilmelding og kan prøve igjen.
- Forespørsler som er «Sett» for over 24t vises ikke som banner, men
  finnes i historikk.

**Status og merking:**

- Nåværende oppførsel («auto-dismiss på fokus») er `delvis implementert` mot
  ønsket logikk — den finnes, men feiler kravene fra prompten.
- Migrering for `acknowledged_at` er `må bygges`.
- «Tidligere svar»-skjerm for senior er `mangler`.
- Midnight-cleanup er `bør vente` til robust løsning.

### 5.4 Push-varsler og eskalering

**Hva som finnes i koden i dag (verifisert):**

- `services/push.ts`: `registerForPushNotifications` kaller
  `Notifications.requestPermissionsAsync` og
  `Notifications.getExpoPushTokenAsync` med EAS `projectId`. Token lagres i
  `notification_tokens`-tabellen.
- `useAppStore` registrerer token ved login, sletter ved logout.
- `notification_tokens`-migrering: `user_id`, `expo_push_token`, `platform`,
  `last_used_at`, RLS som binder til auth.uid().
- `notification_log`-tabellen for serverlogg.
- `supabase/functions/send-push/index.ts`: leser
  `SUPABASE_SERVICE_ROLE_KEY`, lytter på `record` fra payload (webhook),
  finner gruppemedlemmer, henter tokens, sender via Expo Push API. Logger
  resultater i `notification_log`.
- `supabase/functions/escalate/index.ts`: finner åpne forespørsler med
  `escalation_due_at <= now()`, sender push til sekundærkontakt, oppdaterer
  status.
- `help_requests.escalation_due_at` settes ved opprettelse til `now() +
  ESCALATION_DELAY_MINUTES` (konstant i `helpRequests.ts`).

**Hva som ikke kan bekreftes fra kode:**

- Om Database Webhook for `INSERT` på `help_requests` er konfigurert i
  Supabase Dashboard og peker på `send-push`-funksjonen.
- Om Database Webhook for `INSERT` på `help_responses` er konfigurert.
- Om en cron-jobb (pg_cron eller scheduled function) kaller
  `escalate`-funksjonen jevnlig.
- Om `expo-notifications` faktisk er ferdig konfigurert i `app.json` med
  Android-icon, FCM-credentials, kanaler, etc.

**Hva varsel skal vise (foreslått tekst, ikke i kode i dag):**

- Til pårørende ved ny forespørsel:
  - Tittel: `«[Seniorens navn] ber om hjelp»`
  - Body: kort tekst uten innholdet i meldingen — f.eks.
    `«Åpne appen for å se spørsmålet»`.
- Til senior ved svar:
  - Tittel: `«Svar fra familien»`
  - Body: `«[Pårørendes navn] har svart deg»`.
- Til sekundærkontakt ved eskalering:
  - Tittel: `«[Seniorens navn] venter fortsatt på hjelp»`
  - Body: `«Primærkontakten har ikke svart ennå»`.

Bevisst valg: **ingen** sensitive detaljer (meldingsinnhold, bilde-URL,
selve svaret) i varslet. Det vises på låseskjerm, og senior eller pårørende
kan ha skjermbilde delt med utenforstående.

**Plan for klargjøring:**

#### Før mor/senior-pilot

- Verifiser i Supabase Dashboard at Database Webhooks er konfigurert for
  `INSERT` på `help_requests` og `help_responses`, og at de peker på
  `send-push`-funksjonens URL (med riktig autentisering — typisk service
  role key i header).
- Test ende-til-ende på faktisk Android-enhet: send forespørsel, sjekk at
  pårørende får varsel i låseskjerm. Svar, sjekk at senior får varsel.
- Sjekk at trykk på varsel åpner appen på riktig sted (deep link til
  `/relative/request/[id]` for nye forespørsler, eller seniors hjem for
  svar).
- Verifiser at varseltekst er på norsk og inneholder ingen sensitive data.

#### Før betalt pilot

- Aktiver eskalering med cron (`pg_cron` hver 1–5 minutt mot
  `escalate`-funksjonen).
- Verifiser at eskalering stopper når svar mottas (kobler til 5.3 over).
- Test push for sekundærkontakt-eskalering.
- Sjekk `notification_log` for feilrate (avviste tokens, Expo Push API-
  feil, manglende mottakere).
- Implementer rydding av ugyldige tokens (Expo Push API gir tilbakemelding;
  ikke aktivert i `send-push` i dag).
- Vurder Android-varselskanaler («Hjelp», «Svar», «Eskalering») så bruker
  kan slå av enkeltdeler.

#### Før kommersiell app

- Observability: Sentry e.l. på Edge Functions for å se feil i sanntid, ikke
  bare i `notification_log`.
- Daglig rapport over varslingsstatistikk (sendt / feilet / ingen tokens).
- iOS-push via APNs (krever Apple-konto og separat konfigurasjon).
- Pause-/snooze-funksjon for pårørende («Ikke forstyrr» 22–07 e.l.).
- Mulighet for å sende varsel via SMS som fallback hvis push feiler. Dette
  drar inn ekstra leverandør (Twilio e.l.) og bør vurderes på lik linje
  med videochat — kun hvis behovet faktisk dokumenteres i pilot.

**Risikoer:**

- Push uten korrekt webhook-konfig → ingen feilmelding i klient → pårørende
  oppdager bare ved at de ikke får varsel. Veldig stille feil. Mitigering:
  test ende-til-ende i `KLAR_TIL_APK.md`-flyten.
- Token-rotasjon (Android/iOS endrer push-token regelmessig) — krever
  re-registrering. `registerForPushNotifications` kjøres ved login, men
  ikke ved hver app-start. Risiko at gammel token brukes etter at OS har
  rotert den. `må verifiseres` om Expo-tokens er stabile nok.
- Feil bruker får varsel hvis gruppe-medlemskap endres mellom innsetting
  og send-push. Lav risiko, men relevant ved invitasjons-rotasjon.

**Status og merking:**

- Server-side push og eskalering er `delvis implementert`. Klar i kode, ikke
  klar i konfig.
- Klient-side er `fungerer trolig`, må verifiseres i ny APK.
- Webhooks og cron er `må verifiseres` manuelt.

### 5.5 Videochat

**Hva som finnes i koden i dag (verifisert):**

- Ingenting peker mot videochat. Det finnes en placeholder-Alert i
  `relative/request/[id].tsx` («Videosamtale er ikke tilgjengelig ennå»)
  og «Ring familien»-knapper på senior-skjermene som viser
  `«Ringefunksjonen er ikke koblet på ennå»`.
- Ingen WebRTC, Daily, Twilio, Agora eller annen videoleverandør i `package.json`.
- Ingen signaling, ingen TURN, ingen UI for innkommende anrop.

**Vurdering for første MVP:**

Videochat er en betydelig egen leveranse:

- WebRTC: kjernebibliotek + signalering + TURN-server (kostnad: $15–100/
  måned for en delt TURN, mer hvis dedikert).
- Ferdige plattformer (Daily, Twilio, Agora): per-minutt-pris ($0,002–0,005
  per deltager-minutt), enkelt å integrere, men er likevel ny abstraksjon
  og UI.
- Jitsi/Whereby: lavere kostnad, men begge er ikke laget for
  seniorvennlighet ut av boksen.
- Push for innkommende anrop er en egen teknisk problemstilling
  (CallKit/ConnectionService) som krever native moduler.
- UI for seniorvennlig anrop: stor «Trykk for å svare»-knapp, mute, kamera
  av, ingen overskjerm av tekniske detaljer.
- App Store-policy: videochat-apper sjekkes for personvern, opptak, lagring
  av samtaler.

For en familie der senior allerede har en telefon og pårørende har et
nummer, dekker en vanlig telefonsamtale 90 % av behovet. Videochat er
«nice to have», ikke essensielt.

**Anbefaling:**

- **Videochat skal vente** til kommersiell V2 eller senere. Ikke MVP, ikke
  betalt pilot, ikke første kommersielle versjon.
- Erstatt «Videosamtale»-stub midlertidig med en **«Ring [navn]»-knapp** som
  åpner systemets telefon-app med pårørendes nummer prefilled, via
  `tel:`-URL. Dette krever:
  - At pårørendes telefonnummer er lagret på `profiles` eller
    `family_members` (kan være `phone`-felt — `må verifiseres` om feltet
    finnes i tabellen i dag).
  - En enkel UI-knapp som kaller `Linking.openURL('tel:...')`.
- For å skille senior fra pårørende: senior har én knapp («Ring familien»)
  som ringer primærkontakt. Pårørende har én knapp («Ring [seniorens
  navn]») som ringer senior.
- Dette dekker 80 % av kommunikasjonsbehovet med ~1 dag arbeid og null
  videoleverandør-kostnad.

**Når videochat eventuelt skal vurderes:**

Sett opp tre kriterier som må være oppfylt før videochat plasseres på
roadmap:

1. Bruker-research i en faktisk pilot viser at telefonsamtale ikke holder.
2. Forretningsmodellen tåler $0,01–0,05 ekstra per familie-minutt.
3. Pårørende har faktisk etterspurt video, ikke bare «det hadde vært fint».

**Status og merking:**

- Videochat er `mangler` og **anbefalt utsatt**.
- «Ring [navn]»-knapp med `tel:`-URL er `bør vurderes som MVP-erstatning`.
- Krever et `phone`-felt i `profiles` eller `family_members`. `må
  verifiseres` om det finnes.

### 5.6 Abonnement, lisens og ekstern betalingsmodell

**Hva som finnes i koden i dag (verifisert):**

- Ingen `subscription_status`, `stripe_customer_id`, `stripe_subscription_id`,
  `billing_admin_user_id` eller relaterte felter i kode eller migrasjoner.
- Ingen sperreskjerm for manglende lisens.
- Ingen sjekk av lisensstatus i `useAppStore.refresh()` eller i auth-gaten.
- Ingen kjøps-knapp, prisinformasjon eller betalingstekst i mobilappens
  kode — `bra`, ingenting å fjerne.

Dette er i tråd med strategi-føringene: betaling skjer på
`familieknappen.app`, ikke i appen. Men en _sperreskjerm_ for manglende
lisens må fortsatt bygges, og en datamodell for abonnement må eksistere.

**Hvor `subscription_status` bør ligge — analyse:**

| Plassering | Pros | Cons |
| --- | --- | --- |
| `profiles` (per bruker) | Enkelt | Hver bruker har egen status — i strid med familielisens-modellen. |
| `family_groups` | Familielisens-modell, naturlig | Krever at hver bruker hører til én gruppe (allerede tilfelle). Mest naturlig. |
| `subscriptions` (egen tabell) | Mest fleksibel for fremtid | Overkill for én lisens per gruppe i MVP. |
| `organizations` | Til hvis Familieknappen senere vil ha «organisasjon» som overgruppe | Ikke aktuelt i pilot. |

**Anbefaling:** legg `subscription_status` og tilhørende felter på
`family_groups`. Det er den naturlige enhet for «én lisens». Senere kan
familien evt. dele lisens med en annen familiegruppe, men det er ikke
MVP.

**Foreslåtte felter på `family_groups` (alle nullable for bakoverkomp):**

- `subscription_status` text (enum-aktig: `trialing` / `active` / `past_due`
  / `canceled` / `expired` / `manual_review`).
- `billing_admin_user_id` uuid references `profiles(id)` — hvilken bruker
  er ansvarlig for betaling. Typisk primærkontakt, men ikke nødvendigvis.
- `stripe_customer_id` text (referanse til Stripe Customer-objekt — synkes
  fra web).
- `stripe_subscription_id` text (referanse til Stripe Subscription).
- `trial_end` timestamptz (kun for `trialing`).
- `current_period_end` timestamptz (når neste betaling forfaller).
- `manual_review_reason` text (intern dokumentasjon når status er manuell —
  f.eks. «mor-pilot, gratis fram til 2027-01-01»).

**Hvordan appen skal sjekke lisens:**

- Etter login og `refresh()` skal `loadGroupContext` returnere
  `subscription_status` med gruppedata.
- Hvis status er `active` / `trialing` / `manual_review` → vanlig flyt.
- Hvis status er `past_due` / `canceled` / `expired` / NULL → sperreskjerm.
- Sperreskjermen vises mellom auth-gate og rolle-stack, så den fanger både
  senior og pårørende.

**Hvordan sperreskjerm bør være:**

- Stor, rolig melding: «Ingen aktiv lisens er knyttet til denne kontoen. Ta
  kontakt med familieadministratoren.»
- **Ingen** kjøps-knapp, **ingen** prislinje, **ingen** «kjøp på web»-tekst,
  **ingen** lenke til `familieknappen.app`.
- En «Logg ut»-knapp.
- En valgfri «Logg inn med en annen e-post»-snarvei (kan forveksles med
  ingen aktiv lisens, så kanskje samme knapp).
- Senior: bør være ekstra rolig — «Mor, snakk med [pårørendes navn]» hvis
  vi vet navnet.

**Hvordan dette påvirker RLS:**

- `family_groups`: oppdatering av abonnementsfelter må ikke kunne skje fra
  klient (frontend skal være ren leser). Service role (i web-portalens
  Stripe-webhook) gjør oppdateringer.
- Lese-policy: gruppemedlemmer kan lese `subscription_status` (de skal jo
  vise sperreskjermen riktig).
- Lese-policy: kun `billing_admin_user_id`-bruker kan lese
  `stripe_customer_id` og `stripe_subscription_id`. Eller hold dem helt
  utilgjengelige for klient — bedre.
- Senior bør **ikke** kunne lese abonnementsstatus i detalj — kun nok til
  at sperreskjermen kan vises riktig. (Diskuterbart.)

**Mor/senior-pilot:** sett `subscription_status = 'manual_review'` eller
`'active'` med `current_period_end` langt fram i tid for moren din. Da
slipper du sperreskjermen mens du tester.

**Hva som må verifiseres / må bygges utenfor mobilappen:**

- Stripe-konto, Stripe-produkter («Familieknappen Familie» månedlig/årlig).
- `familieknappen.app` som faktisk webportal (separat utviklingsspor — den
  finnes ikke som mobil-app i dag).
- Stripe webhook på web som oppdaterer `family_groups.subscription_status`
  basert på Stripe-events.
- E-postvarsler ved `past_due` og snart-forfall (kan kjøre på samme
  Resend SMTP).

**Statusverdier vurdert:**

| Status | Mening | Mobilapp-effekt | Hvem setter den |
| --- | --- | --- | --- |
| `trialing` | Gratis prøveperiode pågår | Full tilgang | Stripe webhook (start av trial) |
| `active` | Betalt og aktivt abonnement | Full tilgang | Stripe webhook (successful charge) |
| `past_due` | Betaling feilet, grace-periode | Vurdering: vis varsel men gi tilgang i kort grace, eller sperr | Stripe webhook |
| `canceled` | Abonnement avsluttet av kunde | Vis sperreskjerm etter `current_period_end` | Stripe webhook |
| `expired` | Trial gått ut uten å bli `active` | Sperreskjerm | Stripe webhook eller cron |
| `manual_review` | Internt unntak (pilot, gratis) | Full tilgang | Manuelt (SQL eller adminpanel) |

**App Store-policy-risiko (markert som risiko, ikke juridisk fasit):**

- Apple kan klassifisere appen som «Reader app» (én av få kategorier som
  tillater ekstern betaling). Familieknappen passer ikke perfekt — den er
  ikke en mediekonsumapp. Vurder dette grundig før iOS-innsending.
- Alternativt: «Existing Account / External Subscription Management».
  Tillates hvis kontoen kun opprettes på web og mobilappen er ren
  innloggingsportal — som er strategien her.
- Apple kan likevel kreve at appen ikke nevner ekstern betaling, ikke
  henviser til web, ikke har «manage subscription»-lenke.
- Mobilappens sperreskjerm må **ikke** si «kjøp på familieknappen.app» eller
  ha lenke dit. Den skal være helt nøytral: «Ta kontakt med
  familieadministratoren».
- Det er forskjell mellom Apple og Google på dette punktet. Google er mer
  liberal. Apple er strengere.

**Anbefaling:** lansér Android først (Play Store eller egen distribusjon),
få et antall betalte familier i drift, og kvalitetssikre App Store-
strategien grundig før iOS-innsending. Dette skal `flagges som åpen
juridisk/produktrisiko`, ikke som klart spor.

**Status og merking:**

- Subscription-modellen er `mangler` helt i kode.
- Plassering på `family_groups` er `må bygges` i datamodellen.
- Sperreskjerm er `må bygges`.
- Web-portal med Stripe er `må bygges` (separat fra mobil-prosjektet).
- App Store-strategi er `må verifiseres` med advokat / App Store-team før
  iOS-innsending.

---

## 6. Datamodell og Supabase-plan

### 6.1 Nåværende datamodell slik den kan utledes

Basert på migrasjonsfiler og typene i `database.types.ts`:

| Tabell/område | Funksjon | Status | Kommentar |
| --- | --- | --- | --- |
| `profiles` | App-bruker (1:1 med `auth.users`) | aktiv | Felter: `id`, `name`, `role`, `phone`, `email`, `activity_sharing_enabled`, `created_at`, `updated_at`. `phone` er nullable. |
| `family_groups` | Familielisens-grunnenhet | aktiv | Felter: `id`, `name`, `created_at`. Ingen `subscription_status` ennå. |
| `family_members` | Profil ↔ gruppe ↔ rolle | aktiv | Felter: `group_id`, `user_id`, `member_role` (senior/primary_contact/secondary_contact), `relationship`. Unik per (group_id, user_id). |
| `group_invitations` | Invitasjoner med token | aktiv | Felter: `family_group_id`, `invited_email`, `invited_role`, `token`, `expires_at`, `accepted_at`, `revoked_at`, `created_by`. Constraint: `invited_role <> 'primary_contact'`. |
| `help_requests` | Senior ber om hjelp | aktiv | Felter: `id`, `family_group_id`, `senior_id`, `recipient_id`, `message`, `image_path`, `status`, `seen_by_senior`, `delivered_at`, `viewed_at`, `answered_at`, `escalated_at`, `closed_at`, `escalation_due_at`, `escalation_level`. |
| `help_responses` | Pårørendes svar | aktiv | Felter: `id`, `help_request_id`, `responder_id`, `quick_reply_type`, `free_text`, `created_at`. |
| `calendar_events` | Familiekalender | aktiv | Felter: `id`, `family_group_id`, `title`, `description`, `start_time`, `end_time`, `created_by`, `created_at`. |
| `activity_status` | «Sist aktiv» per bruker | aktiv | Felter: `user_id`, `last_seen_at`, `app_opened_today`, `updated_at`. Respekterer `activity_sharing_enabled`. |
| `notification_tokens` | Push-tokens | aktiv | Felter: `user_id`, `expo_push_token`, `platform`, `last_used_at`. |
| `notification_log` | Serverlogg push | aktiv | Felter: `user_id`, `notification_type`, `success`, `payload`, `error`, `created_at`. `må verifiseres` mot faktisk schema. |
| storage `help-images` | Bilder til forespørsler | aktiv | Privat bucket, RLS via gruppe-id i sti. |
| `subscriptions` / `billing` | Abonnement / lisens | mangler | Ingen tabell, ingen felter. |
| `pairing_codes` | Paringskode for senior | mangler | Bør bygges for robust onboarding. |
| `audit_log` / `event_log` | Audit / observability | mangler | Ikke noe sentralt loggsystem. |
| reset/seed-script | Testdata | mangler | Tidligere `seed.sql` fjernet. |

Triggere og funksjoner i Supabase (verifisert):

- `set_updated_at`-trigger på flere tabeller.
- `handle_new_user`: oppretter `profiles` ved `auth.users` insert.
- `is_group_member`, `shares_group_with`, `request_group`,
  `is_primary_contact`, `group_has_members`, `activity_sharing_on`
  (alle SECURITY DEFINER).
- `transfer_primary_contact(p_group, p_new_user)` RPC.
- `accept_group_invitation(p_token)` RPC (oppdaterer nå
  `profiles.role` riktig).
- `create_family_group(p_name)` RPC.
- `enforce_member_role_rules`-trigger på `family_members`.
- Unique partial index: maks én `primary_contact` per gruppe.
- Realtime publication: `help_requests` og `help_responses`.

### 6.2 Forslag til nødvendige felter/endringer

Hvert forslag er merket med fasen det realistisk hører til.

**`family_groups` (nye felter):**

- `subscription_status text` — `nødvendig for MVP` (selv om verdien settes
  manuelt i pilot, må sperreskjermen kunne lese den).
- `billing_admin_user_id uuid references profiles(id)` —
  `nødvendig for funksjonell MVP`.
- `stripe_customer_id text` — `bør vurderes` (kun ved aktiv Stripe-flyt).
- `stripe_subscription_id text` — `bør vurderes`.
- `trial_end timestamptz` — `nødvendig for MVP`.
- `current_period_end timestamptz` — `nødvendig for MVP`.
- `manual_review_reason text` — `bør vurderes` (intern bruk).
- `created_by uuid` (hvem som opprettet gruppen) — `nødvendig for mor-pilot`
  (gir audit-trail uten egen `audit_log`).

**`profiles` (nye felter):**

- `phone text` — finnes allerede. Bør brukes til «Ring [navn]»-knapp.
- `display_name text` — `bør vurderes` (atskilt fra `name` for tilfeller
  der pårørende vil at senior skal se en annen variant — f.eks. «Anne»
  vs «Anne Berg»).
- `deletion_requested_at timestamptz` — `nødvendig for ekstern beta`. Når
  bruker ber om sletting (men ikke umiddelbart slettes — grace-periode).
- `deletion_scheduled_at timestamptz` — `bør vurderes`.
- `consented_terms_at timestamptz` og `consented_privacy_at timestamptz` —
  `nødvendig for ekstern beta`. Eksplisitt samtykke per dokumentversjon.
- `terms_version text` og `privacy_version text` — `nødvendig for ekstern
  beta`. Knyttet til dato-feltene over.

**`help_requests` (nye felter):**

- `acknowledged_at timestamptz` — `nødvendig for MVP` (jf. 5.3).
- `archived_at timestamptz` — `bør vurderes` (jf. 5.3 robust senere).
- `escalation_stopped_at timestamptz` — `nødvendig for MVP`.
- `visible_until timestamptz` — `senere` (alternativ til `archived_at`,
  velg én).

**`calendar_events` (nye felter):**

- `created_by_role text` (senior/relative) — `bør vurderes`. Kan utledes
  fra `created_by` + `profiles.role`, men dyrere å spørre.
- `archived_at timestamptz` — `bør vurderes`.

**`pairing_codes` (helt ny tabell):**

- `id uuid pk`
- `family_group_id uuid references family_groups(id)`
- `code text` (6 siffer, vises kun til pårørende)
- `for_member_role text` (typisk `senior`)
- `expires_at timestamptz` (15 min)
- `consumed_at timestamptz` (NULL til brukt)
- `consumed_by_user_id uuid references profiles(id)` (etter pairing)
- `created_by uuid references profiles(id)` (pårørende som lagde den)
- `created_at timestamptz`
- Status: `nødvendig for funksjonell MVP / robust onboarding`.

**`notification_tokens` (eksisterende):**

- Per-token `disabled_at timestamptz` — `bør vurderes`. Når et token blir
  ugyldig fra Expo Push API, marker det i stedet for å slette (gir
  audit).

**`notification_log` (eksisterende):**

- Hvis det ikke allerede har det: `request_id uuid references
  help_requests(id) on delete set null` for å koble logg til forespørsel.
  `må verifiseres`.

**`subscription_events` (helt ny tabell, for audit):**

- `id uuid pk`
- `family_group_id uuid`
- `event_type text` (Stripe event name)
- `payload jsonb` (rådata fra Stripe webhook)
- `processed_at timestamptz`
- Status: `bør vurderes` for funksjonell MVP, `nødvendig` for betalt
  pilot.

**`event_log` / `audit_log` (helt ny tabell, generisk):**

- `id`
- `actor_user_id`
- `family_group_id`
- `event_type` (string enum)
- `target_id` (uuid, polymorf)
- `metadata jsonb`
- `created_at`
- Status: `bør vurderes` for ekstern beta, `nødvendig` for betalt pilot.

**Konto-/datasletting:**

- En ny RPC `request_account_deletion()` som setter `deletion_requested_at`
  på `profiles`. `nødvendig for ekstern beta`.
- En batch-jobb (cron) som faktisk sletter data 30 dager etter request —
  `bør vurderes` automatisering, eller manuell prosess første år.

### 6.3 RLS-prinsipper

Generelle prinsipper for hva som må gjelde, uavhengig av implementasjon:

- **Senior ser kun sin egen gruppes data.** Allerede dekket via
  `is_group_member`.
- **Pårørende ser kun data for grupper hen er medlem av.** Allerede dekket.
- **Primærkontakt / billing_admin har ikke ubegrenset tilgang.** Lese-/
  skrive-policyer for billing-felter må være eksplisitt avgrenset til
  `billing_admin_user_id = auth.uid()`.
- **Invitasjon må ikke åpne tilgang for feil bruker.** `auth.email()` skal
  matche `invited_email`, slik koden er nå. Cross-check at email er
  case-insensitiv (det er den allerede via `lower(...)`-sjekken).
- **Paringskode må ikke kunne misbrukes.** Innløsningspolicy må kreve at
  koden ikke er utløpt, ikke allerede brukt, og må logge antall mislykkede
  forsøk per IP/enhet (eller bruke en throttle på serversiden — vanskelig
  i ren PostgREST, lettere i Edge Function).
- **Storage/bilder må ikke være offentlig.** Allerede privat bucket med
  signerte 1t-URLs. Kontroller at signerte URLs ikke blir cachet ekstremt
  lenge i CDN/proxy hvis bruker deler skjermbilde.
- **Push-tokens må ikke kunne leses av andre brukere.** RLS:
  `user_id = auth.uid()` for select/insert/update/delete. Allerede dekket.
- **Logging skal ikke eksponere sensitive data.** Server-funksjoner må aldri
  logge meldingsinnhold, e-postadresser eller tokens i `notification_log`
  eller annen logg. Krever en eksplisitt review.
- **Subscription-status må ikke kunne manipuleres fra klient.** UPDATE-
  policy på `family_groups` for abonnementsfelter:
  `auth.role() = 'service_role'`. Klient kan kun lese.
- **Stripe-/betalingsfelter må ikke kunne skrives fra klient.** Som over.
  Stripe webhook (kjørt fra web-portal med service role) er eneste skribent.
- **Appens kjernefunksjoner bør låses ved manglende aktiv lisens.** Dette
  bør håndteres i **service-laget først** (en sentral `assertActiveLicense`-
  sjekk før kritiske handlinger). RLS som backup senere — for å hindre at
  en jailbreaket klient kan omgå service-sjekken. RLS-policy: insert på
  `help_requests`/`calendar_events` betinget av at gruppen har gyldig
  status.
  `bør vurderes` for MVP — i pilot er det grei å stole på service-laget.
- **`family_groups` insert** bør senere strammes så ikke vilkårlige
  autentiserte kan opprette grupper i misbruksøyemed. Mulig løsning:
  registrering på web krever et e-postsamtykke + et minimum betalingssteg
  (selv om det er gratis trial). `bør vurderes` for ekstern beta.

### 6.4 Statusmodell

Foreslår at vi holder enum-modellen avgrenset til faktiske livssyklus-
faser, og lar timestamps beskrive «hva har skjedd». Dette er enklere å
migrere og lese.

**Onboarding / paring:**

- `pending` — invitasjon/paringskode opprettet, ikke brukt.
- `consumed` / `accepted` — bruker har brukt koden.
- `revoked` — pårørende har trukket tilbake.
- `expired` — utløpsdato passert uten bruk.

**Hjelpeforespørsel (`help_requests.status`):**

Behold dagens enum: `CREATED`, `SENT`, `DELIVERED`, `VIEWED`, `ANSWERED`,
`ESCALATED`, `CLOSED`. Suppler med timestamps:

- `delivered_at`, `viewed_at`, `answered_at`, `acknowledged_at` (ny),
  `escalation_stopped_at` (ny), `archived_at` (senere), `closed_at`.

**Varsler (`notification_log`-relatert):**

- `queued`, `sent`, `failed`, `dismissed_by_user`. `må verifiseres` mot
  faktisk schema.

**Aktiviteter / kalender:**

- Ingen status-felt i dag. Kan klare seg uten i MVP. Hvis `archived_at`
  legges til, gir det implisitt skille mellom aktive og historiske.

**Eskalering:**

- `escalation_level: 0` (ingen), `1` (sekundærkontakt varslet), evt. `2`
  (videre, men ikke MVP).
- `escalation_stopped_at` (ny) markerer at eskalering avbrutt — typisk pga.
  svar mottatt.

**Abonnement/lisens (`family_groups.subscription_status`):**

- `trialing` / `active` / `past_due` / `canceled` / `expired` /
  `manual_review`. Implementasjon som tekst eller egen enum-type.
  Anbefales tekst i MVP for å unngå migrering når Stripe legger til ny
  status (f.eks. `incomplete`).

### 6.5 Migreringsplan

Trygg rekkefølge for fremtidige migrasjoner. Hver er additiv og
bakoverkompatibel. Ingen DROP, ingen NOT NULL uten DEFAULT på eksisterende
tabeller.

#### Før mor/senior-pilot

- **Ingen nye migrasjoner kreves teknisk.** Mor-pilot kan kjøres med dagens
  schema.
- Eventuelt: legg til `family_groups.subscription_status text default
  'manual_review'` slik at sperreskjerm allerede er klar (selv om den ikke
  vises for moren din). Lavhengende frukt.

#### Før funksjonell MVP

- `help_requests`: `acknowledged_at`, `escalation_stopped_at` (jf. 5.3).
- `family_groups`: `subscription_status`, `billing_admin_user_id`,
  `trial_end`, `current_period_end`, `created_by`.
- Ny tabell `pairing_codes` (jf. 5.1 robust senere løsning).
- RLS-policyer for de nye feltene/tabellene.
- RPC `pair_with_code(p_code)` for senior-pairing.

#### Før lukket ekstern beta

- `profiles`: `deletion_requested_at`, `consented_terms_at`,
  `consented_privacy_at`, `terms_version`, `privacy_version`.
- Eventuelt `audit_log` / `event_log` (lett versjon — én rad per
  vesentlig handling).
- `family_groups`: stramme insert-policy (krav om verifisert e-post + ett
  konkret kriterium).

#### Før betalt pilot

- `family_groups`: `stripe_customer_id`, `stripe_subscription_id`,
  `manual_review_reason`.
- Ny tabell `subscription_events` (Stripe webhook audit).
- Sletting av forfalte invitasjoner og paringskoder (cron eller scheduled
  function).
- Ny RPC `request_account_deletion()` med 30-dagers grace.

#### Før kommersiell lansering

- Backup-/restore-strategi (Supabase Pro plan, PITR).
- Indeks-optimering på tabeller som vokser raskt (`help_requests`,
  `notification_log`, evt. `event_log`).
- Sletting av tokens markert som ugyldige > 90 dager.
- Eventuelt partisjonering av `notification_log` på tidsserie (kun hvis
  volumet faktisk krever det).

---

## 7. UX-plan for seniorvennlighet

Senior er svakeste bruker, men pårørende er kjøper og administrator. Begge
må kunne bruke appen uten frustrasjon, men terskelen settes etter senior.

### 7.1 Må fikses før mor/senior-pilot

Disse er konkrete utfall av analysen i seksjon 5, sammenstilt for mor-pilot:

- **Ikke auto-dismiss på «Se svar»-banneret.** Senior må trykke en eksplisitt
  «Sett» / «Ferdig»-knapp for å fjerne det. Hvis senior går tilbake, banner
  blir stående. (Jf. 5.3 MVP.)
- **Større sikkerhetsnett rundt logout.** Den «Logg ut»-knappen i headeren
  er nær titler/avstand; vurder å flytte den til settings-seksjonen og
  legge inn en bekreftelsesmelding for senior. Pårørende kan beholde rask
  logout.
- **«Ring familien»-knappen må enten virke eller fjernes for pilot.**
  Anbefaling: kobler `tel:`-URL hvis `phone` er satt på primærkontakt,
  ellers skjul knappen helt. Bedre å ikke ha enn å vise «kommer ennå».
- **Tekstene i hver feiltilstand må leses gjennom én gang til.** Mor-pilot
  er gull til å oppdage om en tekst skremmer eller forvirrer.
- **Aktivitetstoggel skal ha tydelig kontekst.** Hvis senior trykker «Nei»
  på «Del aktivitetsstatus med familien», bør det komme et lite
  bekreftelsesvarsel («Du har skrudd av deling. Familien ser ikke når du
  var aktiv. Du kan slå den på igjen her.») slik at hen ikke lurer på om
  noe gikk galt.

### 7.2 Bør fikses før funksjonell MVP

- **Senior kan legge til avtaler.** Stor knapp på «Min dag» eller hjem.
  (Jf. 5.2 MVP.)
- **Senior har en «Tidligere svar»-skjerm.** Diskret lenke nederst på hjem.
  (Jf. 5.3 MVP.)
- **Sperreskjerm for manglende lisens** finnes og er rolig, uten kjøps-
  knapp eller prisinformasjon.
- **Sentral feilhåndtering for kalender-CRUD** så pårørende ser faktisk
  feil i stedet for stillhet.
- **«Angre»-mulighet etter at senior har trykket «Ferdig»** på et svar
  (kan være et lite «Angre» som vises 5–10 sekunder etter handlingen).
- **Onboarding-veiviser for pårørende** (3–5 skjermer) som forklarer
  konseptet, hvordan invitere, og forventninger til senior.
- **Senior møter en velkomstskjerm første gang** etter pairing/login med en
  enkel forklaring («Du er nå koblet til [familienavn]. Trykk «Spør
  familien» når du lurer på noe.»).

### 7.3 Bør fikses før betalt pilot

- **«Slett konto / mine data»** i settings, med 30-dagers grace.
- **Personvernerklæring lenket fra både senior- og pårørende-personvern-
  skjerm.**
- **Brukervilkår lenket fra sign-in.**
- **Endre primærkontakt** i settings (allerede mulig via RPC, men UI-en bør
  være tydeligere — særlig for pårørende som overtar).
- **Bytte e-postadresse / oppdatere navn** for pårørende.
- **Senior kan bytte primærkontakt** — eller skal det bare være pårørende
  som kan? Produktbeslutning.
- **Polert sperreskjerm** med tydelig kontaktpunkt.

### 7.4 Kan vente

- Videochat (5.5 — utsatt).
- Recurring events i kalender.
- Adminpanel.
- A/B-testing.
- Dark mode.
- Lokalisering utover norsk.
- Endring av designsystem (Nunito er på plass og fungerer).

### 7.5 Tekst-/språkprinsipper

Generelle:

- **«Du» direkte adressering**, både til senior og pårørende, men i ulik tone.
  Senior får varmere, kortere setninger. Pårørende får mer informasjon.
- **Ingen teknisk sjargong** noen steder — ingen «session», «token», «API»,
  «Supabase», «server», «nettverksfeil», «backend».
- **Ingen alarmrødt** med mindre noe faktisk krever umiddelbar handling.
- **Kort, konkret, vennlig.** Maks 2 linjer for feiltekster.
- **Ikke moraliserende.** Ingen «Du burde» / «Du må».
- **Tilgivende.** «Vi prøver igjen om litt», ikke «Du gjorde noe galt».

Konkrete forslag der eksisterende tekst kan strammes:

- **OTP-kode (vellykket sending):** «Vi sendte deg en kode på e-post» (kort,
  klar). Nåværende «Skriv inn koden» er bra.
- **Feil kode:** «Koden stemmer ikke. Sjekk e-posten din og prøv igjen.»
  Ikke «Koden er feil eller utløpt» (forvirrer to tilstander).
- **Utløpt kode:** «Denne koden er for gammel. Trykk «Send ny kode» under.»
- **Rate limit:** «Vi sendte allerede en kode nå. Vent et minutt før du
  prøver igjen.» (Mykere enn «for mange e-poster».)
- **Manglende lisens (senior):** «Snakk med [pårørendes navn] for å bruke
  appen.» (Hvis vi vet navnet.)
- **Manglende lisens (pårørende):** «Familieadministratoren må fornye
  abonnementet for at du kan bruke appen.»
- **Senior-paring (ny tekst, jf. 5.1):** «Skriv inn de 6 sifrene du fikk
  fra [navn]».
- **Invitasjon, ny bruker:** «[Pårørendes navn] har invitert deg til
  familien [familienavn]. Trykk for å bli med.»
- **Ferdig/Godkjent/Sett (kommer fra 5.3):** «Sett — flott!» — kort, varmt,
  ingen «Lagret» eller «Suksess».
- **Besvart men synlig i historikk:** «Tidligere svar» (ikke «Historikk» —
  kald), eller «Det familien har svart deg».
- **Treg eller utilgjengelig Supabase:** «Nettet er tregt akkurat nå. Vi
  prøver på nytt om litt.» Aldri «Tjenesten er utilgjengelig».
- **Prøv igjen senere:** «Vi prøver igjen automatisk. Du trenger ikke gjøre
  noe.» — tilgivende, ikke skremmende.

Senior-spesifikt:

- Bruk fornavn der det er naturlig («Mor», «du»).
- Bruk emoji sparsomt, men en eller to skaper varme («🙏», «👋»).
- Bruk «familie» der mulig, ikke «kontakter» eller «medlemmer».
- Bruk «spørre» og «svare», ikke «sende» og «motta».

Pårørende-spesifikt:

- Klarere på handlinger («Send invitasjon», «Trekk tilbake», «Slå av push»).
- Mer informasjon om hva som skjer i bakgrunnen («Det kan ta opptil 30
  sekunder før koden kommer fram»).
- Knapp-tekster i imperativ («Send», «Lagre», «Slett»).

---

## 8. Sikkerhet, personvern, GDPR og plattformrisiko

Dette er en produkt- og teknisk vurdering. Det er ikke advokatråd. Punkter
markert som juridiske krav må valideres med en GDPR-ekspert eller advokat
før kommersiell lansering, særlig fordi målgruppen kan klassifiseres som
sårbar.

**Persondata appen behandler (kartlagt fra kode/migrasjoner):**

- E-postadresse (kontoidentitet).
- Navn (visningsnavn, vises for andre i familien).
- Telefonnummer (valgfritt, for «Ring»-knapp).
- App-rolle (senior / pårørende).
- Familietilhørighet (hvem er i hvilken gruppe).
- Innholdet i hjelpeforespørsler (tekst + bilde — kan være sensitiv).
- Innholdet i svar (tekst).
- Kalenderhendelser (kan inneholde helse-/legetimer).
- Aktivitetsstatus («sist aktiv» = indikasjon på bevegelse / liv).
- Push-tokens.
- IP-adresser (i Supabase-logger, ikke i appens egen tabell).
- Auth-events (last_sign_in_at, sign_in_count — i `auth.users`).

**Vurdering av dataenes karakter:**

- Bilder fra senior kan dokumentere medisinske dosetter, brev fra fastlege,
  banktransaksjoner, svindel-SMS-er, eller andre sårbare situasjoner.
  Dataene er i praksis **omsorgsrelaterte og potensielt helse-relaterte**,
  selv om appen ikke er en helsetjeneste. Bør behandles som **særlig
  beskyttelsesverdig** i designet, selv om det formelt ikke er helsedata
  under GDPR Art. 9.
- «Sist aktiv» kan indirekte avsløre rutiner, søvn, frafall. Aktivitets-
  deling-toggelen er korrekt designet, men må tydelig formidles til senior.
- Aldersgruppen (~75–90) er **i praksis sårbar** (digital sårbarhet,
  fysisk sårbarhet, samtykkekompetanse). Det skjerper kravet til mykt
  språk og enkle valg, og kan utløse strengere personvernkrav.

**Dataminimering — sjekkliste mot kode:**

- Ingen unødvendige tracking-events, ingen ekstern analyse-leverandør i
  koden i dag. Bra.
- E-post lagres i klartekst — krevd for innlogging.
- Bilder lagres som filer, ikke base64 i databasen. Bra.
- Push-tokens lagres i klartekst — krevd for Expo Push API.
- `auth.users` lagrer mer enn nødvendig for spesialtilfeller (siste
  innlogging, sign-in-count). Dette kontrolleres av Supabase, ikke av oss.

**Samtykke — analyse:**

- Aktivitetsdeling har egen toggel i appen og dedikert RLS-policy.
- Personvern-tekstene finnes for senior og pårørende, men **inneholder ikke
  versjon eller tidsstempel for samtykke**. For en kommersiell app må
  samtykke logges.
- Det er ingen separat samtykke til behandling av sensitiv informasjon
  (bilder/meldinger om helse, økonomi, svindel). Dette bør avklares.
- Senior gir samtykke selv (har samtykkekompetanse i de fleste tilfeller),
  men hvis senior har redusert kompetanse, må pårørende ha rolle.
  **Det er en åpen produktrisiko.**

**Databehandlere — kartlegging:**

| Leverandør | Hva | Status |
| --- | --- | --- |
| Supabase | Database, auth, storage, edge functions | Databehandleravtale må signeres før betalt pilot. Region (EU/US) `må verifiseres`. |
| Resend | Transactional e-post | Databehandleravtale må signeres. Resend er hostet i USA — krever SCC eller annen overføringshjemmel. |
| GitHub | Kildekode + GitHub Pages | Ikke databehandler for kjernedata, men host for klientkode. Mindre kritisk. |
| Expo / EAS | App-build, Expo Push API | Databehandler for push-tokens. Avtale finnes som standard EAS-vilkår. |
| Apple / Google | App-distribusjon (senere) | Avtale via Developer Program. |
| Stripe | Betaling (senere) | Avtale via Stripe Connect / Standard. |
| Cloudflare | DNS for `familieknappen.app` | Behandler ikke persondata for appen i seg selv. Mindre kritisk. |

### 8.1 Må være på plass før intern mor/senior-pilot

- Anon-nøkkel kun i frontend, ingen service role i klient. **Allerede dekket.**
- `.env` aldri committet. **Allerede dekket.**
- Resend API-nøkkel kun i Supabase Dashboard, aldri i repo. **Forutsetter
  manuell konfig — `må verifiseres` at den ikke er i et secret eller env
  som logges feil.**
- Sperreskjerm fra «Ingen aktiv lisens» er ufarlig for mor-pilot fordi mor
  settes til `manual_review` eller `active`.
- Push-tekster verifisert å ikke inneholde meldingsinnhold på låseskjerm.
- Kort intern dokument om hva som lagres, hvorfor, og hva som slettes hvis
  mor sier nei. Trenger ikke være offentlig.

### 8.2 Må være på plass før ekstern/lukket beta

- **Personvernerklæring** (utkast, ikke nødvendigvis advokat-gjennomgått
  ennå). Tilgjengelig fra `familieknappen.app` og fra sign-in i mobilappen
  som lenke.
- **Brukervilkår** (utkast). Samme tilgjengelighet.
- **Slett konto / mine data**-funksjon i appen.
- **Audit-logg av sletting** (når, hvem, hvorfor) — internt, ikke
  brukerrettet.
- **Sentral feillogging** (Sentry e.l.) med filter mot sensitive data.
- **Krasjbeskyttelse** (Error Boundaries i React Native) som unngår hvit
  skjerm.
- **Tydelig samtykke til behandling av bilder/meldinger** ved første
  innlogging eller pairing. Logges med tidsstempel.
- **Versjonsmerkede personvern-/vilkår-aksepter** (`consented_*_at`-felter
  per `profiles`).
- **DPIA-vurdering startet** (Data Protection Impact Assessment).
  Vurderingen kan være kort i utkast, men må eksistere.

### 8.3 Må være på plass før betalt pilot

- **Databehandleravtaler signert** med Supabase, Resend, Expo, Stripe.
- **Personvernerklæring og brukervilkår advokat-gjennomgått**.
- **DPIA fullført** og dokumentert.
- **Backup/restore-strategi**: Supabase Pro-plan eller egne dumps. PITR
  aktivert.
- **Incident response-plan** (hva gjør vi hvis databasen lekker, hvis en
  konto er hacket, hvis Resend lekker e-posten med kode).
- **GDPR-roller avklart**: hvem er behandlingsansvarlig (Familieknappen /
  ah-digital), hvem er databehandler (Supabase, Resend).
- **Data-eksport-funksjon** (GDPR Art. 20 portabilitet).
- **Logging-policy**: hva logges, hvor lenge, hvem kan se. Dokumentert
  internt.
- **Region-bekreftelse**: at Supabase- og Resend-prosjekt er i EU eller at
  overføring til USA er hjemlet med SCC.
- **Avklaring av aldersgrenser**: senior kan ikke være under 18 (åpenbart),
  pårørende må være myndig for å betale.

### 8.4 Må være på plass før kommersiell lansering

- Alt fra 8.3, **pluss**:
- **ROPA** (Records of Processing Activities) ferdig dokumentert.
- **Compliance-review** av all kode for utilsiktet lagring av sensitive
  data i logger.
- **App Store-/Play Store-tilstedeværelse**, med riktige metadata om
  personvern (Privacy Nutrition Labels på Apple, Data Safety på Google
  Play).
- **Strategi for App Store-spørsmål om ekstern abonnementshåndtering** —
  uavklart juridisk risiko (jf. 5.6).
- **Sentralisert supportkontakt** i appen («Trenger du hjelp?» som åpner
  e-postutkast eller kontaktskjema).
- **Bruker-/familievask** ved nedleggelse av abonnement (data slettes etter
  N dager med tydelig varsling først).
- **Backup-test** gjennomført minst én gang (restore til en test-konto).
- **Beredskap for tap av leverandør** (hva gjør vi hvis Supabase utløper,
  Resend stenges, Expo endrer push-prising).
- **Penetrasjons-/sikkerhetstest** av RLS-policyer og auth-flyt. Kan være
  egen review, ikke nødvendigvis ekstern.

### 8.5 Åpne juridiske/produktmessige avklaringer

Markert tydelig som **produkt-/teknisk risikovurdering, ikke advokatråd**:

- **App Store-strategi for ekstern abonnementshåndtering.** Apple kan
  klassifisere appen som «Reader app» eller «Existing Account /
  External Subscription Management». Begge har egne regler. Konkret
  formulering av sperreskjermen og fravær av kjøps-/pris-lenker er
  kritisk. **Må valideres med App Store-erfaren rådgiver før iOS-
  innsending.**
- **Klassifisering av appen som «helsetjeneste» eller ikke.** Familieknappen
  hjelper med vurdering av meldinger, ikke medisinsk diagnose. Bør likevel
  klargjøres med en formulering som «Familieknappen er ikke en
  helsetjeneste og erstatter ikke profesjonell rådgivning». Allerede
  tilstede i tekstene; må verifiseres formelt.
- **Region for Supabase-prosjekt.** Hvis prosjektet `vjddppqsbrafcywwjnpf`
  ligger i en US-region, kreves overføringshjemmel (SCC). EU-region er
  enklere. `må verifiseres`.
- **Region for Resend-prosjekt.** Resend er primært USA-basert.
  Overføringshjemmel kreves.
- **Senior-samtykke ved redusert kompetanse.** Hvis senior har demens eller
  redusert samtykkekompetanse, hvem signerer? Pårørende? Verge? Dette må
  defineres juridisk for målgruppen.
- **Hvor lenge holdes data etter sletting / oppsigelse.** Vanlig praksis:
  30 dager grace + 90 dager backup. Krever konkret avklaring.
- **Logging på server**: hvor lenge holdes serverloggene (Supabase egne,
  vår egen `notification_log`), og inneholder de personidentifiserbare
  data?
- **Push-meldingens innhold på låseskjerm**: hvor lite avslørende kan vi
  være uten å miste nytte? F.eks. «Mor ber om hjelp» avslører at det
  finnes en mor i appen — er det greit?
- **Bildelagring**: hvor lenge oppbevares bilder etter forespørsel er
  besvart/arkivert? Skal de auto-slettes etter N dager?

---

## 9. Funksjonstest med seniorbrukere — konsekvenser for MVP og fullføringsplan

To seniorbrukere (eldre kvinne og hennes mann) testet appen i en uformell
første runde. Tilbakemeldingene viser at grunnideen treffer, men at flere
sentrale seniorflyter fortsatt er for vanskelige eller uklare. Punktene
under behandles ikke som «nice to have», men som produktinnsikter som
påvirker prioritering, MVP-grense og fullføringsplan. Innsiktene ligger
før seksjon 10–14 (faseplan, observability, leveransesteg, åpne
beslutninger, neste prompt) slik at faseplanen kan bygges på et oppdatert
grunnlag.

### 9.1 Funn fra testen og konsekvenser

**9.1.1 Send-knappen i meldingsflyt er ikke tydelig nok**

- *Observasjon:* testbruker fant ikke ut hvordan meldingen skulle sendes.
  Send-handlingen oppleves som en del av skriveflaten, ikke som en egen,
  fysisk knapp.
- *Konsekvens:* kjerneflyten «Spør familien» feiler i første brukstest.
  Dette er **kritisk senior-UX-feil**, ikke en produktforbedring.
- *Krav:*
  - Send-knapp skal være stor, visuelt adskilt fra skrivefeltet, og helst
    fast plassert nederst på skjermen («fast bottom action»).
  - Tekst på knappen: «SEND TIL FAMILIEN», ikke kun ikon.
  - Etter sending: full-skjerm-bekreftelse «Meldingen er sendt» med rolig
    farge, ikke en liten toast i toppen.
  - To-trinns-bekreftelse (forhåndsvis bilde + tekst, deretter «Send»)
    bør vurderes — gir senior tid til å forstå hva som faktisk skjer.
  - Tale-til-tekst (diktering) er **ikke MVP**. Kan komme senere som
    tilgjengelighetsfunksjon.
- *Fase:* **må fikses før ny mor-pilot.**

**9.1.2 Skjermbilde må ikke være nødvendig**

- *Observasjon:* testbrukerne klarer ikke å ta skjermbilder på sin egen
  telefon. Dagens implisitte forventning — «ta screenshot av SMS-en og
  send» — er feilaktig om målgruppens kompetanse.
- *Konsekvens:* hele produktløftet «Spør familien» rakner hvis senior
  ikke kan sende inn det de er usikre på. Dette er en **alvorlig
  senior-UX-risiko** som må ned i prioriteringene før funksjonell MVP.
- *Krav:*
  - Kamera er hovedløsningen i appen («Ta bilde av meldingen / brevet /
    skjermen»). Skjermbilde er ikke nødvendig.
  - Senior kan også få hjelp av pårørende til oppsett.
  - Native share-extension («Del til Familieknappen» fra SMS-/e-post-/
    nettleser-apper) krever native moduler og custom dev client. Det
    finnes ikke i koden i dag. `må verifiseres` om dette er teknisk
    realistisk innenfor dagens stack (Expo, EAS).
- *Fase:* Kamera-basert flyt **må fungere før mor-pilot**. Native share-
  extension er **bør vente til funksjonell MVP eller ekstern beta**.
- *Sekundær løsning hvis native share er for komplekst:* en enkel
  innsendingsmekanisme via e-postadresse (f.eks. `min-familie-NN@
  familieknappen.app`) som mater inn `help_requests`. Det krever Edge
  Function + e-postmottak (inbound) og kan være billig å bygge. `må
  verifiseres` om Resend støtter inbound, eller om vi trenger en annen
  leverandør.

**9.1.3 Ringekjede ved manglende svar**

- *Observasjon (induksjon, ikke fra testen direkte):* ved nødssituasjoner
  bør appen prøve flere pårørende, ikke bare primærkontakt. Hvis ingen
  svarer skal den fortsette til neste, og eventuelt starte på nytt.
- *Konsekvens:* full automatisk ringekjede med VoIP/CallKit/
  ConnectionService er **plattformteknisk krevende** og ligger trolig på
  V2/premium. Men en **lettvektsutgave** kan bygges tidligere.
- *Trinnvis modell:*
  - **MVP (mor-pilot):** stor «Ring familien»-knapp som ringer
    primærkontakt via `tel:`-URL. Hvis primærkontakt ikke svarer, viser
    appen en stor knapp «Prøv neste» som ringer sekundærkontakt. Senior
    velger selv å gå videre.
  - **Funksjonell MVP:** «Ring familien» varsler **alle** pårørende
    samtidig med push («[Mor] prøver å nå deg»). Første som svarer i
    appen tar ansvaret. `tel:`-ring til primær parallelt.
  - **Beta/V2:** automatisk eskalering med tidsgrenser (2 minutter per
    forsøk), starter på nytt etter full runde.
  - **Premium:** full VoIP-anropsflyt med innkommende anrop på låseskjerm.
- *Fase:* MVP-nivået («Ring primær» + «Prøv neste») **må fikses før
  mor-pilot** for at «Ring familien»-knappen skal kunne være på i det
  hele tatt. Hvis ikke, må knappen skjules i pilot.

**9.1.4 Senior kan legge til aktiviteter i kalender**

- Allerede dekket i 5.2. Funksjonstesten bekrefter at dette er reelt
  ønsket. Behold som **funksjonell MVP**, ikke blokker for mor-pilot.
- Stemmebasert kalenderregistrering: **senere V2/premium**,
  tilgjengelighetsfunksjon.

**9.1.5 Videresending av meldinger og e-post til Familieknappen**

- Koblet til 9.1.2. **Bør vente** til funksjonell MVP eller ekstern beta.
- *Vurdering:*
  - Native share-extension: krever native moduler. **Bør utsettes** til
    teknisk avklaring av om Expo-stacken kan levere det uten å eject.
  - E-post-innsending (inbound): kan være enklere første steg. Krever
    Edge Function + leverandør.
- *Fase:* **ekstern beta**, ikke MVP. Mor-pilot dekkes av kamera-flyt.

**9.1.6 Stemmestyrte handlinger**

- *Vurdering:* ikke MVP-krav. Tilgjengelighetsfunksjon for **V2 eller
  premium**.
- Første steg kan være diktering i meldingsfelt (iOS/Android har dette
  innebygd via systemtastatur — gratis, krever ingen ekstra integrasjon).
  Det er sannsynligvis allerede tilgjengelig i dagens TextInput. `må
  verifiseres` at det fungerer på testenhetene.
- Full stemmeassistent («Ring Anne», «Spør familien») krever native
  speech recognition og bør **utsettes til premium**.

**9.1.7 «Min familie» som hovedområde**

- *Ny produktretning:* appen skal også være en varm, enkel flate der
  familien er samlet, ikke bare en nød-/spørreknapp.
- *Foreslått struktur for seniors hjem (4 hovedvalg, fortsatt under 5):*
  - Spør familien
  - Min familie  *(ny — kontaktkort)*
  - Min dag (kalender)
  - Ring familien / Hjelp meg
- *«Min familie»-skjerm:* store kontaktkort per pårørende med bilde, navn,
  ring-knapp, melding-knapp. Eventuelt en «Spør om hjelp»-knapp per
  kontakt.
- *Konsekvens for datamodell:* `profiles` må ha `phone` (finnes) og en
  `avatar_url` (`mangler`). Avatarer kan legges i Supabase Storage
  privatbucket «avatars», med RLS basert på gruppemedlemskap.
- *Fase:* «Min familie» bør **inn senest i funksjonell MVP**. Det styrker
  retensjon og gir senior en grunn til å åpne appen også når ingenting
  er galt. Det er **ikke nødvendig for mor-pilot**, men koblingskortene
  «Ring [navn]» og «Send melding til [navn]» bør i det minste finnes
  som enkel kontaktliste fra mor-pilot.

**9.1.8 Bildearkiv / bilder under hver pårørende**

- *Vurdering:* sterk **beta-/premiumfunksjon**, ikke MVP. Blokkerer ikke
  mor-pilot.
- *Tre mulige retninger* (velg én før beta, ikke alle):
  - Bilder per kontakt (knyttet til en konkret pårørende).
  - Felles «Bilder fra familien»-stream (enklere modell, mindre
    granulært).
  - Ukentlig bildebrev (push fra pårørende, kuratert).
- *Datamodell:* ny tabell `family_photos` med `family_group_id`,
  `uploaded_by`, `storage_path`, `caption`, `visible_to_role`, plus
  ny privat storage bucket. **Ikke bygges nå.**
- *Personvernrisiko:* bilder av barn / barnebarn er sensitive. Krever
  klar samtykkemodell — særlig hvis pårørende sender bilder av en
  tredjepart (f.eks. barnebarn) til senior via appen. **Må vurderes
  juridisk før beta.**
- *Fase:* **ekstern beta eller betalt pilot.** Ikke MVP.

**9.1.9 Skritteller / bevegelsesstatus**

- *Vurdering:* potensielt verdifull trygghetsfunksjon, men **høy
  personvernrisiko** og krever native moduler (HealthKit på iOS,
  Health Connect / Activity Recognition på Android).
- *Tre løsningsnivåer:*
  - **A. Enkel dagsstatus:** «Bevegelse registrert i dag» / «Lite
    bevegelse registrert». Lavest fidelity, minst inntrengende. Krever
    tilgang til Activity Recognition på Android / Motion på iOS.
  - **B. Aktivitetsnivå (lav/normal/god):** krever litt mer data, men ikke
    eksakte tall. Mellomnivå.
  - **C. Varsel ved uvanlig inaktivitet:** krever historikk, baseline,
    anomalideteksjon. Mest verdifullt, men også mest invasivt.
- *Personvernkrav (utdrag, må juridisk valideres):*
  - Senior må samtykke eksplisitt, ikke som en del av generelle vilkår.
  - Pårørende ser **ikke** posisjon som standard. Helst aldri.
  - Detaljerte helsedata vises ikke i første versjon (kun aggregert
    status).
  - Senior kan slå av når som helst med stor knapp.
  - Tekst skal være rolig og verdig («Bevegelse registrert i dag»), ikke
    «overvåkning».
- *Fase:* **ikke mor-pilot, ikke funksjonell MVP.** Tidligst **betalt
  pilot**, og må kobles til GDPR-/DPIA-arbeidet i 8.3. Bevegelses-/
  aktivitetsdata kan klassifiseres som «særlige kategorier» (GDPR Art. 9)
  hvis tolket som helsedata — **må verifiseres** med advokat.
- *Stack-vurdering:* Expo har `expo-sensors` (pedometer) som dekker
  Nivå A på Android og iOS. Det er minst inngripende og krever ikke
  HealthKit-/Health Connect-tilgang. **Anbefalt første nivå** når denne
  funksjonen aktiveres senere.

**9.1.10 Rolig status til pårørende**

- Kobler 9.1.9 med eksisterende `activity_status` («sist aktiv»,
  «app åpnet i dag») og hjelpeforespørsel-historikk.
- *Eksempler på meldinger (foreslått):*
  - «Alt ser rolig ut i dag»
  - «Mamma har vært i bevegelse»
  - «Ingen nye spørsmål»
  - «Mamma har spurt om hjelp én gang i dag»
  - «Lite aktivitet registrert — kanskje verdt å ringe»
- *Vurdering av leveranse-modus:*
  - Daglig oppsummering via push eller e-post.
  - Live status i pårørende-dashboard.
  - Hendelsesvarsler (ingen eget oppsummerings-lag).
- *Anbefaling:* hold seg til **pårørende-dashboard** med rolig status-
  tekst som første nivå. Daglige oppsummeringer er enkle å misforstå
  («Hvorfor har jeg ikke fått varsel?»). **Funksjonell MVP** kan ha en
  enkel «status-stripe» øverst i dashboard. Mer avanserte varsler er
  **beta/V2**.
- *Tekstprinsipp:* statusmeldinger må aldri være konkluderende
  («utrygt», «svindel»). De skal være observasjoner pårørende selv kan
  reagere på.

**9.1.11 Samtykke, verdighet og personvern**

- Alle funksjoner i 9.1.7–9.1.10 (Min familie, bildearkiv, skritteller,
  rolig status) må vurderes opp mot:
  - samtykke (per funksjon, per versjon),
  - verdighet (senior skal ikke føle seg overvåket),
  - personvern (dataminimering),
  - rolle mellom senior og pårørende (asymmetri),
  - fare for opplevd overvåkning.
- *Konkret:* selv om pårørende er kjøper og admin, eier senior sine egne
  data. Pårørende kan ikke skru på skritteller for senior uten seniors
  eksplisitte samtykke i seniors eget UI.
- *Risiko:* hvis senior har redusert samtykkekompetanse, og pårørende
  ønsker «overvåkning av trygghetsgrunner», havner appen i en
  juridisk/etisk gråsone. **Må juridisk avklares før beta.**
- Dette er produkt- og risikovurdering, **ikke advokatråd**.

### 9.2 Justeringer av tidligere seksjoner som følger av funksjonstesten

Funksjonstesten endrer noen vurderinger i seksjon 1–4 og 5–8. Endringene
gjøres ikke i denne runden (jf. arbeidsregelen), men listes her:

- **Seksjon 1 (kort oppsummering):** legg til at første brukstest viser
  at kjerneflyten «Spør familien» har en uoppdaget send-knapp-feil. Det
  hever risikobildet før mor-pilot.
- **Seksjon 3 (funksjonsstatus):**
  - «Meldingsflyt for senior» nedgraderes fra `fungerer trolig` til
    **`delvis utilstrekkelig — kritisk UX-feil bekreftet i test`**.
  - «Bildeopplasting» beholdes som `fungerer trolig` mht. teknikk, men
    legg til merknad: **`forutsetter at senior klarer kamera, ikke
    skjermbilde`**.
- **Seksjon 4 (mangler):**
  - Legg til **«Tydelig send-knapp + bekreftelsesskjerm»** som teknisk
    mangel før mor-pilot.
  - Legg til **«Kamera-basert spør-flyt verifisert med faktisk senior»**
    som produkt-mangel.
  - Legg til **«Min familie-flate (kontaktkort med ring/melding)»** som
    produkt-retning før funksjonell MVP.
  - Legg til **«Ringekjede — minst manuell `Prøv neste`»** som
    funksjonell mangel.
  - Legg til **«Inbound-deling (share extension eller e-post-innsending)»**
    som beta-mangel.
  - Legg til **«Bildearkiv per kontakt eller felles»** som beta/premium-
    mulighet.
  - Legg til **«Skritteller / bevegelsesstatus»** som betalt pilot-
    mulighet, med eksplisitt personvernrisiko.
- **Seksjon 5.1 (onboarding):** uendret. Funksjonstesten bekrefter at
  senior trenger fysisk hjelp første gang.
- **Seksjon 5.2 (senior legger til aktiviteter):** bekreftet relevant.
- **Seksjon 5.3 (banner / svar-historikk):** uendret.
- **Seksjon 5.5 (videochat):** funksjonstesten styrker konklusjonen om
  utsettelse. Telefon/ringekjede er mer realistisk MVP-retning.
- **Seksjon 7.5 (språk):** legg til at send-bekreftelse skal være stor og
  rolig («Meldingen er sendt»), ikke en liten toast.
- **Seksjon 8.5 (åpne juridiske avklaringer):** legg til skritteller/
  bevegelsesdata som spesifikt risikopunkt (mulig Art. 9-data).

### 9.3 Hva som blokkerer hva — sammenfattet

**Blokkerer mor-pilot (må fikses):**

- Tydelig send-knapp i meldingsflyt (9.1.1).
- Bekreftelsesskjerm etter sending (9.1.1).
- Kamera-basert spør-flyt verifisert som første- alternativet, ikke
  skjermbilde (9.1.2).
- «Ring familien»-knapp må enten virke (tel:-URL til primær +
  «Prøv neste»-knapp) eller skjules (9.1.3 / 5.5).
- Banneret «Se svar» må ikke auto-dismisses (jf. 5.3).
- Senior-tekster justeres til kort, konkret, trygg tone (jf. 7.1).
- Sperreskjerm for manglende lisens må eksistere, men mor settes til
  `manual_review` / `active` (jf. 5.6) — ikke blokkerende, men bør være
  på plass for trygghet.

**Blokkerer funksjonell MVP (må prioriteres senere):**

- Pårørende-first onboarding med paringskode + pre-account på web (jf.
  5.1).
- «Min familie»-flate med kontaktkort (9.1.7) — minst en lettversjon.
- Senior kan legge til aktivitet i kalender (jf. 5.2 / 9.1.4).
- Ringekjede «varsle alle» eller «Prøv neste» med push-varsling (9.1.3
  funksjonell-MVP-nivå).
- Eksplisitt «Sett»-knapp og «Tidligere svar»-historikk (jf. 5.3).
- Sentral feilhåndtering for kalender-CRUD og andre store flyter (jf. 7.2).
- Subscription_status + sperreskjerm i produktivt drift (jf. 5.6).
- Database Webhooks og pg_cron faktisk verifisert i konfig (jf. 5.4).

**Bør utsettes til ekstern beta:**

- Native share-extension eller inbound e-post-innsending (9.1.5).
- Bildearkiv / bilder per kontakt (9.1.8) — én av tre modeller velges.
- Pårørende-dashboard med rolig status-stripe (9.1.10 MVP-nivå).
- Konto-/datasletting med 30-dagers grace (jf. 8.2).
- Versjonsmerket samtykke (`consented_*_at`) (jf. 8.2).
- Error Boundaries + Sentry e.l. observability (jf. 8.2).

**Bør utsettes til betalt pilot:**

- Skritteller / bevegelsesstatus, første nivå «Bevegelse registrert i
  dag» via `expo-sensors` (9.1.9).
- Mer avanserte rolige statusmeldinger til pårørende (9.1.10
  funksjonell-pluss-nivå).
- Eskalerende ringekjede med tidsgrenser (9.1.3 beta-nivå).
- Databehandleravtaler og DPIA fullført (jf. 8.3).

**Bør utsettes til V2 / premium / kommersiell:**

- Full automatisk ringekjede med VoIP / innkommende anrop (9.1.3
  premium-nivå).
- Stemmestyrte handlinger (full assistent) (9.1.6).
- Stemmebasert kalenderregistrering.
- Videochat (jf. 5.5).
- Ukentlig bildebrev / kuratert bildestream.
- Anomalideteksjon på inaktivitet (9.1.9 nivå C).
- Lokalisering utover norsk.
- Dark mode.

### 9.4 Konsekvenser for tidslinje, kompleksitet og risiko

- **Tidslinje for mor-pilot:** funksjonstesten flytter mor-pilot litt
  fram i tid, fordi send-knapp / bekreftelse / kamera-flyt / ringekjede-
  minimum må fikses først. Det er likevel **lite arbeid** sammenlignet
  med funksjonell-MVP-leveransene — sannsynligvis dager, ikke uker, hvis
  ingen overraskelser dukker opp i Expo-/RN-stacken.
- **Kompleksitet i funksjonell MVP:** øker noe pga. «Min familie»-flaten
  og ringekjede-«varsle alle»-løsning. «Min familie» krever avatar-
  storage + RLS. Ikke en arkitekturell omveltning, men ny flate som må
  designes og bygges.
- **Kompleksitet i beta:** native share-extension eller inbound e-post er
  betydelig kompleksitet. Hvis vi går for e-post: krever Edge Function +
  leverandørvalg + sikkerhetsvurdering rundt inbound. Hvis vi går for
  share-extension: krever native moduler og potensielt utløp av Expo
  Managed Workflow. **Må verifiseres** med en teknisk forundersøkelse
  før vi velger.
- **Kompleksitet i betalt pilot:** skritteller hever GDPR-risiko og kan
  utløse Art. 9-vurdering (helsedata). Det vil sannsynligvis kreve
  ekstern advokat-gjennomgang før lansering. Det er en reell
  compliance-kostnad som må regnes inn.
- **Risiko ved å gjøre alt på en gang:** høy. Hold mor-pilot avgrenset
  til de seks–syv punktene i 9.3 (mor-pilot-blokkere). Ikke bland inn
  «Min familie», kalender-redigering for senior, eller skritteller i
  samme runde.

### 9.5 Oppdatert go/no-go-sjekkliste per fase

Sjekklistene er produkt-/teknisk vurdering, ikke advokatråd.

**Go/no-go: Ny mor-pilot (intern, én senior + én pårørende)**

Tekniske krav:

- [ ] Send-knapp i meldingsflyt er stor, adskilt fra skrivefeltet, og har
      tekst «SEND TIL FAMILIEN».
- [ ] Etter sending vises en stor bekreftelsesskjerm «Meldingen er sendt.
      Vent på svar før du gjør noe.»
- [ ] Spør-familien-flyten bruker kamera som hovedalternativ. Skjermbilde
      er ikke et krav.
- [ ] «Ring familien»-knappen virker (ringer primærkontakt via tel:URL)
      OG har en «Prøv neste»-knapp som ringer sekundærkontakt. ELLER
      knappen er skjult i pilot.
- [ ] Banner «Se svar» auto-dismisses ikke; senior trykker «Sett».
- [ ] Senior-tekster er gjennomgått: korte, konkrete, ikke skremmende.
- [ ] OTP-kode på 6 siffer fungerer ende-til-ende på fersk APK med Resend
      SMTP.
- [ ] Push-varsler fungerer ende-til-ende (forespørsel → pårørende, svar
      → senior).
- [ ] Mor er satt opp som `manual_review` i `family_groups` (når feltet
      finnes) eller pilot kjører uten lisens-sjekk.

Produktkrav:

- [ ] Mor og en pårørende er fysisk koblet opp med hjelp.
- [ ] Pårørende vet at dette er pilot og at det kan oppstå feil.
- [ ] Det finnes en kanal for å rapportere problemer (telefonen din,
      e-post).

GDPR/sikkerhet:

- [ ] Ingen secrets i repo.
- [ ] Bilder lagres i privat bucket med signerte URLs.
- [ ] Logger inneholder ikke meldingsinnhold.

**Go/no-go: Funksjonell MVP (lukket teknisk-MVP, ~5–10 familier)**

Tekniske krav:

- [ ] Pårørende-first onboarding på web ELLER paringskode i app fungerer
      ende-til-ende.
- [ ] «Min familie»-flate finnes (minst kontaktliste, ideelt
      kontaktkort).
- [ ] Senior kan legge til kalenderaktivitet med to felt (tittel + tid).
- [ ] Ringekjede på «varsle alle»-nivå: push til alle pårørende
      samtidig, første som åpner forespørselen får ansvaret.
- [ ] Eksplisitt «Sett»-knapp og «Tidligere svar»-historikk for senior.
- [ ] Sentral feilhåndtering for kalender-CRUD og send-flyt (ingen stille
      feil).
- [ ] `subscription_status` på `family_groups`, sperreskjerm uten kjøps-
      UI fungerer.
- [ ] Database Webhooks for `send-push` verifisert i Supabase Dashboard.
- [ ] pg_cron for `escalate` aktiv ELLER eskalering eksplisitt slått av.

Produktkrav:

- [ ] Onboarding under 10 minutter for pårørende uten teknisk hjelp.
- [ ] Senior under 2 minutter til første «Spør familien»-handling.
- [ ] Ingen kjente kritiske UX-feil i kjerneflyt.

GDPR/sikkerhet:

- [ ] Personvernerklæring og brukervilkår finnes som utkast.
- [ ] Versjonsmerking av samtykke (`consented_*_at`) på plass.
- [ ] Error Boundaries i React Native dekker hovedskjermer.

**Go/no-go: Ekstern beta (lukket, ~10–30 familier)**

Tekniske krav:

- [ ] Inbound-deling fra andre apper fungerer (share-extension ELLER
      e-post-innsending).
- [ ] Konto-/datasletting med 30-dagers grace fungerer i appen.
- [ ] Pårørende-dashboard har rolig status-stripe.
- [ ] Sentry (eller tilsvarende) logger feil sentralt; ingen sensitive
      data i loggene.
- [ ] iOS-bygg klart for TestFlight (separat spor) ELLER Android-only er
      eksplisitt valgt for beta.

Produktkrav:

- [ ] Påfølgende invitasjons-/paringsflyt fungerer uten manuell support i
      ≥ 80 % av forsøk.
- [ ] Brukerstøtte tilgjengelig (e-post eller telefonnummer i appen).
- [ ] Onboarding-veiviser for pårørende (3–5 skjermer).

GDPR/sikkerhet:

- [ ] Personvernerklæring og brukervilkår advokat-gjennomgått (utkast nok
      hvis ikke ferdig).
- [ ] Databehandleravtaler signert med Supabase, Resend.
- [ ] DPIA-vurdering minst påbegynt.
- [ ] Backup-strategi dokumentert.

**Go/no-go: Betalt pilot (~30–100 familier)**

Tekniske krav:

- [ ] Stripe webhook → Supabase oppdaterer `subscription_status` korrekt
      ved aktiv/past_due/canceled.
- [ ] Web-portal `familieknappen.app` har funksjonell registrering,
      betaling og familieadministrasjon.
- [ ] Eskalerende ringekjede ELLER «varsle alle»-modell er bekreftet
      brukbar fra beta.
- [ ] Skritteller/bevegelsesstatus (nivå A) tilgjengelig som **opt-in**
      med rolig samtykkeflyt — eller eksplisitt utsatt til V2.
- [ ] Rapport over varslingsstatistikk (sendt/feilet/ingen tokens) er
      tilgjengelig internt.
- [ ] Token-rotasjon og ugyldige tokens håndteres (Expo Push API-
      feedback).

Produktkrav:

- [ ] Onboarding-rate ≥ 80 % uten support.
- [ ] Retensjon på pårørende-konto > 70 % etter 30 dager (mål for pilot,
      ikke garanti).
- [ ] Tydelig support-kanal i app og web.

GDPR/sikkerhet:

- [ ] Alle databehandleravtaler signert.
- [ ] Personvernerklæring og brukervilkår advokat-godkjent.
- [ ] DPIA fullført, særlig for skritteller hvis den er aktiv.
- [ ] Region for Supabase + Resend bekreftet (EU eller SCC).
- [ ] Incident response-plan dokumentert.
- [ ] Data-eksport-funksjon (GDPR Art. 20) tilgjengelig.

**Go/no-go: Kommersiell lansering (åpen)**

Tekniske krav:

- [ ] Stabil onboarding bekreftet over flere måneder med betalte familier.
- [ ] Stabil varsling (< 1 % feilrate på push).
- [ ] Stabil spør/svar-flyt (< 0,5 % feilrate på opplasting).
- [ ] «Min familie»-flate, kalender, ringekjede polert.
- [ ] Sperreskjerm + abonnementsmodell uten App Store-/Play Store-
      konflikt.

Produktkrav:

- [ ] App Store-strategi klar (Reader app, Existing Account, eller annen
      kategori), advokat-validert.
- [ ] Privacy Nutrition Labels (Apple) og Data Safety (Google Play) på
      plass.
- [ ] Tydelig produktkommunikasjon uten overvåkningspreg.
- [ ] Support-modell skalerbar (FAQ + e-post + telefon).
- [ ] Feilhåndteringsmodell dokumentert.

GDPR/sikkerhet:

- [ ] ROPA dokumentert.
- [ ] Compliance-review utført.
- [ ] Penetrasjons-/sikkerhetstest gjennomført.
- [ ] Backup-restore testet.
- [ ] Beredskap for tap av leverandør.

---


---

## 10. Teknisk og kommersielt veikart

Veikartet er bygd på seksjon 1–9. Seksjon 9 (funksjonstest) veier tyngst
der den motsier tidligere antakelser. Fasene skal ikke blandes — særlig
ikke mor/senior-pilot og betalt pilot.

### 10.1 Fase 0 — Stabil mor/senior-pilot

**Mål:** Én senior og én liten pårørendegruppe kan teste appen i 1–2
uker uten at den virker teknisk ustabil, utrygg eller forvirrende.
Fokus er **kjerneflyten «Spør familien»** og en realistisk
hjelpekanal («Ring familien»). Alt annet er ute av scope.

**Funksjoner som må fungere:**

- Innlogging med 6-sifret OTP-kode fra Resend SMTP via Supabase.
- Hjem-skjerm med tre store, rolige hovedvalg: «Spør familien»,
  «Ring familien», «Min dag».
- Spør-familien-flyten: ta bilde (kamera) → skriv kort melding →
  trykke stor send-knapp → stor bekreftelsesskjerm.
- Pårørende mottar push-varsel med nøytral tekst og kan åpne
  forespørselen.
- Pårørende kan svare med hurtigsvar eller fri tekst.
- Senior ser «Se svar fra familien»-banner som **ikke** auto-
  dismisses. Banner forsvinner kun når senior trykker «Sett».
- «Ring familien»-knappen ringer primærkontakt via `tel:`-URL og
  viser en stor «Prøv neste»-knapp som ringer sekundærkontakt.
- Senior kan se «Min dag» med dagens kalenderhendelser (kun
  lesevisning).

**Tekniske oppgaver:**

- Bygg ny preview-APK med OTP-flyten og endret send-knapp + kamera-
  flyt. Krever EAS build, ingen DB-migrasjoner ut over det som
  allerede er kjørt.
- Verifiser at OTP-koden faktisk leveres fra Resend gjennom Supabase
  Auth, og at e-postmalen viser `{{ .Token }}` tydelig.
- Sjekk at push-varselet trigges fra Database Webhook ved
  INSERT på `help_requests` og `help_responses`. `må verifiseres`
  i Supabase Dashboard.
- Sjekk at signerte URLs for bilder fungerer på fersk APK (ikke
  bare i dev-client).
- Sett mors gruppe til `subscription_status = 'manual_review'` hvis
  feltet er innført. Hvis feltet ikke er innført ennå, dropp
  sperreskjermen i Fase 0.

**Manuelle dashboard-/Supabase-/Resend-/EAS-oppgaver (Andreas):**

- Cloudflare-DNS for `familieknappen.app` (SPF, DKIM, return-path)
  satt opp som «DNS only» (grå sky).
- Resend API-nøkkel lagt inn i Supabase Auth → SMTP. Ikke i repo,
  ikke i chat.
- Supabase Auth → Email Templates: «Magic link / OTP»-malen viser
  6-sifret kode tydelig.
- EAS environment variables for `EXPO_PUBLIC_SUPABASE_URL` og
  `EXPO_PUBLIC_SUPABASE_ANON_KEY` satt for `preview`-profil.
- Database Webhooks i Supabase Dashboard som peker på `send-push`-
  funksjonen. `må verifiseres`.

**UX-krav (fra seksjon 7 og 9):**

- Send-knapp stor, fast plassert nederst, tekst «SEND TIL FAMILIEN».
- Stor bekreftelsesskjerm («Meldingen er sendt. Vent på svar før du
  gjør noe.») i rolig farge, ikke toast.
- Kamera-knapp dominant i spør-flyt; skjermbilde nevnes ikke.
- Senior-tekster er korte, konkrete, uten teknisk sjargong.
- «Ring familien» virker eller skjules. Aldri «kommer ennå».

**Testkriterier (go/no-go):**

- Mor klarer å trykke «Spør familien», ta bilde, sende, og se
  bekreftelse uten teknisk hjelp i ≥ 4 av 5 forsøk.
- Pårørende mottar push på låseskjerm innen 30 sekunder.
- Pårørendes svar når senior innen 60 sekunder etter sending.
- Senior klarer å se svaret og trykke «Sett».
- «Ring familien» ringer riktig nummer; «Prøv neste» ringer
  sekundærkontakt.
- Ingen «hvit skjerm» i kjerneflyten over 14 dagers test.
- Ingen kritisk feilmelding på norsk som inneholder teknisk sjargong.

**Hva som ikke skal gjøres i Fase 0:**

- Pårørende-first onboarding med paringskode (vent til Fase 1).
- «Min familie»-flate (Fase 1).
- Senior legger til aktiviteter (Fase 1).
- «Varsle alle»-ringekjede med push (Fase 1).
- Subscription/Stripe (Fase 3).
- Sletting/eksport av data (Fase 2).
- Error Boundaries og Sentry (Fase 2).
- Videochat, skritteller, stemmestyring, bildearkiv (Fase 3 eller
  V2).

**Største risikoer i Fase 0:**

- OTP-koden kommer ikke fram pga. feilkonfigurert Resend → mor
  kommer ikke inn. Mitigering: ende-til-ende-test før mor får APK.
- Push trigges ikke fordi Database Webhooks ikke er konfigurert →
  pårørende får ikke varsel. Mitigering: manuell test før pilot.
- Mor klarer ikke å taste 6-sifret kode på en gang (gamle øyne,
  liten tastatur). Mitigering: vurder fysisk hjelp første gang, og
  test på enheten mor faktisk bruker.
- Mor mister svaret hvis hun ved et uhell trykker «Sett» for tidlig.
  Mitigering: «Tidligere svar»-historikk er ikke i Fase 0 — men
  banneret skal i det minste ikke auto-dismisses, og en god
  bekreftelse på «Sett» bør finnes.
- Telefonen til mor har OS-versjon som ikke støtter expo-image-
  picker eller expo-notifications godt. `må verifiseres` per enhet.

### 10.2 Fase 1 — Funksjonell MVP

**Mål:** Appen fungerer for **én senior + én pårørendegruppe** uten
manuelle hacks. Skal kunne kjøres av en familie som ikke har
Andreas tilgjengelig 24/7.

**Funksjoner som må fungere:**

- Pårørende-first onboarding: pårørende registrerer seg, oppretter
  familiegruppe, betaler (placeholder eller `manual_review`).
- Paringskode-flyt: pårørende genererer 6-sifret kode på web (eller
  app), senior taster den inn ved første åpning. Krever
  beslutning om senior-auth-modell (egen e-post vs. anonym vs.
  pre-account på web). `må avgjøres før Fase 1 starter.`
- «Min familie»-flate i lettversjon: liste eller kort med navn,
  ring-knapp, melding-knapp. Avatar valgfritt i lettversjon.
- Senior kan legge til enkel kalenderaktivitet (tittel + dato/tid,
  ingen beskrivelse).
- Pårørende kan fortsatt legge til, redigere, slette
  kalenderaktiviteter.
- «Varsle alle»-ringekjede: «Ring familien» sender push til alle
  pårørende samtidig + ringer primær via `tel:`. Første pårørende
  som åpner appen «tar» ansvaret (kan være visuell markering).
- Besvarte spørsmål forsvinner ikke. «Sett»-knapp fjerner kun
  varsel/banner. Svaret ligger i «Tidligere svar»-historikk.
- Sperreskjerm for manglende lisens er nøytral, uten kjøps-UI.
  Senior ser «Snakk med [navn]», pårørende ser «Ta kontakt med
  familieadministratoren».
- Sentral feilhåndtering for kalender-CRUD: ingen stille feil.

**Tekniske oppgaver:**

- Migrering: `family_groups.subscription_status` + relaterte felter
  fra 6.2. Ikke aktivér Stripe ennå.
- Migrering: `help_requests.acknowledged_at` +
  `escalation_stopped_at`.
- Ny tabell `pairing_codes` med RPC `pair_with_code(p_code)`.
- Ny skjerm «Min familie» (senior).
- Ny skjerm «Tidligere svar» (senior).
- Ny knapp «Legg til avtale» (senior) som åpner enkel form.
- Endring i `selectUnseenAnswer` for å bruke `acknowledged_at`.
- Endring i `escalate`-funksjon for å respektere
  `escalation_stopped_at`.
- Auth-gate utvides med lisens-sjekk: hvis status er aktiv
  → fortsett; ellers → vis sperreskjerm.
- Sentral feilhåndtering i kalender-CRUD: `addEvent` /
  `updateEvent` / `deleteEvent` returnerer feil til UI, vises som
  rolig melding.
- Verifisering av Database Webhooks (manuelt, ikke i kode).
- Verifisering av pg_cron for `escalate`-funksjon, ELLER eksplisitt
  beslutning om at eskalering er av i Fase 1.

**RLS og datamodell:**

- RLS-policyer for `pairing_codes`: kun aktiv kode kan innløses; en
  kode kan kun brukes én gang.
- RLS-policyer for `family_groups.subscription_status`: kun
  service_role kan skrive.
- Verifisere at `family_members` ikke kan endres av senior selv
  (rolle-eskalering).

**UX-krav:**

- «Min familie»-flate bruker store kontaktkort. Maks 5 kort på
  første skjerm — scroll for flere.
- «Legg til avtale» for senior: 2 felt (tittel + tid), ingen
  beskrivelse.
- «Tidligere svar»: liste med 10 siste, dato + pårørendes navn +
  første linje av svar.
- Sperreskjerm: stor rolig melding, ingen pris, ingen lenke til
  web.

**Manuell support i Fase 1:**

- Andreas (eller annen support) tilgjengelig på e-post.
- Liten dokumentside: «Slik kommer du i gang», «Slik hjelper du
  senior», «Slik kontakter du oss».
- Ingen scaling-strategi nødvendig — 5–10 familier maksimum.

**Hva som ikke skal gjøres i Fase 1:**

- Stripe-integrasjon (Fase 3).
- Sentry/Error Boundaries (Fase 2 — men gjør Error Boundaries
  hvis det er billig).
- Inbound-deling (Fase 2).
- Bildearkiv (Fase 2 eller V2).
- Skritteller (Fase 3 eller utsatt).
- Sletting av konto (Fase 2).

**Største risikoer i Fase 1:**

- Senior-auth-modell ikke avklart: hvis vi bygger paringskode på
  anonym Supabase-bruker uten å verifisere at det fungerer for
  push og storage, kan vi måtte rebuilde i Fase 2.
- «Min familie»-flate uten avatar-storage virker tom og kald.
  Mitigering: lett-versjon med initialer i farget sirkel.
- Ringekjede «varsle alle» kan oppleves støyende hvis flere
  pårørende svarer samtidig. Mitigering: i Fase 1 er det ofte bare
  én eller to pårørende.

### 10.3 Fase 2 — Lukket ekstern beta

**Mål:** 5–20 familier kan teste uten at Andreas må rette alt
manuelt. Vi skal kunne se feil i produksjon, ha brukerstøtte, og
oppfylle grunnleggende personvernkrav.

**Funksjoner og kvalitet:**

- Error Boundaries i React Native: ingen hvit skjerm. Fallback-
  view med «Noe gikk galt. Prøv igjen.»
- Sentry (eller tilsvarende) med filter mot sensitive data:
  meldingstekst, e-post, tokens må aldri logges.
- Sentral feillogging i Edge Functions (allerede delvis via
  `notification_log`, men må utvides).
- Automatiserte tester for kjerneflyt: «Send forespørsel»,
  «Svar med hurtigsvar», «Aksepter invitasjon», «Pair med kode».
  Kan være E2E i Detox, eller integrasjonstest mot lokal
  Supabase.
- Datarydding: invitasjoner og paringskoder eldre enn N dager
  slettes.
- Sletting av konto i appen med 30-dagers grace.
- Dataeksport (GDPR Art. 20): bruker kan be om kopi av sine data.
  MVP-løsning kan være en manuell prosess (Andreas eksporterer
  fra Supabase).
- Personvernerklæring utkast.
- Brukervilkår utkast.
- Versjonsmerket samtykke i `profiles`.
- Supportflyt: «Trenger du hjelp?»-knapp i app som åpner e-post-
  utkast.
- Backup/restore: Supabase Pro-plan med PITR aktivert.
- Adminrutiner: Andreas kan trygt slette en gruppe, overføre
  primærkontakt manuelt, se varslingsstatistikk uten å avsløre
  personlige data.

**Bør vurderes (ikke nødvendigvis ferdig):**

- Inbound-deling: hva er teknisk realistisk? Native share-extension
  krever bare-workflow (utløp av Expo Managed). E-post-innsending
  krever inbound-leverandør (`må verifiseres` om Resend støtter,
  ellers Postmark/Mailgun). Beslutning før Fase 3.
- Bildearkiv: én av tre modeller velges (per kontakt / felles /
  ukentlig bildebrev). Krever ny tabell + storage bucket + UI.
- Pårørende-dashboard med rolig status-stripe («Alt ser rolig ut
  i dag»).

**Hva som ikke skal gjøres i Fase 2:**

- Faktisk Stripe-betaling (Fase 3).
- Skritteller (Fase 3 med opt-in, eller utsatt).
- Full VoIP-ringekjede (V2).
- Videochat (V2).

**Største risikoer i Fase 2:**

- For mange familier samtidig før observability er på plass.
  Begrens skalering: maks 5 i starten, opp til 20 etter første
  produksjons-feil er funnet og fikset.
- Personvernerklæring og brukervilkår uten advokat-gjennomgang.
  Mitigering: utkast er greit, men marker tydelig som
  «forhåndsversjon» til betalt pilot.
- Sentry kan logge sensitive data hvis filter ikke er strenge nok.
  Mitigering: code review av alle Sentry-kall + scrubbing-regler.

### 10.4 Fase 3 — Betalt pilot

**Mål:** Et lite antall familier (typisk 10–30) betaler for tilgang
på web. Mobilappen er innloggingsportal for eksisterende lisenser.

**Funksjoner som må fungere:**

- Web-portal `familieknappen.app` med:
  - Registrering for pårørende.
  - Stripe Hosted Checkout (Apple/Google Pay + kort).
  - Familieadministrasjon (legg til/fjern medlemmer).
  - Faktura-historikk.
  - Endre/oppsi abonnement.
- Supabase Edge Function `stripe-webhook` som tar imot:
  - `checkout.session.completed`
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_failed`
  - `customer.subscription.trial_will_end` (anbefalt for varsling)
- `family_groups.subscription_status` oppdateres fra webhook med
  service role.
- Lisenssjekk i mobilappen etter innlogging:
  - `useAppStore.loadGroupContext` returnerer
    `subscription_status`.
  - Status `active` / `trialing` / `manual_review` → vanlig flyt.
  - Andre statuser → nøytral sperreskjerm uten kjøpslenke.
- RLS/service-lag for lisens: hvis backend-sjekk overstyres på
  klient, kjernehandlinger (insert i `help_requests`) skal fortsatt
  feile via RLS-policy bundet til `subscription_status`. (Anbefalt,
  ikke obligatorisk i Fase 3 — kan utsettes hvis service-lag-
  sjekken er robust.)

**App Store-policy-risiko:**

- Apple/Google kan kreve at appen ikke nevner ekstern betaling.
  Sperreskjermen må være helt nøytral: «Ta kontakt med
  familieadministratoren». Ingen lenke til `familieknappen.app`,
  ingen pris, ingen «kjøp på web»-tekst.
- App Store kan likevel avvise innsendingen og kreve in-app
  purchase. Dette er **uavklart juridisk risiko**, ikke fasit.
- Anbefaling: lansér Android først (Play Store eller egen
  distribusjon). Vurder iOS når Android-modellen har 10–20 betalte
  familier og strategien er testet.

**Databehandleravtaler og DPIA:**

- Databehandleravtaler signert med Supabase, Resend, Stripe, Expo.
  Disse må være på plass før første betaling.
- DPIA fullført eller minst dokumentert som arbeid pågår.
- Region for Supabase-prosjekt og Resend bekreftet. EU-region eller
  SCC.
- Personvernerklæring advokat-gjennomgått.

**Skritteller / bevegelsesstatus:**

- Hvis aktivert i Fase 3, kun som **eksplisitt opt-in** med rolig
  samtykkeflyt og minst inngripende nivå (nivå A: «Bevegelse
  registrert i dag»).
- Hvis ikke aktivert, eksplisitt utsatt til V2.
- GDPR Art. 9-vurdering (helsedata) må være avklart med advokat
  før funksjonen vises i appen.

**Manuell support:**

- E-post-support med SLA (1 virkedag).
- Brukerstøtte-skjema i appen.
- Andreas eller annen kontaktperson for tekniske og
  fakturarelaterte spørsmål.

**Største risikoer i Fase 3:**

- App Store avviser eller forsinker innsendingen. Mitigering:
  Android først.
- Stripe-webhooks feiler stille → status synkes ikke → familie
  mister tilgang uten å forstå hvorfor. Mitigering: webhook-retries
  + intern varsling ved repeterte feil.
- Skritteller utløser GDPR-utfordring. Mitigering: utsatt eller
  meget begrenset opt-in.
- Familie betaler men kan ikke komme inn fordi senior-auth-modellen
  fra Fase 1 fortsatt ikke er stabil. Mitigering: ikke åpne for
  betaling før Fase 1 har vært stabil i 2–4 uker.

### 10.5 Fase 4 — Kommersiell app

**Mål:** Appen kan publiseres bredere og driftes som reelt produkt
for 100–500 familier i år 1.

**Funksjoner og operasjonell modenhet:**

- Play Store-publisering (Android først).
- App Store-løp (iOS, hvis strategi tillater).
- Privacy Nutrition Labels (Apple) og Data Safety (Google Play).
- Tydelig produktkommunikasjon uten overvåkningspreg.
- Robust support: FAQ, e-post, telefon eller chat.
- Adminportal for support: kan trygt nullstille passord, fryse
  konto, overføre primærkontakt, eksportere data.
- Logging/observability: sentral logg av push-feilrate,
  innlogging, lisens-status. Daglig sammendrag.
- Driftsovervåkning: alarm når Edge Functions feiler over terskel.
- Abonnement robust: prøveperiode, oppsigelse, refusjon-policy.
- Sikkerhet og GDPR:
  - ROPA dokumentert.
  - Penetrasjons-/sikkerhetstest gjennomført.
  - Beredskapsrutiner for brudd.
  - Backup-restore testet.
  - Beredskap for tap av leverandør.
- Skalerbarhet: indekser, partisjonering, query-optimering på
  tabeller som vokser raskt.
- Versjonering: app-versjon vises tydelig; minimum-versjon kan
  håndheves («Du må oppdatere appen»).
- Releaseprosess: staging/preview/production-spor i EAS, automatisk
  build på tag.

**Videochat:**

- Vurderes på nytt basert på pilotdata. Hvis brukere faktisk
  etterspør, vurder lett WebRTC-løsning. Ellers utsett.

**Skritteller / bevegelse:**

- Hvis stabil i betalt pilot, gjør tilgjengelig i kommersiell app.
- Hvis utsatt, fortsatt utsatt.

**Største risikoer i Fase 4:**

- App Store-avvisning ved iOS-innsending.
- Brudd på personvern under tilsynsbesøk.
- Tap av leverandør (Supabase, Resend, Expo) uten beredskap.
- Skalering: 500 familier × push × bilder = ikke trivielt,
  men håndterbart med Supabase Pro.

---

## 11. Fordeling av arbeidsoppgaver

Fire roller. Hver rolle har distinkte oppgaver, og oppgaver skal
ikke gli over uten avtale. Spesielt: ingen rolle skal håndtere
secrets eller publisere på Andreas' vegne uten klar instruks.

### 11.1 Claude

- **Arkitekturvurdering:** vurdere stack-valg, dataflyt, RLS-
  modell, fasestrategier.
- **Produktplan:** prioritering, scope-vurdering, MVP-grense.
- **Analyse:** lese kode + migrasjoner, identifisere risiko og
  mangler.
- **UX-tekster:** seniorvennlige formuleringer, feilmeldinger,
  bekreftelser.
- **Dokumentasjon:** lange plandokumenter (som denne planen),
  arkitektur-notater, beslutningsdokumenter.
- **Større refaktorplaner:** identifisere hva som må endres,
  rekkefølge, avhengigheter — men ikke selve refaktoren.
- **Kodegjennomgang på høyt nivå:** lese diffs etter Codex, gi
  feedback på arkitektur og produktkonsekvenser.
- **Skrive Codex-prompter:** små, presise, avgrensede.
- **Vurdere konsekvenser og avhengigheter:** hvis vi gjør X, hva
  må også gjøres? Hvilke risikoer åpnes?
- **Kvalitetssikre at funksjonstestfunn faktisk blir prioritert:**
  ikke la P0-funn fra seksjon 9 glemmes til fordel for kuriositeter.

**Claude skal ikke:** committe kode, pushe, bygge APK, gjøre
Supabase Dashboard-endringer, holde secrets, ta brukerinnsikt
direkte fra mor uten Andreas i loopen.

### 11.2 Codex

- **Konkrete kodeendringer:** små, avgrensede, én oppgave per
  runde.
- **Migrasjoner:** SQL-filer i `supabase/migrations/`. Idempotente,
  bakoverkompatible.
- **Supabase-kall:** klient-kode mot Supabase JS.
- **Komponenter:** React Native-komponenter.
- **Tester:** enhetstester, integrasjonstester, E2E.
- **Build:** EAS-bygg via CLI.
- **GitHub/EAS-oppgaver:** commits, push, PRs, builds.
- **Små sikre refaktorer:** rename, dele opp store filer.
- **Kjøre typecheck/build:** `npm run typecheck`, EAS build.

**Codex skal ikke:** ta store produktvalg selv (f.eks. velge
mellom paringskode og pre-account), endre App Store-policy-
strategi, signere databehandleravtaler, gjøre design-overhaul
uten plan.

### 11.3 ChatGPT

- **Kritisk sparring:** «Gir denne planen mening?»,
  «Hva har jeg ikke tenkt på?».
- **Promptutforming:** hjelpe Andreas å skrive presise prompter
  til Claude og Codex.
- **Prioritering:** sortere backlogg, finne neste oppgave.
- **Juridisk/GDPR-drøfting på ikke-advokatnivå:** vise
  problemstillinger, ikke gi fasit.
- **Produktstrategi:** målgruppe, kommunikasjon, pakketering.
- **Språk og forklaringer:** sjekke tekst, oversette teknisk til
  enkelt.
- **Testplaner:** hvordan teste en flyt manuelt eller automatisk.
- **Beslutningsstøtte:** lage pro/contra-lister.
- **Holde prosjektet realistisk:** påminne om at scope-glipp er
  hovedrisiko.
- **Hjelpe Andreas å ikke blande for mange spor samtidig.**

**ChatGPT skal ikke:** kjøre kode, ha tilgang til repo eller
Supabase, holde secrets, gi juridisk fasit.

### 11.4 Andreas

- **Produktbeslutninger:** hva som skal i hvilken fase, hvilken
  målgruppe, hvilken pris.
- **Brukerinnsikt:** testing med mor og senior, intervjuer.
- **Kontoer/secrets/dashboard:** Supabase, Resend, EAS, GitHub,
  Cloudflare, Stripe (senere). Andreas eier alle nøkler.
- **Domene/Resend/Supabase manuelle felt:** DNS-records,
  e-postmaler, webhooks, cron-konfig.
- **Godkjenne endringer:** code review og produktbeslutninger
  før merge.
- **Avgjøre prioritering:** når Claude/ChatGPT er uenige,
  Andreas beslutter.
- **Eie risiko og publisering:** App Store, Play Store, GDPR,
  pilot-deltakere.

**Andreas skal ikke:**

- Lime secrets (API-nøkler, service role keys, SMTP-passord) inn
  i AI-chat.
- Blande mor-pilot med betalt pilot.
- Lansere på App Store før strategien er kvalitetssikret.
- Hoppe over manuelle tester før hver APK gis til mor.

---

## 12. Prioritert backlogg

49 oppgaver, prioritert. Hver oppgave har eier, avhengigheter,
testkriterium og risiko. Prioritetene betyr:

- `P0` = blokkerer mor/senior-pilot.
- `P1` = nødvendig før funksjonell MVP.
- `P2` = nødvendig før ekstern beta / betalt pilot.
- `P3` = senere / kommersiell modning.

### P0 — Mor/senior-pilot

| ID | Tittel | Prioritet | Eier | Beskrivelse | Avhengigheter | Testkriterium | Risiko |
| -- | ------ | --------- | ---- | ----------- | ------------- | ------------- | ------ |
| F-001 | Bygg ny preview-APK med OTP | P0 | Codex/Andreas | Bygg `preview`-profil i EAS med eksisterende OTP-kode-flyt. | Resend-DNS + Supabase SMTP konfigurert | APK installeres uten feil, åpner sign-in | Build feiler pga. EAS-env-mangel |
| F-002 | Verifiser OTP ende-til-ende | P0 | Andreas | Send kode til Andreas' egen e-post fra ny APK. Sjekk at kode kommer, kan tastes, gir innlogging. | F-001, Resend SMTP | Innlogging fungerer i ≥ 4 av 5 forsøk | Token rate limit, e-post forsinket |
| F-003 | Verifiser Resend SMTP + DNS | P0 | Andreas | Resend domene `familieknappen.app` verifisert (SPF/DKIM/DMARC). Supabase Auth bruker Resend SMTP. | DNS hos Cloudflare | Resend dashboard viser «Verified», Supabase Test e-mail kommer fram | DNS-feil, BOM i records |
| F-004 | Tilpass Supabase e-postmal med `{{ .Token }}` | P0 | Andreas | Mal viser 6-sifret kode stort og tydelig. | Supabase Dashboard | Mottatt e-post viser koden lesbart | Mal-syntax-feil |
| F-005 | Fast send-knapp i meldingsflyt | P0 | Codex | Stor «SEND TIL FAMILIEN»-knapp fast nederst på spør-skjerm, tydelig adskilt fra skrivefelt. | UX-spek fra Claude | Senior klarer å sende uten å bli vist hvor knappen er | Layout-feil på små skjermer |
| F-006 | Stor sendebekreftelse | P0 | Codex | Full-skjerm bekreftelse «Meldingen er sendt. Vent på svar før du gjør noe.» i rolig farge. | F-005 | Bekreftelsen vises i ≥ 2 sek, dempes ikke automatisk | Toast i stedet for skjerm |
| F-007 | Kamera som hovedflyt | P0 | Codex | Spør-skjerm fremhever kamera-knapp; «Velg fra galleri» er sekundær. Ingen referanse til skjermbilde. | Eksisterende expo-image-picker | Senior trykker kamera først, ikke galleri | Permission-feil på Android |
| F-008 | «Ring familien» virker eller skjules | P0 | Codex | Hvis primærkontakt har `phone`, vis ring-knapp. Ellers skjul. Aldri «kommer ennå». | `phone`-felt på profiles | Knappen oppfører seg konsistent | Manglende telefonnummer på mor-pilots pårørende |
| F-009 | Manuell «Prøv neste»-knapp | P0 | Codex | Etter at primærkontakt ringt, vis «Prøv neste»-knapp som ringer sekundærkontakt. | F-008 | Senior kan ringe to forskjellige nummer fra samme skjerm | Sekundærkontakt ikke definert |
| F-010 | Banner/svar auto-dismisses ikke | P0 | Codex | Fjern `markAnswerSeen` fra `useFocusEffect` i `senior/answer.tsx`. Vis svaret normalt; «Sett»-knapp må trykkes manuelt. | Ingen migrering nødvendig hvis acknowledged_at utsettes til P1 | Senior kan åpne svar, gå tilbake, og fortsatt se banneret | UX-konflikt med eksisterende design |
| F-011 | Senior-tekstgjennomgang | P0 | Claude/Andreas | Gå gjennom alle tekster på seniors hjem, spør-skjerm, svar-skjerm, ringe-skjerm, kalender. Korte, konkrete, trygge. | Eksisterende kode | Ingen tekst over 2 linjer, ingen teknisk sjargong | Endring kan flytte layout |
| F-012 | Verifiser push ende-til-ende | P0 | Andreas/Codex | Send forespørsel fra senior, sjekk at pårørende får push på låseskjerm. Send svar, sjekk at senior får push. | Database Webhooks i Supabase Dashboard | Push kommer innen 30 sek i ≥ 4 av 5 forsøk | Webhooks ikke konfigurert |
| F-013 | Go/no-go-test med mor | P0 | Andreas | Mor bruker ny APK i 1–2 uker. Andreas observerer/tilrettelegger første gang. | Alle F-001 til F-012 | Mor klarer kjerneflyten uten tilrettelegging i ≥ 4 av 5 forsøk | Mor blir frustrert |
| F-014 | Skjul/fjerne «kommer ennå»-tekster | P0 | Codex | Alle steder der appen sier «kommer ennå» eller viser placeholder, skjul knappen eller fjern strengen. | F-008 | Ingen «kommer ennå» synlig i kjerneflyt | Brutt navigasjon hvis knapp skjules feil |

### P1 — Funksjonell MVP

| ID | Tittel | Prioritet | Eier | Beskrivelse | Avhengigheter | Testkriterium | Risiko |
| -- | ------ | --------- | ---- | ----------- | ------------- | ------------- | ------ |
| F-015 | Beslutning: senior-auth-modell | P1 | Andreas + Claude | Avgjør paringskode (anonym auth) vs. pre-account på web (egen e-post). | Funksjonstest med mor | Beslutning dokumentert med begrunnelse | Velger feil, må bygge om |
| F-016 | Migrering: `pairing_codes`-tabell | P1 | Codex | Ny tabell + RLS + RPC `pair_with_code(p_code)`. | F-015 | RPC innløser kode én gang, validerer utløp | Brute force, race condition |
| F-017 | Paringskode-skjerm i app | P1 | Codex | Senior taster 6-sifret kode ved første åpning. Stor input, ingen sjargong. | F-016 | Senior pares til riktig gruppe | Feil familie pares |
| F-018 | Migrering: `subscription_status` på `family_groups` | P1 | Codex | Legg til `subscription_status`, `billing_admin_user_id`, `trial_end`, `current_period_end`, `created_by`. Alle nullable. | Ingen | Migrering kjører idempotent | Bryter eksisterende queries |
| F-019 | Nøytral lisens-sperreskjerm | P1 | Codex | Vises hvis `subscription_status` ikke er aktiv/manual_review. Ingen kjøps-UI. | F-018 | Skjermen vises korrekt for inaktiv gruppe | Tekst forveksles med «logg ut» |
| F-020 | Lisenssjekk i auth-gate | P1 | Codex | `loadGroupContext` returnerer status; root-layout viser sperreskjerm hvis inaktiv. | F-018, F-019 | Mor (manual_review) ser vanlig flyt; testkonto med expired ser sperreskjerm | Logikkfeil sperrer faktisk bruker |
| F-021 | Migrering: `acknowledged_at` på `help_requests` | P1 | Codex | Ny kolonne, nullable. | Ingen | Migrering kjører | Trenger ny webhook-versjon |
| F-022 | «Sett»-knapp i svar-skjerm | P1 | Codex | Eksplisitt knapp som setter `acknowledged_at = now()` via RPC eller direkte update (med RLS). | F-021 | Etter «Sett» forsvinner banneret; «Tidligere svar» beholder svaret | Race condition mellom flere klienter |
| F-023 | «Tidligere svar»-skjerm for senior | P1 | Codex | Liste med 10 siste besvarte forespørsler. Klikkbar tilbake til svaret. | F-022 | Senior kan finne et svar hen tidligere så | Lang liste oppleves rotete |
| F-024 | Migrering: `escalation_stopped_at` | P1 | Codex | Ny kolonne. `escalate`-funksjon respekterer den. | Ingen | Eskalering stopper når svar mottas | Eskalering kjører likevel |
| F-025 | «Min familie»-flate lettversjon (senior) | P1 | Codex | Skjerm med liste/kort over alle pårørende. Navn + ring-knapp + melding-knapp. | F-008 (phone-felt) | Senior kan ringe og melde fra kort-list | Tom skjerm hvis ingen pårørende |
| F-026 | «Legg til avtale»-knapp for senior | P1 | Codex | Stor knapp på «Min dag» eller hjem. 2 felt (tittel + tid). | Ingen | Avtale vises på «Min dag» neste gang datoen kommer | Senior taster feil tid |
| F-027 | Pårørende kan fortsatt redigere/slette avtaler | P1 | Codex | Bekreft at relative/calendar.tsx fortsatt fungerer etter at senior kan legge til. | F-026 | Pårørende kan opprette, redigere, slette en avtale | Konflikt mellom roller |
| F-028 | Sentral feilhåndtering for kalender-CRUD | P1 | Codex | `addEvent` / `updateEvent` / `deleteEvent` returnerer feil til UI med rolig melding. | F-026, F-027 | Hvis Supabase er nede, ser bruker en melding, ikke stillhet | Skjuler relevante feil bak generisk melding |
| F-029 | Ringekjede «varsle alle» med push | P1 | Codex + Andreas | «Ring familien» sender push til alle pårørende samtidig + ringer primær via `tel:`. | Push verifisert (F-012) | Alle pårørende får varsel innen 30 sek | Spam-følelse |
| F-030 | Verifiser Database Webhooks i konfig | P1 | Andreas | Sjekk i Supabase Dashboard at webhook for `help_requests` insert og `help_responses` insert peker på `send-push`. | Tilgang til Dashboard | Skriftlig bekreftelse | Webhook deaktivert |
| F-031 | Verifiser pg_cron for escalate eller skru av | P1 | Andreas | Hvis pg_cron kjører `escalate`, dokumenter intervallet. Hvis ikke, dokumenter at eskalering er av i Fase 1. | Tilgang til Dashboard | Skriftlig bekreftelse | Eskalering misforståelse |
| F-032 | Onboarding-veiviser for pårørende | P1 | Codex | 3–5 skjermer etter første registrering: hva er Familieknappen, hvordan invitere senior, hvordan ringe. | F-015 | Pårørende kommer ut til vanlig flyt etter veiviseren | For lang, droppes |
| F-033 | RLS-revisjon | P1 | Codex + Claude | Lese gjennom alle RLS-policyer; bekreft at billing-felter ikke kan skrives fra klient, paringskode ikke kan brute-forces enkelt. | F-016, F-018 | Skriftlig revisjon | Glipper en policy |

### P2 — Ekstern beta / betalt pilot

| ID | Tittel | Prioritet | Eier | Beskrivelse | Avhengigheter | Testkriterium | Risiko |
| -- | ------ | --------- | ---- | ----------- | ------------- | ------------- | ------ |
| F-034 | Error Boundaries i hovedflyter | P2 | Codex | Wrap Stack-skjermer i Error Boundary med rolig fallback. | Ingen | Krasj viser fallback, ikke hvit skjerm | Skjuler faktiske bugs |
| F-035 | Sentry-integrasjon med scrubbing | P2 | Codex | Sentry SDK + filter for meldingstekst, e-post, tokens. | F-034 | Test-krasj logges uten sensitive data | Scrubbing ikke streng nok |
| F-036 | Konto-/datasletting med 30-dagers grace | P2 | Codex | RPC `request_account_deletion()` + cron-jobb som faktisk sletter etter 30 dager. | Migrering: `deletion_requested_at` på profiles | Bruker kan be om sletting, data fjernes etter 30 dager | Permanent tap av data hvis bruker angrer |
| F-037 | Dataeksport (GDPR Art. 20) | P2 | Codex/Andreas | MVP: manuell eksport. Senere: knapp i app. | F-036 | Bruker kan be om eksport, mottar fil | Inneholder data hen ikke skal ha |
| F-038 | Personvernerklæring utkast | P2 | Claude + Andreas | Norsk tekst med dataminimering, formål, lagring, rettigheter. | Datamodell stabilisert | Tilgjengelig som lenke i appen og på web | Mangler advokat-gjennomgang i utkast-fasen |
| F-039 | Brukervilkår utkast | P2 | Claude + Andreas | Norsk tekst med tjenestebegrensninger, ansvarsfraskrivelse. | Datamodell stabilisert | Tilgjengelig som lenke | Strenger enn nødvendig |
| F-040 | Databehandleravtaler signert | P2 | Andreas | Supabase, Resend, Expo, Stripe. | Kontoer aktive | Signerte avtaler arkivert | Forsinkelse fra leverandør |
| F-041 | Versjonsmerket samtykke | P2 | Codex | `consented_terms_at`, `consented_privacy_at`, `terms_version`, `privacy_version` på `profiles`. | F-038, F-039 | Samtykke logges per versjon | Migrering bryter eksisterende brukere |
| F-042 | Automatiserte tester for kjerneflyt | P2 | Codex | E2E (Detox) eller integrasjonstest for «send forespørsel», «svar», «aksepter invitasjon», «pair med kode». | F-016 | Tester kjører grønt i CI | Flaky tests, kostnad |
| F-043 | Inbound-deling forundersøkelse | P2 | Claude + Codex | Notat: kan vi gjøre share-extension i Expo Managed, eller må vi bare-workflow? E-post-innsending via Resend inbound? | Ingen | Beslutningsnotat | Velger vei som krever Expo eject |
| F-044 | Bildearkiv-modellvalg | P2 | Andreas + Claude | Velg én av tre modeller (per kontakt / felles / ukentlig bildebrev). | Brukerinnsikt fra beta | Beslutningsnotat | Velger for dyr modell |
| F-045 | Pårørende-dashboard status-stripe | P2 | Codex | Rolig melding øverst i dashboard («Alt ser rolig ut»). | Eksisterende activity_status | Stripe vises korrekt for ulike scenarioer | Misforstås som varsling |
| F-046 | Stripe Hosted Checkout på web | P2 | Codex (web) + Andreas | Web-portal `familieknappen.app` med Hosted Checkout. Apple Pay / Google Pay / kort. | Web-portal opprettet, Stripe konto | Test-betaling fullført, sub opprettet | Avhenger av web-portal som ikke finnes |
| F-047 | Supabase Edge Function `stripe-webhook` | P2 | Codex | Tar imot 5 Stripe-events, oppdaterer `family_groups.subscription_status`. | F-046 | Test-event fra Stripe oppdaterer riktig rad | Webhook secret feil → events ignoreres |
| F-048 | RLS/service-lag for lisens | P2 | Codex + Claude | Sjekk i service-lag i appen + RLS-policy som hindrer insert i `help_requests` for inaktiv lisens. | F-018, F-046 | Inaktiv gruppe kan ikke sende forespørsel | Eksisterende mor-pilot brytes |
| F-049 | App Store-policy-avklaring | P2 | Andreas + ekstern rådgiver | Vurder om appen kan publiseres med ekstern abonnementshåndtering uten å bli avvist. | Sperreskjerm uten kjøpslenke (F-019) | Skriftlig vurdering | Avvising fra Apple |

### P3 — Senere / kommersiell modning

| ID | Tittel | Prioritet | Eier | Beskrivelse | Avhengigheter | Testkriterium | Risiko |
| -- | ------ | --------- | ---- | ----------- | ------------- | ------------- | ------ |
| F-050 | Skritteller / bevegelse nivå A (opt-in) | P3 | Codex | `expo-sensors` pedometer, dagsstatus «Bevegelse registrert i dag». Eksplisitt samtykke. | F-040 (DPA), DPIA | Senior kan slå på/av; pårørende ser status; ingen data uten samtykke | GDPR Art. 9 |
| F-051 | Adminportal for support | P3 | Codex (web) | Web-tilgang for Andreas/support: nullstille passord, fryse konto, overføre primærkontakt. | F-046 (web-portal) | Andreas kan trygt løse support-saker | Tilgang misbrukes |
| F-052 | Full VoIP-ringekjede | P3 | Codex + Claude (plan) | WebRTC eller leverandør, innkommende anrop. | Forundersøkelse | Senior tar imot anrop på låseskjerm | Stor kompleksitet |
| F-053 | Videochat | P3 | Codex + Claude (plan) | Leverandør-integrasjon eller WebRTC. | F-052 vurdert | Senior + pårørende har samtale | Personvern, kostnad |
| F-054 | Stemmestyrte handlinger | P3 | Codex | «Ring Anne», «Spør familien» via native speech recognition. | F-050 | Kommandoer fungerer pålitelig | Falske positives |
| F-055 | Penetrasjons-/sikkerhetstest | P3 | Andreas + ekstern | Tredjepartsgjennomgang av RLS, Edge Functions, web. | Alle P2 fullført | Rapport uten kritiske funn | Kritiske funn forsinker lansering |
| F-056 | ROPA-dokumentasjon | P3 | Andreas + Claude | Records of Processing Activities for alle data-behandlinger. | F-040 | Dokumentert internt | Mangler ved tilsyn |
| F-057 | Beredskapsrutiner | P3 | Andreas | Hva gjør vi ved leverandør-utfall, brudd, kontoovertakelse. | F-040, F-055 | Skriftlig plan | Plan finnes ikke når incident skjer |

---

## 13. Første konkrete Codex-prompter

14 prompter, prioritert etter P0 fra seksjon 9. Hver er liten og
avgrenset. Hver runde skal ende med oppsummering før commit.

### 13.1 Prompt: Verifiser OTP-flyt og bygg ny preview-APK

**Mål:** Bekrefte at 6-sifret OTP-flyten fungerer ende-til-ende med
Resend SMTP. Bygge en ny `preview`-APK som Andreas kan installere
på en testenhet.

**Filer/områder som skal undersøkes:**

- `app/sign-in.tsx`
- `src/services/auth.ts`
- `eas.json`
- `app.json` (versjonsnummer, versionCode)
- `src/utils/authErrors.ts`

**Hva som ikke skal røres:**

- Ingen kodeendringer i auth-flyt med mindre Claude eksplisitt har
  godkjent dem.
- Ingen Supabase-endringer.
- Ikke endre App Store-/Play Store-metadata.

**Testkommandoer:**

- `cd familieknappen-app && npm install`
- `npm run typecheck`
- `eas build --profile preview --platform android`

**Krav om oppsummering før commit:**

- Bekreft at OTP er sendt og verifisert minst én gang på reell
  e-postadresse.
- List endrede filer (forventer kun versjonsbump).
- Eventuelle EAS-bygg-warnings.

**Anbefalt commit-melding:** `chore: bump versjon og bygg preview-APK for OTP-test`

### 13.2 Prompt: Fast send-knapp og stor sendebekreftelse

**Mål:** I spør-familien-flyten skal send-knappen være stor, fast
plassert nederst, og adskilt fra skrivefeltet. Etter sending skal
en stor bekreftelsesskjerm vises («Meldingen er sendt. Vent på
svar før du gjør noe.»).

**Filer/områder som skal undersøkes:**

- `app/senior/ask.tsx` (eller tilsvarende spør-skjerm)
- `app/senior/sent.tsx` (eller tilsvarende bekreftelses-skjerm)
- `src/components/...` (felles UI-komponenter)
- `src/theme/...` (farger, typografi)

**Hva som ikke skal røres:**

- Ikke endre opplastings-logikk (`uploadHelpImage`).
- Ikke endre datamodell eller migrasjoner.
- Ikke endre push-konfigurasjon.

**Testkommandoer:**

- `npm run typecheck`
- Test på faktisk Android-enhet (preview-APK).

**Krav om oppsummering før commit:**

- Skjermbilder eller beskrivelse av før/etter.
- Bekreft at knappen er over 56 pt høy, kontrast ≥ 4.5:1.
- Bekreft at bekreftelses-skjermen ikke auto-dismisses.

**Anbefalt commit-melding:** `feat(senior): fast send-knapp og stor sendebekreftelse i spør-flyt`

### 13.3 Prompt: Gjør kamera til hovedflyt for senior

**Mål:** I spør-skjermen skal kamera være primært alternativ for
å «hente» bildet. «Velg fra galleri» kan beholdes som sekundært
alternativ. Ingen tekst skal referere til skjermbilde.

**Filer/områder som skal undersøkes:**

- `app/senior/ask.tsx`
- `src/services/imagePicker.ts` (hvis finnes)
- `app.json` (kamerapermissions tekst)

**Hva som ikke skal røres:**

- Ikke endre `expo-image-picker`-versjon.
- Ikke endre `uploadHelpImage`-flyt.

**Testkommandoer:**

- `npm run typecheck`
- Test på Android-enhet: «Ta bilde» åpner kamera, «Velg bilde»
  åpner galleri.

**Krav om oppsummering før commit:**

- Bekreft at permissions-tekstene på Android og iOS er natur-
  språkelige og senior-vennlige.
- Bekreft at kamera-knappen er minst dobbelt så stor som galleri-
  knappen.

**Anbefalt commit-melding:** `feat(senior): kamera som hovedflyt i spør-skjerm`

### 13.4 Prompt: Gjør «Ring familien» trygg — virke eller skjules

**Mål:** «Ring familien»-knappen skal ringe primærkontakt via
`tel:`-URL hvis primærkontakt har `phone` satt. Hvis ikke, skal
knappen skjules helt. Aldri «kommer ennå». Legg til «Prøv
neste»-knapp som ringer sekundærkontakt på samme måte.

**Filer/områder som skal undersøkes:**

- `app/senior/home.tsx`
- `app/senior/ring.tsx` (eller tilsvarende)
- `src/stores/appStore.ts` (selectors for primær- og
  sekundærkontakt)
- `src/utils/phone.ts` (eller opprett ny hjelpefunksjon for
  `tel:`-URL-bygging)

**Hva som ikke skal røres:**

- Ikke endre datamodell (`phone` er allerede på profiles).
- Ikke implementere VoIP eller automatisk ringekjede.
- Ikke endre push-konfigurasjon.

**Testkommandoer:**

- `npm run typecheck`
- Test på Android: knapp åpner telefonsamtale med riktig nummer.
- Test scenario uten primærkontakt-telefon: knapp skjult.

**Krav om oppsummering før commit:**

- Bekreft at både primær og sekundær er forsøkt med faktisk
  Android-enhet.
- Bekreft at knappen ikke vises hvis ingen pårørende har `phone`.

**Anbefalt commit-melding:** `feat(senior): tel:-ring til primær- og sekundærkontakt`

### 13.5 Prompt: Hindre at banner/svar auto-dismisses

**Mål:** Banneret «Se svar fra familien» skal ikke forsvinne når
senior bare åpner svar-skjermen. Det skal kreves en eksplisitt
«Sett»-handling for å fjerne banneret. I Fase 0 trenger vi ikke
`acknowledged_at`-migrering ennå — det er nok å fjerne
auto-fokus-effekten og la senior trykke «Sett» som senere kan
kobles til `acknowledged_at` (P1).

**Filer/områder som skal undersøkes:**

- `app/senior/answer.tsx`
- `src/stores/appStore.ts` (`selectUnseenAnswer`, `markAnswerSeen`)

**Hva som ikke skal røres:**

- Ikke endre datamodell ennå.
- Ikke fjerne `markAnswerSeen` helt — kall den fra en eksplisitt
  knapp i stedet for `useFocusEffect`.

**Testkommandoer:**

- `npm run typecheck`
- Test: senior åpner svar, går tilbake → banner fortsatt der.
- Test: senior trykker «Sett» → banner borte.

**Krav om oppsummering før commit:**

- Bekreft at ingen andre flyter er brutt.
- Skjermbilde eller beskrivelse.

**Anbefalt commit-melding:** `fix(senior): banner forsvinner kun ved eksplisitt Sett-knapp`

### 13.6 Prompt: Senior-tekstgjennomgang

**Mål:** Gjennomgå alle tekster i senior-skjermer (hjem, spør,
svar, ring, kalender, sign-in) og kort dem ned til ≤ 2 linjer,
fjern teknisk sjargong, gjør tonen rolig og tilgivende.

**Filer/områder som skal undersøkes:**

- Alle filer i `app/senior/`
- `src/utils/authErrors.ts`
- `app/sign-in.tsx`
- Eventuelle felles tekstmoduler

**Hva som ikke skal røres:**

- Ikke endre layout eller komponenter.
- Ikke endre pårørende-tekster i samme PR.

**Testkommandoer:**

- `npm run typecheck`
- Manuell gjennomgang av alle skjermer.

**Krav om oppsummering før commit:**

- Liste over endrede strenger (før/etter).
- Bekreft at ingen tekst over 2 linjer.
- Bekreft at ingen tekst inneholder «nettverk», «server»,
  «autentisering», «sesjon», «token», «backend» osv.

**Anbefalt commit-melding:** `chore(senior): rolige og korte tekster i senior-skjermer`

### 13.7 Prompt: Verifiser push ende-til-ende for pilot

**Mål:** Bekreft at Database Webhook for `help_requests` insert
trigger `send-push`-funksjonen, og at Expo Push API faktisk
leverer push til både pårørende (forespørsel) og senior (svar).

**Filer/områder som skal undersøkes:**

- `supabase/functions/send-push/index.ts`
- `src/services/push.ts`
- `app.json` (Android channel-konfigurasjon, hvis relevant)

**Hva som ikke skal røres:**

- Ikke endre `notification_tokens`-schema.
- Ikke endre `send-push`-logikk uten plan fra Claude.

**Testkommandoer:**

- Verifiser i Supabase Dashboard: Database → Webhooks → eksisterer
  for `help_requests` insert og `help_responses` insert, peker på
  `send-push`-funksjonen, har riktig service role i header.
- Test fra fersk APK: send forespørsel, sjekk push på pårørende-
  enhet innen 30 sek.

**Krav om oppsummering før commit:**

- Skriftlig bekreftelse av webhook-konfigurasjon (uten å eksponere
  secrets).
- Eventuelt logg fra `notification_log` (uten meldingsinnhold).

**Anbefalt commit-melding:** `docs: verifisert push ende-til-ende for pilot`

### 13.8 Prompt: Lag go/no-go-testskjema for mor-pilot

**Mål:** Lag et enkelt testskjema (Markdown-fil) som Andreas kan
gå gjennom med mor i pilot-perioden. Skjemaet skal være på norsk,
ha avkrysningsbokser, og dekke de viktigste flytene.

**Filer/områder som skal undersøkes:**

- Ny fil: `docs/MOR_PILOT_GO_NO_GO.md`

**Hva som ikke skal røres:**

- Ingen kodefiler.

**Testkommandoer:**

- Ingen — dokumentasjon.

**Krav om oppsummering før commit:**

- Skjemaet inkluderer: innlogging, spør-flyt, motta svar, ring
  familien, prøv neste, banner sett, kalender lesevisning.
- Hver flyt har et go/no-go-kriterium.

**Anbefalt commit-melding:** `docs: go/no-go-testskjema for mor-pilot`

### 13.9 Prompt: Implementer at senior kan legge til aktivitet

**Mål:** Senior skal kunne legge til en enkel kalenderaktivitet
(tittel + dato/tid). Ingen beskrivelse, ingen recurring. Senior
kan ikke slette eller redigere — det overlates til pårørende.

**Filer/områder som skal undersøkes:**

- `app/senior/day.tsx`
- Ny: `app/senior/add-event.tsx` (eller tilsvarende)
- `src/stores/appStore.ts` (`addEvent`)
- `src/components/DateTimeField.tsx`

**Hva som ikke skal røres:**

- Ikke endre RLS-policyer for `calendar_events`.
- Ikke endre `relative/event.tsx`.

**Testkommandoer:**

- `npm run typecheck`
- Test: senior legger til avtale, ser den på «Min dag».
- Test: pårørende ser avtalen i sin kalender.

**Krav om oppsummering før commit:**

- Bekreft at flyten er under 30 sekunder for senior.
- Bekreft at validering hindrer dato i fortid (med rolig melding).

**Anbefalt commit-melding:** `feat(senior): senior kan legge til enkel kalenderaktivitet`

### 13.10 Prompt: Gjør besvarte spørsmål synlige i historikk

**Mål:** Lag «Tidligere svar»-skjerm for senior. Knytter til
`acknowledged_at`-migrering som forutsetning.

**Filer/områder som skal undersøkes:**

- Ny migrering: `supabase/migrations/YYYYMMDDHHMMSS_help_requests_acknowledged_at.sql`
- Ny: `app/senior/history.tsx`
- `src/stores/appStore.ts` (selector for historikk)
- `src/services/helpRequests.ts`

**Hva som ikke skal røres:**

- Ikke endre `request_status`-enum.
- Ikke fjerne `seen_by_senior` (behold bakoverkompatibilitet).

**Testkommandoer:**

- `npm run typecheck`
- Migrering kjører lokalt og i preview-prosjekt.
- Test: senior ser besvarte forespørsler i historikk.

**Krav om oppsummering før commit:**

- Migrering er idempotent (`add column if not exists`).
- Liste over endrede selektorer.

**Anbefalt commit-melding:** `feat(senior): tidligere svar-skjerm med acknowledged_at`

### 13.11 Prompt: Skill varsel-dismiss fra svar/arkivering

**Mål:** «Sett»-knappen i svar-skjerm setter `acknowledged_at`,
men sletter ikke svaret. Selve svaret er fortsatt synlig i
«Tidligere svar».

**Filer/områder som skal undersøkes:**

- `app/senior/answer.tsx`
- `src/services/helpRequests.ts` (`acknowledgeAnswer`-funksjon)
- `src/stores/appStore.ts` (`selectUnseenAnswer`)

**Hva som ikke skal røres:**

- Ikke endre `markAnswerSeen` semantikk (behold som fallback,
  eller juster forsiktig).
- Ikke endre eskalering ennå.

**Testkommandoer:**

- `npm run typecheck`
- Test: senior trykker «Sett», banner forsvinner, svar fortsatt
  i historikk.
- Test: eskalering stopper (krever F-024 — kan utsettes).

**Krav om oppsummering før commit:**

- Skjermbilder.
- Bekreft at ingen andre flyter er brutt.

**Anbefalt commit-melding:** `fix(senior): Sett-knapp setter acknowledged_at uten å slette svar`

### 13.12 Prompt: Forbered «Min familie»-flate lettversjon

**Mål:** Lag en enkel «Min familie»-skjerm for senior med liste
over alle pårørende i gruppen. Hver rad har navn + ring-knapp +
melding-knapp. Avatar er valgfri (initialer i farget sirkel
holder i lettversjon).

**Filer/områder som skal undersøkes:**

- Ny: `app/senior/family.tsx`
- `app/senior/home.tsx` (legg til navigering)
- `src/stores/appStore.ts` (selector for pårørende-liste)
- `src/components/Avatar.tsx` (eller opprett ny enkel komponent)

**Hva som ikke skal røres:**

- Ikke implementere bildearkiv ennå.
- Ikke implementere «Spør om hjelp»-per-kontakt ennå.

**Testkommandoer:**

- `npm run typecheck`
- Test: senior ser alle pårørende i en liste, kan ringe en og
  sende melding til en.

**Krav om oppsummering før commit:**

- Bekreft at hjem-skjermen fortsatt har maks 4 hovedvalg
  («Spør familien», «Min familie», «Min dag», «Ring familien»).
- Skjermbilder.

**Anbefalt commit-melding:** `feat(senior): Min familie-flate lettversjon med kontaktkort`

### 13.13 Prompt: Forbered subscription_status-datamodell uten å aktivere betaling

**Mål:** Legg til `subscription_status` og relaterte felter på
`family_groups`-tabellen. Sett mors gruppe til `manual_review` så
hun fortsetter å ha tilgang. Ikke koble på Stripe ennå.

**Filer/områder som skal undersøkes:**

- Ny migrering: `supabase/migrations/YYYYMMDDHHMMSS_family_groups_subscription_status.sql`
- `src/lib/database.types.ts` (regenererte typer)
- `src/services/familyGroups.ts` (selector for status)

**Hva som ikke skal røres:**

- Ikke koble på Stripe.
- Ikke implementere sperreskjerm (separat prompt).
- Ikke endre eksisterende RLS for andre felter.

**Testkommandoer:**

- `npm run typecheck`
- Migrering kjører idempotent.
- Manuell SQL: `update family_groups set subscription_status = 'manual_review' where id = '<mors_gruppe_id>';`

**Krav om oppsummering før commit:**

- Migrering inkluderer: `subscription_status`, `billing_admin_user_id`,
  `trial_end`, `current_period_end`, `created_by` (alle nullable).
- RLS: kun service_role kan oppdatere disse feltene.
- Bekreft at ingen eksisterende test feiler.

**Anbefalt commit-melding:** `feat(db): subscription_status på family_groups (uten Stripe)`

### 13.14 Prompt: Lag nøytral lisens-sperreskjerm uten kjøpslenke

**Mål:** Vis en rolig, nøytral skjerm når `subscription_status`
ikke er aktiv, trialing, eller manual_review. Skjermen skal ikke
inneholde pris, kjøpsknapp, eller lenke til `familieknappen.app`.

**Filer/områder som skal undersøkes:**

- Ny: `app/no-license.tsx`
- `app/_layout.tsx` (auth-gate utvides med lisens-sjekk)
- `src/stores/appStore.ts` (selector for status)

**Hva som ikke skal røres:**

- Ikke koble til Stripe.
- Ikke endre sign-in-flyt.
- Ikke endre rolle-baserte routings.

**Testkommandoer:**

- `npm run typecheck`
- Test: sett en test-konto til `expired`, sjekk at sperreskjermen
  vises.
- Test: mors konto (`manual_review`) ser vanlig flyt.

**Krav om oppsummering før commit:**

- Tekstinnhold: «Ingen aktiv lisens er knyttet til denne kontoen.
  Ta kontakt med familieadministratoren.»
- Ingen lenke til web, ingen pris.
- Logg ut-knapp tilgjengelig.

**Anbefalt commit-melding:** `feat: nøytral sperreskjerm for inaktiv lisens (uten kjøpslenke)`

**Ikke kjør disse prompterne ennå:** Stripe-integrasjon, videochat,
skritteller, full ringekjede, inbound-deling.

---

## 14. Konklusjon og anbefalt neste steg

### 14.1 Hva bør gjøres først

1. **Verifiser Resend SMTP + DNS for `familieknappen.app`.** Uten
   denne stopper alt — OTP-koden må komme fram. (F-003, F-004 +
   Prompt 13.1.)
2. **Tilpass Supabase e-postmal med `{{ .Token }}`.** Lavhengende
   frukt — tar minutter.
3. **Fast send-knapp + stor sendebekreftelse + kamera som
   hovedflyt.** Den enkelt-største brukerinnsikten fra
   funksjonstesten. (F-005, F-006, F-007 + Prompt 13.2, 13.3.)
4. **«Ring familien» virker eller skjules.** Plus «Prøv neste».
   (F-008, F-009 + Prompt 13.4.)
5. **Banner/svar auto-dismisses ikke + senior-tekstgjennomgang.**
   (F-010, F-011 + Prompt 13.5, 13.6.)

Etter disse fem rundene kan Andreas bygge ny APK (Prompt 13.1)
og gjøre go/no-go-testen med mor (F-013 + Prompt 13.8).

### 14.2 Hva bør vente

Disse skal **ikke** gjøres i Fase 0:

- Stripe / betalingsintegrasjon (Fase 3).
- Skritteller / bevegelse (Fase 3 eller V2).
- Full VoIP-ringekjede (V2).
- Videochat (V2).
- Stemmestyrte handlinger (V2).
- Inbound-deling / share-extension (Fase 2).
- Bildearkiv (Fase 2 eller V2).
- Adminportal (Fase 4).
- Penetrasjonstest (Fase 4).
- Lokalisering, dark mode (Fase 4).

Disse skal **ikke** gjøres i Fase 1 (funksjonell MVP):

- Faktisk Stripe-betaling.
- Sentry/Error Boundaries (gjør Error Boundaries hvis raskt,
  ellers Fase 2).
- Konto-/datasletting.
- DPIA.

Felles for begge faser: **ikke** introduser nye produktområder
(bildearkiv, skritteller, stemmestyring, videochat) før kjerne-
flyten er bekreftet stabil i drift.

### 14.3 Største risiko

**Teknisk:**

- OTP/Resend ikke konfigurert riktig → mor kommer ikke inn.
- Database Webhooks ikke aktive → push fungerer ikke i Fase 0.
- Senior-auth-modell ikke avklart før Fase 1 → må bygges om.
- OneDrive-baserte filhåndteringsproblemer i utviklingssettet
  (truncation av Edit/Write) → krever bash-heredoc-disiplin.

**Produktmessig:**

- Send-knapp / kamera / ringe-knapp er ikke testet med faktisk
  senior i ny APK — vi vet ikke at fiksene faktisk fungerer for
  mor før hun prøver.
- «Min familie»-flate skapes uten avatar-storage → kan oppleves
  tom.
- Tekstene blir teknisk-tonet uten en grundig gjennomgang.

**Kommersielt:**

- App Store-policy-strategi («Existing Account / External
  Subscription Management» eller «Reader app») er **uavklart
  juridisk risiko**.
- Senior-målgruppen kan klassifiseres som sårbar → strengere
  personvernkrav enn vanlig.
- Skritteller-data kan klassifiseres som helsedata (Art. 9) →
  tar tid med advokat.
- Konkurrenter eller etablerte aktører (familie-apper, trygghets-
  produkter) kan presse pris/positioning.

### 14.4 Raskeste vei til god mor/senior-test

1. Andreas: konfigurer Resend SMTP og DNS for
   `familieknappen.app`. Tilpass e-postmal.
2. Codex (én runde): fast send-knapp, stor bekreftelse, kamera som
   hovedflyt. (Prompt 13.2 + 13.3 kan kombineres.)
3. Codex (én runde): «Ring familien» virker eller skjules, manuell
   «Prøv neste». (Prompt 13.4.)
4. Codex (én runde): banner auto-dismisses ikke, senior-tekster
   gjennomgås. (Prompt 13.5 + 13.6.)
5. Codex (én runde): ny preview-APK. (Prompt 13.1.)
6. Andreas: installer APK på mors enhet, gå gjennom go/no-go-skjema
   (Prompt 13.8). Vær til stede første gang.
7. Mor bruker appen i 7–14 dager. Andreas observerer / fikser
   småting.

Estimert kalendertid: 1–2 uker hvis Andreas har 2–4 timer per
dag tilgjengelig, ingen overraskelser i EAS-build, og Resend-
oppsett går på første forsøk.

### 14.5 Raskeste vei til funksjonell MVP

Forutsetter at Fase 0 har vært stabil i minst 1–2 uker hos mor.

1. Avgjør senior-auth-modell (F-015). **Krever en beslutning fra
   Andreas + Claude.**
2. Bygg paringskode-tabell + RPC + skjerm (F-016, F-017).
3. Bygg `subscription_status`-felt + sperreskjerm (F-018, F-019,
   F-020 + Prompt 13.13, 13.14).
4. Bygg «Min familie»-flate lettversjon (F-025 + Prompt 13.12).
5. Bygg «Legg til avtale» for senior (F-026 + Prompt 13.9).
6. Bygg «Sett»-knapp + «Tidligere svar»-historikk (F-021, F-022,
   F-023 + Prompt 13.10, 13.11).
7. Bygg «varsle alle»-ringekjede (F-029).
8. Sentral feilhåndtering for kalender-CRUD (F-028).
9. RLS-revisjon (F-033).
10. Verifiser Database Webhooks og pg_cron (F-030, F-031).
11. Onboarding-veiviser for pårørende (F-032).
12. Begrenset rollout: 5–10 familier, manuell support.

Estimert kalendertid: 4–8 uker hvis Codex kan kjøre 2–3 prompter
per uke og Andreas har tid til review og test.

### 14.6 Raskeste vei til betalt pilot

Forutsetter at Fase 1 har vært stabil i 2–4 uker med 5–10
familier.

1. Bygg web-portal `familieknappen.app` med Stripe Hosted Checkout
   (F-046). **Dette er et nytt prosjektspor** — krever beslutning
   om plattform (Next.js, statisk side med Stripe, annet) og kan
   ikke gjenbruke React Native-koden direkte.
2. Bygg `stripe-webhook` Edge Function (F-047).
3. Koble lisens-sjekk i mobilapp mot reell Stripe-sub (F-048).
4. Avklar App Store-policy-strategi (F-049). **Krever ekstern
   App Store-rådgiver.**
5. Signer databehandleravtaler (F-040). **Krever leverandørenes
   prosess — kan ta uker.**
6. Personvernerklæring + brukervilkår advokat-gjennomgått
   (F-038, F-039).
7. DPIA fullført (separat ikke-listet arbeid).
8. Error Boundaries + Sentry (F-034, F-035).
9. Konto-/datasletting (F-036).
10. Dataeksport (F-037).
11. Versjonsmerket samtykke (F-041).
12. Begrenset rollout: 10–30 familier, dokumentert support-flyt.

Estimert kalendertid: **3–6 måneder** etter at Fase 1 er stabil,
fordi web-portal, databehandleravtaler og advokat-arbeid alle har
egne ledetider som ikke kan parallelliseres helt.

---

## Stopp etter seksjon 14

Dokumentet er nå ferdig på dette nivået. Seksjonene 1–14 dekker:

1. Kort oppsummering og risikobilde.
2. Arkitektur.
3. Funksjonsstatus.
4. Mangler før kommersiell MVP.
5. Spesifikke funksjonsendringer som bør planlegges.
6. Datamodell og Supabase-plan.
7. UX-plan for seniorvennlighet.
8. Sikkerhet, personvern, GDPR og plattformrisiko.
9. Funksjonstest med seniorbrukere — konsekvenser for MVP og
   fullføringsplan.
10. Teknisk og kommersielt veikart (Fase 0–4).
11. Fordeling av arbeidsoppgaver mellom Claude, Codex, ChatGPT
    og Andreas.
12. Prioritert backlogg med 49 oppgaver (P0–P3).
13. 14 første konkrete Codex-prompter.
14. Konklusjon og anbefalt neste steg.

Neste skritt er **ikke** å implementere alt. Andreas må velge
hvilke 1–2 prompter som skal kjøres først, og om noen av
beslutningene i 14.5 (særlig senior-auth-modell) skal tas før
Codex starter på P1.
