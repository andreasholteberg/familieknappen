# Codex Handoff Report - Familieknappen

Sist oppdatert: 2026-07-07

## Nåværende git-status

Sist observert status:

- `main...origin/main [ahead 1]`
- arbeidskopien var ren før disse samarbeidsdokumentene ble opprettet
- lokal commit som ikke er pushet: `71da230`

Når dette dokumentet er opprettet, vil `docs/collaboration/*` ligge som nye lokale dokumentasjonsendringer.

## Siste commits

- `71da230` - compliance: uavhengig GDPR-revisjon + fikser – nøytral escalate-push, Mitt navn-felt, sletting av tomme grupper, `__DEV__`-vern på logg
- `a07cedb` - Harden privacy controls and data minimization
- `c8f1339` - Finalize GDPR distribution readiness pack
- `350c2ae` - fix: allow family photo upload finalization
- `c93882d` - fix: tighten family photo storage deletion

## Hva som er deployet

Sist kjente deploy før denne handoffen:

- Supabase-migrering `20260618100000_privacy_hardening_standard.sql` ble kjørt.
- Edge Functions `notify-call`, `send-push` og `purge-accounts` ble deployet.
- EAS preview APK ble bygget fra commit `a07cedb`.

Viktig: commit `71da230` er lokal og ikke pushet/deployet per denne rapporten. Den inneholder blant annet nøytral `escalate`-push og bør håndteres kontrollert før neste backend-/APK-runde.

## Hva som ikke er testet

- Full senior/pårørende-test etter nyeste lokale commit `71da230`.
- Om `Mitt navn`-feltet fungerer godt nok for art. 16-retting i appen.
- Om tomme familiegrupper slettes som forventet etter nyeste purge-endring.
- Om nøytral `escalate`-push er deployet i Supabase.
- Om samarbeidspakken i `docs/collaboration/*` er godkjent av Andreas.

## APK-build som venter/testing

Sist kjente ferdige EAS preview APK:

- Build ID: `138c9a2e-7c80-4e73-89db-2a6c1b879794`
- Status: `FINISHED`
- Commit: `a07cedbdf7f8c439ad3cb899d1b23998cbd8a4b4`
- APK: https://expo.dev/artifacts/eas/9o8wAIElrQsEXt1lByshDtcNIbudct19hGzO7PB2bG4.apk

Denne APK-en inkluderer ikke lokal commit `71da230` og inkluderer ikke samarbeidsdokumentene.

## GDPR-dokumenter som finnes

Sentrale dokumenter:

- `JURIDISK_ETTERLEVELSESPLAN.md`
- `PERSONVERN.md`
- `VILKAR.md`
- `src/content/legal.ts`
- `docs/legal/GDPR_DISTRIBUSJONSKLAR_SJEKKLISTE.md`
- `docs/legal/ROPA_FAMILIEKNAPPEN.md`
- `docs/legal/DPIA_FAMILIEKNAPPEN.md`
- `docs/legal/DPA_REGISTER.md`
- `docs/legal/AVVIKSRUTINE.md`
- `docs/legal/REGISTRERTES_RETTIGHETER.md`
- `docs/legal/SAMTYKKE_OG_SAMTYKKEKOMPETANSE.md`
- `docs/legal/SLETTING_OG_TREDJEPARTSDATA.md`
- `docs/legal/LEVERANDOR_DASHBOARD_SJEKKLISTE.md`
- `docs/legal/ADVOKATSPORSMAL.md`
- `docs/legal/GDPR_DISTRIBUSJONSRAPPORT.md`
- `docs/legal/GDPR_UAVHENGIG_REVISJON.md`

## Manuelle GDPR-oppgaver for Andreas

- Arkiver DPA-er og leverandørvilkår utenfor repo.
- Verifiser Supabase, Resend, Expo/EAS og GitHub dashboard mot `LEVERANDOR_DASHBOARD_SJEKKLISTE.md`.
- Avklar advokatpunkter før betalt pilot, særlig samtykkekompetanse, tredjepartsdata, tredjelandsoverføring og kjøpsvilkår.
- Avklar supportkontakt og rutine for innsyn, retting, sletting og avvik.
- Ikke legg secrets, API keys eller tokens i repo eller chat.

## Hva Claude bør vurdere først

Claude bør først vurdere balansen mellom GDPR-robusthet og friksjonsfri sosial kobling:

- hvordan gjøre samtykke og personvern forståelig uten å skremme senior
- om bildedeling/familiestrøm er riktig neste produktløft
- hvordan pårørende kan administrere uten å overstyre senior
- om aktivitetsstatus “brukt appen i dag” gir nok verdi uten overvåkingsfølelse
- hva som må være gjort før ekstern beta kontra betalt pilot

## Anbefalt neste Codex-oppgave etter Claude-feedback

Når Claude har levert anbefalinger og Andreas har valgt retning:

1. Codex oppsummerer Claude-feedback som konkrete beslutningspunkter.
2. Andreas godkjenner én avgrenset endring.
3. Codex implementerer kun den endringen.
4. Codex kjører `typecheck` og `build:web`.
5. Codex stopper før push, deploy og APK-build med mindre dette er eksplisitt godkjent.

Før ny APK bør Codex også håndtere lokal commit `71da230`: verifisere status, pushe etter godkjenning, deploye relevante Edge Functions/migreringer hvis nødvendig, og deretter bygge ny preview APK.
