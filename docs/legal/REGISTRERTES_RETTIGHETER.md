# Rutine for registrertes rettigheter - Familieknappen

**Status:** operativ pilotrutine per 2026-07-02. Ikke juridisk rådgivning. Rettighetskrav skal normalt besvares innen én måned.

## Prinsipper

- Bekreft identitet før du utleverer eller endrer data.
- Del aldri én families data med andre.
- Ikke send rå databaseeksport ukritisk; minimer og forklar.
- Dokumenter alle henvendelser, frister, tiltak og svar.
- Ved tvil: merk saken `[ADVOKAT]`.

## Innsyn

| Felt | Rutine |
| --- | --- |
| Hva kan brukeren gjøre selv | Se egne meldinger, svar, kalender, familiebilder og innstillinger i appen. |
| Via support | Be om samlet oversikt over konto/profil, familiegruppe, innhold og logger. |
| Hvor data ligger | Supabase: profiles, family_members, help_requests, help_responses, calendar_events, family_photos, notification_tokens/log, pairing/invitations. |
| Frist | Normalt én måned. |
| Hvem håndterer | Andreas/behandlingsansvarlig. |
| Dokumentasjon | Registrer dato, bruker, hva som ble utlevert og hvordan identitet ble kontrollert. |
| Pilot | Manuell eksport er akseptabelt hvis kvalitetssikret. |
| Senere | Bygg selvbetjent dataeksport/portabilitet. |

## Retting

| Felt | Rutine |
| --- | --- |
| Selv i appen | Telefon kan endres; enkelte navn/roller kan følge profil/onboarding. |
| Via support | E-post, feil rolle, feil familiegruppe eller feil navn. |
| Hvor data ligger | profiles, family_members, group_invitations. |
| Frist | Uten ugrunnet opphold, senest én måned. |
| Dokumentasjon | Noter hva som ble rettet og hvorfor. |
| Pilot | Manuell SQL bare med eksplisitt kontroll og uten å eksponere data i chat. |
| Senere | Adminverktøy med audit-logg. |

## Sletting

| Felt | Rutine |
| --- | --- |
| Selv i appen | Bruker kan be om sletting og angre innen 30 dager. |
| Via support | Hjelp hvis bruker ikke kommer inn i appen. |
| Hvor data ligger | profiles + auth.users, relaterte tabeller og Storage. |
| Frist | Sletting skal gjennomføres etter 30 dagers angrefrist, med mindre juridisk grunn tilsier annet. |
| Dokumentasjon | Logg request, eventuell angre, endelig purge og resultat. |
| Pilot | Bruk appens flow; ikke slett manuelt uten backup/eksplisitt godkjenning. |
| Senere | Adminstatus for pending deletion og eksport før sletting. |
| Åpent | [ADVOKAT] tredjepartsdata i familiegruppe/tråder. |

## Begrensning

| Felt | Rutine |
| --- | --- |
| Selv i appen | Slå av aktivitetsdeling; logg ut; slutte å sende innhold. |
| Via support | Pause konto, stoppe behandling av bestemte data hvis mulig. |
| Hvor data ligger | profiles, notification_tokens, activity_status. |
| Frist | Én måned. |
| Dokumentasjon | Hva er begrenset, fra når og hvorfor. |
| Pilot | Manuelt tiltak; vurder å deaktivere push-token eller markere konto. |
| Senere | Egen “pause konto”-funksjon hvis behov. |

## Protest

| Felt | Rutine |
| --- | --- |
| Aktuelt for | Behandling basert på berettiget interesse: varslingslogg, paringsforsøkslogg, sikkerhet/logg. |
| Selv i appen | Ikke full selvbetjening; bruker kan slå av aktivitetsdeling, men den er samtykkebasert. |
| Via support | Vurder protest konkret mot sikkerhets-/driftsbehov. |
| Frist | Én måned. |
| Dokumentasjon | Vurdering av om berettiget interesse fortsatt veier tyngre. |
| Pilot | Manuell vurdering. |
| Senere | Standardisert svarmal/interesseavveining. |

## Dataportabilitet

| Felt | Rutine |
| --- | --- |
| Selv i appen | Ikke bygget. |
| Via support | Eksporter data i strukturert format, for eksempel JSON/CSV + bilder som filer. |
| Hvor data ligger | Samme som innsyn, pluss Storage. |
| Frist | Én måned. |
| Dokumentasjon | Hva som ble eksportert og hvordan det ble overført sikkert. |
| Pilot | Manuell eksport etter kontroll. |
| Senere | Selvbetjent “Last ned mine data”. |

## Tilbaketrekking av samtykke

| Felt | Rutine |
| --- | --- |
| Selv i appen | Aktivitetsdeling kan slås av i senior/personvern og pårørende-innstillinger. |
| Via support | Hjelp hvis bruker ikke får det til. |
| Hvor data ligger | profiles.activity_sharing_enabled, activity_status. |
| Frist | Virkning fremover straks/uten ugrunnet opphold. |
| Dokumentasjon | Trenger normalt ikke manuell logg utover feltendring; vurder audit senere. |
| Pilot | OK. |
| Senere | Egen samtykkelogging per funksjon hvis flere samtykker innføres. |

## Klage til Datatilsynet

Brukere skal informeres om at de kan klage til Datatilsynet. Personvernerklæringen nevner dette. Support bør først forsøke å løse saken rolig og dokumentere dialogen.

## Supportmal

```text
Hei,

Vi har mottatt henvendelsen din om [innsyn/retting/sletting/portabilitet].
Vi må først bekrefte at du er riktig bruker. Svar fra samme e-postadresse du bruker i Familieknappen, og oppgi gjerne hvilken familiegruppe saken gjelder.

Vi svarer så snart vi kan og senest innen én måned.

Vennlig hilsen
Familieknappen
```
