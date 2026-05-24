/**
 * Designsystem for Familieknappen.
 *
 * Prinsipper (styringsdokument 6.5 + designprinsipper): rolig palett, stor tekst,
 * høy kontrast. Ingen stressende rødfarger med mindre noe faktisk krever
 * oppmerksomhet – «Ikke svar»-svaret bruker en dempet rav-farge, ikke alarmrød.
 */

export const colors = {
  bgScreen: '#f7f9fc',
  surface: '#ffffff',
  surfaceSoft: '#eef4fb',

  ink: '#1f2a37',
  inkSoft: '#4b5a6b',
  inkFaint: '#6b7a8c',
  line: '#d9e1ea',

  brand: '#2b6cb0',
  brandDark: '#234e7d',
  brandSoft: '#dce9f7',

  calmGreen: '#2f855a',
  calmGreenSoft: '#d6efe0',

  /** Dempet rav for oppmerksomhet – ikke alarm. */
  attention: '#b5651d',
  attentionSoft: '#f6e6d4',

  white: '#ffffff',
} as const;

export const radius = {
  s: 12,
  m: 18,
  l: 26,
} as const;

/** 4px-basert spacing. */
export const spacing = (n: number): number => n * 4;

/**
 * Skriftstørrelser. Senior-grensesnittet bruker bevisst store verdier
 * (minst 18–22px, gjerne større) per designprinsippene.
 */
export const fontSize = {
  // generelt
  sm: 14,
  md: 16,
  lg: 18,
  // senior (store)
  body: 20,
  title: 28,
  huge: 32,
  button: 26,
} as const;

export const fontWeight = {
  regular: '400',
  medium: '600',
  bold: '700',
  heavy: '800',
} as const;

export const shadow = {
  card: {
    shadowColor: '#1f2a37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 14,
    elevation: 3,
  },
  raised: {
    shadowColor: '#1f2a37',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 6,
  },
} as const;

export const theme = { colors, radius, spacing, fontSize, fontWeight, shadow };
export type Theme = typeof theme;
