# Advokatspørsmål - Familieknappen

**Status:** samlet liste per 2026-07-02. Punktene må vurderes før betalt pilot, og flere bør vurderes før ekstern beta.

## Kritiske spørsmål før ekstern/betalt pilot

1. **Samtykkekompetanse hos senior**
   - Når kan senior gyldig samtykke til bruk av appen?
   - Hva hvis senior har redusert kognitiv kapasitet?
   - Bør appen kreve egenerklæring fra pårørende?

2. **Pårørende som administrator**
   - Er pårørende bare bruker, eller kan rollen gi behandlingsansvar/felles ansvar?
   - Kan primærkontakt opprette/administrere seniorbruker?
   - Hvilke plikter skal pårørende akseptere?

3. **Oppsett på vegne av senior**
   - Kan pårørende installere og konfigurere appen for senior?
   - Kreves seniorens uttrykkelige medvirkning?
   - Hvordan håndteres fremtidsfullmakt/vergemål?

4. **Tredjepartsdata ved sletting**
   - Hva skjer med svar fra andre hvis en bruker sletter kontoen?
   - Kan felles tråder beholdes anonymisert?
   - Skal hele familiegruppen slettes når senior slettes?

5. **Bilder av barn/barnebarn/tredjepersoner**
   - Er dagens tekst tilstrekkelig?
   - Kreves særskilt veiledning eller samtykke?
   - Hva med bilder i hjemmet, helsebrev eller økonomiske dokumenter?

6. **Brukergenerert innhold med helseopplysninger**
   - Appen tilsikter ikke helsedata, men brukere kan sende dem.
   - Er standard “brukergenerert innhold”-argumentasjon tilstrekkelig?
   - Bør personvernerklæringen presiseres?

7. **Aktivitetsstatus / “brukt i dag”**
   - Er samtykke riktig grunnlag?
   - Er boolean “brukt i dag” lav nok risiko?
   - Kreves egen samtykkelogging per funksjon?

8. **Push-varsler**
   - Er nøytrale pushtekster tilstrekkelige?
   - Må alle varseltyper fjerne navn før ekstern beta?
   - Hva med låseskjerm-risiko?

9. **Tredjelandsoverføring**
   - Supabase, Resend, Expo, GitHub/EAS: DPF/SCC/status.
   - Er leverandørenes DPA-er tilstrekkelige?
   - Må det gjøres transfer impact assessment?

10. **Kjøpsvilkår og angrerett**
    - Pårørende er kjøper, senior er bruker.
    - Angrerett for digital tjeneste/abonnement.
    - Krav til uttrykkelig samtykke ved umiddelbar levering.

11. **App Store / Google Play**
    - Må betaling gå via in-app purchase, eller kan webbetaling brukes?
    - Hvordan beskrives data i Privacy Nutrition Labels/Data Safety?

12. **Ekstern abonnementshåndtering**
    - Hvilke data kan Stripe lagre?
    - Hvordan håndteres sletting av appkonto versus bokføringsdata?

13. **Ansvarsfraskrivelse**
    - Er “assistanse, ikke nødtjeneste” tilstrekkelig?
    - Kan appen fraskrive ansvar for uteblitte varsler?
    - Må 113/akutt-henvisning vises mer fremtredende?

14. **Markedsføring mot pårørende**
    - Hvordan unngå fryktpress mot sårbare familier?
    - Hvilke påstander kan brukes om trygghet/svindelvern?

15. **Fremtidige premiumfunksjoner**
    - Skritteller/bevegelse: art. 9/helseopplysninger?
    - Auto-eskalering/rik aktivitetslogg: overvåking?
    - Video: opptak/metadata/leverandøransvar?

## Foreslått leveranse fra advokat

- Kommentert personvernerklæring.
- Kommenterte brukervilkår.
- Vurdering av samtykkekompetanse/rutine.
- Vurdering av DPA/overføringsgrunnlag.
- Vurdering av sletting/tredjepartsdata.
- Kjøpsvilkår og angrerettstekst før Stripe.
- Kort notat om markedsføring og “ikke nødtjeneste”.
