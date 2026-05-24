/**
 * Enkel realtime: lytt på endringer i help_requests og help_responses for
 * gruppa. Polling-fallback bor i store (i tilfelle realtime ikke er aktivert).
 * Vi holder det bevisst enkelt – callback utløser en re-henting.
 */

import type { RealtimeChannel } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';

export function subscribeToGroupChanges(groupId: string, onChange: () => void): RealtimeChannel {
  const channel = supabase
    .channel(`familieknappen:${groupId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'help_requests', filter: `family_group_id=eq.${groupId}` },
      onChange,
    )
    .on(
      // help_responses har ikke group-kolonne; vi lytter bredt og lar RLS + re-henting filtrere.
      'postgres_changes',
      { event: '*', schema: 'public', table: 'help_responses' },
      onChange,
    )
    .subscribe();
  return channel;
}

export function unsubscribe(channel: RealtimeChannel | null): void {
  if (channel) void supabase.removeChannel(channel);
}
