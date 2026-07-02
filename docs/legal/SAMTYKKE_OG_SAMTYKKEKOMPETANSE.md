# Samtykke og samtykkekompetanse - Familieknappen

**Status:** vurderings- og rutinedokument per 2026-07-02. Dette er ikke juridisk rådgivning. `[ADVOKAT] Samtykkekompetanse og pårørendes rolle må vurderes før ekstern/betalt pilot.`

## Når brukes hvilket grunnlag?

| Behandling | Hovedgrunnlag | Hvorfor |
| --- | --- | --- |
| Konto/innlogging | Avtale, art. 6(1)(b) | Nødvendig for å levere appen. |
| Familiegruppe/roller | Avtale | Nødvendig for tjenesten. |
| Hjelpeforespørsler/svar | Avtale | Kjernen i appen. |
| Kalender | Avtale | Avtalt funksjon i familiegruppen. |
| Telefonnummer/ring | Avtale | Frivillig, men del av ringefunksjon. |
| Familiebilder | Avtale | Del av familiekommunikasjon. |
| Aktivitetsstatus/“brukt i dag” | Samtykke, art. 6(1)(a) | Ikke nødvendig for kjernen, kan oppleves som overvåking. |
| Push-token/varsler | Avtale + OS-tillatelse | Varsling er tjenestefunksjon, krever systemtillatelse. |
| Varslingslogg/paringsforsøk | Berettiget interesse, art. 6(1)(f) | Sikkerhet, misbruksvern og feilsøking. |
| Samtykke-/akseptlogg | Dokumentasjonsplikt/interesse | Bevise versjonert aksept. |
| Betaling senere | Avtale + rettslig plikt | Abonnement/bokføring. |

## Aktivitetsstatus/sist aktiv

Dagens Standard-spor skal bare dele “brukt appen i dag” når brukeren selv har slått det på. Presist tidspunkt skal ikke vises til andre gruppemedlemmer. Dette følger av `20260618100000_privacy_hardening_standard.sql` og `src/services/activity.ts`.

Krav:

- Default skal være av.
- Senior skal kunne si ja/nei selv.
- Det skal være mulig å slå av senere.
- Pårørende skal ikke få historikk eller presise tidsstempler i Standard.
- Premium/rik aktivitetslogg krever ny DPIA og eget samtykke.

## Versjonert samtykke / dokumentaksept

Appen lagrer vilkårs- og personvernversjon i `profiles`. Ved vesentlige endringer i `src/content/legal.ts` skal versjonen bumpes og brukeren skal se samtykkeskjermen på nytt.

Ikke bump versjon for små dokumentasjonsendringer uten betydning for brukeren. Bump ved:

- Nye datatyper.
- Nye formål.
- Nye leverandører.
- Endret lagringstid.
- Betaling/Stripe.
- Nye risikofunksjoner som video, skritteller eller rik aktivitetslogg.

## Seniorens egen forståelse

Før ekstern beta bør onboarding/rutine gjøre det klart at senior:

- vet at appen brukes,
- forstår at meldinger/bilder deles med familiegruppen,
- forstår at appen ikke er nødtjeneste,
- forstår aktivitetsstatus-valget hvis det slås på,
- kan be om hjelp eller si nei.

## Pårørende som setter opp appen

Vilkårene sier allerede at den som setter opp appen for senior må ha grunnlag for det, normalt seniorens eget ønske og medvirkning. For ekstern beta bør dette gjøres mer operativt:

- Pårørende bekrefter i onboarding at senior kjenner til appen.
- Pårørende bekrefter at senior ønsker å bruke appen eller at det finnes annet rettslig grunnlag.
- Pårørende får tydelig tekst om at appen ikke skal brukes til skjult overvåking.

## Hvis senior ikke forstår appen

Hvis senior ikke har samtykkekompetanse, må Familieknappen ikke legge til grunn at en vanlig pårørende kan samtykke på seniorens vegne uten videre. Mulige rettslige grunnlag kan være fremtidsfullmakt, vergemål eller annet, men dette må vurderes juridisk.

`[ADVOKAT]` Avklar om appen kan brukes av seniorer med redusert samtykkekompetanse, og hvilke krav som må stilles til pårørende/verge.

## Fremtidsfullmakt/vergemål

Før betalt pilot bør det finnes en enkel policy:

- Hvilke dokumenter eller bekreftelser kreves?
- Skal appen støtte “verge/administrator”-rolle?
- Skal seniorens egen UI fortsatt kreves for aktivitetsdeling?
- Hva skjer ved uenighet mellom familiemedlemmer?

## Produktregler som bør ha veto-kraft

1. Ingen GPS i Standard.
2. Ingen skjult aktivitetslogg.
3. Ingen deling uten at senior ser funksjonen i appen.
4. Ingen skritteller/bevegelse før DPIA og advokat.
5. Ingen varsler med sensitivt innhold på låseskjerm.
6. Ingen betaling før kjøpsvilkår og angrerett er avklart.

## Advokatpunkter

- `[ADVOKAT]` Om samtykke er riktig grunnlag for aktivitetsstatus eller om annen modell bør brukes.
- `[ADVOKAT]` Om pårørende kan opprette/administrere seniorbruker uten egen samtykkekompetanse.
- `[ADVOKAT]` Om det bør kreves egenerklæring i appen.
- `[ADVOKAT]` Hvordan fremtidsfullmakt/vergemål skal håndteres.
- `[ADVOKAT]` Hvordan uenighet i familiegruppe skal håndteres.
