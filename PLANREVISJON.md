# Planrevisjon – vurdering av COMMERCIAL_APP_COMPLETION_PLAN.md

Kritisk gjennomgang av fullføringsplanen mot faktisk tilstand i koden
(per commit `ff9bdd5`), med forslag til utbedringer for at appen skal være
optimal når planen er fullført.

---

## 1. Overordnet vurdering

Planen er uvanlig god på tre ting: den skiller ærlig mellom «verifisert i
kode», «dokumentert» og «må verifiseres»; den har testkriterier per oppgave;
og den lar brukerinnsikt (funksjonstesten, § 9) overstyre tidligere
antakelser. Faseinndelingen 0–4 med go/no-go-sjekklister er riktig metode.

Hovedproblemet er ikke kvalitet, men **drift**: planen er et øyeblikksbilde
fra før Fase 0 ble bygget, og virkeligheten har løpt forbi den. I tillegg
har den tre systematiske skjevheter: (i) enkelte oppgaver omtales i prosa
men mangler backlogg-ID og faller dermed ut av styringen, (ii) kvalitets-
infrastruktur (CI, tester) kommer for sent i løpet, og (iii) retensjons-/
varmefunksjoner er identifisert som viktige (§ 9.1.7–9.1.8) men aldri
forpliktet i veikartet.

## 2. Status-drift: planen undervurderer hvor langt prosjektet er kommet

Faktisk fullført, men står som åpent i planen:

- **Hele P0-kodelisten** (F-005–F-011, F-014) + OTP verifisert på enhet.
- **Nesten hele P1:** F-015 (besluttet: kode + e-post-OTP), F-016/F-017
  (paringskode), F-018/F-019/F-020 (lisens + sperreskjerm), F-021–F-024,
  F-025–F-029, F-032, F-033 (RLS-revisjon med to rettede funn).
  Gjenstår av P1: kun F-030/F-031 (dashbord-verifisering – gjort i røyktest)
  – og påfølgende drift.
- **Store deler av P2:** F-034 (Error Boundaries), F-036 (sletting m/
  angrefrist), F-038/F-039 (dokumentutkast), F-041 (versjonert samtykke),
  F-045 (status-stripe). I tillegg juridisk etterlevelsesplan (delvis F-056).
- **Flere «robust senere»-punkter fra § 5:** DB-styrt eskaleringsfrist,
  eskaleringsstopp ved svar, datahygiene/cron, kolonnenivå-vern av
  lisensfelter, lukket family_groups-insert.

**Utbedring 2.1:** Re-baseline backloggen: legg til en Status-kolonne
(DONE/ÅPEN/UTGÅR) i § 12, dater den, og slett/arkiver prompter i § 13 som er
utført. En plan der 60 % av punktene reelt er ferdige, men står som åpne,
mister styringsverdi og skjuler hva som faktisk gjenstår.

**Utbedring 2.2:** Flytt sannhetskilden for status til leveransenotatene
(FASE*-filene) eller inn i planen – ikke begge. Anbefaling: kort
«Statuslogg»-seksjon øverst i planen som peker på notatene.

## 3. Hull som bør tettes for «optimal app»

### 3.1 Oppgaver omtalt i prosa uten backlogg-ID (faller ut av styringen)

- **Push-herding** (§ 5.4 «før betalt pilot»: rydding av ugyldige tokens
  via Expo-receipts, token-rotasjon ved app-start, varslingskanaler,
  deep-link fra varsel til riktig skjerm). Ingen F-ID. Dette er den mest
  sannsynlige kilden til «appen virker ikke»-opplevelser i drift.
- **Domenebytte til familieknappen.app** for web (§ 2.2/2.7: baseUrl,
  manifest, redirect-URLs). Ingen F-ID, men juridiske dokumenter henviser
  nå til domenet.
- **«Angre» etter Sett** og **velkomstskjerm for senior etter paring**
  (§ 7.2) – små, men nevnt som krav uten ID.
- **Logout-vern for senior** (§ 7.1: bekreftelse før utlogging) – viktig
  fordi utlogget senior = død app til noen hjelper.

### 3.2 Kvalitetsinfrastruktur kommer for sent

Planen legger automatiserte tester (F-042) og CI i Fase 2+, men koden
endres raskt nå. Ett regresjonsuhell i mor-piloten koster mer tillit enn
CI koster å sette opp. **Utbedring:** GitHub Actions som kjører
`typecheck` + `build:web` på hver push (1 time arbeid), og 3–5
integrasjonstester for RPC-ene (pair_with_code, create_pairing_code,
request_account_deletion) mot lokal Supabase – før neste funksjonsrunde,
ikke i Fase 2.

### 3.3 Produkthull planen ikke ser

- **Én pårørende, to foreldre.** Datamodellen tillater flere gruppe-
  medlemskap, men appen antar ett (`getMyGroupId` tar første;
  `pair_with_code` avviser medlemskap i ny gruppe). En datter med mor OG
  far i hver sin gruppe er et helt normalt kommersielt tilfelle. Må minst
  besluttes (støtte gruppebytte i UI, eller dokumentere begrensningen) før
  betalt pilot – å bygge det om senere blir dyrere.
- **Bildedeling er strategisk underprioritert.** § 9.1.8 identifiserer det
  som sterk retensjonsdriver, men veikartet forplikter seg aldri («Fase 2
  eller V2», modellvalg utsatt). For en app som skal åpnes daglig av senior
  er dette trolig den viktigste enkeltinvesteringen etter kjerneflyten.
  **Utbedring:** velg enkleste modell nå (felles «Bilder fra familien»-
  strøm, gjenbruker help-images-mønsteret) og tidfest til Fase 2-start.
- **Android-pålitelighet for push** hos eldre: varslingstillatelse
  (Android 13+), batterioptimalisering som dreper bakgrunnsprosesser på
  Samsung/Xiaomi, og «Ikke forstyrr». Planen nevner kanaler, men ikke en
  sjekkliste/veiledning for pårørende ved oppsett av seniors telefon.
- **Tilgjengelighet:** planen har skriftstørrelser, men ingen revisjon mot
  TalkBack/systemtekstskalering (mange seniorer har 130 %+ systemtekst).
  Én a11y-gjennomgang i Fase 2 er billig og treffer målgruppen direkte.
- **Supportkontakt i app** ligger i Fase 4 (§ 8.4), men beta-go/no-go
  (§ 9.5) krever supportkanal. En mailto-lenke i innstillinger er 30
  minutter arbeid – gjør det nå.

### 3.4 Mindre presiseringer

- `past_due`-adferd er uavklart i § 5.6 (grace eller sperre) – dagens kode
  gir tilgang. Anbefal: behold grace, men vis rolig varsel til
  billing-admin. Beslutt og noter.
- `manual_review_reason`-feltet fra § 5.6 ble aldri innført – nyttig for
  intern oversikt over gratis-familier. Liten migrering.
- Senior uten e-post forblir uløst (bevisst F-015-valg). Behold som kjent
  begrensning, men mål det i pilot: hvis >20 % av interesserte familier
  faller av her, må anonym-auth-sporet gjenåpnes i Fase 2.

## 4. Foreslåtte nye backlogg-punkter

| ID | Tittel | Fase | Begrunnelse |
|---|---|---|---|
| F-058 | Push-herding: receipts, token-rydding, rotasjon ved app-start, kanaler, deep-link fra varsel | Fase 1.5 (nå) | § 5.4-prosa uten ID; største driftsrisiko |
| F-059 | CI: typecheck + build:web på push, RPC-integrasjonstester | Fase 1.5 (nå) | Kvalitetsgulv før videre bygging |
| F-060 | Beslutning + ev. støtte for flere familiegrupper per pårørende | Beslutning nå, bygg Fase 2 | Normalt kommersielt tilfelle |
| F-061 | Android-pålitelighetssjekkliste (varslingstillatelse, batteri, DND) i veiviser/dokumentasjon | Fase 1.5 | Push-frafall hos målgruppen |
| F-062 | Tilgjengelighetsrevisjon (TalkBack, tekstskalering 130 %+) | Fase 2 | Målgruppekritisk, billig |
| F-063 | Bildedeling MVP: felles strøm, samtykketekst, privat bucket | Fase 2-start | Retensjon; allerede identifisert i § 9.1.8 |
| F-064 | Supportlenke i app (mailto + FAQ-side) | Nå | Beta-krav; 30 min |
| F-065 | Domenebytte web til familieknappen.app (baseUrl, manifest, redirect-URLs) | Før beta | Juridiske dokumenter henviser dit |
| F-066 | Logout-vern senior + «Angre» etter Sett + velkomstskjerm etter paring | Fase 1.5 | § 7.1/7.2-krav uten ID |
| F-067 | past_due-adferd + manual_review_reason | Fase 3-forberedelse | Avklaring før Stripe |

## 5. Justert rekkefølge (anbefaling)

1. **Nå, mens mor-piloten løper (Fase 1.5 – stabilisering):** F-059 (CI),
   F-058 (push-herding), F-064 (support), F-066 (småvern), F-061
   (Android-sjekkliste). Ingen nye flater – bare gjøre det bygde robust.
2. **Fase 2 (beta):** F-063 (bildedeling) som trekkplaster, F-060, F-062,
   F-065, F-035 (Sentry), F-042 (E2E-tester), advokatgjennomgang av
   dokumentene, DPIA-utkast.
3. **Fase 3 (betalt):** uendret fra planen (web-portal + Stripe + DPA-er) –
   planens vurderinger her er fortsatt riktige, inkludert Android-først.
4. **Fase 4:** uendret.

## 6. Konklusjon

Planen er et sterkt styringsdokument som har gjort jobben sin – så godt at
den er utdatert. Med re-baseline (§ 2), ti nye backlogg-punkter (§ 4) og en
innskutt stabiliseringsfase (§ 5) beskriver den en app som ved fullført plan
ikke bare er trygg og compliant, men også noe familien faktisk åpner hver
dag – som er forutsetningen for at alt det andre skal bety noe.
