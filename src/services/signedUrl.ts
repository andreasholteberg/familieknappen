/**
 * Cache for signerte Storage-URL-er (lagringsoptimalisering).
 *
 * Appen poller hvert 20. sekund, og uten cache fikk hvert bilde en NY signert
 * URL per oppdatering – telefonen lastet da bildet på nytt hver gang i stedet
 * for å bruke bildecachen sin. Vi gjenbruker derfor URL-er i 45 minutter
 * (selve signaturen gjelder i 60), slik at URI-en holder seg stabil og
 * egress-forbruket holdes nede.
 */

import { supabase } from '@/lib/supabase';

const TTL_MS = 45 * 60 * 1000; // gjenbruk i 45 min
const SIGN_SECONDS = 60 * 60; // signaturen gjelder i 60 min

const cache = new Map<string, { url: string; expiresAt: number }>();

export async function cachedSignedUrl(bucket: string, path: string): Promise<string | undefined> {
  const key = `${bucket}/${path}`;
  const hit = cache.get(key);
  if (hit && hit.expiresAt > Date.now()) return hit.url;

  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, SIGN_SECONDS);
  if (error || !data?.signedUrl) return hit?.url; // behold gammel ved feil
  cache.set(key, { url: data.signedUrl, expiresAt: Date.now() + TTL_MS });
  return data.signedUrl;
}

/** Tøm cachen (f.eks. ved utlogging). */
export function clearSignedUrlCache(): void {
  cache.clear();
}
