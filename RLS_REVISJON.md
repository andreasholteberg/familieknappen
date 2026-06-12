# RLS-revisjon (F-033) – juni 2026

Skriftlig gjennomgang av tilgangskontrollen etter Fase 1. Metode: lest alle
policy-migreringer + SECURITY DEFINER-funksjoner mot faktisk bruk i
service-laget. Statisk revisjon – RLS-tester (pgTAP) er fortsatt anbefalt.

## Konklusjon
Modellen er forsvarlig for lukket pilot. To funn ble RETTET under revisjonen,
tre observasjoner står igjen som aksepterte risikoer med begrunnelse.

## Funn og status

**R1 · RETTET – `family_groups` insert var åpen for alle innloggede.**
Kjent fra § 2.5 i planen. Onboarding går nå utelukkende via
`create_family_group()` (SECURITY DEFINER med egne sjekker), så insert-policyen
er fjernet helt (`20260614120000_tighten_group_insert.sql`). En innlogget
bruker kan ikke lenger opprette vilkårlige grupper direkte.

**R2 · RETTET – lisensfelter kunne vært skrivbare fra klient.**
`family_groups_update`-policyen gjelder alle gruppemedlemmer. Med nye
billing-felter (F-018) ville et medlem kunne sette `subscription_status` selv.
Løst med kolonnenivå-tilgang: `revoke update` + `grant update (name)` til
authenticated. Klienter kan kun endre gruppenavn; lisensfeltene er
service-role-only (`20260614100000_subscription_status.sql`).

**R3 · OK – paringskoder.**
`pairing_codes`: select for gruppemedlemmer, insert/update kun primærkontakt,
innløsing kun via `pair_with_code()` (SECURITY DEFINER) med engangsbruk,
15 min utløp, maks 5 forsøk per bruker per kvarter, og check-constraint mot
`primary_contact`-rolle. `pairing_attempts` har RLS på uten policies – kun
RPC-en når den. Restrisiko: en fremmed MED gyldig kode og riktig timing kan
bli med i gruppa – det er per design (koden ER nøkkelen); kort levetid og
engangsbruk begrenser. Koden leses opp muntlig, sendes ikke digitalt av appen.

**R4 · Akseptert – bred tillit innad i gruppa.**
Alle gruppemedlemmer kan lese/endre forespørsler og kalender. For én familie
er det riktig avveining (planen § 2.5). Bør revurderes ved større grupper.

**R5 · Akseptert – `escalation_due_at` settes av klienten.**
Et ondsinnet gruppemedlem kan sette fristen kunstig. Konsekvensen er begrenset
til egen gruppes eskaleringstidspunkt. Kan flyttes til DB-default senere.

**R6 · Observasjon – `stop_escalation_on_response()` er SECURITY DEFINER.**
Trigges kun av insert i `help_responses`, som selv krever
`responder_id = auth.uid()` + gruppemedlemskap. Oppdaterer kun
`escalation_stopped_at` på tilhørende forespørsel. Vurdert trygg.

## Verifisert i denne revisjonen
- Ingen `service_role`-referanser i `src/`/`app/` (kun Edge Functions).
- `notify-call` (ny) krever gyldig JWT og utleder gruppe fra innsenderen –
  en bruker kan ikke varsle andres familier.
- Alle SECURITY DEFINER-funksjoner setter `search_path = public, pg_temp`.
- Storage-policyene (help-images) er uendret: gruppemedlemskap fra filsti.

## Anbefalt videre (P2)
pgTAP-tester for policyene, opprydding i `pairing_attempts` (cron),
signaturverifisert webhook, og DB-default for eskaleringsfrist (R5).
