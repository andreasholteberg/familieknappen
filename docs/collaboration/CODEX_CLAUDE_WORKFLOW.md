# Codex-Claude Workflow for Familieknappen

Sist oppdatert: 2026-07-07

## 1. Formål

Dette dokumentet beskriver hvordan Andreas, Claude og Codex skal samarbeide kontrollert om Familieknappen. Målet er å gjøre appen GDPR-robust og produktmessig sterk uten at personvernarbeidet gjør appen tung, skremmende eller unødvendig friksjonsfylt.

Arbeidsformen skal holde tre hensyn samlet:

- personvern og juridisk etterlevelse
- seniorvennlig enkelhet og trygghet
- sosial kobling og kommersiell bærekraft

## 2. Roller

### Andreas

- beslutningstaker og produkteier
- godkjenner risiko, publisering, prioriteringer og større veivalg
- tester med senior og pårørende
- håndterer manuelle dashboardoppgaver og secrets
- avgjør når noe er klart for push, deploy, APK-build eller ekstern test

### Claude

- produktarkitekt og kritisk sparringspartner
- vurderer GDPR, DPIA, ROPA, samtykke, samtykkekompetanse og brukeropplevelse
- vurderer seniorvennlig UX og kommersiell prioritering
- lager forslag, beslutningspunkter og Codex-prompter
- skal ikke implementere direkte uten Andreas sin godkjenning

### Codex

- inspiserer kodebase, migreringer, Edge Functions og dokumentasjon
- implementerer små, avgrensede og godkjente endringer
- kjører typecheck, build, migreringskontroll og deploy når eksplisitt godkjent
- rapporterer hva som er endret, testet og ikke testet
- stopper før push, deploy, APK-build eller irreversible handlinger hvis dette ikke er godkjent
- tar ikke store produktbeslutninger alene

## 3. Arbeidsflyt

Standard syklus:

1. Codex kartlegger teknisk og dokumentarisk status.
2. Claude vurderer konsekvenser for produkt, GDPR, senioropplevelse og kommersiell retning.
3. Codex oversetter Claude-forslag til konkrete beslutningspunkter.
4. Andreas godkjenner retning og risiko.
5. Codex implementerer én liten, avgrenset endring.
6. Codex kjører relevante sjekker, normalt `typecheck` og `build:web`.
7. Codex stopper før push, deploy, migrering eller APK-build hvis dette ikke er eksplisitt godkjent.
8. Andreas tester på egen telefon og deretter eventuelt med senior/pårørende.
9. Funn dokumenteres i relevant rapport, beslutningslogg eller plan.

## 4. Stopprekker

Codex skal stoppe og be om godkjenning før:

- nye migreringer
- RLS-endringer
- Edge Function-endringer
- push-varselendringer
- endringer i samtykke, personvern eller vilkår
- endringer i sletting, purge eller retention
- endringer i betalings-, lisens- eller Stripe-logikk
- endringer i App Store-, Play Store- eller Stripe-strategi
- endringer som kan øke overvåkingsfølelse for senior
- alt som krever secrets, tokens, API keys eller dashboardtilgang
- push, deploy eller APK-build når dette ikke allerede er eksplisitt godkjent

## 5. Produktprinsipper

- Personvern først, men ikke friksjon for friksjonens skyld.
- Senior skal forstå og bruke appen, ikke administrere den.
- Pårørende skal kunne sette opp, betale og hjelpe uten å overstyre senior.
- Sosial nærhet er en kjerneverdi, ikke pynt.
- Aktivitetsdeling skal være frivillig, tydelig og reversibel.
- Bildedeling skal være varm, privat og enkel.
- Push-varsler skal være nyttige, men dataminimerte på låseskjerm.
- Appen skal aldri fremstilles som nødtjeneste.
- Ingen skjult overvåking eller passiv kontroll.
- Samtykke skal være reelt, forståelig og egnet for sårbar brukergruppe.

## 6. Definisjon av GDPR-klar

### Intern pilot

Kan brukes av mor/familie med lav risiko, tydelig avgrensning og manuell oppfølging. Må ha fungerende OTP, privat familiegruppe, grunnleggende RLS, forståelig samtykke, og trygg slette-/supportvei.

### Ekstern beta

Krever DPA-arkiv, dashboard-verifisering, supportkontakt, DPIA-utkast, oppdatert ROPA, personvernerklæring, vilkår, rutiner for rettigheter og avvik, samt dokumentert test av auth, storage, push og sletting.

### Betalt pilot

Krever advokatgjennomgang, kjøpsvilkår, angrerett, betalingsflyt uten App Store-brudd, dataeksport eller manuell innsynsrutine, DPA/overføringsgrunnlag, logging/scrubbing og tydelig ansvarsavgrensning.

### Kommersiell distribusjon

Krever moden drift, support, sikkerhetsrutiner, beredskap, App Store/Play Store-avklaringer, leverandørkontroll, overvåking av feil, advokatgodkjent ramme og dokumentert håndtering av personvernforespørsler.

## 7. Dokumentasjonsregler

Alle endringer som påvirker personvern, datatyper, tilgang, sletting, samtykke, push, bilder, auth, betaling eller leverandører skal enten:

- oppdatere relevant dokumentasjon, eller
- registreres som dokumentasjonsgjeld med tydelig eier og frist.

Relevante dokumenter er særlig:

- `JURIDISK_ETTERLEVELSESPLAN.md`
- `COMMERCIAL_APP_COMPLETION_PLAN.md`
- `PERSONVERN.md`
- `VILKAR.md`
- `src/content/legal.ts`
- `docs/legal/*`
- `docs/collaboration/DECISION_LOG.md`
