# Leveranse: «Bilder fra familien» (F-063) + F-043-notat

Fremskyndet fra Fase 2 etter ønske fra pilot-seniorene (plan § 9.1.8),
besluttet med Andreas. Additiv funksjon – kjerneflyten er urørt.
`tsc` grønn, SQL parser, RPC-røyktesten er uendret gyldig.

## Hva som er bygget
- **Migrering `20260617100000_family_photos.sql`**: tabellen `family_photos`
  + privat bucket `family-photos`. RLS: gruppemedlemmer ser/sender; avsender
  (eller primærkontakt) kan slette. Kontosletting kaskaderer egne bilder.
- **Service/store**: opplasting med samme robuste base64-mønster som
  hjelpebilder (rad først, fil etterpå, opprydding ved feil), signerte
  URL-er, siste 30 bilder lastes med øvrig gruppedata.
- **Pårørende**: ny «Bilder»-fane – velg/ta bilde, kort hilsen, send; egne
  bilder kan slettes; «Del bare bilder du har lov til å dele»-påminnelse
  (personvernhensynet fra § 9.1.8).
- **Senior**: «Bilder fra familien» med store, varme bildekort (hilsen +
  avsender + tid), inngang øverst i «Min familie» med antall som hint.
- **Personvernerklæringen** dekker nå delte familiebilder; privacy-versjonen
  er bumpet til 2026-06-17 → alle får samtykkeskjermen én gang (ett trykk).

## I tillegg (fra kronologi-vurderingen)
- `INNSENDING_FORUNDERSOKELSE.md` (F-043): anbefaler Android share-intent i
  Fase 2, fraråder e-postinnsending; iOS-deling venter.
- Nytt testpunkt for mor-piloten: **diktering** – trykk mikrofonen på
  tastaturet i meldingsfeltet («Spør familien») og snakk. Finnes gratis i
  systemtastaturet; verifiser at det fungerer på mors telefon (§ 9.1.6).

## Lagringsoptimalisering (tillegg)
- **Nedskalering ved opplasting:** alle bilder (hjelpebilder + familiebilder)
  skaleres nå til maks 1280 px før opplasting (`expo-image-manipulator`) –
  ~150–300 KB i stedet for 1–3 MB. Feiler nedskaleringen brukes originalen.
- **Signert-URL-cache (45 min):** bilde-URL-er gjenbrukes mellom
  oppdateringer, så telefonens bildecache faktisk virker. Uten dette lastet
  appen bildene på nytt hvert 20. sekund (polling) – en egress-feller på
  Supabase-kvoten. Cachen tømmes ved utlogging.
- Konsekvens: gratis-planen (1 GB lagring / 5 GB egress) holder romslig for
  piloten; Pro-planen holder for hundrevis av familier.

## Må gjøres manuelt
1. Kjør migreringen (db push / combined_setup.sql).
2. Ny APK – **kreves nå uansett**: `expo-image-manipulator` er en ny native
   modul.

## Testpunkter
1. Pårørende sender bilde med hilsen → vises i fanen; senior ser det stort
   under Min familie → Bilder fra familien.
2. Slett eget bilde → borte hos alle. Andres bilder kan ikke slettes (uten
   å være primær).
3. Annen familie ser ingenting (RLS – verifiser med testkonto).
4. Samtykkeskjermen dukker opp én gang etter oppdateringen (ny versjon).
5. Diktering i meldingsfeltet på mors telefon.
