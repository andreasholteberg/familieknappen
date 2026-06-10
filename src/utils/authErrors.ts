/**
 * Oversetter tekniske auth-feil til norske, menneskelige meldinger.
 *
 * Brukergrensesnittet skal ikke vise tekniske engelske Supabase-meldinger,
 * heller ikke i preview-builds som testes av familien.
 *
 * Brukes fra innloggings- og callback-skjermer slik at min mor ikke møter
 * engelske Supabase-feil som "Email rate limit exceeded".
 */

type ErrorMapping = { match: RegExp; message: string };

const NORWEGIAN_MESSAGES: ErrorMapping[] = [
  // Supabase rate limit på e-postutsending.
  {
    match: /email rate limit|rate.?limit|too many (?:emails|requests)|security purposes|only request this after/i,
    message:
      'Det er sendt for mange e-poster på kort tid. Vent litt før du prøver igjen.',
  },
  // OTP-kode eller backup-lenke er feil, utløpt eller allerede brukt.
  {
    match: /otp.*(?:expired|invalid)|token.*(?:expired|invalid)|email link.*(?:invalid|expired)/i,
    message:
      'Koden er feil eller utløpt. Be om en ny kode og prøv igjen.',
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

  return friendly;
}
