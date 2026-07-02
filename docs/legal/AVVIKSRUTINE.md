# Avviksrutine - Familieknappen

**Status:** praktisk rutine per 2026-07-02. Dette er ikke juridisk rådgivning. Brukes for å oppdage, vurdere, dokumentere og håndtere brudd på personopplysningssikkerheten.

## Hva er et avvik?

Et avvik er en hendelse som fører til utilsiktet eller ulovlig tilintetgjøring, tap, endring, ikke-autorisert utlevering av eller tilgang til personopplysninger.

## Eksempler relevante for Familieknappen

- Feil familie får se en melding, et bilde eller en kalenderhendelse.
- Storage bucket blir offentlig ved feil.
- RLS-policy gir tilgang på tvers av familiegrupper.
- Service role key/API key eksponeres i repo, logg eller chat.
- OTP, token, e-post eller telefonnummer skrives til offentlig logg.
- APK/build-logg inneholder secrets.
- Pushvarsel røper sensitivt innhold på låseskjerm.
- Konto slettes feil eller før 30 dagers frist.
- Leverandørmelder om sikkerhetshendelse hos Supabase, Resend eller Expo.

## Første 0-24 timer

1. Stans videre skade hvis mulig uten å slette bevis.
2. Noter tidspunkt, hvem oppdaget hendelsen og første observasjon.
3. Ta vare på relevante logger, men ikke kopier unødvendige persondata.
4. Vurder om hemmeligheter må roteres: Supabase keys, Resend key, EAS/GitHub secrets, webhook secret.
5. Vurder om funksjon må deaktiveres midlertidig: push, bildedeling, invitasjon, purge.
6. Kontroller leverandørstatus:
   - Supabase status/dashboard/logs
   - Resend logs/status
   - Expo status
   - GitHub/EAS Actions/build logs
7. Opprett avviksloggpost med malen nederst.

## Vurdering innen 72 timer

Innen 72 timer fra man ble kjent med avviket skal det vurderes om Datatilsynet må varsles. Hvis det er sannsynlig risiko for registrertes rettigheter og friheter, skal avvik meldes. Hvis det er høy risiko, skal også berørte brukere/familier varsles uten ugrunnet opphold.

Vurder:

- Hvilke data ble berørt?
- Hvor mange brukere/familier?
- Var data kryptert eller bare id-er?
- Kan noen misbruke dataene?
- Var senior/sårbar bruker berørt?
- Kan avviket føre til sosial, økonomisk eller praktisk skade?
- Er feilen rettet?
- Er det dokumentert hvorfor man melder eller ikke melder?

## Når Datatilsynet skal varsles

Varsle Datatilsynet hvis avviket ikke er usannsynlig å medføre risiko for de registrerte. Typiske Familieknappen-tilfeller som normalt bør vurderes for melding:

- Feil familiegruppe fikk tilgang til innhold.
- Bilder/meldinger ble offentlig tilgjengelige.
- Auth- eller service-nøkler ble eksponert.
- Sletting skjedde feil eller data gikk tapt.
- Leverandørbrudd berørte Familieknappen-data.

## Når brukere/familier skal varsles

Varsle berørte brukere/familier hvis det er høy risiko. Meldingen skal være rolig, konkret og uten å dele mer data enn nødvendig.

Mal:

```text
Vi har oppdaget et personvernavvik i Familieknappen.
Dette skjedde: [kort og konkret]
Dette kan ha vært berørt: [datatyper]
Dette har vi gjort: [tiltak]
Dette bør du gjøre: [eventuelle råd]
Kontakt: [support]
```

## Hvem gjør hva

| Rolle | Ansvar |
| --- | --- |
| Andreas / behandlingsansvarlig | Eier avviksvurdering, beslutning om Datatilsynet/brukervarsel, kontakt med leverandører. |
| Teknisk hjelper/Codex/Claude | Ikke-destruktiv kartlegging, kode-/policyanalyse, forslag til tiltak. Skal ikke hente ut mer persondata enn nødvendig. |
| Advokat/personvernrådgiver | Vurdering ved høy risiko, uklar meldeplikt, samtykkekompetanse eller tredjeland/leverandørbrudd. |

## Etterarbeid

1. Dokumenter rotårsak.
2. Lag konkret patch/migrering/rutineendring.
3. Test at feilen er lukket.
4. Vurder om ROPA/DPIA/personvernerklæring må oppdateres.
5. Vurder om samtykkeversjon må bumpes.
6. Arkiver all dokumentasjon i avviksmappe.

## Avvikslogg

```md
## Avvikslogg

Dato/tid:
Oppdaget av:
Hva skjedde:
Hvilke data:
Hvilke brukere/familier:
Foreløpig risiko:
Tiltak:
Meldt Datatilsynet: ja/nei/begrunnelse
Brukere varslet: ja/nei/begrunnelse
Lukket dato:
Læring:
```

## Varslingskanaler og leverandørlenker

- Supabase Dashboard: Auth Logs, Database Logs, Edge Function Logs, Storage.
- Resend Dashboard: Domains, Logs.
- Expo/EAS: Build details, notifications/push status.
- GitHub: Actions logs, Secret scanning hvis aktivert.
- Datatilsynet: meldeskjema for avvik.
