/**
 * Videolenke-hjelpere for «Videosamtale» (Nivå 2 – ekstern lenke).
 *
 * Pårørende lagrer en fast lenke til videotjenesten sin (FaceTime, Google Meet,
 * Whereby, Jitsi …). Appen åpner bare lenken – ingen innebygd video, ingen
 * SDK, ingen kontoer opprettet av Familieknappen. Samtalen skjer i tjenesten.
 *
 * Av sikkerhetshensyn godtar vi kun https:// og Apples facetime-skjema. Da
 * unngår vi å åpne vilkårlige app-skjemaer fra en lagret tekstverdi.
 */

import { Linking } from 'react-native';

/** Trimmer og validerer en videolenke. Returnerer lenken, eller null. */
export function normalizeVideoUrl(raw: string | undefined | null): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (/^https:\/\/\S+$/i.test(trimmed)) return trimmed;
  if (/^facetime(-audio)?:\/\/\S+$/i.test(trimmed)) return trimmed;
  return null;
}

/** Åpner videolenken i riktig app/nettleser. Returnerer false hvis den ikke er brukbar. */
export async function openVideoCall(raw: string | undefined | null): Promise<boolean> {
  const url = normalizeVideoUrl(raw);
  if (!url) return false;
  try {
    await Linking.openURL(url);
    return true;
  } catch {
    return false;
  }
}
