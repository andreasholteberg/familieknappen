/**
 * Paringskode (F-016/F-017): kobler en innlogget bruker til en familiegruppe
 * med en 6-sifret engangskode. Oppretting og innløsing skjer via
 * SECURITY DEFINER-RPC-er – klienten ser aldri andre gruppers koder.
 */

import { supabase } from '@/lib/supabase';
import type { InvitedRole } from '@/types/models';

export interface PairingCode {
  code: string;
  expiresAt: string;
  invitedRole: InvitedRole;
}

/** Lag en ny paringskode for gruppa (kun primærkontakt). */
export async function createPairingCode(
  groupId: string,
  role: 'senior' | 'secondary_contact' = 'senior',
): Promise<PairingCode> {
  const { data, error } = await supabase.rpc('create_pairing_code', {
    p_group: groupId,
    p_role: role,
  });
  if (error) throw error;
  const r = data as { code: string; expires_at: string; invited_role: InvitedRole };
  return { code: r.code, expiresAt: r.expires_at, invitedRole: r.invited_role };
}

export interface PairResult {
  familyGroupId: string;
  role: InvitedRole;
}

/** Løs inn en kode for innlogget bruker. Kaster med rolig norsk melding. */
export async function pairWithCode(code: string): Promise<PairResult> {
  const { data, error } = await supabase.rpc('pair_with_code', { p_code: code });
  if (error) throw error;
  const r = data as { family_group_id: string; role: InvitedRole };
  return { familyGroupId: r.family_group_id, role: r.role };
}
