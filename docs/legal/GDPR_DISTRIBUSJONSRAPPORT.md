# GDPR distribusjonsrapport - Familieknappen

**Status:** samlet rapport per 2026-07-02. Rapporten gjør ikke appen juridisk “godkjent” eller GDPR-compliant. Den beskriver hvor langt repoet og rutinene er kommet før advokatgjennomgang.

## 1. Sammendrag

Familieknappen har et relativt sterkt teknisk personvernfundament for intern pilot: Supabase RLS, private Storage-buckets, signerte bilde-URL-er, OTP-login, 30 dagers sletting, versjonert samtykke, paringskoder med utløp/rate limiting, dataminimerte push-varsler i hovedflyt og en ny hardening-migrering som gjør aktivitetsdeling opt-in og skjuler presise aktivitets-tidspunkt for andre gruppemedlemmer.

Det som ikke er ferdig er primært formalisering: DPA-arkiv, DPIA sign-off, ROPA som levende dokument, avviksrutine i drift, manuell dashboardverifisering, dataeksport-rutine og advokatgjennomgang. Før betaling må også kjøpsvilkår/angrerett og Stripe-sporet vurderes.

## 2. Hva som er klart

- OTP-login som hovedflyt; magic link/deep link er backup.
- Personvernerklæring og brukervilkår finnes i markdown og appinnhold.
- Versjonert samtykkeskjerm finnes.
- Konto-/datasletting med 30 dagers angrefrist finnes.
- `purge-accounts` finnes og sletter også bildeobjekter i Storage.
- RLS finnes på kjernetabeller.
- `help-images` og `family-photos` er definert som private buckets.
- Familiebilder har opplaster/primærkontakt-sletting.
- Bilder re-enkodes til JPEG og originalmetadata lastes ikke opp i lokal kode.
- Push for hovedflyt er nøytralisert.
- Paringskoder er 6-sifrede, engangs, 15 minutter, med forsøksteller.
- Activity Standard-hardening finnes som migrering og kode: opt-in og boolsk “brukt i dag”.

## 3. Hva som mangler

- Verifisering av at siste migrering er kjørt i live Supabase.
- DPA-arkiv med Supabase, Resend, Expo/GitHub/EAS.
- Dokumentert overføringsgrunnlag/tredjeland.
- Forenklet DPIA ferdigstilt og signert.
- Advokatgjennomgang.
- Dataeksport-rutine testet i praksis.
- Sentry/sentral logging med scrubbing.
- pgTAP/RLS-testdekning.
- Tabletop-test av avviksrutine.
- Konkret behandlingsansvarlig/supportkontakt i juridiske tekster før ekstern beta.

## 4. Hva som må gjøres manuelt

- Supabase Dashboard: region, buckets, RLS, Edge Function secrets, cron og logs.
- Resend: DPA, domene, DNS, OTP-template og leveringslogg.
- Expo/EAS: DPA/vilkår, push-innhold, build logs og env vars.
- GitHub: secrets, Actions logs og repo-status.
- Arkiver DPA-er og underdatabehandlerlister utenfor repoet.
- Gjennomfør test av sletting/purge med testbruker.
- Gjennomfør manuell dataeksport-test med testbruker.

## 5. Hva som krever advokat

- Samtykkekompetanse og pårørendes rolle.
- Tredjepartsdata i felles familiegruppe ved sletting.
- Brukergenerert innhold som kan inneholde helseopplysninger.
- Bilder av barn/barnebarn/tredjepersoner.
- DPA/DPF/SCC/tredjelandsoverføring.
- Kjøpsvilkår, angrerett og Stripe.
- App Store/Google Play-regler rundt betaling og personvernlabels.
- Ansvarsfraskrivelse: assistanse, ikke nødtjeneste.
- Markedsføring uten fryktpress.

## 6. Teknisk GDPR-verifisering

| Område | Status | Funn | Risiko | Anbefalt tiltak | Blokkerer distribusjon? |
| --- | --- | --- | --- | --- | --- |
| Auth | OK | OTP via `signInWithOtp` uten redirect i hovedflyt. | Lav | Verifiser Supabase Auth/SMTP manuelt. | Nei for intern pilot |
| Secrets | OK / MANUELL | Klient bruker bare `EXPO_PUBLIC_*`. Service role kun Edge Functions. | Middels hvis dashboard feil | Sjekk GitHub/EAS/Supabase secrets. | Ja for ekstern hvis uklart |
| RLS | DELVIS | Policyer finnes, men live DB og nye hardening-policyer må verifiseres. | Middels | Kjør migrering, legg til pgTAP senere. | Ja for ekstern hvis ikke verifisert |
| Storage | OK / MANUELL | Private buckets og signed URLs. | Middels | Bekreft bucket public=false live. | Ja hvis bucket offentlig |
| Bilder | OK i kode | Metadata fjernes ved re-enkoding; ingen originalfallback. | Lav/Middels | Test på Android etter ny APK. | Nei for intern pilot |
| Logging | DELVIS | Dev console kan logge feil; Edge logs kan ha error messages. | Middels | Scrubbing/Sentry før betalt pilot. | Ikke intern, delvis ekstern |
| Sletting | DELVIS | 30 dager og purge finnes. | Middels | Test med testbruker og cron. | Ja før ekstern/betalt hvis ikke testet |
| Push | DELVIS | Hovedvarsler nøytrale; escalation bruker navn, men Standard deaktiverer auto-eskalering. | Lav nå, høyere hvis aktivert | Dataminimer escalation før premium. | Ikke hvis deaktivert |
| Paringskoder | OK | Engangs, utløp, attempts. | Lav | Verifiser cleanup. | Nei |
| Aktivitetsstatus | OK etter migrering | Boolsk brukt-i-dag og opt-in. | Lav/Middels | Verifiser migrering i live DB. | Ja for ekstern hvis ikke migrert |
| Betaling | FREMTIDIG | Ikke bygget. | Høy hvis aktivert uten juridikk | Ikke bygg før Stripe/juridisk pakke. | Ja for betalt pilot |

## 7. Blokkerer ekstern beta

- Ikke-verifisert Supabase live-status for RLS/buckets/migreringer.
- Manglende DPA-arkiv og overføringsgrunnlag.
- Manglende forenklet DPIA sign-off.
- Manglende konkret supportkontakt/behandlingsansvarlig i dokumentene.
- `[ADVOKAT]` Samtykkekompetanse/pårørende-oppsett bør minst være foreløpig avklart.

## 8. Blokkerer betalt pilot

- Advokatgjennomgang ikke gjort.
- Kjøpsvilkår/angrerett/Stripe ikke avklart.
- Dataeksport ikke testet.
- Sletting/purge ikke testet i kontrollert miljø.
- Sentry/feillogging uten persondata ikke satt opp.
- DPA/overføring ikke komplett.
- Tredjepartsdata ved sletting ikke avklart.

## 9. Blokkerer kommersiell lansering

- Full DPIA ved nye risikofunksjoner mangler.
- Penetrasjonstest/RLS-testdekning mangler.
- App Store/Google Play privacy/data safety mangler.
- Beredskapsplan ikke øvd.
- Komplett ROPA/DPA-arkiv ikke operativt.
- Betalings- og supportprosesser ikke ferdige.

## 10. Go/no-go-tabell

| Fase | Go/no-go | Begrunnelse |
| --- | --- | --- |
| Intern mor-pilot | GO | Ingen nye juridiske blokkere funnet i repoet. Bruk kontrollert test og ikke markedsfør som kommersiell tjeneste. |
| Ekstern beta | NO-GO inntil manuell verifisering | Trenger DPA, Dashboard-sjekk, DPIA, supportkontakt og samtykkekompetanse-rutine. |
| Betalt pilot | NO-GO | Krever advokat, kjøpsvilkår/angrerett, dataeksport, logging og DPA/overføring. |
| Kommersiell lansering | NO-GO | Krever full drifts-, juridisk og plattformpakke. |

## 11. Anbefalt rekkefølge

1. Kjør/verifiser `privacy_hardening_standard`-migreringen.
2. Fullfør Supabase/Resend/Expo/GitHub manuell dashboard-sjekk.
3. Arkiver DPA-er.
4. Konkretiser behandlingsansvarlig/supportkontakt i juridiske tekster.
5. Gjennomfør forenklet DPIA med denne filen som utgangspunkt.
6. Test sletting/purge og manuell dataeksport med testbruker.
7. Send `ADVOKATSPORSMAL.md`, `DPIA_FAMILIEKNAPPEN.md`, `ROPA_FAMILIEKNAPPEN.md`, `PERSONVERN.md` og `VILKAR.md` til advokat.
8. Før Stripe: lag kjøpsvilkår, angrerettflyt og oppdater ROPA/DPIA/personvern.
