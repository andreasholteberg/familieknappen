# Familieknappen testdeploy med GitHub Pages

Dette er en enkel offentlig HTTPS-test for Familieknappen. Den er ment for a teste appflyt pa din og din mors telefon, ikke som produksjonsdeploy.

## Hva prosjektet er

- Stack: Expo Router, React Native Web og Supabase.
- Package manager: npm (`package-lock.json` finnes).
- Lokal web-kommando: `npm run web`.
- Lokal dev-port: Expo bruker normalt `http://localhost:8081` for web her.
- Build-script: `npm run build:web`.
- Supabase-klient: `src/lib/supabase.ts`.
- Supabase env-vars: `EXPO_PUBLIC_SUPABASE_URL` og `EXPO_PUBLIC_SUPABASE_ANON_KEY`.
- PWA: `public/manifest.webmanifest`, uten service worker-cache.

## Hvorfor GitHub Pages passer

Appen er en statisk frontend som snakker direkte med Supabase fra klienten. Expo kan eksportere web til `dist/`, og GitHub Pages kan servere den katalogen.

Siden GitHub Pages server repoet under `/familieknappen`, er `app.json` satt med:

```json
"experiments": {
  "baseUrl": "/familieknappen"
}
```

Expo Router brukes videre. Jeg har ikke byttet routing til hash-routing. `dist/404.html` kopieres fra `dist/index.html` etter export for a gi en enkel fallback hvis en dyp klientrute apnes direkte.

Magisk lenke og invitasjonslenke bruker `src/utils/appLinks.ts`, slik at web-testen far `/familieknappen/...` mens native APK fortsatt bruker app-scheme.

## Lokalt

Installer avhengigheter hvis de ikke finnes:

```bash
npm install
```

Kjor appen lokalt:

```bash
npm run web
```

Forventet lokal URL:

```text
http://localhost:8081
```

Bygg statisk web:

```bash
npm run build:web
```

## Supabase Auth URL Configuration

Gaa til Supabase Dashboard -> Authentication -> URL Configuration.

For denne GitHub Pages-testen bruker du GitHub Pages som Site URL:

```text
Site URL:
https://andreasholteberg.github.io/familieknappen

Redirect URLs:
http://localhost:8081
http://localhost:8081/**
http://localhost:8081/auth-callback
http://localhost:8081/invite
https://andreasholteberg.github.io/familieknappen
https://andreasholteberg.github.io/familieknappen/**
https://andreasholteberg.github.io/familieknappen/auth-callback
https://andreasholteberg.github.io/familieknappen/invite
familieknappen://auth-callback
familieknappen://invite
```

Dette gjores manuelt i Supabase Dashboard:

```text
Authentication -> URL Configuration -> Site URL
Authentication -> URL Configuration -> Redirect URLs
```

## GitHub Pages

Workflowen ligger i `.github/workflows/pages.yml` og er manuell. Den deployer ikke automatisk pa push.

Forst, legg inn GitHub Actions repository variables:

```text
EXPO_PUBLIC_SUPABASE_URL
EXPO_PUBLIC_SUPABASE_ANON_KEY
```

Dette gjores i GitHub:

```text
Settings -> Secrets and variables -> Actions -> Variables -> New repository variable
```

Deretter aktiver Pages med GitHub Actions som kilde:

```text
Settings -> Pages -> Build and deployment -> Source -> GitHub Actions
```

Commit og push kildekoden nar du er klar:

```bash
git add .env.example .gitignore app.json app/+html.tsx app/relative/settings.tsx package.json src/lib/supabase.ts src/services/auth.ts src/utils/appLinks.ts public scripts .github DEPLOYMENT.md
git commit -m "Prepare GitHub Pages test deploy"
git push origin main
```

Ikke legg til `supabase/.temp/cli-latest` eller andre lokale cache/temp-filer.

Nar du vil publisere testversjonen etter push:

```text
Actions -> Deploy GitHub Pages -> Run workflow
```

Forventet offentlig test-URL:

```text
https://andreasholteberg.github.io/familieknappen
```

## Viktige avgrensninger

- Ikke legg service role, secret key eller andre private secrets i repoet.
- `EXPO_PUBLIC_*`-verdier blir offentlige i web-bundelen. Bruk bare Supabase URL og public anon/publishable key.
- Ingen service worker-cache er lagt inn na, slik at auth-flowen ikke risikerer a bli cachet feil.
- Dette er en testdeploy. Produksjon bor fa egen vurdering av auth, feilhaandtering, domene og caching.
