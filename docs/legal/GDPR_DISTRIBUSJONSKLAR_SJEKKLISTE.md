# GDPR distribusjonsklar sjekkliste - Familieknappen

**Status:** operativ sjekkliste per 2026-07-02. Dette er ikke juridisk rådgivning og betyr ikke at appen er juridisk godkjent. Punkter merket `[ADVOKAT]` skal vurderes av advokat med personvernkompetanse før betalt pilot.

## Status per fase

| Fase | Status | Vurdering |
| --- | --- | --- |
| Intern mor-pilot | OK med manuell kontroll | Teknisk personvern er langt på vei implementert: OTP, RLS, private buckets, signerte URL-er, 30 dagers sletting, versjonert samtykke, dataminimerte push-varsler i hovedflyten og opt-in aktivitetsdeling. |
| Ekstern/lukket beta | DELVIS | Krever DPA-arkiv, region-/dashboard-verifisering, forenklet DPIA, supportkontakt, avviksrutine og samtykkekompetanse-rutine. |
| Betalt pilot | ADVOKAT / DELVIS | Krever advokatgjennomgang, kjøpsvilkår/angrerett, dataeksport-rutine, DPA/overføringsgrunnlag og sentral feillogging med persondatascrubbing. |
| Kommersiell distribusjon | BLOKKERER | Krever full ROPA, full DPIA ved risikofunksjoner, pentest/RLS-tester, App Store/Google Play-personvernerklæringer og øvd avviksberedskap. |

## Må være på plass før ekstern beta

| Krav | Status | Kommentar |
| --- | --- | --- |
| Personvernerklæring i app og markdown | OK | `PERSONVERN.md` og `src/content/legal.ts` finnes. Versjon 2026-06-17 dekker familiebilder. |
| Brukervilkår i app og markdown | OK | `VILKAR.md` og `src/content/legal.ts` finnes. Appen beskrives som assistanse, ikke nødtjeneste. |
| Versjonert samtykke | OK | `profiles` har `consented_terms_at`, `consented_privacy_at`, `terms_version`, `privacy_version`. |
| Sletting med 30 dagers angrefrist | OK / MANUELL VERIFISERING | RPC og `purge-accounts` finnes. Cron og secrets må kontrolleres i Supabase Dashboard. |
| RLS på kjernedata | OK / MANUELL VERIFISERING | Migreringer finnes. Live database må verifiseres etter siste migrering. |
| Private Storage-buckets | OK / MANUELL VERIFISERING | `help-images` og `family-photos` er private i migreringene. Dashboard må bekreftes. |
| Aktivitetsdeling opt-in | OK etter lokal migrering | `20260618100000_privacy_hardening_standard.sql` setter default false og returnerer kun boolsk “brukt i dag”. Må migreres/verifiseres. |
| Avviksrutine | OK i dokumentpakke | `AVVIKSRUTINE.md` må tas i bruk operativt. |
| DPA-register | OK i dokumentpakke | Avtalene må faktisk arkiveres manuelt. |
| Supportkontakt | DELVIS | Appen har supportmail i innstillinger hvis konfigurert. Kontaktpunkt i juridiske tekster bør være konkret før ekstern beta. |
| Forenklet DPIA | OK som utkast | `DPIA_FAMILIEKNAPPEN.md` må fylles med endelige vurderinger og eier. |
| Samtykkekompetanse-rutine | ADVOKAT | Rutineutkast finnes, men senior/pårørende-ansvar må vurderes. |

## Må være på plass før betalt pilot

| Krav | Status | Kommentar |
| --- | --- | --- |
| Advokatgjennomgang av personvern/vilkår | ADVOKAT / BLOKKERER | Må gjøres før betaling. |
| Kjøpsvilkår og angrerett | ADVOKAT / BLOKKERER | Stripe/webbetaling er ikke bygget. Kjøpsflyt må ikke lanseres uten dette. |
| DPA-arkiv komplett | MANUELL VERIFISERING | Supabase, Resend, Expo, GitHub/EAS og senere Stripe. |
| Tredjelandsoverføringer dokumentert | ADVOKAT | DPF/SCC/status må vurderes på tidspunktet. |
| Dataeksport-rutine testet | DELVIS | Manuell eksport kan holde i pilot, men rutinen må testes. |
| Sentral feillogging uten persondata | MANGLER | Sentry/tilsvarende er ikke implementert. Må ha scrubbing og tilgangsstyring. |
| RLS-/storage-tester | MANGLER | pgTAP eller tilsvarende anbefales før betalt pilot. |
| Avviksberedskap øvd | MANGLER | Rutinen må prøves med tabletop-test. |
| Tredjepartsdata ved sletting av familietråder | ADVOKAT | Må avklares før større pilot. |

## Må være på plass før kommersiell lansering

| Krav | Status | Kommentar |
| --- | --- | --- |
| Full DPIA | BLOKKERER ved risikofunksjoner | Særlig ved skritteller/bevegelse, rik aktivitetslogg, video eller automatisert eskalering. |
| Komplett ROPA | DELVIS | Denne pakken gir et levende utkast. |
| Penetrasjonstest / sikkerhetsgjennomgang | MANGLER | Bør dekke Supabase RLS, Edge Functions, Storage og appklient. |
| App Store / Google Play Data Safety | MANGLER | Må fylles ut i tråd med faktisk databehandling. |
| Databehandler- og underdatabehandlerarkiv | MANUELL VERIFISERING | Må holdes oppdatert. |
| Backup/restore- og nedleggelsesrutine | MANGLER | Må beskrive hva som skjer med familiedata ved avvikling. |
| Kommersiell support- og henvendelsesrutine | MANGLER | Frister for rettighetskrav og sikkerhetshendelser. |

## Blokkerer distribusjon

| Distribusjon | Blokkere |
| --- | --- |
| Intern mor-pilot | Ingen juridiske blokkere funnet i repoet, forutsatt at migreringer og dashboard er riktig satt opp. |
| Ekstern beta | Manglende DPA-arkiv, manglende forenklet DPIA, manglende konkret supportkontakt, ikke-verifisert Supabase/Resend/Expo dashboard. |
| Betalt pilot | Manglende advokatgjennomgang, kjøpsvilkår/angrerett, DPA/overføringsgrunnlag, dataeksport-rutine og sentral sikkerhetslogging. |
| Kommersiell lansering | Manglende full DPIA ved nye risikofunksjoner, pentest, App Store/Google Play personvernoppsett, komplett ROPA og øvd avviksplan. |

## Blokkerer ikke distribusjon, men må dokumenteres

- Magic link/deep link som backup: ikke hovedflyt, men redirect-URL-er må fortsatt dokumenteres.
- GitHub Pages-test: ikke produksjonsdeploy, men kan inngå i testhistorikk.
- Familiegruppebilder: OK i pilot når bucket er privat og RLS fungerer, men bilder av tredjepersoner må omtales og vurderes.
- Appversjon/supportinfo: nyttig for pilot, ikke egen GDPR-blokker.
- Auto-eskalering: parkert i Standard etter `privacy_hardening_standard`; hvis aktivert senere, krever ny vurdering.

## Go/no-go

| Sjekk | Intern pilot | Ekstern beta | Betalt pilot | Kommersiell |
| --- | --- | --- | --- | --- |
| Apptekster stemmer med funksjon | GO | GO hvis supportkontakt konkretiseres | GO etter advokat | GO etter advokat |
| RLS/storage live-verifisert | GO hvis migrert | BLOKKERER hvis ikke verifisert | BLOKKERER | BLOKKERER |
| DPA-er arkivert | Kan vente | BLOKKERER | BLOKKERER | BLOKKERER |
| DPIA | Kan være utkast | Forenklet må finnes | Må være gjennomgått | Full ved risikofunksjoner |
| Sletting/purge testet | GO med kontroll | BLOKKERER hvis ikke testet | BLOKKERER | BLOKKERER |
| Advokatgjennomgang | Kan vente | Anbefalt | BLOKKERER | BLOKKERER |
| Betaling/Stripe | Ikke relevant | Ikke relevant | BLOKKERER hvis betaling aktiveres | BLOKKERER |

## Manuelle kontroller før neste eksterne test

1. Supabase: kjør/migrer `20260618100000_privacy_hardening_standard.sql` hvis ikke gjort.
2. Supabase: bekreft private buckets og RLS i Dashboard.
3. Supabase: bekreft `purge-accounts`-cron og Vault-secret.
4. Resend: bekreft domene, DPA og at OTP-mail ikke inneholder unødig data.
5. Expo/EAS: bekreft hvilke data Expo behandler for push/build.
6. GitHub/EAS: bekreft at secrets ikke skrives i logs.
7. Arkiver leverandøravtaler i et lokalt DPA-arkiv utenfor repoet.
8. Book advokatgjennomgang av punktene i `ADVOKATSPORSMAL.md`.

## Kilder/rammeverk

- GDPR art. 5, 6, 9, 12-22, 24, 25, 28, 30, 32, 33, 34, 35 og kapittel V.
- Datatilsynet: virksomhetenes plikter, DPIA, databehandleravtaler, protokoll, innebygd personvern og avvik.
