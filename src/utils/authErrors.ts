/**
 * Oversetter tekniske auth-feil til norske, menneskelige meldinger.
 *
 * I dev/preview viser vi også originalmeldingen (i parentes) som hjelp under
 * feilsøking. I produksjon viser vi bare den norske teksten til brukeren.
 *
 * Brukes fra innloggings- og callback-skjermer slik at min mor ikke møter
 * engelske Supabase-feil som "Email rate limit exceeded".
 */

type ErrorMapping = { match: RegExp; message: string };

const NORWEGIAN_MESSAGES: ErrorMapping[] = [
  // Supabase rate limit på e-postutsending.
  {
    match: /email rate limit|rate.?limit|too many (?:emails|requests)/i,
    message:
      'Det er sendt for mange e-poster på kort tid. Vent litt før du prøver igjen.',
  },
  // Magic link / OTP utløpt eller allerede brukt.
  {
    match: /otp.*(?:expired|invalid)|token.*(?:expired|invalid)|email link.*(?:invalid|expired)/i,
    message:
      'Lenken er utløpt eller allerede brukt. Be om en ny lenke fra innloggingsskjermen.',
  },
  // Feil passord / ukjent bruker (test-innlogging).
  {
    match: /invalid (?:login|credential|password|grant)/i,
    message:
      'E-post eller passord stemmer ikke. Sjekk at testbrukeren har passord satt i Supabase.',
  },
  // Bruker finnes ikke.
  {
    match: /user (?:not found|does not exist)/i,
    message: 'Vi finner ingen bruker med denne e-posten.',
  },
  // Nettverk / timeout.
  {
    match: /network|fetch.*fail|timeout|timed out|connection/i,
    message:
      'Vi får ikke kontakt med tjenesten. Sjekk at du har internett, og prøv igjen.',
  },
  // Ugyldig e-postformat.
  {
    match: /invalid.*email|email.*invalid/i,
    message: 'Skriv en gyldig e-postadresse.',
  },
  // Manglende auth-kode i callback.
  {
    match: /mangler auth-kode|missing.*code/i,
    message:
      'Innloggingslenken manglet informasjon. Prøv å be om en ny lenke.',
  },
];

const isDevOrPreview = (): boolean => {
  if (typeof __DEV__ !== 'undefined' && __DEV__) return true;
  const env = process.env.EXPO_PUBLIC_APP_ENV?.toLowerCase();
  return env === 'preview' || env === 'development';
};

const extractMessage = (err: unknown): string => {
  if (err instanceof Error) return err.message ?? '';
  if (typeof err === 'string') return err;
  if (err && typeof err === 'object' && 'message' in err) {
    const m = (err as { message?: unknown }).message;
    if (typeof m === 'string') return m;
  }
  return '';
};

/**
 * Lager en brukervennlig norsk feilmelding.
 *
 * @param err     Feilen vi fanget (Error, string, eller objekt med .message).
 * @param fallback Norsk standardmelding hvis ingen mønstre matcher.
 */
export function humanizeAuthError(
  err: unknown,
  fallback = 'Noe gikk galt med innloggingen. Prøv igjen.',
): string {
  const original = extractMessage(err).trim();

  let friendly = fallback;
  for (const { match, message } of NORWEGIAN_MESSAGES) {
    if (original && match.test(original)) {
      friendly = message;
      break;
    }
  }

  // I dev/preview vises originalmelding nederst som hjelp under feilsøking.
  if (isDevOrPreview() && original && original !== friendly) {
    return `${friendly}\n\n(teknisk: ${original})`;
  }
  return friendly;
}
