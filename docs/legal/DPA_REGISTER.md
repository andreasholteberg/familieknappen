# Databehandlerregister - Familieknappen

**Status:** sjekkliste og arkivregister per 2026-07-02. Ikke legg API-nøkler, avtaledokumenter med private kontodetaljer eller passord i repoet. Lagre signerte/aksepterte avtaler i et sikkert eksternt arkiv.

## Oversikt

| Leverandør | Rolle | Data | Formål | DPA-status | Region | Tredjeland | Overføringsgrunnlag | Arkivref | Manuell handling | Advokatpunkt |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Supabase | Databehandler | Auth, profiler, familiegrupper, meldinger, bilder, kalender, logs | Backend, database, storage, auth, Edge Functions | MÅ ARKIVERES | Må verifiseres for prosjekt `vjddppqsbrafcywwjnpf` | Mulig | DPA + DPF/SCC må verifiseres | DPA/Supabase/yyyy-mm-dd | Last ned/arkiver DPA, bekreft EU-region, subprosessorer | [ADVOKAT] overføring og vilkår |
| Resend | Databehandler | E-postadresse, OTP-e-post, leveringsstatus | Utsending av innloggingskoder | MÅ ARKIVERES | Domene `familieknappen.app`; region/underleverandører må sjekkes | Mulig | DPA + DPF/SCC må verifiseres | DPA/Resend/yyyy-mm-dd | Arkiver DPA, verifiser domene/DNS, sjekk logs | [ADVOKAT] overføring |
| Expo / Exponent | Databehandler / underleverandør for push | Expo push-token, push-payload, build-/deviceinformasjon | Pushvarsler og EAS-build | MÅ ARKIVERES | Må verifiseres | Mulig | DPA/vilkår + DPF/SCC må verifiseres | DPA/Expo/yyyy-mm-dd | Arkiver vilkår/DPA, vurder push-innhold | [ADVOKAT] push og overføring |
| GitHub | Leverandør for kode/CI | Kildekode, GitHub Actions logs, repo secrets | Kildekode, deploy/workflow | MÅ VURDERES | Må verifiseres | Mulig | Vilkår/DPA etter konto/org | DPA/GitHub/yyyy-mm-dd | Bekreft repo-status, secrets, logs | [ADVOKAT] ved kommersiell drift |
| EAS | Byggleverandør | Build logs, env vars, app artefakter | Intern APK og senere app builds | MÅ ARKIVERES sammen med Expo | Må verifiseres | Mulig | Expo-vilkår/DPA | DPA/Expo-EAS/yyyy-mm-dd | Bekreft env vars og logginnhold | [ADVOKAT] |
| Apple | Fremtidig plattform | App metadata, krasjlogger, kjøp hvis relevant | App Store | FREMTIDIG | Global | Mulig | Apple-avtaler | DPA/Apple/yyyy-mm-dd | Før iOS-distribusjon | [ADVOKAT] App Store-regler |
| Google Play | Fremtidig plattform | App metadata, krasjlogger, installasjonsdata | Play Store | FREMTIDIG | Global | Mulig | Google-avtaler | DPA/Google/yyyy-mm-dd | Før Play-distribusjon | [ADVOKAT] Data Safety |
| Stripe | Fremtidig databehandler/selvstendig behandlingsansvarlig avhengig av aktivitet | Betalingsstatus, kunde-id, fakturadata | Abonnement/betaling | FREMTIDIG | Global | Mulig | Stripe DPA/SCC/DPF | DPA/Stripe/yyyy-mm-dd | Ikke aktiver før kjøpsvilkår/angrerett | [ADVOKAT] betaling og bokføring |
| Sentry eller annen logging | Fremtidig databehandler | Feil, stack traces, device/app info | Feilsøking | FREMTIDIG | Må velges | Mulig | DPA/SCC/DPF | DPA/Sentry/yyyy-mm-dd | Må scrubbe persondata før aktivering | [ADVOKAT] hvis logger kan ha innhold |

## Leverandørnotater

### Supabase

Manuelle oppgaver:

- Bekreft prosjektregion for `vjddppqsbrafcywwjnpf`.
- Arkiver DPA og underdatabehandlerliste.
- Bekreft at `help-images` og `family-photos` er private buckets.
- Bekreft at RLS er aktivert på alle relevante tabeller.
- Bekreft at `SUPABASE_SERVICE_ROLE_KEY` aldri finnes i klient/repo.
- Bekreft at `PUSH_WEBHOOK_SECRET` ligger som secret/Vault, ikke i repo.
- Bekreft at `purge-accounts` cron/schedule faktisk kjører.
- Bekreft retention/logginnstillinger i Dashboard.

### Resend

Manuelle oppgaver:

- Arkiver DPA og underdatabehandlerliste.
- Bekreft at `familieknappen.app` er verified.
- Bekreft SPF/DKIM/DMARC i Cloudflare som DNS only.
- Bekreft avsender `noreply@familieknappen.app` og sender name `Familieknappen`.
- Bekreft e-postmal: 6-sifret OTP-kode, ikke magic-link som hovedhandling.
- Ikke lagre Resend API key i repo, chat eller dokumentasjon.

### Expo/EAS

Manuelle oppgaver:

- Arkiver relevant DPA/vilkår.
- Vurder om push-payload skal være helt nøytral for alle typer varsler.
- Bekreft at EAS env vars ikke vises i logs.
- Arkiver hvilken EAS-konto/org som eier prosjektet.
- Vurder om build-artefakter/APK-lenker skal holdes internt.

### GitHub

Manuelle oppgaver:

- Bekreft repo-status: privat eller offentlig.
- Gå gjennom GitHub Actions logs for secrets/persondata.
- Bekreft at `.env` og lokale tempfiler ikke committes.
- Bekreft at Repository Variables/Secrets er riktige og ikke gjengis i docs.

### Fremtidige leverandører

Stripe, Apple, Google og Sentry må ikke legges inn i produksjon uten egen DPA-/personvernvurdering og oppdatert ROPA/DPIA.

## Arkivstruktur utenfor repo

Foreslått lokal/skybasert sikker struktur:

```text
Familieknappen Legal Archive/
  DPA/
    Supabase/YYYY-MM-DD.pdf
    Resend/YYYY-MM-DD.pdf
    Expo/YYYY-MM-DD.pdf
    GitHub/YYYY-MM-DD.pdf
  Transfer Assessments/
  DPIA/
  Incidents/
  Vendor Reviews/
```
