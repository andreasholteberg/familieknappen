# F-043: Forundersøkelse – innsending av meldinger/e-post til Familieknappen

Beslutningsnotat for «videresend til Familieknappen»-ønsket fra
funksjonstesten (§ 9.1.5). Ingen kode bygges nå – dette avklarer veivalget.

## Behovet
Senior får en mistenkelig SMS/e-post og vil dele den uten å fotografere
skjermen. Kamera-flyten (bygget) dekker brev og andres skjermer; egen skjerm
er fortsatt klønete.

## Alternativ A: Native share-extension («Del til Familieknappen»)
- Android: Expo støtter intent-filters for deling av bilder/tekst inn i appen
  via config plugins – mulig i managed workflow med custom dev client/EAS.
  iOS share-extension krever derimot egen extension-target = bare workflow
  eller config-plugin-akrobatikk med vesentlig kompleksitet.
- Vurdering: **Android-delen er realistisk uten eject** (intent-filter +
  håndtering av delt innhold i +native-intent). iOS-delen bør vente.
- Kostnad: 2–4 utviklingsrunder + ny APK. Risiko: middels.

## Alternativ B: E-postinnsending (inbound)
- Resend støtter per i dag primært utgående e-post; inbound krever annen
  leverandør (Postmark/Mailgun/CloudMailin) → ny databehandler, ny DPA,
  spam-/misbruksflate, og adresse-per-familie-håndtering.
- Vurdering: **frarådes** – personvernkostnaden (e-post som åpen
  innsendingskanal) står ikke i forhold til gevinsten for målgruppen, som
  uansett sliter med videresending av e-post.

## Anbefaling
1. Fase 2: bygg **Android share-intent** («Del bilde/tekst til
   Familieknappen» fra Meldinger/Gmail) – starter spør-flyten med innholdet
   forhåndsutfylt. Gjenbruker hele eksisterende flyt.
2. iOS-deling og e-postinnsending: revurder først ved iOS-satsing (Fase 3+).
3. Mål i piloten: hvor ofte er «det jeg lurer på er på min egen skjerm»
   faktisk tilfellet? Det avgjør prioriteten.
