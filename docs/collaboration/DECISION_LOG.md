# Decision Log - Familieknappen

| Dato | Beslutning | Begrunnelse | Konsekvens | Må revurderes når |
| ---- | ---------- | ----------- | ---------- | ----------------- |
| 2026-07-07 | Pårørende er kjøper og administrator. | Pårørende har betalingsvilje og praktisk ansvar for oppsett. | Onboarding, betaling og administrasjon prioriteres for pårørende. | Før ekstern beta og ved Stripe/webbetaling. |
| 2026-07-07 | Senior er bruker, ikke administrator. | Senior skal slippe komplisert oppsett og juridisk/teknisk friksjon. | Senior-UI skal være enkel, varm og handlingsorientert. | Ved nye seniorrettede innstillinger. |
| 2026-07-07 | OTP er primær innlogging. | E-postkode er mer robust enn magic link på mobil og reduserer deep-link-friksjon. | Appen skal prioritere 6-sifret kode i pilot. | Hvis OTP gir leveringsproblemer eller høy supportbelastning. |
| 2026-07-07 | Magic link/deep link er fallback. | Deep links er nyttige, men har vært ustabile i APK-test. | Koden beholdes, men er ikke hovedflyt i pilot. | Før ny native auth-strategi eller app store-lansering. |
| 2026-07-07 | Betaling skal skje på web, ikke i mobilapp. | Reduserer App Store/Play Store-risiko og passer pårørende som kjøper. | Mobilapp skal ikke ha kjøpsflyt. | Før Stripe og kommersiell pilot. |
| 2026-07-07 | Mobilappen skal ikke vise kjøpslenker eller priser. | Unngår plattformrisiko og holder senioropplevelsen rolig. | Lisens/sperre må være nøytral i app. | Før App Store/Play Store-vurdering. |
| 2026-07-07 | `subscription_status` planlegges på familiegruppe-/lisensnivå. | Lisens gjelder familiegruppen, ikke bare én bruker. | Betalingsmodell må knyttes til gruppe/administrator. | Før Stripe-datamodell låses. |
| 2026-07-07 | Aktivitetsdeling er opt-in. | Senior skal ikke føle seg overvåket, og deling må være forståelig. | Pårørende ser bare “brukt appen i dag” når senior deler. | Ved nye aktivitets- eller statusfunksjoner. |
| 2026-07-07 | Push skal være dataminimert. | Låseskjerm kan leses av andre. | Push-tekst skal være nyttig, men uten navn/sensitive detaljer. | Ved nye push-typer. |
| 2026-07-07 | Bilder skal lagres privat. | Familiebilder kan inneholde barn, hjem og tredjepersoner. | Private buckets, signed URLs og RLS må være standard. | Før ekstern beta og dataeksport. |
| 2026-07-07 | Appen er ikke nødtjeneste. | Tjenesten kan ikke garantere respons eller akutt hjelp. | Vilkår, onboarding og markedsføring må være tydelige. | Før betalt pilot og markedsmateriell. |
| 2026-07-07 | Videochat, skritteller, VoIP-ringekjede og avansert overvåking utsettes. | Høy teknisk, juridisk og personvernmessig kompleksitet. | Fokus holdes på kjerneflyt, trygg kontakt og enkel hjelp. | Etter stabil ekstern beta eller advokat/DPIA. |
| 2026-07-07 | Bildedeling/familiestrøm vurderes som mulig neste produktløft etter stabil APK-test. | Kan gi daglig sosial verdi uten å endre kjerneauth. | Må vurderes mot tredjepartsdata, sletting og samtykke. | Etter mor-pilot og Claude-produktvurdering. |
| 2026-07-07 | Advokat må vurdere samtykkekompetanse, tredjepartsdata, tredjelandsoverføring og kjøpsvilkår før betalt pilot. | Dette er sentrale juridiske risikoområder for sårbar brukergruppe og betalt tjeneste. | Betalt pilot skal ikke starte før juridisk gjennomgang er gjort. | Før betalt pilot. |
