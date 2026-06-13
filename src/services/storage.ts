/**
 * Bilder for hjelpeforespørsler. Privat bucket «help-images».
 * Sti-konvensjon: «<family_group_id>/<request_id>.jpg» (RLS leser gruppe fra sti).
 *
 * Opplasting: på native leses fila robust via expo-file-system (base64) og
 * konverteres til ArrayBuffer (base64-arraybuffer) – mer stabilt enn
 * fetch(uri).arrayBuffer() på ekte enheter. På web brukes fetch (fungerer i
 * nettleseren). Signatur og imageFailed-håndtering er uendret.
 */

import { decode } from 'base64-arraybuffer';
import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';

import { supabase } from '@/lib/supabase';
import { cachedSignedUrl } from '@/services/signedUrl';

const BUCKET = 'help-images';

export function helpImagePath(groupId: string, requestId: string): string {
  return `${groupId}/${requestId}.jpg`;
}

/** Les en lokal bilde-URI til ArrayBuffer (robust per plattform). */
async function readImageBytes(localUri: string): Promise<ArrayBuffer> {
  if (Platform.OS === 'web') {
    const res = await fetch(localUri);
    return res.arrayBuffer();
  }
  const base64 = await FileSystem.readAsStringAsync(localUri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return decode(base64);
}

/** Laster opp en lokal bilde-URI og returnerer lagringsstien. */
export async function uploadHelpImage(
  groupId: string,
  requestId: string,
  localUri: string,
): Promise<string> {
  const path = helpImagePath(groupId, requestId);
  const bytes = await readImageBytes(localUri);
  // Tomt resultat skal feile tydelig (fanges som imageFailed) i stedet for å
  // laste opp et tomt/ødelagt bilde.
  if (!bytes || bytes.byteLength === 0) {
    throw new Error('Bildet kunne ikke leses. Prøv å ta bildet på nytt.');
  }
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, bytes, { contentType: 'image/jpeg', upsert: true });
  if (error) throw error;
  return path;
}

/** Tidsbegrenset visnings-URL. Gjenbrukes i 45 min (stabil URI = bildecache). */
export async function signedImageUrl(path: string): Promise<string | undefined> {
  return cachedSignedUrl(BUCKET, path);
}
