/**
 * Telefonhjelpere for «Ring familien».
 *
 * Bygger en tel:-URL fra et lagret telefonnummer og åpner den native
 * ringeappen. Hvis nummeret mangler eller ikke kan ringes, returnerer vi
 * false slik at UI-et kan la være å vise knappen (aldri «kommer ennå»).
 */

import { Linking } from 'react-native';

/** Fjerner alt annet enn sifre og ledende «+» fra et telefonnummer. */
export function normalizePhone(phone: string | undefined | null): string | null {
  if (!phone) return null;
  const trimmed = phone.trim();
  if (!trimmed) return null;
  const plus = trimmed.startsWith('+') ? '+' : '';
  const digits = trimmed.replace(/[^\d]/g, '');
  if (digits.length < 3) return null;
  return `${plus}${digits}`;
}

/** Bygger en tel:-URL, eller null hvis nummeret ikke er brukbart. */
export function telUrl(phone: string | undefined | null): string | null {
  const normalized = normalizePhone(phone);
  return normalized ? `tel:${normalized}` : null;
}

/** Åpner ringeappen med nummeret. Returnerer false hvis det ikke gikk. */
export async function callPhone(phone: string | undefined | null): Promise<boolean> {
  const url = telUrl(phone);
  if (!url) return false;
  try {
    await Linking.openURL(url);
    return true;
  } catch {
    return false;
  }
}
