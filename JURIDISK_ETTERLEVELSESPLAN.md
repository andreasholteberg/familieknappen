# Juridisk etterlevelsesplan – Familieknappen

**Status: faglig utkast.** Dokumentet er strukturert slik en personvern-
spesialist ville lagt opp arbeidet, men er skrevet av en KI-assistent og er
ikke juridisk rådgivning. Det skal gjennomgås av advokat med personvern som
spesialfelt før betalt pilot (jf. fullføringsplanen § 8.3). Punkter advokaten
særlig må ta stilling til er merket **[ADVOKAT]**.

**Distribusjonspakke 2026-07-02:** Operative GDPR-dokumenter for ekstern beta og senere betalt pilot ligger i docs/legal/: distribusjonssjekkliste, ROPA, DPIA-utkast, DPA-register, avviksrutine, rettighetsrutine, samtykkekompetanse, sletting/tredjepartsdata, leverandørdashboard-sjekkliste, advokatspørsmål og distribusjonsrapport. Disse dokumentene er arbeidsgrunnlag før advokatgjennomgang, ikke juridisk godkjenning.

---

## 1. Faktum: hva tjenesten gjør

Familieknappen formidler hjelpespørsmål (tekst/bilde) fra en eldre bruker til
en lukket familiegruppe, med svar, delt kalender, frivillig «sist aktiv»-
status og push-varsler. Ingen stedsdata, ingen helsedata i nåværende versjon,
ingen profilering eller automatiserte avgjørelser. Data lagres hos Supabase
(database/auth/filer), e-post sendes via Resend, push formidles via Expo.
Sletting med 30 dagers angrefrist og samtykkelogging per dokumentversjon er
implementert i appen.

## 2. Roller og ansvar (art. 4, 24, 26, 28)

- **Behandlingsansvarlig:** utgiveren av Familieknappen (i pilot: Andreas
  Holteberg / AH Digital). Må angis med fullt navn, org.nr. og kontaktpunkt i
  personvernerklæringen før ekstern pilot. **[ADVOKAT]** Vurder om
  selskapsform bør være på plass før betalt tjeneste (ansvarsbegrensning).
- **Databehandlere:** Supabase Inc. (database, auth, lagring), Resend Inc.
  (e-postutsending), Expo (Exponent Inc., push-formidling). Alle krever
  databehandleravtale (art. 28(3)) – se § 7.
- **Husholdningsunntaket** (art. 2(2)(c)) gjelder familiens egen bruk, men
  IKKE utgiveren: vi drifter en tjeneste og er fullt ansvarlige.
- **Pårørende er ikke felles behandlingsansvarlige** i normal bruk – de er
  brukere. **[ADVOKAT]** Bekreft denne vurderingen; EU-praksis om
  «administrator-brukere» er i utvikling.

## 3. Behandlingsoversikt og rettslig grunnlag (art. 6)

| # | Behandling | Opplysninger | Grunnlag | Merknad |
|---|---|---|---|---|
| B1 | Kontoadministrasjon og innlogging | navn, e-post, OTP-koder | Art. 6(1)(b) (avtale) | Nødvendig for å levere tjenesten |
| B2 | Hjelpespørsmål og svar | meldinger, bilder, svar | Art. 6(1)(b) | Kjernen i tjenesten |
| B3 | Delt kalender | avtaler, tidspunkt | Art. 6(1)(b) | |
| B4 | Telefonnummer for ringefunksjon | telefonnr. | Art. 6(1)(b) | Frivillig felt |
| B5 | «Sist aktiv»-deling | tidsstempel for appbruk | Art. 6(1)(a) (samtykke) | Egen toggle, av/på når som helst; default-verdi bør vurderes **[ADVOKAT]** |
| B6 | Push-varsler | Expo-token, varslingslogg | Art. 6(1)(b) + (f) for logg | Loggen (90 dg) begrunnes i feilsøking/sikkerhet (berettiget interesse – interesseavveining bør dokumenteres) |
| B7 | Paringskoder og forsøkslogg | koder, bruker-ID, tidspunkt | Art. 6(1)(f) (sikkerhet) | 30 dg sletting; misbruksvern |
| B8 | Samtykkelogg | versjon + tidsstempel | Art. 6(1)(c) (dokumentasjonsplikt) | |
| B9 | Sletting med angrefrist | deletion_requested_at | Art. 6(1)(c) (art. 17) | |

**Særlige kategorier (art. 9):** behandles ikke i dag. MEN: innholdet i
bilder/meldinger kan inneholde alt mulig (f.eks. helseopplysninger i et brev
fra sykehuset). Vurderingen er at utgiveren ikke *tilsikter* slik behandling
og ikke bruker innholdet til noe; dette er standard «bruker-generert
innhold»-argumentasjon. **[ADVOKAT]** Bekreft, og vurder en setning om dette
i erklæringen. Fremtidig skritteller/bevegelse (F-050) vil sannsynligvis være
helsedata → eksplisitt samtykke + DPIA før bygging.

## 4. Sårbar brukergruppe

Målgruppen (eldre, potensielt med redusert digital eller kognitiv kapasitet)
er en sårbar gruppe i GDPR-forstand. Konsekvenser:

- **Klarspråk-krav forsterkes** (art. 12): dokumentene holdes korte, store
  bokstaver i appen, viktigste poeng først. Implementert.
- **Samtykkets gyldighet:** for B5 (aktivitetsdeling) må senior selv kunne
  forstå og endre valget – toggelen ligger derfor i seniorens eget UI, ikke
  bare hos pårørende. Implementert.
- **Samtykkekompetanse:** hvis senior har redusert samtykkekompetanse, kan
  ikke pårørende gyldig samtykke på vegne av senior uten rettslig grunnlag
  (fremtidsfullmakt/vergemål). **[ADVOKAT]** Dette er den viktigste enkelt-
  problemstillingen for produktet: definer hva appen krever av pårørende ved
  oppsett (egenerklæring?) og hva som skjer ved tvil.
- **Asymmetri-vern:** pårørende skal ikke kunne overvåke senior i det
  skjulte. Dagens design (ingen GPS, aktivitetsdeling styrt av senior,
  synlige funksjoner) støtter dette og bør være et designprinsipp med
  veto-kraft i fremtidige funksjoner.

## 5. DPIA (art. 35)

Terskelvurdering: behandlingen omfatter (i) sårbar gruppe og (ii) en viss
systematisk monitorering («sist aktiv»). To av ni EDPB-kriterier tilsier at
**DPIA bør gjennomføres før betalt/ekstern pilot** – ikke nødvendigvis fordi
den er lovpålagt for dagens funksjonalitet, men fordi terskelen uansett
krysses idet bevegelses-/aktivitetsfunksjoner (F-050) eller eskalerings-
automatikk utvides. Anbefaling: gjennomfør en forenklet DPIA nå (mal:
Datatilsynets), full DPIA før F-050. **[ADVOKAT]** Bekreft terskelvurdering.

## 6. Informasjonsplikt og rettigheter (art. 12–22)

- Art. 13-informasjon: dekkes av personvernerklæringen i appen (v2026-06-16).
- Innsyn (15): i pilot manuelt via henvendelse; data er synlige i appen.
- Retting (16): navn/telefon kan endres i appen; e-post via support.
- Sletting (17): selvbetjent i appen med 30 dagers angrefrist. Merk:
  innhold senior har sendt til gruppen slettes med kontoen (kaskade).
  **[ADVOKAT]** Vurder om svar/meldinger FRA andre i samme tråd berøres
  (tredjeparts data i samme forespørsel).
- Portabilitet (20): manuell eksport i pilot (F-037); knapp senere.
- Innsigelse (21): relevant for B6/B7 (berettiget interesse) – håndteres
  via support i pilot.
- Automatiserte avgjørelser (22): forekommer ikke. Eskalering er varsling,
  ikke en avgjørelse med rettsvirkning – bør likevel beskrives. Gjort.

## 7. Databehandleravtaler og tredjelandsoverføring (art. 28, kap. V)

| Leverandør | Rolle | Avtale | Overføring |
|---|---|---|---|
| Supabase | DB/auth/lagring | DPA aksepteres i dashbord/vilkår – arkiver kopi | Velg/bekreft EU-region for prosjektet. **[ANDREAS]** Verifiser region for prosjektet `vjddppqsbrafcywwjnpf` |
| Resend | E-post | DPA fra leverandør – arkiver | US-selskap: krever overføringsgrunnlag (EU-US Data Privacy Framework eller SCC). **[ADVOKAT]** Verifiser sertifiseringsstatus på avtaletidspunktet |
| Expo | Push | DPA/vilkår – arkiver | Som over. Merk: push-innhold inneholder fornavn («X ber om hjelp») – vurder å minimere til «Familien trenger deg» **[PRODUKT]** |

Handling: arkiver signerte/aksepterte DPA-er samlet (F-040), noter
overføringsgrunnlag per leverandør i ROPA.

## 8. Protokoll (ROPA, art. 30)

Behandlingstabellen i § 3 + lagringstidene utgjør kjernen i protokollen.
Den føres som levende dokument (dette dokumentet + F-056-utvidelse).
Lagringstider implementert i kode: varslingslogg 90 dg, paringsdata 30 dg,
kontosletting 30 dg angrefrist, innhold = kontoens levetid.

## 9. Sikkerhet (art. 32) – implementert og gjenstående

Implementert: radnivå-sikkerhet (RLS) på alle tabeller med skriftlig
revisjon, privat bildelagring med signerte URL-er (1 t), kolonnenivå-vern av
lisensfelter, engangs paringskoder med utløp og bruteforce-brems,
JWT-verifisering på brukerkallbare funksjoner, hemmelighet på cron-endepunkt,
TLS overalt (leverandørstandard), ingen service-nøkler i klient.
Gjenstående før betalt pilot: sentral feillogging uten persondata (F-035),
pgTAP-tester av RLS, signaturverifiserte webhooks, penetrasjonstest (F-055).

## 10. Avviks- og bruddrutiner (art. 33–34)

Pilot-rutine (må formaliseres): (1) oppdag/varsle – alle henvendelser til
utgiver; (2) vurder risiko for de registrerte; (3) meld Datatilsynet innen
72 timer hvis ikke usannsynlig risiko; (4) varsle berørte ved høy risiko –
i praksis familiegruppene i appen + e-post; (5) loggfør alt, også brudd som
ikke meldes. **[ANDREAS]** Skriv én side beredskapsrutine (F-057) med
kontaktpunkter (Supabase status, Resend, Datatilsynets meldeskjema).

## 11. Markedsføring og avtaleinngåelse

Pårørende er kjøper (betaler på web, Fase 3): forbrukerkjøps- og
angrerettsregler gjelder for abonnementet (angrerettloven – digital tjeneste,
14 dager med unntak ved uttrykkelig samtykke til umiddelbar levering).
**[ADVOKAT]** Utform kjøpsvilkår for web-portalen i Fase 3. Markedsføring må
ikke utnytte frykt («svindel-skrekk») overfor sårbar gruppe – tonen «få hjelp
før du svarer» er også markedsrettslig fornuftig.

## 12. Milepæler per fase

**Nå (mor-pilot):** dette dokumentet + dokumentene i app (gjort), arkiver
DPA-er, bekreft Supabase-region, skriv beredskapsrutine på én side.
**Før ekstern/lukket beta:** advokatgjennomgang av dokumentene, forenklet
DPIA, samtykkekompetanse-rutine, support-e-post i tekstene.
**Før betalt pilot:** kjøpsvilkår web, angrerett-flyt, Sentry med scrubbing,
dataeksport-rutine testet, DPA-arkiv komplett (F-040), versjonert samtykke i
drift (gjort teknisk).
**Før kommersiell lansering:** full DPIA ved nye funksjoner, ROPA komplett
(F-056), penetrasjonstest (F-055), beredskapsplan øvd (F-057).

## 13. Samlet vurdering

Den tekniske personvern-implementasjonen ligger foran dokumentasjonen –
sletting, samtykkelogging, dataminimering og tilgangsstyring er bygget.
Hovedrisikoen er ikke teknisk, men (i) samtykkekompetanse i målgruppen,
(ii) manglende formalisering (DPA-arkiv, DPIA, beredskap) og (iii) at
fremtidige funksjoner (bevegelse, bilder av tredjepersoner/barnebarn) har
vesentlig høyere terskel enn dagens. Ingen av delene blokkerer mor-piloten.

