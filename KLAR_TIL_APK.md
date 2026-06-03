# Klar-til-APK – sjekkliste (Familieknappen, preview/APK)

Kryss av før du sender APK-en til moren din.

## A. Bygg-config (kreves – ellers feiler login i APK-en)
- [ ] Supabase-config gitt til builden (én av):
  - EAS-miljovariabler: `eas env:create --environment preview --name EXPO_PUBLIC_SUPABASE_URL …`
    og `… EXPO_PUBLIC_SUPABASE_ANON_KEY …`
  - ELLER `env`-blokk i `eas.json` under `preview`
- [ ] Verdien er **anon/publishable**-nokkelen (`sb_publishable_…` eller `eyJ…`), **ikke** `sb_secret_…`
- [ ] `eas.json` er committet og pushet (EAS bygger fra git)
- [ ] Android `package` valgt ved forste `eas build` (f.eks. `com.familieknappen.app`)

## B. Supabase (kreves for login + data)
- [ ] Migreringer pushet (`supabase db push`) – tabeller/RLS/funksjoner finnes
- [ ] Auth → URL Configuration → Redirect URLs inneholder **alle** disse:
      `familieknappen://auth-callback`, `familieknappen://invite`,
      `familieknappen:///auth-callback`, `familieknappen:///invite`
      (legg inn begge former – dobbel- og triple-slash – for å dekke alle Android-varianter)
- [ ] Storage-bucket `help-images` finnes og er privat
- [ ] (Anon-nokkelen er korrekt; en evt. lekket `sb_secret_` er rotert)

## C. For at moren din faktisk kan bruke appen
- [ ] Hun har en konto (logger inn med magisk lenke forste gang)
- [ ] Hun er medlem av en familiegruppe – enten:
  - hun oppretter en i appen (onboarding), eller
  - du inviterer henne fra Innstillinger → «Inviter familiemedlem»
- [ ] Riktig rolle: senior settes via SQL (invitasjon setter ikke `profiles.role`
      til senior ennaa). For ren senior-opplevelse: `profiles.role = 'senior'` +
      `family_members.member_role = 'senior'`.
- [ ] Det finnes minst én pårørende i gruppa (ellers har «Spør familien» ingen å sende til)

## D. Push og eskalering (valgfritt for forste test – kan komme etter)
- [ ] `eas`-build inkluderer `expo-file-system` (rebuild gjort etter at den ble lagt til)
- [ ] Edge Functions deployet: `send-push`, `escalate`
- [ ] Database Webhooks (INSERT på help_requests + help_responses → send-push)
- [ ] Cron som kaller `escalate` (for eskalering)
- [ ] `send-push` redeployet etter siste tekstendring («venter på svar fra familien»)

## E. Test selv FØR du sender
- [ ] Installer APK-en på din egen Android
- [ ] Logg inn (magisk lenke åpner appen, ikke en nettside som feiler)
- [ ] Opprett/koble familiegruppe
- [ ] Send en testforespørsel (tekst, bilde, og tekst+bilde)
- [ ] Bekreft i Supabase: rad i `help_requests`, og bilde > 0 bytes i `help-images`
- [ ] Svar fra en annen konto → senior ser svaret

## F. Bygg + send
```powershell
git add eas.json
git commit -m "eas: preview-miljo + apk"
git push
# sett config (A) hvis ikke gjort
eas build --profile preview --platform android
```
→ Send APK-lenken til moren din. Ingen dev-server, QR eller WiFi-krav.

## Hva feiler hvis du hopper over
- A: APK åpner, men «Supabase er ikke konfigurert» / login feiler.
- B (Redirect URLs): magisk lenke åpner en nettside som ikke laster, ikke appen.
- C (gruppe): hun lander på «Velkommen / opprett familiegruppe» eller kommer ikke videre.
- D: appen virker, men ingen push-varsler / ingen eskalering (in-app realtime virker fortsatt).
