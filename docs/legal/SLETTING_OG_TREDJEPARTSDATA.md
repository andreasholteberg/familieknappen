# Sletting og tredjepartsdata - Familieknappen

**Status:** rutineutkast per 2026-07-02. Ikke juridisk rådgivning. `[ADVOKAT] Tredjepartsdata i samme familiegruppe må vurderes før betalt pilot.`

## Dagens tekniske modell

- Bruker kan be om sletting i appen.
- `profiles.deletion_requested_at` settes via RPC `request_account_deletion()`.
- Bruker kan angre via `cancel_account_deletion()`.
- `purge-accounts` sletter auth-bruker etter 30 dager.
- FK-kaskader fjerner profil og tilknyttet data.
- Edge Function forsøker å slette family-photos og help-images fra Storage før auth-sletting.
- `purge_old_records` rydder varslingslogg etter 90 dager og paringsdata/invitasjoner etter 30 dager.

## 30 dagers angrefrist

Formål:

- Hindre utilsiktet permanent sletting.
- Gi senior/pårørende tid til å forstå konsekvensen.
- Gi support tid til å avklare feil.

Krav:

- Appen skal vise at sletting skjer etter 30 dager.
- Appen skal vise at man kan angre.
- Endelig sletting skal ikke skje før fristen er ute.
- Manuell sletting i dashboard skal bare gjøres med eksplisitt godkjenning.

## Hva slettes

| Datatype | Dagens antatte håndtering | Status |
| --- | --- | --- |
| Auth-bruker | Slettes av admin.deleteUser | OK |
| Profil | FK-kaskade fra auth/profil | OK, må verifiseres live |
| Medlemskap | Kaskade der FK er satt | OK, må verifiseres |
| Hjelpeforespørsler fra bruker | Kaskade hvis senior_id peker til bruker | OK, men tredjepartsdata må vurderes |
| Svar fra bruker | Kaskade hvis responder_id peker til bruker | OK, men trådkontekst må vurderes |
| Help-images | Slettes av `purge-accounts` for brukerens forespørsler | OK etter lokal kodeendring |
| Family-photos | Slettes av `purge-accounts` for brukerens egne opplastinger | OK etter lokal kodeendring |
| Kalender | Avhenger av FK/created_by og gruppe | MÅ VERIFISERES |
| Push-token | Kaskade/sletting ved logout og user-delete | OK, må verifiseres |
| Varslingslogg | 90 dagers retention | OK |
| Paringsforsøk/koder | 30 dagers retention | OK |
| Samtykkelogg | Ligger i profile; slettes med profil | [ADVOKAT] om noe bør beholdes/anonymiseres |
| Betalingsdata senere | Ikke bygget | FREMTIDIG |

## Tredjepartsdata i samme tråd

Problem:

En hjelpeforespørsel kan inneholde både seniorens melding/bilde og pårørendes svar. Hvis senior sletter kontoen sin, kan pårørendes svar også forsvinne. Hvis pårørende sletter sin konto, kan seniorens historikk miste svaret.

Mulige modeller:

1. Full sletting av alt knyttet til brukerens konto.
2. Anonymisering av brukerens bidrag, men behold tråd for andre.
3. Behold felles tråder til familiegruppen slettes, men fjern personkobling.
4. La primærkontakt administrere familiesletting.

`[ADVOKAT]` Velg modell før betalt pilot. Dagens modell er teknisk enkel, men må juridisk vurderes.

## Bilder av andre personer

Familiebilder kan vise barn, barnebarn, helseforhold, hjemmemiljø eller tredjeparter. Dagens tiltak er private buckets, RLS, signed URLs, metadatafjerning og slettefunksjon. Likevel bør appen ha veiledning:

- Ikke del bilder som andre ikke bør se.
- Ikke del sensitive helse-/økonomiopplysninger unødvendig.
- Opplaster eller primærkontakt kan slette familiebilder.

`[ADVOKAT]` Vurder om bildedeling krever tydeligere samtykke/varsel i ekstern beta.

## Logger

- Varslingslogg: 90 dager.
- Paringsforsøk/koder: 30 dager.
- Invitasjoner: ryddes etter utløp/aksept/tilbaketrekking med 30 dagers margin i privacy-hardening.
- Edge Function logs: må verifiseres i Supabase Dashboard; ikke styrt direkte av repoet.

## Samtykkelogg

Dagens samtykkelogg ligger i `profiles`. Den slettes trolig ved kontosletting. For dokumentasjon kan det være behov for å beholde en minimal anonymisert logg over at en versjon ble akseptert.

`[ADVOKAT]` Avklar om samtykkelogger skal slettes, anonymiseres eller beholdes i begrenset form etter kontosletting.

## Betalingsdata senere

Når Stripe kommer:

- Appdata og betalingsdata må skilles.
- Sletting av appkonto betyr ikke nødvendigvis sletting av lovpålagt faktura-/bokføringsdata.
- Stripe customer/subscription id må dokumenteres i ROPA.
- Betalingshistorikk må ha egen lagringstid og rettslig grunnlag.

## Operativ sletterutine

1. Bruker ber om sletting i appen.
2. Appen viser 30 dagers frist og angremulighet.
3. Support kan hjelpe, men skal ikke slette manuelt uten identitetskontroll.
4. Etter frist kjører `purge-accounts`.
5. Kontroller `errors` fra funksjonen hvis tilgjengelig.
6. Ved feil: ikke forsøk ad hoc-sletting uten logg og plan.
7. Dokumenter slettesaker som support har håndtert manuelt.

## Trygg test av sletting

- Bruk testbrukere/testfamilie, ikke ekte mor-pilot-data.
- Ta notat av bruker-id, men ikke lim persondata i chat.
- Sett deletion_requested_at i testdata bare med eksplisitt godkjenning.
- Kjør purge mot test hvis mulig.
- Verifiser Storage og relaterte tabeller etterpå.
