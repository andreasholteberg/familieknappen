/** Nøktern trygghetsstatus («sist aktiv»). Ingen GPS, ingen alarmer. */

import { supabase } from '@/lib/supabase';
import { toActivityStatus } from '@/services/mappers';
import type { ActivityStatus } from '@/types/models';

export async function getActivity(userId: string): Promise<ActivityStatus | null> {
  const { data, error } = await supabase
    .from('activity_status')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return data ? toActivityStatus(data) : null;
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
