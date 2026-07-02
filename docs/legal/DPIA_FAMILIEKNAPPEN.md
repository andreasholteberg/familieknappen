# DPIA-utkast - Familieknappen

**Status:** forenklet DPIA-utkast per 2026-07-02. Ikke juridisk rådgivning. Skal gjennomgås av advokat/personvernspesialist før ekstern/betalt pilot og før nye risikofunksjoner.

## 1. Beskrivelse av behandlingen

Familieknappen er en trygghets- og familiekommunikasjonsapp for én senior/eldre bruker og én eller flere pårørende i en lukket familiegruppe. Senior kan sende tekst/bilde som hjelpespørsmål, motta svar, se kalender, ringe familien og se familiebilder. Pårørende kan svare, administrere familiegruppe, legge inn telefonnummer, dele familiebilder og motta push-varsler.

Databehandlingen skjer hovedsakelig i Supabase (database, auth, storage, Edge Functions), Resend (OTP/e-post), Expo (push), GitHub/EAS (kildekode/bygg/logg). Stripe/webbetaling er fremtidig og ikke aktiv nå.

## 2. Formål

- Levere passordløs innlogging og familiegruppe.
- Formidle hjelpespørsmål og svar mellom senior og pårørende.
- Dele kalender og enkle familiebilder i lukket gruppe.
- Gjøre det enklere å ringe familie.
- Formidle push-varsler på en dataminimert måte.
- Gi senior kontroll over aktivitetsdeling.
- Oppfylle rettigheter som sletting, samtykkelogging og innsyn/portabilitet.

## 3. Nødvendighet

Behandlingen er nødvendig for tjenesten fordi appens kjerne er å knytte riktig senior til riktig familiegruppe og vise relevant innhold bare til gruppemedlemmer. Det finnes dataminimerende tiltak: ingen GPS, ingen kontaktliste, ingen reklame, ingen profilering, ingen automatiserte avgjørelser, dataminimerte push-tekster, private buckets og opt-in aktivitetsdeling.

## 4. Forholdsmessighet

Standardversjonen er bevisst avgrenset. Premium-/høyrisikofunksjoner som tidslinje for aktivitetsmønster, auto-eskalering, videosamtale og skritteller er parkert eller fremtidige. `privacy_hardening_standard` gjør aktivitetsdeling til opt-in og eksponerer bare boolsk “brukt i dag”, ikke presis “sist aktiv”.

## 5. Sårbar brukergruppe

Senior/eldre brukere kan ha lav digital kompetanse eller redusert samtykkekompetanse. Dette skjerper kravene til klarspråk, store trykkflater, seniorens egen kontroll og vern mot skjult overvåking. Pårørende kan ikke uten videre samtykke på seniorens vegne. `[ADVOKAT]` Samtykkekompetanse og pårørendes rolle må avklares før ekstern/betalt pilot.

## 6. Risikovurdering

| Risiko | Sannsynlighet | Konsekvens | Tiltak | Rest-risiko | Eier | Status |
| --- | --- | --- | --- | --- | --- | --- |
| Senior forstår ikke hva appen deler | Middels | Høy | Klarspråk, egen senior-personvernskjerm, toggle for aktivitet, samtykkeskjerm | Middels | Produkt/Andreas | DELVIS - [ADVOKAT] |
| Pårørende setter opp appen uten gyldig grunnlag | Middels | Høy | Vilkår sier at oppsett krever seniorens ønske/medvirkning | Middels | Andreas | [ADVOKAT] |
| Skjult overvåking via aktivitetsstatus | Lav/Middels | Høy | Default off, bare “brukt i dag”, senior kan slå av, ingen GPS | Lav/Middels | Produkt | OK etter migrering |
| Feil bruker kobles til feil familiegruppe | Lav/Middels | Høy | OTP først, paringskode 15 min, engangsbruk, 5 forsøk/15 min | Lav | Teknisk | OK |
| Gjetting av paringskode | Lav | Middels/Høy | SECURITY DEFINER RPC, attempts-logg, rate limit, utløp | Lav | Teknisk | OK |
| Bilder inneholder helse, barn eller tredjepersoner | Middels | Høy | Private buckets, RLS, klarspråk om ikke å sende sensitive data unødvendig, metadata-fjerning | Middels | Produkt/Andreas | DELVIS - [ADVOKAT] |
| Bildemetadata/GPS lekkes | Lav | Høy | Re-enkoding til JPEG via image manipulator, ingen fallback til original | Lav | Teknisk | OK i lokal kode |
| Push på låseskjerm røper sensitiv kontekst | Middels | Middels | Hovedpush er nøytralisert: “ny oppdatering”; call-alert nøytral | Lav/Middels | Teknisk | DELVIS, escalation må vurderes |
| Eskaleringsvarsel inneholder seniornavn | Lav nå | Middels | Standard slår auto-eskalering av; dataminimer før ev. reaktivering | Lav | Produkt/Teknisk | KAN VENTE hvis deaktivert |
| Sletting fjerner også data fra andre familiemedlemmer | Middels | Høy | 30 dagers angrefrist, dokumentert åpent punkt | Middels | Andreas | [ADVOKAT] |
| Konto slettes irreversibelt ved feil | Lav | Høy | 30 dagers grace, angreknapp, cron etter frist | Lav/Middels | Teknisk | OK, må testes |
| Edge Function logs inneholder persondata | Middels | Middels | Dataminimerte error logs anbefalt, ikke logg innhold/tokens | Middels | Teknisk | DELVIS |
| Service role/secrets eksponeres | Lav | Høy | Service role bare i Edge Functions, .env ikke i repo, secrets i dashboard | Lav | Teknisk | OK / MANUELL VERIFISERING |
| RLS-hull mellom familiegrupper | Lav/Middels | Høy | RLS helper-funksjoner, policyer, tidligere revisjon/fikser | Lav/Middels | Teknisk | DELVIS - bør ha pgTAP |
| Storage-delete for familiebilder for bred | Tidligere Middels | Høy | Fikset med policy som matcher tabell-RLS | Lav | Teknisk | OK etter migrering |
| Pending family_photos gjør at bilder ikke vises | Tidligere Middels | Lav/Middels | UPDATE-policy og cleanup ved feil | Lav | Teknisk | OK etter migrering |
| Resend/Supabase e-post feiler | Middels | Middels | Verifisert domene/SMTP, OTP-kode som hovedflyt | Lav/Middels | Andreas | MANUELL VERIFISERING |
| Tredjelandsoverføring uten dokumentert grunnlag | Middels | Høy | DPA-register og overføringsgrunnlag må arkiveres | Middels | Andreas/Advokat | [ADVOKAT] |
| Fremtidig skritteller blir helsedata | Høy hvis bygget | Høy | Ikke bygg før full DPIA, eksplisitt samtykke, advokat | Høy uten tiltak | Produkt | BLOKKERER ny funksjon |
| Fremtidig Stripe-betaling uten angrerett/kjøpsvilkår | Middels | Høy | Ikke bygg/lanser betaling før juridisk kjøpsflyt | Middels | Andreas/Advokat | FREMTIDIG |

## 7. Tiltak som allerede er implementert

- OTP-login som hovedflyt.
- Magic link/deep link kun backup.
- RLS på profiler, grupper, medlemmer, forespørsler, svar, kalender, aktivitet, tokens, logger og familiebilder.
- Private Storage-buckets for `help-images` og `family-photos`.
- Signerte URL-er med cache og begrenset levetid.
- Re-enkoding/metadatafjerning og nedskalering av bilder.
- Paringskoder med 6 sifre, utløp, engangsbruk og rate limiting.
- 30 dagers sletting/angrefrist og server-side purge.
- Versjonert samtykke for personvern/vilkår.
- Dataminimerte push-varsler i hovedflyt.
- Opt-in aktivitetsdeling etter privacy-hardening-migreringen.
- Error Boundary og rolige feilmeldinger.

## 8. Tiltak før ekstern beta

1. Kjør/verifiser alle migreringer, spesielt `20260618100000_privacy_hardening_standard.sql`.
2. Bekreft private buckets og RLS live i Supabase Dashboard.
3. Arkiver DPA-er og overføringsgrunnlag for Supabase, Resend, Expo og GitHub/EAS.
4. Konkretiser behandlingsansvarlig og supportkontakt i dokumenter.
5. Ta i bruk `AVVIKSRUTINE.md` og `REGISTRERTES_RETTIGHETER.md`.
6. Fullfør forenklet DPIA med dato, eier og sign-off.
7. `[ADVOKAT]` Avklar samtykkekompetanse/pårørenderolle.

## 9. Tiltak før betalt pilot

1. Advokatgjennomgang av personvern/vilkår og alle `[ADVOKAT]`-punkter.
2. Kjøpsvilkår, angrerett og betalingsflyt før Stripe.
3. Sentry/feillogging med scrubbing og tilgangsstyring.
4. Test dataeksport-rutine.
5. Test sletting/purge i trygg testdatabase.
6. RLS-/storage-policy tester.
7. Tabletop-test av avviksrutine.

## 10. Residualrisiko

Rest-risikoen etter dagens tiltak vurderes som akseptabel for intern pilot, men ikke ferdig for ekstern/betalt pilot uten manuell verifisering og advokatgjennomgang. Høyest residualrisiko er samtykkekompetanse, brukerinnhold med sensitive data, tredjepartsdata ved sletting og leverandør-/tredjelandsoverføring.

## 11. Punkter for advokat

- Samtykkekompetanse og pårørendes rolle.
- Pårørende som administrator/primærkontakt.
- Brukergenerert innhold som kan inneholde helseopplysninger.
- Bilder av barn/barnebarn/tredjepersoner.
- Tredjepartsdata ved sletting.
- DPA/SCC/DPF og tredjelandsoverføring.
- Kjøpsvilkår, angrerett og senere abonnement.
- Ansvarsfraskrivelse: assistanse, ikke nødtjeneste.
