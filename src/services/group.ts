/** Familiegruppe-kontekst: hvilken gruppe brukeren tilhører + medlemmer/profiler. */

import { supabase } from '@/lib/supabase';
import { toFamilyGroup, toFamilyMember, toUser } from '@/services/mappers';
import type { FamilyGroup, FamilyMember, User } from '@/types/models';

export interface GroupContext {
  group: FamilyGroup;
  members: FamilyMember[];
  users: User[];
}

/** Finn første gruppe innlogget bruker er medlem av (MVP: én gruppe per bruker). */
export async function getMyGroupId(userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('family_members')
    .select('group_id')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .limit(1);
  if (error) throw error;
  return data && data.length > 0 ? data[0].group_id : null;
}

export async function loadGroupContext(groupId: string): Promise<GroupContext> {
  const [groupRes, membersRes] = await Promise.all([
    supabase.from('family_groups').select('*').eq('id', groupId).single(),
    supabase.from('family_members').select('*').eq('group_id', groupId),
  ]);
  if (groupRes.error) throw groupRes.error;
  if (membersRes.error) throw membersRes.error;

  const members = membersRes.data.map(toFamilyMember);
  const userIds = members.map((m) => m.userId);
  const profilesRes = await supabase.from('profiles').select('*').in('id', userIds);
  if (profilesRes.error) throw profilesRes.error;

  return {
    group: toFamilyGroup(groupRes.data),
    members,
    users: profilesRes.data.map(toUser),
  };
}

/**
 * Overfør primærrollen til et annet medlem. Kjøres via en SECURITY DEFINER-RPC
 * (transfer_primary_contact) slik at demote+promote skjer atomisk og RLS
 * håndheves: bare nåværende primærkontakt kan overføre, og ingen kan gjøre seg
 * selv til primær.
 */
export async function setPrimaryContact(groupId: string, userId: string): Promise<void> {
  const { error } = await supabase.rpc('transfer_primary_contact', {
    p_group: groupId,
    p_new_user: userId,
  });
  if (error) throw error;
}

/**
 * Opprett en ny familiegruppe og meld inn innlogget bruker som primaerkontakt
 * (atomisk via RPC). Setter ogsaa profiles.role = 'relative'. Returnerer group-id.
 */
export async function createFamilyGroup(name: string): Promise<string> {
  const { data, error } = await supabase.rpc('create_family_group', { p_name: name });
  if (error) throw error;
  return data as string;
}
