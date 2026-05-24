/**
 * Bilder for hjelpeforespørsler. Privat bucket «help-images».
 * Sti-konvensjon: «<family_group_id>/<request_id>.jpg» (RLS leser gruppe fra sti).
 */

import { supabase } from '@/lib/supabase';

const BUCKET = 'help-images';

export function helpImagePath(groupId: string, requestId: string): string {
  return `${groupId}/${requestId}.jpg`;
}

/** Laster opp en lokal bilde-URI og returnerer lagringsstien. */
export async function uploadHelpImage(
  groupId: string,
  requestId: string,
  localUri: string,
): Promise<string> {
  const path = helpImagePath(groupId, requestId);
  const res = await fetch(localUri);
  const bytes = await res.arrayBuffer();
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, bytes, { contentType: 'image/jpeg', upsert: true });
  if (error) throw error;
  return path;
}

/** Tidsbegrenset URL for visning (1 time). undefined hvis den ikke kan lages. */
export async function signedImageUrl(path: string): Promise<string | undefined> {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 3600);
  if (error) return undefined;
  return data?.signedUrl;
}
