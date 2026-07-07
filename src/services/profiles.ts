/** Profil-operasjoner (appbruker, ikke auth-bruker). */

import { supabase } from '@/lib/supabase';
import { toUser } from '@/services/mappers';
import type { User } from '@/types/models';

export async function getProfile(userId: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  return data ? toUser(data) : null;
}

/** Slå deling av aktivitetsstatus av/på for egen profil (RLS: kun egen). */
export async function setActivitySharing(userId: string, enabled: boolean): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ activity_sharing_enabled: enabled })
    .eq('id', userId);
  if (error) throw error;
}

/** Oppdater eget telefonnummer (RLS: kun egen profil). */
export async function setPhone(userId: string, phone: string | null): Promise<void> {
  const { error } = await supabase.from('profiles').update({ phone }).eq('id', userId);
  if (error) throw error;
}

/** Oppdater egen videolenke (Nivå 2 – ekstern lenke; RLS: kun egen profil). */
export async function setVideoCallUrl(userId: string, videoCallUrl: string | null): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ video_call_url: videoCallUrl })
    .eq('id', userId);
  if (error) throw error;
}

/** Be om sletting av egen konto (30 dagers angrefrist). Returnerer tidspunkt. */
export async function requestAccountDeletion(): Promise<string> {
  const { data, error } = await supabase.rpc('request_account_deletion');
  if (error) throw error;
  return data as string;
}

/** Angre en bestilt sletting. */
export async function cancelAccountDeletion(): Promise<void> {
  const { error } = await supabase.rpc('cancel_account_deletion');
  if (error) throw error;
}

/** Logg samtykke til gjeldende vilkår/personvern (RLS: kun egen profil). */
export async function acceptLegal(
  userId: string,
  versions: { terms: string; privacy: string },
): Promise<void> {
  const now = new Date().toISOString();
  const { error } = await supabase
    .from('profiles')
    .update({
      consented_terms_at: now,
      consented_privacy_at: now,
      terms_version: versions.terms,
      privacy_version: versions.privacy,
    })
    .eq('id', userId);
  if (error) throw error;
}

/** Oppdater eget visningsnavn (GDPR art. 16 – retting; RLS: kun egen profil). */
export async function setName(userId: string, name: string): Promise<void> {
  const { error } = await supabase.from('profiles').update({ name }).eq('id', userId);
  if (error) throw error;
}
