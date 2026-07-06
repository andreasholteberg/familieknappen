# Claude-brief: GDPR og sosial kobling i Familieknappen

Du er Claude og skal hjelpe Andreas med å vurdere Familieknappen på produkt-, UX-, GDPR- og kommersielt nivå. Du skal ikke skrive kode. Du skal ikke anta at appen allerede er juridisk compliant. Du skal levere vurderinger, prioriteringer og konkrete beslutningspunkter som Codex senere kan implementere etter Andreas sin godkjenning.

## Kontekst

Familieknappen er en Expo / React Native-app med Supabase, Supabase Auth, Supabase Storage, Supabase Edge Functions, Resend SMTP, Expo Push, GitHub og EAS. Appen brukes av seniorer og pårørende i en lukket familiegruppe.

Pårørende er kjøper, administrator og primær markedsføringsmålgruppe. Senior er bruker og skal slippe komplisert oppsett. Appen skal ikke være nødtjeneste, skjult overvåking eller en kilde til uro.

Nylige tiltak inkluderer OTP-login, RLS, privat bildelagring, signed URLs, bildekomprimering/metadatareduksjon, dataminimerte push-varsler, aktivitetsdeling opt-in, versjonert samtykke, 30 dagers sletting, purge-funksjon, paringskodeflyt, GDPR-dokumentpakke, Error Boundary, status-stripe og APK-preview-testløp.

## Oppdrag

Analyser hvordan Familieknappen kan være GDPR-robust samtidig som appen gir friksjonsfri sosial kobling mellom senior og pårørende.

Vurder særlig hvordan appen kan være varm, enkel og trygg uten at GDPR-tiltakene gjør opplevelsen kald, tung eller skremmende.

## 1. Overordnet produktbalanse

Vurder:

- hvordan Familieknappen kan unngå at GDPR gjør appen kald og juridisk tung
- hvor lav friksjon som er forsvarlig
- hvilke personverntiltak som bør være usynlige for senior
- hvilke personverntiltak som må forklares eksplisitt
- hvordan kommersielle mål kan forenes med dataminimering

## 2. Seniorens opplevelse

Vurder:

- hva senior skal se
- hva senior bør slippe å administrere
- hvordan samtykke kan forklares uten juridisk språk
- hvordan appen unngår overvåkingsfølelse
- hvordan sosial kontakt kan føles varm, trygg og hverdagslig
- hvordan appen bør formulere at den ikke er nødtjeneste uten å skremme

## 3. Pårørendes opplevelse

Vurder:

- hvordan oppsett kan gjøres friksjonsfritt
- hvordan pårørende kan administrere uten å overstyre senior
- hvordan trygghet kan kommuniseres uten fryktmarkedsføring
- hvordan praktisk hjelp og sosial kontakt bør balanseres
- hvilke oppgaver pårørende naturlig bør eie
- hvilke valg senior selv bør bekrefte

## 4. Bildedeling og familiestrøm

Vurder om bildedeling er riktig neste produktløft etter stabil APK-test.

Ta stilling til:

- GDPR-risiko
- bilder av barn, barnebarn og tredjepersoner
- lagring, sletting, innsyn og eksport
- samtykke og berettiget interesse
- privathet og RLS
- lavfriksjons-UX
- verdi for daglig bruk
- om bildedeling bør være Standard, Pluss eller senere premium

## 5. Aktivitetsstatus

Vurder:

- formuleringen “brukt appen i dag”
- opt-in som standard
- om pårørende får nok verdi uten presise tidsstempler
- om senior forstår hva som deles
- hvor funksjonen bør ligge i UI
- hva som bør dokumenteres juridisk

## 6. Push-varsler

Vurder:

- dataminimert tekst
- forståelighet på låseskjerm
- når push bør brukes
- når push bør unngås
- om appen gir nok kontekst etter åpning
- hvordan push kan være trygg uten å avsløre sensitive detaljer

## 7. Samtykke og onboarding

Vurder:

- pårørende-first onboarding
- senior-paring med kode
- versjonert samtykke
- samtykkekompetanse
- hva advokat må vurdere
- hvordan samtykke kan gjøres varmt og enkelt
- hva som må skje hvis senior ikke fullt ut forstår appen

## 8. Kommersielt veikart

Foreslå:

- hva som bør gjøres før ekstern beta
- hva som bør vente til betalt pilot
- hva som bør vente til V2 eller premium
- hva som ikke bør bygges
- hvilke funksjoner som styrker daglig bruk uten å øke personvernrisiko for mye

## 9. Konkret leveranse

Lever:

- 10 anbefalte beslutninger
- 10 ting som bør unngås
- topp 10 neste oppgaver
- hvilke oppgaver Codex bør gjøre
- hvilke oppgaver Andreas må gjøre manuelt
- hvilke punkter advokat må se

## Viktige grenser

- Ikke skriv kode.
- Ikke anta at appen er juridisk compliant.
- Ikke anbefal overvåkingsfunksjoner uten sterk personvernvurdering.
- Foreslå minst mulig friksjon som fortsatt er forsvarlig.
- Skill tydelig mellom “må før ekstern beta”, “må før betalt pilot” og “kan vente”.
