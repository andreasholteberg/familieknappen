/** Nøktern trygghetsstatus. Ingen GPS, ingen alarmer, ingen presist tidspunkt. */

import { supabase } from '@/lib/supabase';

/**
 * «Brukt i dag» – avledet BOOLSK verdi (Standard). Presist `last_seen_at` holdes
 * internt server-side og eksponeres ikke til gruppemedlemmer (jf. migrasjon
 * 20260618100000: RLS gir bare lesing av egen rad; gruppemedlemmer bruker denne
 * RPC-en, som returnerer kun true/false og respekterer seniorens samtykke).
 */
export async function getUsedToday(userId: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('activity_used_today', { p_user: userId });
  if (error) throw error;
  return data === true;
}

/** Oppdater «sist sett» for innlogget bruker (kalt ved appåpning/fokus). */
export async function touchActivity(userId: string): Promise<void> {
  const { error } = await supabase.from('activity_status').upsert(
    {
      user_id: userId,
      last_seen_at: new Date().toISOString(),
      app_opened_today: true,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' },
  );
  if (error) throw error;
}
