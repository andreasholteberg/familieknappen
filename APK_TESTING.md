# APK/PWA-testing for Familieknappen

Dette dokumentet er en nøktern neste-fase-sjekkliste. Målet er kontrollert testing på Android, ikke produksjonssetting.

## Dette fungerer nå

- GitHub Pages web-test kjører på `https://andreasholteberg.github.io/familieknappen`.
- Lokal web-test kjører normalt på `http://localhost:8081`.
- Supabase magic link fungerer på web via `https://andreasholteberg.github.io/familieknappen/auth-callback`.
- Expo web-export bygger statisk til `dist/` med base path `/familieknappen`.
- Supabase URL og anon/publishable key hentes fra `EXPO_PUBLIC_SUPABASE_URL` og `EXPO_PUBLIC_SUPABASE_ANON_KEY`.

## Dette er ikke produksjonsklart

- GitHub Pages er bare en testdeploy, ikke en produksjonsplattform for appen.
- Ingen aggressiv service worker-cache er lagt inn, med vilje, fordi auth-flowen ikke skal caches feil.
- PWA-test er fortsatt web i browser. Den er ikke det samme som en installert native Android-app.
- Push, eskalering, feilhåndtering, domene, logging og produksjonssikkerhet må vurderes separat.

## Web/PWA-test på Android

1. Åpne `https://andreasholteberg.github.io/familieknappen` i Chrome på Android.
2. Send magic link fra samme browser-kontekst.
3. Åpne magic link i samme browser hvis mulig. PKCE kan feile hvis lenken åpnes i en annen app/browser-kontekst enn den som startet innloggingen.
4. Test senior- og pårørende-flyten:
   - login
   - rolle/ruting etter login
   - invitasjon
   - opprette eller bruke familiegruppe
   - sende forespørsel
   - svare på forespørsel
5. Eventuell "Legg til på startsiden" tester PWA-opplevelse, men bruker fortsatt web-callback.

GitHub Pages web/PWA bruker:

```text
https://andreasholteberg.github.io/familieknappen/auth-callback
https://andreasholteberg.github.io/familieknappen/invite
```

## APK-test på Android

Når en faktisk APK er installert, blir native deep links relevante. Da kan appen bruke:

```text
familieknappen://auth-callback
familieknappen://invite
```

Disse scheme-lenkene er først nyttige når Android-appen faktisk er installert og registrerer `familieknappen` som scheme. GitHub Pages-testen bruker ikke disse til web-login.

Før APK-test:

- Sjekk at EAS preview-build får `EXPO_PUBLIC_SUPABASE_URL` og `EXPO_PUBLIC_SUPABASE_ANON_KEY`.
- Sjekk at Supabase Redirect URLs inneholder både web-callbacks og native scheme-lenker.
- Sjekk at Android package/scheme i `app.json` er riktig.
- Kjør `npm run typecheck` og `npm run build:web` før du bygger.
- Test magic link på egen Android før lenken sendes til andre.
- Test bildevalg/kamera, lagring i Supabase Storage og at forespørselen vises for pårørende.

## Tre ulike testnivåer

### A. GitHub Pages web/PWA-test

- Bruker offentlig HTTPS-webadresse.
- Bruker web-callback under `/familieknappen/auth-callback`.
- Egner seg for rask flyttest på telefon uten APK.
- Avslører ikke alle native Android-problemer.

### B. Android APK med native deep links

- Bruker installert app.
- Kan bruke `familieknappen://auth-callback` og `familieknappen://invite`.
- Krever EAS/Android-build med riktige env-vars.
- Må testes for Android-lenkeåpning, kamera/bildevalg og app-livssyklus.

### C. Senere produksjonsdeploy

- Bør ha eget domene, tydelig auth-konfig, vurdert caching, logging og feilmonitorering.
- Bør skille test/prod Supabase-konfig og data.
- Bør ha en egen beslutning for PWA, native APK eller begge deler.
