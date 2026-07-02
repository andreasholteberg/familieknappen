# Uavhengig GDPR-revisjon – Familieknappen (per commit a07cedb + fikser)

Andregangsvurdering av hele repoet mot GDPR og tilgrensende regler, utført
som kontroll av `GDPR_DISTRIBUSJONSRAPPORT.md`. **Ikke juridisk rådgivning**
– advokatgjennomgang står fortsatt som eget krav.

## Samlet dom

**Familieknappen er IKKE formelt GDPR-compliant i dag – men den er trygt
innenfor for det den faktisk brukes til (intern familiepilot), og det
tekniske fundamentet er uvanlig sterkt for stadiet.** Compliance-gapet er
nesten utelukkende formalisering og avtaler, ikke teknikk. Konklusjonen i
distribusjonsrapporten bekreftes.

Trafikklys per område:

| Område | Status | Kommentar |
|---|---|---|
| Behandlingsgrunnlag (art. 6) | 🟢 | Dokumentert per behandling (etterlevelsesplan § 3) og speilet i erklæringen |
| Informasjonsplikt (art. 13) | 🟡 | Erklæring i app ✓, men behandlingsansvarlig mangler navn/org.nr/kontakt-epost |
| Rettigheter (art. 15–21) | 🟢 | Innsyn i app, retting (navn+telefon – navn NYTT i denne runden), sletting m/angrefrist, samtykketrekk. Eksport = manuell rutine (OK i pilot) |
| Samtykke (art. 7) | 🟢 | Versjonert, tidsstemplet, per dokument; aktivitetsdeling opt-in |
| Dataminimering (art. 5c) | 🟢 | Ingen GPS/tracking/analyse; push nøytralisert (escalate rettet NÅ); bilder nedskaleres; logger uten innhold |
| Lagringsbegrensning (art. 5e) | 🟢 | 90 dg logg, 30 dg paringsdata, 30 dg slettefrist; purge rydder Storage-filer og nå også tomme grupper |
| Sikkerhet (art. 32) | 🟢 | RLS m/skriftlig revisjon, private buckets, EU-region **bekreftet (aws-0-eu-west-1)**, secrets utenfor repo, 401 verifisert på funksjoner |
| Databehandlere (art. 28) | 🔴 | DPA-er IKKE arkivert (Supabase/Resend/Expo). Blokkerer ekstern beta |
| Tredjelandsoverføring (kap. V) | 🟡 | DB i EU ✓. Resend/Expo (US) trenger dokumentert DPF/SCC-grunnlag |
| DPIA (art. 35) | 🟡 | Utkast finnes i docs/legal – må ferdigstilles/signeres før ekstern beta |
| ROPA (art. 30) | 🟡 | Finnes – må vedlikeholdes som levende dokument |
| Avvik (art. 33/34) | 🟡 | Rutine skrevet – ikke øvd (tabletop) |
| Sårbar gruppe / samtykkekompetanse | 🔴 | Notat finnes, men dette er DET åpne juridiske spørsmålet – krever advokat før betalt tjeneste |

## Nye funn i denne revisjonen (utover distribusjonsrapporten)

1. **RETTET – escalate-push lekket navn.** send-push og notify-call var
   nøytralisert, men eskaleringsvarselet viste fortsatt seniorens navn på
   låseskjerm. Nå: «Familieknappen / Noen i familien venter fortsatt på svar.»
2. **RETTET – navn kunne ikke rettes i appen (art. 16).** Nytt «Mitt
   navn»-felt i innstillinger (egen profil, RLS).
3. **RETTET – tomme familiegrupper ble stående etter siste sletting.**
   Gruppenavn kan være persondata («Familien Holteberg»); purge-accounts
   sletter nå medlemsløse grupper.
4. **RETTET – console.warn i auth-callback manglet __DEV__-vern.**
5. **Bekreftet fra konfig:** databaseregionen er `aws-0-eu-west-1` (EU) –
   punktet «verifiser region» i rapporten kan hukes av for databasen.
   (Storage/Functions følger prosjektregionen.)
6. **Gjenstående engangsjobb:** foreldreløse help-images fra FØR
   opprydningsfiksen (TODO i purge-accounts) – kjør en verifisert dry-run.

## Prioritert fikseliste (det du faktisk må gjøre)

**Nå (før flere familier enn din egen):**
1. Arkiver DPA-ene: Supabase, Resend, Expo – last ned/aksepter og lagre
   utenfor repoet, noter dato i `DPA_REGISTER.md`. (1 time)
2. Sett inn reelt behandlingsansvarlig-navn + kontakt-epost i
   `legal.ts`-tekstene (bump versjon). (15 min)
3. Test slettekjeden med en testbruker ende-til-ende (be om sletting → sett
   dato 31 dg tilbake → kjør purge → verifiser at auth, rader OG filer er
   borte). (30 min)

**Før ekstern/lukket beta:**
4. Ferdigstill og signer DPIA-en (utkastet ligger klart).
5. Dokumenter overføringsgrunnlag for Resend/Expo (DPF-status/SCC) i
   DPA-registeret.
6. Manuell dataeksport-test (art. 20-rutinen i REGISTRERTES_RETTIGHETER).
7. Tabletop-øvelse av avviksrutinen (30 min rundt kjøkkenbordet holder).
8. Advokatgjennomgang – send `ADVOKATSPORSMAL.md` som bestilling; viktigst:
   samtykkekompetanse og tredjepartsdata ved sletting.

**Før betalt tjeneste:**
9. Kjøpsvilkår + angrerett (web-portalen), oppdaterte vilkår.
10. Sentry med scrubbing, pgTAP-tester, Supabase Pro (backup/PITR).
11. Privacy-labels (Play/App Store) ved butikkdistribusjon.

## Andre regelverk (kort)

- **Ekomloven/cookies (web):** kun nødvendig lagring (sesjon) – OK uten
  banner; nevn det i erklæringen ved web-lansering.
- **Markedsføringsloven:** «få hjelp før du svarer»-tonen er OK; unngå
  fryktbasert markedsføring mot sårbar gruppe (notert i planen).
- **Angrerettloven:** aktiveres først ved betaling (Fase 3).
- **Tilgjengelighetskrav (uu-forskriften/EAA):** appen retter seg mot
  forbrukere; European Accessibility Act stiller krav til e-tjenester –
  a11y-revisjonen (F-062) er dermed også et regulatorisk poeng, ikke bare UX.
