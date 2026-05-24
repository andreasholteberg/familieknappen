/** Hjelpeforespørsler – kjerneflyten. */

import { supabase } from '@/lib/supabase';
import { toHelpRequest } from '@/services/mappers';
import { signedImageUrl } from '@/services/storage';
import type { HelpRequest } from '@/types/models';

/** Standard forsinkelse før eskalering til sekundærkontakt. */
export const ESCALATION_DELAY_MINUTES = 10;

export async function listRequests(groupId: string): Promise<HelpRequest[]> {
  const { data, error } = await supabase
    .from('help_requests')
    .select('*')
    .eq('family_group_id', groupId)
    .order('created_at', { ascending: false });
  if (error) throw error;

  // Resolv signerte bilde-URL-er parallelt slik at skjermene får ferdig URI.
  return Promise.all(
    data.map(async (row) => {
      const uri = row.image_path ? await signedImageUrl(row.image_path) : undefined;
      return toHelpRequest(row, uri);
    }),
  );
}

export interface CreateRequestInput {
  groupId: string;
  seniorId: string;
  recipientId?: string;
  message: string;
  imagePath?: string;
}

/** Oppretter en forespørsel. «Leveres» umiddelbart til gruppa i MVP. */
export async function createRequest(input: CreateRequestInput): Promise<string> {
  const now = new Date().toISOString();
  const escalationDueAt = new Date(Date.now() + ESCALATION_DELAY_MINUTES * 60_000).toISOString();
  const { data, error } = await supabase
    .from('help_requests')
    .insert({
      family_group_id: input.groupId,
      senior_id: input.seniorId,
      recipient_id: input.recipientId ?? null,
      message: input.message,
      image_path: input.imagePath ?? null,
      status: 'DELIVERED',
      delivered_at: now,
      escalation_due_at: escalationDueAt,
    })
    .select('id')
    .single();
  if (error) throw error;
  return data.id;
}

/** Sett status til VIEWED når en pårørende åpner forespørselen (kun hvis ny). */
export async function markViewed(id: string): Promise<void> {
  const { error } = await supabase
    .from('help_requests')
    .update({ status: 'VIEWED', viewed_at: new Date().toISOString() })
    .eq('id', id)
    .in('status', ['SENT', 'DELIVERED']);
  if (error) throw error;
}

export async function markAnswerSeen(id: string): Promise<void> {
  const { error } = await supabase
    .from('help_requests')
    .update({ seen_by_senior: true })
    .eq('id', id);
  if (error) throw error;
}

export async function closeRequest(id: string): Promise<void> {
  const { error } = await supabase
    .from('help_requests')
    .update({ status: 'CLOSED', closed_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

/** Knytt en opplastet bilde-sti til en eksisterende forespørsel. */
export async function attachImage(id: string, imagePath: string): Promise<void> {
  const { error } = await supabase
    .from('help_requests')
    .update({ image_path: imagePath })
    .eq('id', id);
  if (error) throw error;
}
