# Android-sjekkliste for oppsett av seniors telefon (F-061)

Push-varsler er den vanligste stille feilen på Android hos eldre brukere.
Gå gjennom denne lista når appen installeres på en ny telefon – særlig
Samsung og Xiaomi, som har aggressiv batterisparing.

## Ved installasjon
1. **Varslingstillatelse:** Godta «Tillat varsler» når appen spør
   (Android 13+ krever dette eksplisitt). Sjekk etterpå: Innstillinger →
   Apper → Familieknappen → Varsler → På.
2. **Batterisparing:** Innstillinger → Batteri → (Bakgrunnsbruk /
   Batterioptimalisering) → Familieknappen → «Ikke optimaliser» /
   «Ubegrenset». På Samsung: fjern appen fra «Apper i dvale».
3. **Ikke forstyrr:** Hvis senior bruker «Ikke forstyrr» på natten, vurder
   å legge Familieknappen som unntak.
4. **Datasparing:** Innstillinger → Nettverk → Datasparing → tillat
   bakgrunnsdata for Familieknappen.

## Test etterpå (2 minutter)
1. Lås seniors telefon.
2. Send en testforespørsel fra seniors konto (eller svar fra pårørende).
3. Varselet skal vises på låseskjermen innen 30 sekunder.
4. Trykk på varselet → appen skal åpne rett på riktig skjerm.

## Hvis varsler likevel ikke kommer
- Sjekk at `notification_tokens` har en rad for brukeren (Supabase).
- Sjekk `notification_log` for `no_token` eller `error`.
- Logg ut og inn igjen i appen (registrerer token på nytt).
- Restart telefonen (hjelper oftere enn man tror).
