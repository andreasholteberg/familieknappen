# Fase 2B-leveranse – personvern, vilkår og versjonsmerket samtykke

F-038, F-039 og F-041 fra planens § 12 (P2). Statisk verifisert:
`tsc --noEmit` grønn, SQL parser mot Postgres-grammatikken.

> **Viktig forbehold:** Tekstene er UTKAST skrevet for å beskrive faktisk
> funksjonalitet i appen. De er ikke juridisk rådgivning og må gjennomgås av
> advokat før betalt pilot (som planen også forutsetter, § 8.3).

## Hva som er gjort

**F-038/F-039 – Personvernerklæring og brukervilkår (utkast)**
- Én kilde til sannhet: `src/content/legal.ts` med versjonskonstanter.
  Tekstene er forankret i det appen faktisk gjør: hvilke data som lagres
  (profil, meldinger/bilder, kalender, aktivitet, push-tokens), databehandlere
  (Supabase, Resend, Expo), lagringstider (90/30 dager, 30 dagers
  slettefrist), rettigheter (innsyn, retting, sletting i appen,
  dataportabilitet, Datatilsynet), og «assistanse, ikke garanti»-forbeholdet
  inkludert 113-henvisning i vilkårene.
- To lesbare skjermer i appen (`/privacy-policy`, `/terms`) med stor tekst og
  tilbake-knapp, lenket fra pårørende-innstillinger, seniorens
  personvernskjerm og samtykkeskjermen.
- `PERSONVERN.md` og `VILKAR.md` generert fra samme kilde – klare til å
  publiseres på familieknappen.app.

**F-041 – Versjonsmerket samtykke**
- Migrering `20260616100000_versioned_consent.sql`: `consented_terms_at`,
  `consented_privacy_at`, `terms_version`, `privacy_version` på `profiles`.
- Ny rolig samtykkeskjerm (`/consent`): lenker + én stor «Jeg godtar».
  Auth-gaten viser den når brukerens lagrede versjon ikke matcher gjeldende –
  altså én gang per bruker, og på nytt bare ved vesentlige endringer
  (bump versjonen i `legal.ts`).
- Samtykket logges med tidsstempel og versjon på brukerens profil
  (RLS: kun egen).

## Må gjøres manuelt
1. Kjør migreringen (db push / combined_setup.sql).
2. Ny APK når dere vil ha det på enhet (ren JS/SQL-endring).
3. Publiser `PERSONVERN.md`/`VILKAR.md` på familieknappen.app når dere vil.

## Testpunkter
1. Eksisterende bruker logger inn → samtykkeskjermen vises én gang →
   «Jeg godtar» → vanlig flyt. Logg ut/inn → vises ikke igjen.
2. Bump `LEGAL_VERSIONS.terms` i `legal.ts` (test) → skjermen kommer tilbake.
3. Lenkene fra innstillinger/personvern åpner dokumentene med tilbake-knapp.
4. Sjekk i Supabase at `terms_version`/`privacy_version` settes på profilen.

## Merknader og forslag videre
1. **Kontaktpunkt i tekstene** er bevisst generelt («via familieknappen.app»).
   Sett inn en faktisk support-e-post når den finnes (P2: support-flyt).
2. **Mor-piloten:** samtykkeskjermen dukker opp én gang også for henne –
   nevn det for henne, eller godta sammen neste gang dere ses.
3. **Dataeksport (F-037)** er nevnt i erklæringen som «kontakt oss»-rutine
   (manuell i pilot, slik planen legger opp til). En eksport-knapp i appen
   kan bygges senere.
4. Neste fra planen når mor-piloten er stabil: bildedeling (produktvarme)
   eller web-portal/Stripe-sporet (Fase 3).
