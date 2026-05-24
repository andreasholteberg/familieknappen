/**
 * Familieknappen · Edge Function: send-push
 *
 * Kalles av en Supabase Database Webhook ved INSERT i help_requests og
 * help_responses, og sender push-varsel via Expo Push API.
 *
 *  - Ny help_request  → varsle alle pårørende i gruppa (ikke senior selv)
 *  - Nytt help_response → varsle senioren som spurte (ikke svareren)
 *
 * Bruker service role-nøkkelen (omgår RLS) for å lese mottakere/tokens og
 * skrive notification_log. Ingen avansert retry – ett forsøk per varsel.
 *
 * Deploy:  supabase functions deploy send-push --no-verify-jwt
 * Hemmelighet (valgfri):  supabase secrets set PUSH_WEBHOOK_SECRET=...
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

type WebhookPayload = {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  record: Record<string, unknown> | null;
};

Deno.serve(async (req: Request): Promise<Response> => {
  // Valgfri delt hemmelighet (sett PUSH_WEBHOOK_SECRET + samme header i webhooken).
  const secret = Deno.env.get('PUSH_WEBHOOK_SECRET');
  if (secret && req.headers.get('x-webhook-secret') !== secret) {
    return new Response('Unauthorized', { status: 401 });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceKey) {
    return new Response('Mangler miljøvariabler', { status: 500 });
  }
  const admin = createClient(supabaseUrl, serviceKey);

  let payload: WebhookPayload;
  try {
    payload = await req.json();
  } catch {
    return new Response('Bad request', { status: 400 });
  }
  const record = payload.record;
  if (!record) return new Response('Ingen record', { status: 200 });

  let recipientIds: string[] = [];
  let title = '';
  let body = '';
  let relatedHelpRequestId: string | null = null;
  let logType = '';

  if (payload.table === 'help_requests') {
    logType = 'help_request';
    relatedHelpRequestId = record.id as string;
    const seniorId = record.senior_id as string;
    const groupId = record.family_group_id as string;

    const { data: senior } = await admin
      .from('profiles').select('name').eq('id', seniorId).maybeSingle();
    const seniorName = (senior?.name as string) || 'Et familiemedlem';

    const { data: members } = await admin
      .from('family_members').select('user_id').eq('group_id', groupId);
    recipientIds = (members ?? [])
      .map((m: { user_id: string }) => m.user_id)
      .filter((id: string) => id !== seniorId);

    title = `${seniorName} ber om hjelp`;
    body = `${seniorName} ber om hjelp før hun svarer.`;
  } else if (payload.table === 'help_responses') {
    logType = 'help_response';
    relatedHelpRequestId = record.help_request_id as string;
    const responderId = record.responder_id as string;

    const { data: hr } = await admin
      .from('help_requests').select('senior_id').eq('id', relatedHelpRequestId).maybeSingle();
    if (!hr) return new Response('Fant ikke forespørsel', { status: 200 });

    const { data: responder } = await admin
      .from('profiles').select('name').eq('id', responderId).maybeSingle();
    const responderName = (responder?.name as string) || 'Familien';

    recipientIds = [hr.senior_id as string].filter((id) => id && id !== responderId);
    title = 'Svar fra familien';
    body = `${responderName} har svart deg.`;
  } else {
    return new Response('Ignorert', { status: 200 });
  }

  if (recipientIds.length === 0) return new Response('Ingen mottakere', { status: 200 });

  const { data: tokens } = await admin
    .from('notification_tokens')
    .select('user_id, expo_push_token')
    .in('user_id', recipientIds);

  const tokenRows = (tokens ?? []) as { user_id: string; expo_push_token: string }[];

  type LogRow = {
    user_id: string;
    type: string;
    related_help_request_id: string | null;
    status: string;
    error_message: string | null;
  };
  const logs: LogRow[] = [];

  if (tokenRows.length === 0) {
    // Ingen registrerte enheter – logg som «no_token» for sporbarhet.
    for (const uid of recipientIds) {
      logs.push({ user_id: uid, type: logType, related_help_request_id: relatedHelpRequestId, status: 'no_token', error_message: null });
    }
  } else {
    const messages = tokenRows.map((t) => ({
      to: t.expo_push_token,
      sound: 'default',
      title,
      body,
      data: { helpRequestId: relatedHelpRequestId, type: logType },
    }));

    try {
      const res = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(messages),
      });
      const json = await res.json();
      const tickets = Array.isArray(json?.data) ? json.data : [];
      tokenRows.forEach((t, i) => {
        const ticket = tickets[i];
        const ok = ticket?.status === 'ok';
        logs.push({
          user_id: t.user_id,
          type: logType,
          related_help_request_id: relatedHelpRequestId,
          status: ok ? 'sent' : 'error',
          error_message: ok ? null : (ticket?.message ?? 'ukjent feil'),
        });
      });
      await admin
        .from('notification_tokens')
        .update({ last_used_at: new Date().toISOString() })
        .in('user_id', recipientIds);
    } catch (e) {
      for (const t of tokenRows) {
        logs.push({ user_id: t.user_id, type: logType, related_help_request_id: relatedHelpRequestId, status: 'error', error_message: String(e) });
      }
    }
  }

  if (logs.length > 0) await admin.from('notification_log').insert(logs);

  return new Response(JSON.stringify({ recipients: recipientIds.length, tokens: tokenRows.length }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
