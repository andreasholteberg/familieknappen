/**
 * Juridiske tekster (F-038/F-039) – UTKAST, ikke advokat-gjennomgått.
 *
 * Én kilde til sannhet: skjermene i appen og md-filene for web genereres
 * herfra. Versjonene driver samtykkelogging (F-041): endres en tekst
 * vesentlig, bump versjonen, og brukerne blir bedt om nytt samtykke.
 *
 * v2026-06-16: omskrevet med juridisk presisjon (behandlingsgrunnlag,
 * rettigheter, ansvarsregulering) – fortsatt i klarspråk for målgruppen.
 */

export const LEGAL_VERSIONS = {
  privacy: '2026-06-16',
  terms: '2026-06-16',
} as const;

export interface LegalSection {
  heading: string;
  body: string;
}

export const PRIVACY_TITLE = 'Personvernerklæring for Familieknappen';

export const PRIVACY_SECTIONS: LegalSection[] = [
  {
    heading: 'Hvem som er ansvarlig',
    body:
      'Utgiveren av Familieknappen er behandlingsansvarlig for opplysningene som ' +
      'beskrives her. Kontakt oss via familieknappen.app. Denne erklæringen gjelder ' +
      'appen og tilhørende tjenester, og følger personvernforordningen (GDPR) og ' +
      'personopplysningsloven.',
  },
  {
    heading: 'Hva Familieknappen er',
    body:
      'Familieknappen lar en senior spørre sin egen familiegruppe om hjelp før hen ' +
      'svarer på en melding, et brev eller en henvendelse. Appen er assistanse fra ' +
      'familien – ikke en automatisk vurdering, og den treffer ingen avgjørelser om deg.',
  },
  {
    heading: 'Hvilke opplysninger vi behandler – og hvorfor',
    body:
      'For å levere tjenesten du har avtale om (GDPR artikkel 6 nr. 1 bokstav b) ' +
      'behandler vi: navn og e-postadresse (konto og innlogging), telefonnummer hvis du ' +
      'legger det inn (ringeknappene), meldinger og bilder du selv sender som ' +
      'hjelpespørsmål, svar fra familien, og kalenderavtaler. ' +
      'Med ditt samtykke (bokstav a) deler vi «sist aktiv»-status med familiegruppen ' +
      'din – dette styrer du selv med en egen bryter, og du kan trekke samtykket når ' +
      'som helst uten begrunnelse. ' +
      'Av hensyn til sikkerhet og feilsøking (berettiget interesse, bokstav f) lagrer ' +
      'vi en kort logg over sendte varsler og over bruk av paringskoder. ' +
      'For å oppfylle rettslige plikter (bokstav c) lagrer vi når du godtok vilkårene ' +
      'og denne erklæringen.',
  },
  {
    heading: 'Det vi ikke gjør',
    body:
      'Vi bruker ikke GPS eller stedssporing, henter ikke kontaktene dine, selger ikke ' +
      'opplysninger, viser ikke reklame, og bruker ikke opplysningene til profilering ' +
      'eller automatiserte avgjørelser. Vi ber deg om å ikke sende sensitive ' +
      'opplysninger (for eksempel om helse) i meldinger med mindre det er nødvendig – ' +
      'innholdet du sender brukes uansett ikke til noe annet enn å vises til familien din.',
  },
  {
    heading: 'Hvem som ser opplysningene',
    body:
      'Bilder, meldinger, svar og kalender deles bare med medlemmene i din egen ' +
      'familiegruppe. «Sist aktiv» deles bare hvis du har samtykket. Ingen andre ' +
      'familier eller utenforstående har tilgang. Tilgangen er teknisk avgrenset på ' +
      'databasenivå (radnivå-sikkerhet).',
  },
  {
    heading: 'Databehandlere og hvor data lagres',
    body:
      'Vi bruker databehandlere som behandler opplysninger på våre vegne og etter ' +
      'avtale (GDPR artikkel 28): Supabase (database, innlogging og bildelagring), ' +
      'Resend (utsending av e-post med innloggingskode) og Expo (formidling av ' +
      'push-varsler). Der en leverandør behandler opplysninger utenfor EØS, skjer det ' +
      'med gyldig overføringsgrunnlag etter GDPR kapittel V (som EU-US Data Privacy ' +
      'Framework eller EUs standardkontrakter).',
  },
  {
    heading: 'Hvor lenge vi lagrer',
    body:
      'Innholdet ditt lagres så lenge kontoen finnes. Varslingslogg slettes etter 90 ' +
      'dager. Paringskoder og tilhørende forsøkslogg slettes etter 30 dager. Ber du om ' +
      'sletting av kontoen, slettes kontoen og opplysningene dine endelig etter en ' +
      'angrefrist på 30 dager.',
  },
  {
    heading: 'Dine rettigheter',
    body:
      'Du har rett til innsyn (artikkel 15), retting (16), sletting (17), begrensning ' +
      '(18), dataportabilitet (20) og å protestere mot behandling basert på berettiget ' +
      'interesse (21). I appen kan du selv: se innholdet ditt, endre telefonnummer, slå ' +
      'av aktivitetsdeling, og slette kontoen («Slett kontoen min»). Kopi av dataene ' +
      'dine (portabilitet) får du ved å kontakte oss. Samtykker kan alltid trekkes ' +
      'tilbake med virkning fremover. Du kan klage til Datatilsynet ' +
      '(datatilsynet.no), men vi setter pris på om du kontakter oss først.',
  },
  {
    heading: 'Barn',
    body:
      'Tjenesten er laget for voksne og eldre og retter seg ikke mot barn under 16 år. ' +
      'Vi behandler ikke bevisst opplysninger om barn.',
  },
  {
    heading: 'Endringer',
    body:
      'Ved vesentlige endringer i denne erklæringen blir du bedt om å lese og godta på ' +
      'nytt i appen, og versjonen du godtok lagres. Dette dokumentet er et utkast som ' +
      'kan bli justert etter juridisk gjennomgang.',
  },
];

export const TERMS_TITLE = 'Brukervilkår for Familieknappen';

export const TERMS_SECTIONS: LegalSection[] = [
  {
    heading: 'Avtalen',
    body:
      'Disse vilkårene er avtalen mellom deg og utgiveren av Familieknappen når du ' +
      'bruker appen. Du godtar vilkårene i appen, og vi lagrer hvilken versjon du ' +
      'godtok. Tjenesten er i pilotfase og leveres uten betaling inntil annet er avtalt.',
  },
  {
    heading: 'Hva tjenesten er – og ikke er',
    body:
      'Familieknappen formidler spørsmål og svar mellom deg og familien din. Tjenesten ' +
      'er assistanse, ikke en garanti: appen vurderer ikke selv om noe er svindel, og ' +
      'et svar fra familien er et råd fra et familiemedlem – ikke profesjonell ' +
      'rådgivning og ikke en fasit. Er dere i tvil om en henvendelse, kontakt banken, ' +
      'Posten eller politiet direkte. Familieknappen er ikke en nødtjeneste: ved fare ' +
      'for liv og helse, ring 113.',
  },
  {
    heading: 'Konto, roller og koder',
    body:
      'Du logger inn med engangskode på e-post og er ansvarlig for at e-postkontoen ' +
      'din er tilstrekkelig sikret. Kontaktpersonen (primærkontakten) administrerer ' +
      'familiegruppen: inviterer og fjerner medlemmer og lager paringskoder. ' +
      'Innloggings- og paringskoder er personlige og skal aldri deles utenfor familien. ' +
      'Den som setter opp appen for en senior, bekrefter å ha grunnlag for det – ' +
      'normalt seniorens eget ønske og medvirkning.',
  },
  {
    heading: 'Akseptabel bruk',
    body:
      'Tjenesten skal bare brukes av familiemedlemmer til å hjelpe hverandre. Det er ' +
      'ikke tillatt å bruke den til å overvåke noen uten deres viten og vilje, til å ' +
      'skaffe seg tilgang til andres familiegrupper, til å omgå tekniske ' +
      'sikkerhetstiltak, eller til innhold som er ulovlig eller krenkende. Vi kan ' +
      'stenge kontoer som misbruker tjenesten; ved stenging varsles du med begrunnelse ' +
      'der det er mulig.',
  },
  {
    heading: 'Varsler og tilgjengelighet',
    body:
      'Push-varsler og e-post leveres etter beste evne («best effort») og kan bli ' +
      'forsinket eller utebli – leveransen avhenger av telefonen, operativsystemet, ' +
      'nettverket og tredjeparter utenfor vår kontroll. Tjenesten kan ha planlagt og ' +
      'ikke-planlagt nedetid. Innholdet i tjenesten er ikke ment som arkiv; ta egne ' +
      'kopier av det du trenger å beholde.',
  },
  {
    heading: 'Ansvar',
    body:
      'Tjenesten leveres «som den er». Så langt gjeldende rett tillater, er vi ikke ' +
      'ansvarlige for indirekte tap eller tap som skyldes råd familiemedlemmer gir ' +
      'hverandre, forsinkede eller uteblitte varsler, nedetid, eller forhold hos ' +
      'tredjeparter. Ingenting i disse vilkårene begrenser ansvar som ikke gyldig kan ' +
      'fraskrives, eller rettigheter du har som forbruker etter ufravikelig norsk lov.',
  },
  {
    heading: 'Immaterielle rettigheter og ditt innhold',
    body:
      'Appen og varemerket tilhører utgiveren. Innholdet du sender (bilder, meldinger) ' +
      'er ditt; vi får bare den tekniske retten som trengs for å lagre og vise det til ' +
      'familiegruppen din. Vi bruker ikke innholdet ditt til noe annet.',
  },
  {
    heading: 'Avslutning og endringer',
    body:
      'Du kan når som helst slutte å bruke tjenesten og slette kontoen din i appen ' +
      '(30 dagers angrefrist). Vi kan endre vilkårene; ved vesentlige endringer blir du ' +
      'bedt om å godta på nytt i appen, og du kan da velge å avslutte i stedet. Vi kan ' +
      'avvikle tjenesten med rimelig forhåndsvarsel. Avtalen er underlagt norsk rett ' +
      'med Oslo tingrett som verneting, med mindre annet følger av ufravikelige ' +
      'vernetingsregler. Dette dokumentet er et utkast som kan bli justert etter ' +
      'juridisk gjennomgang.',
  },
];
