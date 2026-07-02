# Leverandør- og dashboard-sjekkliste - Familieknappen

**Status:** manuell sjekkliste per 2026-07-02. Ikke legg secrets i repo eller chat.

## Supabase

### Prosjekt og region

- [ ] Bekreft prosjektref: `vjddppqsbrafcywwjnpf`.
- [ ] Bekreft prosjektregion i Supabase Dashboard.
- [ ] Arkiver Supabase DPA og subprosessorliste.
- [ ] Dokumenter overføringsgrunnlag.

### Auth

- [ ] Email/OTP er aktivert.
- [ ] OTP-lengde er 6 sifre.
- [ ] OTP expiration er vurdert og dokumentert.
- [ ] Magic link/deep-link er kun backup.
- [ ] Redirect URLs støtter appens backupflyt uten å bli hovedflyt.
- [ ] Auth logs viser ikke unødvendig sensitiv data.

### SMTP / Resend

- [ ] Custom SMTP er ON.
- [ ] Host `smtp.resend.com`, port 465/587.
- [ ] Username `resend`.
- [ ] Password/API key er kun i Supabase secret, ikke repo.
- [ ] Sender `noreply@familieknappen.app`.
- [ ] Magic link/OTP template viser kode, ikke klikkbar hovedlenke.

### Database/RLS

- [ ] RLS aktivert på alle relevante tabeller.
- [ ] `profiles` har egenbruker-/gruppebegrensning.
- [ ] `family_members` og `family_groups` er isolert per gruppe.
- [ ] `help_requests`, `help_responses`, `calendar_events` er isolert per gruppe.
- [ ] `activity_status` kan bare leses direkte av eier etter hardening.
- [ ] `activity_used_today()` returnerer bare boolean.
- [ ] `pairing_attempts` har ingen klientpolicy og brukes via RPC.
- [ ] `notification_tokens` er brukerbegrenset.
- [ ] `notification_log` er begrenset og ryddes etter 90 dager.

### Storage

- [ ] Bucket `help-images` er private.
- [ ] Bucket `family-photos` er private.
- [ ] Storage policies bruker første mappeledd som group_id.
- [ ] Family-photo delete policy matcher opplaster/primærkontakt.
- [ ] Signed URLs brukes, ikke public URLs.

### Edge Functions

- [ ] `send-push` deployet med `--no-verify-jwt` og `PUSH_WEBHOOK_SECRET`.
- [ ] `purge-accounts` deployet med `--no-verify-jwt` og secret header.
- [ ] `notify-call` deployet med JWT-verifisering.
- [ ] `escalate` er deaktivert/ikke schedulert i Standard, eller dataminimert før aktivering.
- [ ] Edge Function logs inneholder ikke meldingsinnhold, OTP, tokens eller e-post unødvendig.

### Cron / Vault

- [ ] Vault secret `purge_accounts_webhook_secret` finnes.
- [ ] Cron `familieknappen-purge-accounts` finnes.
- [ ] Schedule er riktig, for eksempel daglig `17 3 * * *`.
- [ ] Siste kjøring kan verifiseres.
- [ ] `purge_old_records` kjører som del av purge.

### Backup

- [ ] Supabase backupstatus er kjent.
- [ ] Restore-rutine er dokumentert før ekstern/betalt pilot.

## Resend

- [ ] Domene `familieknappen.app` står som Verified.
- [ ] SPF/DKIM/DMARC er lagt inn i Cloudflare som DNS only.
- [ ] DPA/subprosessorer er arkivert.
- [ ] Logs viser Delivered ved test.
- [ ] OTP-mail inneholder ikke unødig persondata.
- [ ] API key er ikke i repo, docs eller chat.

## Expo/EAS

- [ ] EAS preview env har `EXPO_PUBLIC_SUPABASE_URL` og `EXPO_PUBLIC_SUPABASE_ANON_KEY`.
- [ ] Ingen private secrets i appbundle.
- [ ] APK-lenker deles bare kontrollert i pilot.
- [ ] Pushmeldinger er dataminimert.
- [ ] Expo DPA/vilkår er arkivert.
- [ ] EAS build logs er sjekket for secrets.

## GitHub

- [ ] Repo-status er ønsket: privat/offentlig avklart.
- [ ] `.env` er ikke committed.
- [ ] GitHub Actions secrets/variables er riktige.
- [ ] Actions logs viser ikke secrets.
- [ ] Branch protection vurderes før ekstern/betalt pilot.
- [ ] Dependabot/security alerts vurderes.

## Stripe senere

- [ ] Stripe DPA arkiveres.
- [ ] Stripe secret bare server-side.
- [ ] Webhook signing secret kun i server secret.
- [ ] Kjøpsvilkår og angrerett avklart.
- [ ] Subscription status speiles minimalt i Supabase.
- [ ] Betalingsdata skilles fra appdata.

## Sentry/logging senere

- [ ] DPA arkiveres.
- [ ] Scrubbing fjerner e-post, telefon, meldinger, bilde-URL-er, tokens.
- [ ] Logger har begrenset retention.
- [ ] Tilgang begrenses.
