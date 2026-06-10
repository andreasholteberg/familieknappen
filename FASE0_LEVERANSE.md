# Fase 0-leveranse – senior-UX-fiksene fra funksjonstesten

Bygget etter `COMMERCIAL_APP_COMPLETION_PLAN.md` § 12 (P0) og § 14.1.
Dekker kodeoppgavene **F-005, F-006, F-007, F-008, F-009, F-010, F-011 og
F-014**. Statisk verifisert med `npm run typecheck` (grønn). Må testes på
ekte Android-enhet (preview-APK) før go/no-go med mor (F-013).

---

## Hva som er gjort

### F-005 + F-006 – Fast send-knapp og stor sendebekreftelse (`app/senior/ask.tsx`)

- Spør-flyten har nå et **fast handlingsfelt nederst** på skjermen, visuelt
  adskilt fra innholdet (egen bakgrunn + skillelinje). Innholdet scroller,
  knappen står stille.
- På siste trinn heter knappen **«SEND TIL FAMILIEN»** (stor BigButton,
  godt over 56 pt høy, hvit på brand-blå ≈ 4.9:1 kontrast).
- Trinn 3 er nå en **se-over-og-send-oppsummering** (bilde + melding +
  mottaker) – en naturlig to-trinns-bekreftelse slik 9.1.1 anbefaler.
- Etter sending vises en **fullskjerm-bekreftelse** i rolig grønn:
  «Meldingen er sendt» + «Vent på svar før du gjør noe.» Den forsvinner
  ikke av seg selv – senior må selv trykke «Tilbake til hjem».
- Opplastingslogikken (`uploadHelpImage`, `createHelpRequest`) er urørt.

### F-007 – Kamera som hovedflyt (`app/senior/ask.tsx`)

- Trinn 1 starter nå med en **stor «Ta bilde»-knapp** (primær-variant).
- «Velg bilde fra telefonen» er nedgradert til en **liten tekstlenke**
  (klart mer enn dobbel størrelsesforskjell).
- Meldingsfeltet ligger **etter** kamera-valget og er tydelig merket som
  valgfritt. Ingen tekster refererer til skjermbilde.

### F-008 + F-009 – «Ring familien» virker eller skjules

- Ny hjelpefil **`src/utils/phone.ts`**: normaliserer nummer, bygger
  `tel:`-URL og åpner ringeappen via `Linking`.
- Ny skjerm **`app/senior/call.tsx`**: stort kontaktkort + «Ring {navn}»
  som ringer primærkontakten med vanlig telefon. Etter et ringeforsøk
  vises **«Fikk du ikke svar? – Prøv neste: {navn}»** som ringer neste
  pårørende med telefonnummer. Senior styrer selv kjeden (ingen automatikk).
- Hjem-skjermen og «Min dag» viser **bare** ring-knappen hvis minst én
  pårørende har telefonnummer – ellers er den helt borte. Aldri «kommer ennå».
- Svar-skjermens «Ring {navn}» ringer nå faktisk svareren via `tel:`
  (skjules hvis vedkommende mangler nummer).
- Pårørendes hurtigsvar «Jeg ringer deg» forsøker nå å åpne ringeappen
  mot seniors nummer; mangler nummer vises en rolig beskjed i stedet.

> **Viktig for mor-piloten:** `profiles.phone` må være utfylt for
> pårørende (og helst senior). Det finnes ingen UI for dette ennå – legg
> inn via Supabase (SQL/Table editor) før testen. Se forslag nr. 1 nedenfor.

### F-010 – Banner/svar auto-dismisses ikke (`app/senior/answer.tsx`)

- `markAnswerSeen` kalles **ikke** lenger automatisk fra `useFocusEffect`.
- Ny eksplisitt knapp **«Jeg har sett svaret»** kvitterer og går hjem.
  «Tilbake» lar senior gå ut uten å kvittere – kortet på hjem-skjermen
  blir stående. Klar til å kobles mot `acknowledged_at` i P1 (F-021/F-022).

### F-011 – Senior-tekstgjennomgang (endrede strenger, før → etter)

| Hvor | Før | Etter |
| --- | --- | --- |
| ask, trinn 1 | «Trinn 1: Hva lurer du på?» + «Skriv en kort melding, ta et bilde – eller begge deler.» | «Hva lurer du på?» + «Ta et bilde av meldingen eller brevet.» |
| ask, plassholder | «Skriv en kort melding (valgfritt) – f.eks. ‘Er denne ekte?’» | «F.eks. ‘Er denne ekte?’» (med ledetekst «Du kan også skrive en melding:») |
| ask, trinn 2 | «Trinn 2: Hvem vil du spørre?» | «Hvem vil du spørre?» |
| ask, trinn 3 | «Trinn 3: Send» + «Vi sender dette til X. X ser på det og svarer deg.» | «Se over og send» + «X får dette og svarer deg.» |
| ask, send-knapp | «Send til X» (med 📨) | «SEND TIL FAMILIEN» |
| ask, feil | «Vi fikk ikke sendt forespørselen. Sjekk at du har internett, og prøv igjen.» | «Vi fikk ikke sendt meldingen. Prøv igjen.» |
| ask, bekreftelse | «Sendt til X» + «Vent på svar før du gjør noe. 🙏» | «Meldingen er sendt» + «Vent på svar før du gjør noe.» |
| ask, validering | «Skriv en kort melding eller ta et bilde.» | «Ta et bilde eller skriv en kort melding.» |
| answer | «Ferdig»-knapp (auto-kvitterte) | «Jeg har sett svaret» + «Tilbake» |
| sign-in (feil) | «Innlogging ga ingen aktiv sesjon.» | «Innloggingen ble ikke fullført. Prøv igjen.» |

Ingen senior-tekst er over 2 linjer, og ingen inneholder teknisk sjargong
(nettverk/server/sesjon/token). `privacy.tsx` og `day.tsx` var allerede i
riktig tone og er kun endret der ring-knappen byttet adferd.

### F-014 – «Kommer ennå»-tekster fjernet

- `app/senior/index.tsx`: ring-placeholder erstattet med ekte ring/skjul.
- `app/senior/day.tsx`: samme.
- `app/senior/answer.tsx`: samme.
- `app/relative/request/[id].tsx`: «Ringefunksjonen er ikke koblet på ennå»
  erstattet med ekte `tel:`-forsøk; **«Start videosamtale»-knappen er
  fjernet helt** (var ren placeholder).
- `grep` bekrefter: ingen «kommer ennå» / «ikke koblet på» / «ikke
  tilgjengelig ennå» igjen i UI-strenger.

---

## Verifisering

- `npm run typecheck` → grønn (ingen feil).
- Placeholder-grep → tom.
- **Gjenstår på enhet** (kan ikke verifiseres herfra): kamera-tillatelse,
  `tel:`-åpning på Android, layout på liten skjerm, hele F-001–F-004
  (APK, OTP, Resend, e-postmal), F-012 (push ende-til-ende) og F-013
  (go/no-go med mor).

## Forslag til forbedringer (utenfor denne leveransen)

1. **Telefonnummer-UI (anbefalt som neste lille kodeoppgave).** F-008/F-009
   er avhengige av `profiles.phone`, men hverken pårørende eller senior kan
   legge inn nummer i appen. Et felt i pårørende-innstillingene («Mitt
   telefonnummer») er liten kode og fjerner et SQL-steg før mor-piloten.
2. **Ukommittert OTP-arbeid.** Endringene i `sign-in.tsx`,
   `src/services/auth.ts`, `authErrors.ts`, `app/_layout.tsx` m.fl. lå
   ukommittert i arbeidstreet. De bør committes (og bygges inn i ny APK)
   før mor-testen, ellers er det uklart hva APK-en faktisk inneholder.
3. **Dobbel `refresh()` ved oppstart** (INITIAL_SESSION + eksplisitt kall
   i store) – ufarlig, men dobbel henting ved hver innlogging. Lavthengende.
4. **«Gjør primær»-knappen** i pårørende-innstillinger vises også for
   ikke-primærkontakter og feiler da med RLS-melding. Bør skjules (kjent
   svakhet fra plan § 2.5) – én linje med `iAmPrimary`.
5. **Kalender-CRUD er fortsatt fire-and-forget** (feil vises ikke i UI).
   Planlagt som F-028 (P1) – ikke gjort nå, men verdt å fremskynde hvis
   kalenderen skal brukes aktivt i mor-piloten.
6. **`escalation`-status på hjem-skjermen** sier «Vi prøver å få tak i
   familien» også når eskalering ikke er konfigurert (cron mangler, F-031).
   Hvis eskalering er av i pilot, vurder å vise «Familien har fått
   spørsmålet ditt» uansett, så teksten aldri lover noe appen ikke gjør.
7. **Ringeforsøk er usynlige for familien.** «Ring familien» bruker
   `tel:` – pårørende får ingen signal hvis de ikke ser anropet. F-029
   («varsle alle» med push, P1) dekker dette; frem til da er det verdt å
   nevne i go/no-go-skjemaet at ubesvarte anrop ikke logges i appen.
