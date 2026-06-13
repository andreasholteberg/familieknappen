/**
 * «Bilder fra familien» (F-063). Felles, privat bildestrøm per familiegruppe.
 * Gjenbruker opplastingsmønsteret fra help-images (robust base64 på native).
 */

import { decode } from 'base64-arraybuffer';
import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';

import { supabase } from '@/lib/supabase';
import type { FamilyPhoto } from '@/types/models';

const BUCKET = 'family-photos';
const MAX_PHOTOS = 30;

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

/** Siste bilder i gruppa, nyest først, med signerte visnings-URL-er. */
export async function listPhotos(groupId: string): Promise<FamilyPhoto[]> {
  const { data, error } = await supabase
    .from('family_photos')
    .select('*')
    .eq('family_group_id', groupId)
    .order('created_at', { ascending: false })
    .limit(MAX_PHOTOS);
  if (error) throw error;

  return Promise.all(
    (data ?? []).map(async (row) => {
      const { data: signed } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(row.storage_path, 3600);
      return {
        id: row.id,
        groupId: row.family_group_id,
        uploadedBy: row.uploaded_by,
        imageUri: signed?.signedUrl,
        caption: row.caption ?? undefined,
        createdAt: row.created_at,
      };
    }),
  );
}

/** Last opp et bilde med valgfri hilsen. */
export async function uploadFamilyPhoto(input: {
  groupId: string;
  uploadedBy: string;
  localUri: string;
  caption?: string;
}): Promise<void> {
  const bytes = await readImageBytes(input.localUri);
  if (!bytes || bytes.byteLength === 0) {
    throw new Error('Bildet kunne ikke leses. Prøv et annet bilde.');
  }

  // Rad først (gir id), deretter fil – fil-sti lagres på raden.
  const { data, error } = await supabase
    .from('family_photos')
    .insert({
      family_group_id: input.groupId,
      uploaded_by: input.uploadedBy,
      storage_path: 'pending',
      caption: input.caption?.trim() || null,
    })
    .select('id')
    .single();
  if (error) throw error;

  const path = `${input.groupId}/${data.id}.jpg`;
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, bytes, { contentType: 'image/jpeg', upsert: true });
  if (uploadError) {
    // Rydd raden hvis fila ikke kom opp – ingen tomme bilder i strømmen.
    await supabase.from('family_photos').delete().eq('id', data.id);
    throw uploadError;
  }

  const { error: updateError } = await supabase
    .from('family_photos')
    .update({ storage_path: path })
    .eq('id', data.id);
  if (updateError) throw updateError;
}

/** Slett et bilde (RLS: egen opplasting, eller primærkontakt). */
export async function deleteFamilyPhoto(photo: FamilyPhoto): Promise<void> {
  const { error } = await supabase.from('family_photos').delete().eq('id', photo.id);
  if (error) throw error;
  // Best effort – fila ryddes; raden er allerede borte.
  await supabase.storage.from(BUCKET).remove([`${photo.groupId}/${photo.id}.jpg`]);
}
