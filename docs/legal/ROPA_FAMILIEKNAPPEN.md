# ROPA - behandlingsprotokoll for Familieknappen

**Status:** levende protokollutkast per 2026-07-02. Ikke juridisk rådgivning. Skal gjennomgås av advokat før betalt pilot.

## Felles informasjon

| Felt | Verdi |
| --- | --- |
| Tjeneste | Familieknappen |
| Behandlingsansvarlig | Utgiver av Familieknappen. Foreløpig Andreas Holteberg / AH Digital. Må konkretiseres med organisasjonsnummer og kontaktpunkt før ekstern/betalt pilot. |
| Registrerte | Senior/eldre bruker, pårørende/primærkontakt/sekundærkontakt, inviterte brukere. |
| Databehandlere | Supabase, Resend, Expo. GitHub/EAS for bygg/kildekode/logg, senere Stripe/Apple/Google/Sentry. |
| Generell sikkerhet | Supabase Auth, RLS, private buckets, signerte URL-er, Edge Functions med JWT/secret, dataminimerte push-tekster, ingen service role i klient, OTP, 30 dagers sletting. |
| Generell lagring | Innhold lagres så lenge kontoen/familiegruppen finnes. Varslingslogg 90 dager. Paringsforsøk/koder 30 dager. Konto slettes endelig etter 30 dager hvis purge kjører. |

## B1 Konto og innlogging

| Felt | Innhold |
| --- | --- |
| Formål | Opprette og autentisere brukere. |
| Aktivitet | OTP via Supabase Auth/Resend. Magic link beholdt som backup. Session lagres i AsyncStorage. |
| Registrerte | Senior og pårørende. |
| Opplysninger | E-post, navn fra auth metadata/profil, auth-id, OTP-kode hos Supabase, session-token lokalt. |
| Grunnlag | Art. 6(1)(b) avtale/tjenesteleveranse. |
| Særlige kategorier | Ikke tilsiktet. |
| Mottakere | Supabase Auth, Resend for e-post. |
| Lagring | Kontoens levetid, auth-logger etter Supabase-retensjon. |
| Sletting | Auth-bruker slettes av `purge-accounts` etter 30 dagers angrefrist. |
| Tiltak | OTP, ingen passord i app, ingen secrets i frontend, feilmeldinger humaniseres. |
| Overføring | Supabase/Resend kan innebære tredjeland; må dokumenteres. |
| Status | OK teknisk, DPA/overføring må verifiseres manuelt. |
| Åpne punkter | [ADVOKAT] DPA/overføringsgrunnlag. |

## B2 Familiegruppe og roller

| Felt | Innhold |
| --- | --- |
| Formål | Koble senior og pårørende i riktig lukket gruppe. |
| Aktivitet | Opprett familiegruppe, medlemskap, roller: senior, primærkontakt, sekundærkontakt. |
| Registrerte | Senior og pårørende. |
| Opplysninger | Bruker-id, gruppe-id, rolle, relasjon/medlemskap, primærkontakt. |
| Grunnlag | Art. 6(1)(b). |
| Særlige kategorier | Ikke tilsiktet. |
| Mottakere | Supabase. |
| Lagring | Kontoens/familiegruppens levetid. |
| Sletting | FK-kaskader ved auth/profil-sletting; gruppedata må vurderes ved flerbrukergruppe. |
| Tiltak | RLS `is_group_member`, strammet group insert, primærkontakt-regler. |
| Overføring | Supabase. |
| Status | OK i kode/migreringer. Live DB må verifiseres. |
| Åpne punkter | [ADVOKAT] Pårørende som administrator og oppsett av seniorprofil. |

## B3 Paring/invitasjon

| Felt | Innhold |
| --- | --- |
| Formål | Sikker innmelding i riktig familiegruppe. |
| Aktivitet | 6-sifret paringskode, invitasjon på e-post, engangsbruk, utløp, forsøksteller. |
| Registrerte | Invitert bruker, primærkontakt. |
| Opplysninger | E-post for invitasjon, kode, rolle, gruppe-id, forsøk, timestamps. |
| Grunnlag | Art. 6(1)(b) for invitasjon, art. 6(1)(f) sikkerhet for forsøk/logg. |
| Særlige kategorier | Nei. |
| Mottakere | Supabase, Resend ved e-post. |
| Lagring | Koder/attempts ryddes etter 30 dager i `purge_old_records`; aktive koder 15 min. |
| Sletting | Purge-funksjon/retention. |
| Tiltak | SECURITY DEFINER RPC, 5 forsøk per 15 min, engangsbruk. |
| Overføring | Supabase/Resend. |
| Status | OK i kode; cron må verifiseres. |
| Åpne punkter | Dokumentere hvem som kan gi kode til senior. |

## B4 Hjelpeforespørsler og svar

| Felt | Innhold |
| --- | --- |
| Formål | La senior be familie om hjelp og få svar. |
| Aktivitet | Senior sender tekst/bilde; pårørende svarer med hurtigsvar/fritekst. |
| Registrerte | Senior, pårørende, eventuelle tredjeparter nevnt i innhold. |
| Opplysninger | Meldingstekst, svar, status, timestamps, relasjon til gruppe/mottaker. |
| Grunnlag | Art. 6(1)(b). |
| Særlige kategorier | Ikke tilsiktet, men brukerinnhold kan inneholde helse/økonomi. [ADVOKAT] vurdering. |
| Mottakere | Familiegruppen, Supabase. |
| Lagring | Kontoens/familiegruppens levetid; tidligere svar vises i historikk. |
| Sletting | Kaskade ved konto. Tredjepartsdata må avklares. |
| Tiltak | RLS per familiegruppe, ingen profilering/automatiserte avgjørelser. |
| Overføring | Supabase. |
| Status | OK teknisk. |
| Åpne punkter | [ADVOKAT] sletting av tråder med svar fra andre. |

## B5 Bilder og familiebilder

| Felt | Innhold |
| --- | --- |
| Formål | Vise hjelpebilder og familiens delte bilder/hilsener i gruppa. |
| Aktivitet | Kamera/bildevalg, re-enkoding til JPEG, opplasting til private buckets, signed URLs. |
| Registrerte | Brukere, personer som vises i bilder. |
| Opplysninger | Bildefil, bildetekst, uploader, gruppe-id, storage path. |
| Grunnlag | Art. 6(1)(b) for tjenesten. Samtykke/varsel for tredjepersoner må vurderes ved ekstern bruk. |
| Særlige kategorier | Bilder kan avsløre helse, barn eller hjemmemiljø. [ADVOKAT] vurdering. |
| Mottakere | Familiegruppen, Supabase Storage. |
| Lagring | Kontoens/familiegruppens levetid; family_photos kan slettes av opplaster/primærkontakt. |
| Sletting | Storage + row slettes; purge fjerner brukerens egne bilder og hjelpebilder. |
| Tiltak | Private buckets, RLS, signerte URL-er, URL-cache, re-enkoding/metadatafjerning, maks 1280 px. |
| Overføring | Supabase. |
| Status | OK i kode; private bucket må verifiseres i Dashboard. |
| Åpne punkter | [ADVOKAT] bilder av barn/barnebarn/tredjepersoner. |

## B6 Kalender og aktiviteter

| Felt | Innhold |
| --- | --- |
| Formål | Familiegruppe deler en enkel kalender/aktiviteter. |
| Aktivitet | Opprette/redigere/slette kalenderhendelser. Senior kan se Min dag og legge til avtale hvis bygget i gjeldende branch. |
| Registrerte | Senior og pårørende. |
| Opplysninger | Tittel, tidspunkt, notat/beskrivelse, lagt til av, gruppe-id. |
| Grunnlag | Art. 6(1)(b). |
| Særlige kategorier | Ikke tilsiktet; kalender kan indirekte avsløre helse/avtaler. |
| Mottakere | Familiegruppen, Supabase. |
| Lagring | Kontoens/familiegruppens levetid. |
| Sletting | Kalenderhendelser kan slettes; FK-kaskade ved gruppe/profil der relevant. |
| Tiltak | RLS per familiegruppe. |
| Overføring | Supabase. |
| Status | OK teknisk. |
| Åpne punkter | Klarspråk om ikke å legge inn sensitive helseavtaler unødvendig. |

## B7 Telefonnummer/ringefunksjon

| Felt | Innhold |
| --- | --- |
| Formål | Gjøre det lett å ringe familie. |
| Aktivitet | Bruker lagrer eget telefonnummer; app åpner tel:-lenke. |
| Registrerte | Pårørende/senior som legger inn nummer. |
| Opplysninger | Telefonnummer. |
| Grunnlag | Art. 6(1)(b), frivillig felt. |
| Særlige kategorier | Nei. |
| Mottakere | Familiegruppen, Supabase. Telefonapp ved oppringing. |
| Lagring | Kontoens levetid eller til bruker fjerner nummer. |
| Sletting | Bruker kan endre/fjerne; kaskade ved kontosletting. |
| Tiltak | RLS på profiler; normalisering før tel-lenke. |
| Overføring | Supabase. |
| Status | OK teknisk. |
| Åpne punkter | Ingen identifisert. |

## B8 Aktivitetsstatus/sist aktiv

| Felt | Innhold |
| --- | --- |
| Formål | Gi rolig trygghetsstatus uten overvåking. |
| Aktivitet | Appen oppdaterer `activity_status`; gruppen får bare boolsk “brukt i dag” når deling er aktivert. |
| Registrerte | Senior og eventuelt pårørende som slår på deling. |
| Opplysninger | Internt last_seen_at/app_opened_today, eksternt avledet boolsk brukt-i-dag. |
| Grunnlag | Art. 6(1)(a) samtykke. |
| Særlige kategorier | Kan oppleves som overvåking av sårbar person; behandles som forhøyet risiko. |
| Mottakere | Gruppe ser boolsk verdi hvis bruker har samtykket. Supabase lagrer presist tidspunkt. |
| Lagring | Kontoens levetid; bør vurderes om historikk skal begrenses. |
| Sletting | Kaskade ved konto. |
| Tiltak | Default false, toggle i brukerens eget UI, RPC returnerer bare boolean, RLS skjuler direkte rad for andre. |
| Overføring | Supabase. |
| Status | OK etter `privacy_hardening_standard`, må migreres/verifiseres. |
| Åpne punkter | [ADVOKAT] samtykkekompetanse og default/tilbaketrekking. |

## B9 Push-varsler og push-token

| Felt | Innhold |
| --- | --- |
| Formål | Varsle familie når noe skjer i appen. |
| Aktivitet | App ber om tillatelse, lagrer Expo push-token, Edge Functions sender via Expo. |
| Registrerte | Brukere med push aktivert. |
| Opplysninger | Expo push-token, plattform, last_used_at, varseldata. |
| Grunnlag | Art. 6(1)(b) tjeneste; berettiget interesse for teknisk logg. |
| Særlige kategorier | Ikke tilsiktet, men låseskjerm kan lekke kontekst. |
| Mottakere | Expo, Supabase. |
| Lagring | Token til utlogging/avregistrering; notification_log 90 dager. |
| Sletting | Token slettes ved utlogging og ved DeviceNotRegistered; purge rydder logs. |
| Tiltak | Dataminimert body i `send-push`; call-alert nøytral. |
| Overføring | Expo/Supabase. |
| Status | DELVIS. `escalate` har fortsatt seniornavn i varseltekst, men Standard setter auto-eskalering av. |
| Åpne punkter | Vurdér å dataminimere eskalering før aktivering. |

## B10 Varslingslogg/feilsøkingslogg

| Felt | Innhold |
| --- | --- |
| Formål | Feilsøke push og dokumentere leveringsforsøk. |
| Aktivitet | Edge Functions skriver `notification_log` med status/error. |
| Registrerte | Mottakerbrukere. |
| Opplysninger | user_id, type, related_help_request_id, status, error_message, created_at. |
| Grunnlag | Art. 6(1)(f) berettiget interesse/sikkerhet og drift. |
| Særlige kategorier | Nei, men related id kan knytte til forespørsel. |
| Mottakere | Supabase, administrator ved drift. |
| Lagring | 90 dager. |
| Sletting | `purge_old_records`. |
| Tiltak | RLS begrenser lesing; logs bør ikke inneholde meldingsinnhold. |
| Overføring | Supabase. |
| Status | OK / MANUELL VERIFISERING. |
| Åpne punkter | Dokumenter interesseavveining. |

## B11 Samtykkelogg

| Felt | Innhold |
| --- | --- |
| Formål | Dokumentere at bruker har godtatt vilkår/personvernversjoner. |
| Aktivitet | App lagrer timestamp og versjon i `profiles`. |
| Registrerte | Alle brukere. |
| Opplysninger | consented_terms_at, consented_privacy_at, terms_version, privacy_version. |
| Grunnlag | Art. 6(1)(c) dokumentasjonsplikt / art. 6(1)(f) dokumentasjon. |
| Særlige kategorier | Nei. |
| Mottakere | Supabase/utgiver. |
| Lagring | Kontoens levetid, evt. lengre hvis nødvendig for rettskrav må vurderes. |
| Sletting | Ved kontosletting. |
| Tiltak | Versjonert samtykkeskjerm, nytt samtykke ved versjonsbump. |
| Overføring | Supabase. |
| Status | OK teknisk. |
| Åpne punkter | [ADVOKAT] om samtykkeloggen bør beholdes/anonymiseres etter kontosletting for dokumentasjon. |

## B12 Konto-/datasletting

| Felt | Innhold |
| --- | --- |
| Formål | Oppfylle rett til sletting og gi angrefrist. |
| Aktivitet | Bruker ber om sletting; kan angre; Edge Function sletter etter 30 dager. |
| Registrerte | Alle brukere. |
| Opplysninger | deletion_requested_at og alle brukerdata. |
| Grunnlag | Art. 6(1)(c), GDPR art. 17. |
| Særlige kategorier | Avhenger av brukerinnhold. |
| Mottakere | Supabase Auth/admin. |
| Lagring | 30 dagers grace etter request. |
| Sletting | `purge-accounts` sletter auth-bruker og tilknyttet data/bilder. |
| Tiltak | Selvbetjent request/cancel, secret-beskyttet cron, service role bare server-side. |
| Overføring | Supabase. |
| Status | OK i kode, cron må verifiseres. |
| Åpne punkter | [ADVOKAT] tredjepartsdata og felles tråder. |

## B13 Sikkerhetslogger/paringsforsøk

| Felt | Innhold |
| --- | --- |
| Formål | Hindre gjetting/misbruk av koder. |
| Aktivitet | Loggfører paringsforsøk per bruker. |
| Registrerte | Innloggede brukere som prøver kode. |
| Opplysninger | user_id, attempted_at. |
| Grunnlag | Art. 6(1)(f) sikkerhet. |
| Særlige kategorier | Nei. |
| Mottakere | Supabase/utgiver ved drift. |
| Lagring | 30 dager. |
| Sletting | `purge_old_records`. |
| Tiltak | Ingen RLS-policy; kun SECURITY DEFINER RPC. |
| Overføring | Supabase. |
| Status | OK i kode. |
| Åpne punkter | Interesseavveining bør dokumenteres. |

## B14 Betaling/abonnement (fremtidig)

| Felt | Innhold |
| --- | --- |
| Formål | Betalt pilot/abonnement for pårørende. |
| Aktivitet | Ikke bygget nå. Stripe/webbetaling kommer senere. |
| Registrerte | Kjøper/pårørende, evt. organisasjon. |
| Opplysninger | Betalingsstatus, kundereferanse, abonnement, fakturadata hos Stripe. |
| Grunnlag | Art. 6(1)(b) avtale, art. 6(1)(c) bokføring/skatt der relevant. |
| Særlige kategorier | Nei. |
| Mottakere | Stripe, regnskapssystem senere. |
| Lagring | I tråd med bokføringskrav/Stripe-retensjon. |
| Sletting | Må skille appdata fra lovpålagt betalingsdokumentasjon. |
| Tiltak | Stripe secret kun server-side, webhook-signering, kjøpsvilkår/angrerett. |
| Overføring | Stripe kan innebære tredjeland. |
| Status | FREMTIDIG / BLOKKERER betaling. |
| Åpne punkter | [ADVOKAT] kjøpsvilkår, angrerett, ekstern betaling, App Store/Google Play-regler. |
