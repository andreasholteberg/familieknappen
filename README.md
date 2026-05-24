# Familieknappen – Expo/React Native + Supabase

Mobil-MVP for «Familieknappen»: en trygghetsapp der en eldre bruker kan trykke én
stor knapp – **«Spør familien»** – ta bilde av en melding eller situasjon hun er usikker
på, og sende den til en pårørende før hun svarer eller handler.

> **Styringsprinsipp:** Hvis en funksjon ikke styrker kjerneøyeblikket
> *«Jeg er usikker → jeg får hjelp raskt»*, skal den ikke bygges.

Fra og med **Lag 3** kjører hele kjerneflyten på **Supabase** (auth, database,
storage, realtime) – mocklaget er fjernet. Se **`LAG3_SUPABASE.md`** for full
teknisk rapport (tabeller, RLS, sikkerhet, neste lag).

---

## Kom i gang

Du trenger [Node.js](https://nodejs.org) (LTS), appen **Expo Go** (eller en
simulator), og et **Supabase-prosjekt**.

### 1. Sett opp Supabase

```bash
cp .env.example .env      # fyll inn EXPO_PUBLIC_SUPABASE_URL og _ANON_KEY
```

Kjør deretter databaseoppsettet (idempotent) – velg én av delene:

- **Raskt:** Supabase Dashboard → SQL Editor → lim inn `supabase/combined_setup.sql`
  og kjør. Kjør så `supabase/seed.sql` for demodata (kun dev).
- **CLI:** `supabase link --project-ref <ref>` og `supabase db push`
  (`supabase db reset` kjører også `seed.sql` lokalt).

I Supabase → Authentication → URL Configuration: legg til appens deep link som
Redirect URL (f.eks. `familieknappen://auth-callback` + Expo-dev-varianten).

### 2. Start appen

```bash
npm install        # eller: npx expo install
npx expo start -c
```

Skann QR-koden med Expo Go. Logg inn med **magisk lenke**. Demodata gir brukerne
`astrid@example.no` (senior), `anne@example.no` (primær), `per@example.no` (sekundær).

---

## Mappestruktur

```
familieknappen-app/
├── app/                      # Skjermer (Expo Router, filbasert navigasjon)
│   ├── _layout.tsx           # Rot-oppsett: starter auth, fanger deep links
│   ├── index.tsx             # Auth-gate: ruter etter innlogging + profil-rolle
│   ├── sign-in.tsx           # Innlogging med magisk lenke (passordløst)
│   ├── senior/               # Seniorens skjermer (hjem, ask, answer, day)
│   └── relative/             # Pårørendes skjermer (dashboard, request, calendar, …)
├── src/
│   ├── lib/supabase.ts       # Supabase-klient (feiler hardt uten .env)
│   ├── theme/theme.ts        # Farger, typografi, spacing (rolig palett, stor tekst)
│   ├── types/
│   │   ├── models.ts         # Domenemodeller brukt av skjermene
│   │   └── database.types.ts # DB-typer som speiler SQL-schemaet
│   ├── services/             # Rent datalag (komponenter kaller aldri Supabase direkte)
│   │   ├── auth.ts · group.ts · profiles.ts
│   │   ├── helpRequests.ts · helpResponses.ts
│   │   ├── calendar.ts · activity.ts · storage.ts
│   │   ├── realtime.ts · mappers.ts · index.ts
│   ├── store/useAppStore.ts  # Zustand: Supabase-backed, realtime + polling
│   └── components/           # BigButton, Screen, Card, QuickReply, StatusBadge ...
├── supabase/
│   ├── migrations/           # 12 idempotente migreringer (schema, RLS, storage, realtime)
│   ├── seed.sql              # Demodata (kun dev)
│   ├── combined_setup.sql    # Alle migreringer samlet for SQL Editor
│   └── config.toml           # Minimal CLI-konfig
├── .env.example
└── app.json · package.json · tsconfig.json · babel.config.js
```

## Slik testes hovedflyten

1. **Logg inn** som senior (`astrid@example.no`) via magisk lenke.
2. Trykk **«Spør familien»** → ta/velg bilde → velg kontakt → **Send**. Du ser
   *«Vent på svar før du gjør noe.»*
3. Logg inn som pårørende (`anne@example.no`) på en annen enhet/økt. Den nye
   forespørselen dukker opp på dashbordet (realtime) → åpne → svar med hurtigsvar
   eller fritekst.
4. Tilbake hos senior viser hjemskjermen **«Se svar fra familien»**.

## Viktig avgrensning

Familieknappen er **assistanse, ikke en garanti**. Appen lover ikke å avsløre svindel.
Språket unngår «svindelsjekk» og absolutte «trygg/utrygg»-dommer, og bruker formuleringer
som *«Spør noen du stoler på»* og *«Få hjelp før du svarer»*.

## Neste lag (ikke i MVP)

Push-varsler, eskalering, ekte video/telefoni, onboarding/invitasjoner og persistente
innstillinger. Se `LAG3_SUPABASE.md` § 8.
