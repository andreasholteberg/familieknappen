# Fase 1.5-leveranse – stabilisering (F-058, F-059, F-061, F-064, F-066)

Stabiliseringsrunden fra planrevisjonen: ingen nye flater, bare robusthet
rundt det som er bygget. `tsc --noEmit` grønn, ny SQL parser.

## Hva som er gjort

**F-059 – CI + RPC-røyktest**
- `.github/workflows/ci.yml`: typecheck + build:web på hver push/PR til main
  (gjenbruker repo-vars for Supabase-nøkler, som pages-workflowen).
- `supabase/tests/rpc_smoke.sql`: røyktest av create_family_group,
  create_pairing_code, pair_with_code (riktig/feil/brukt kode, rollesetting),
  request/cancel_account_deletion og primær-kravet – i én transaksjon som
  rulles tilbake. Kjøres LOKALT: `supabase db reset` + `psql ... -f`.
  (Bevisst ikke i CI ennå – krever supabase start på runner; første kjøring
  bør verifiseres manuelt.)

**F-058 – Push-herding**
- Forgrunns-varsler: `setNotificationHandler` konfigurert (gammelt funn F10).
- Android-kanal med HIGH-prioritet (heads-up + lyd).
- **Deep-link fra varsel:** trykk på varsel åpner riktig skjerm – forespørsel
  hos pårørende (`/relative/request/[id]`), svar hos senior
  (`/senior/answer`), også ved kaldstart. Felles ruting i
  `routeForNotificationData()`.
- **Token-opprydding:** alle tre push-funksjonene (send-push, escalate,
  notify-call) sletter nå tokens som Expo melder som `DeviceNotRegistered` –
  døde enheter hoper seg ikke opp.

**F-064 – Supportkontakt i app**
- «Kontakt oss»-knapp i pårørende-innstillinger (HJELP-seksjon) som åpner
  e-postutkast med app-versjon ferdig utfylt. Adresse: konstant
  `SUPPORT_EMAIL` – bytt til dedikert support-adresse når den finnes.

**F-066 – Småvern**
- **Logout-vern:** «Logg ut» i headeren ber alltid om bekreftelse («Du
  trenger en ny kode på e-post for å logge inn igjen»).
- **Angre etter Sett:** «Jeg har sett svaret» viser nå «Sett ✓» med
  Angre-knapp (gjenoppretter banneret) i stedet for å hoppe rett hjem.
- **Velkomstskjerm for senior:** etter paring/invitasjon ser senior én rolig
  skjerm («Du er koblet til [familienavn] … Vent alltid på svar») før hjem.
  Pårørende rutes som før til veiviseren.

**F-061 – Android-pålitelighet**
- Nytt 4. steg i pårørende-veiviseren: godta varsler + batteriunntak på
  seniors telefon.
- `ANDROID_SJEKKLISTE.md`: full sjekkliste for oppsett og feilsøking av
  push på seniors telefon (Samsung/Xiaomi-fellene), med 2-minutters test.

## Må gjøres manuelt
1. Redeploy push-funksjonene: `supabase functions deploy send-push
   --no-verify-jwt`, samme for `escalate`; `notify-call` MED JWT.
2. Kjør RPC-røyktesten lokalt én gang og bekreft «ALLE RPC-RØYKTESTER OK».
3. Push til GitHub aktiverer CI – sjekk at første kjøring blir grønn
   (krever at repo-vars for Supabase-nøklene finnes, som i pages-workflow).
4. Ny APK for varsels-/deep-link-endringene.

## Testpunkter
1. Varsel i forgrunnen vises som banner (før: stille).
2. Trykk på varsel fra låseskjerm → riktig skjerm, også fra kaldstart.
3. Avinstaller appen på en testenhet, send forespørsel → raden i
   notification_tokens forsvinner etter første sendeforsøk.
4. «Logg ut» → bekreftelse; Avbryt beholder økten.
5. «Jeg har sett svaret» → «Sett ✓» med Angre → banneret er tilbake på hjem.
6. Par en senior → velkomstskjerm → «Vis meg appen» → hjem.
7. Veiviseren har 4 steg; siste handler om varsler/batteri.
