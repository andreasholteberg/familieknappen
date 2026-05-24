/** Svar på hjelpeforespørsler (hurtigsvar eller fritekst). */

import { supabase } from '@/lib/supabase';
import { responseTypeToQuickReply, toHelpResponse } from '@/services/mappers';
import type { HelpResponse, ResponseType } from '@/types/models';

export async function listResponses(requestIds: string[]): Promise<HelpResponse[]> {
  if (requestIds.length === 0) return [];
  const { data, error } = await supabase
    .from('help_responses')
    .select('*')
    .in('help_request_id', requestIds)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data.map(toHelpResponse);
}

export interface RespondInput {
  requestId: string;
  responderId: string;
  responseType: ResponseType;
  responseText?: string;
}

/** Lagrer svaret og markerer forespørselen som ANSWERED (uses ett kall hver). */
export async function respond(input: RespondInput): Promise<void> {
  const insert = await supabase.from('help_responses').insert({
    help_request_id: input.requestId,
    responder_id: input.responderId,
    quick_reply_type: responseTypeToQuickReply(input.responseType),
    free_text: input.responseText ?? null,
  });
  if (insert.error) throw insert.error;

  const update = await supabase
    .from('help_requests')
    .update({
      status: 'ANSWERED',
      answered_at: new Date().toISOString(),
      seen_by_senior: false,
    })
    .eq('id', input.requestId);
  if (update.error) throw update.error;
}
