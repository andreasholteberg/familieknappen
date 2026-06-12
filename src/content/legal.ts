/**
 * Juridiske tekster (F-038/F-039) – UTKAST, ikke advokat-gjennomgått.
 *
 * Én kilde til sannhet: skjermene i appen og md-filene for web genereres
 * herfra. Versjonene driver samtykkelogging (F-041): endres en tekst
 * vesentlig, bump versjonen, og brukerne blir bedt om nytt samtykke.
 */

export const LEGAL_VERSIONS = {
  privacy: '2026-06-15',
  terms: '2026-06-15',
} as const;

export interface LegalSection {
  heading: string;
  body: string;
}

export const PRIVACY_TITLE = 'Personvernerklæring for Familieknappen';

export const PRIVACY_SECTIONS: LegalSection[] = [
  {
    heading: 'Hva Familieknappen er',
    body:
      'Familieknappen er en app der en senior kan spørre familien sin om hjelp før hen ' +
      'svarer på en melding, et brev eller en henvendelse. Appen er assistanse fra ' +
      'familien – ikke en automatisk vurdering eller en garanti.',
  },
  {
    heading: 'Hvilke opplysninger vi behandler',
    body:
      'Profil: navn, e-postadresse og telefonnummer (hvis du legger det inn). ' +
      'Innhold: meldinger og bilder du selv sender som hjelpespørsmål, svar fra familien, ' +
      'og kalenderavtaler. Aktivitet: når appen sist ble åpnet («sist aktiv»). ' +
      'Teknisk: varslings-ID for push (Expo push-token) og en logg over sendte varsler. ' +
      'Vi bruker ikke GPS eller stedssporing, og vi henter ikke kontakter eller andre ' +
      'data fra telefonen din.',
  },
  {
    heading: 'Hva opplysningene brukes til',
    body:
      'Kun til å levere tjenesten: å vise spørsmålene dine til familiegruppen din, å gi ' +
      'deg svar, å vise kalenderen, og å sende varsler om spørsmål og svar. Vi selger ' +
      'ikke opplysninger og bruker dem ikke til reklame.',
  },
  {
    heading: 'Hvem som ser hva',
    body:
      'Bilder, meldinger og svar deles bare med medlemmene i din egen familiegruppe. ' +
      'Aktivitetsstatus («sist aktiv») deles bare hvis du har sagt ja til det – du kan ' +
      'slå det av når som helst. Ingen utenfor familiegruppen har tilgang.',
  },
  {
    heading: 'Hvor opplysningene lagres',
    body:
      'Dataene lagres hos Supabase (database, innlogging og bildelagring). E-post med ' +
      'innloggingskode sendes via Resend. Push-varsler formidles via Expo. Disse er våre ' +
      'databehandlere og behandler bare data på våre vegne.',
  },
  {
    heading: 'Hvor lenge vi lagrer',
    body:
      'Innhold lagres så lenge kontoen din finnes. Varslingslogg slettes etter 90 dager, ' +
      'og brukte paringskoder etter 30 dager. Ber du om sletting av kontoen, slettes alt ' +
      'etter en angrefrist på 30 dager.',
  },
  {
    heading: 'Dine rettigheter',
    body:
      'Du kan se opplysningene dine i appen, rette navn og telefonnummer, slå av deling ' +
      'av aktivitet, og slette kontoen og dataene dine direkte i appen («Slett kontoen ' +
      'min»). Du kan også be om en kopi av dataene dine (dataportabilitet) ved å ' +
      'kontakte oss. Du har rett til å klage til Datatilsynet.',
  },
  {
    heading: 'Barn',
    body: 'Familieknappen er laget for voksne og eldre, og retter seg ikke mot barn under 16 år.',
  },
  {
    heading: 'Kontakt',
    body:
      'Behandlingsansvarlig er utgiveren av Familieknappen. Kontakt oss via ' +
      'familieknappen.app. Dette dokumentet er et utkast og kan bli oppdatert; ved ' +
      'vesentlige endringer blir du bedt om å lese og godta på nytt i appen.',
  },
];

export const TERMS_TITLE = 'Brukervilkår for Familieknappen';

export const TERMS_SECTIONS: LegalSection[] = [
  {
    heading: 'Hva tjenesten er – og ikke er',
    body:
      'Familieknappen formidler spørsmål og svar mellom deg og familien din. Tjenesten ' +
      'er assistanse, ikke en garanti: appen vurderer ikke selv om noe er svindel, og ' +
      'et svar fra familien er et råd – ikke en fasit. Er dere i tvil, kontakt banken, ' +
      'Posten eller politiet direkte.',
  },
  {
    heading: 'Konto og familiegruppe',
    body:
      'Du logger inn med e-postkode. Kontaktpersonen (primærkontakten) administrerer ' +
      'familiegruppen: inviterer og fjerner medlemmer og lager paringskoder. Del aldri ' +
      'innloggingskoder eller paringskoder med noen utenfor familien.',
  },
  {
    heading: 'Akseptabel bruk',
    body:
      'Tjenesten skal bare brukes av familien til å hjelpe hverandre. Det er ikke ' +
      'tillatt å bruke den til å overvåke noen uten deres viten og samtykke, eller til ' +
      'innhold som er ulovlig eller krenkende.',
  },
  {
    heading: 'Varsler og tilgjengelighet',
    body:
      'Push-varsler og e-post leveres «best mulig» og kan forsinkes eller utebli – de ' +
      'avhenger av telefonen, operatøren og tredjeparter. Ikke bruk Familieknappen som ' +
      'eneste kanal i en nødsituasjon: ring 113 ved fare for liv og helse.',
  },
  {
    heading: 'Ansvar',
    body:
      'Tjenesten leveres som den er, uten garanti for feilfri drift. Vi er ikke ' +
      'ansvarlige for tap som følge av råd familien gir hverandre, forsinkede varsler ' +
      'eller nedetid, så langt loven tillater. Ingenting i disse vilkårene begrenser ' +
      'rettigheter du har som forbruker etter norsk lov.',
  },
  {
    heading: 'Avslutning og endringer',
    body:
      'Du kan når som helst slette kontoen din i appen (30 dagers angrefrist). Vi kan ' +
      'endre vilkårene; ved vesentlige endringer blir du bedt om å godta på nytt i ' +
      'appen. Vilkårene er underlagt norsk rett. Dette dokumentet er et utkast.',
  },
];
