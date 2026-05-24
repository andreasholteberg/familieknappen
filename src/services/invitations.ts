/**
 * Invitasjoner til en familiegruppe.
 *
 * Oppretting/tilbaketrekking/listing styres av RLS (kun primærkontakt kan
 * opprette/endre/slette; gruppemedlemmer kan lese). Aksept skjer via
 * SECURITY DEFINER-RPC-en accept_group_invitation, som validerer token og
 * melder innlogget bruker inn i gruppa.
 */

import { supabase } from '@/lib/supabase';
import { toGroupInvitation } from '@/services/mappers';
import type { GroupInvitation, InvitedRole } from '@/types/models';

export interface CreateInvitationInput {
  groupId: string;
  email: string;
  role?: Exclude<InvitedRole, 'primary_contact'>;
}

/** Opprett en invitasjon (kun primærkontakt – håndheves av RLS). */
export async function createInvitation(input: CreateInvitationInput): Promise<GroupInvitation> {
  const { data: userData } = await supabase.auth.getUser();
  const createdBy = userData.user?.id ?? null;

  const { data, error } = await supabase
    .from('group_invitations')
    .insert({
      family_group_id: input.groupId,
      invited_email: input.email.trim().toLowerCase(),
      invited_role: input.role ?? 'secondary_contact',
      created_by: createdBy,
    })
    .select('*')
    .single();
  if (error) throw error;
  return toGroupInvitation(data);
}

/** Trekk tilbake en invitasjon. */
export async function revokeInvitation(id: string): Promise<void> {
  const { error } = await supabase
    .from('group_invitations')
    .update({ revoked_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

export interface AcceptResult {
  familyGroupId: string;
  role: InvitedRole;
}

/** Godta en invitasjon via token. Kaster med lesbar melding hvis ugyldig. */
export async function acceptInvitation(token: string): Promise<AcceptResult> {
  const { data, error } = await supabase.rpc('accept_group_invitation', { p_token: token });
  if (error) throw error;
  const result = data as { family_group_id: string; role: InvitedRole };
  return { familyGroupId: result.family_group_id, role: result.role };
}

/** List invitasjoner for en gruppe (nyeste først). */
export async function listInvitationsForGroup(groupId: string): Promise<GroupInvitation[]> {
  const { data, error } = await supabase
    .from('group_invitations')
    .select('*')
    .eq('family_group_id', groupId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data.map(toGroupInvitation);
}
