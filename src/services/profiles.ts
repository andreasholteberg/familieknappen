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
