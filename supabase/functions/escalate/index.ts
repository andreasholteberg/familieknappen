/**
 * Familieknappen · Edge Function: escalate
 *
 * Enkel, tidsbasert eskalering. Kjøres på en tidsplan (f.eks. hvert minutt via
 * pg_cron + pg_net, eller Supabase Scheduled Functions). Finner åpne, ubesvarte
 * forespørsler der escalation_due_at har passert, varsler sekundærkontakt(ene),
 * setter status = ESCALATED og logger i notification_log. Kun ett nivå.
 *
 * Deploy:  supabase functions deploy escalate --no-verify-jwt
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

type Member = { user_id: string; member_role: string };
type LogRow = {
  user_id: string | null;
  type: string;
  related_help_request_id: string | null;
  status: string;
  error_message: string | null;
};

Deno.serve(async (req: Request): Promise<Response> => {
  const secret = Deno.env.get('PUSH_WEBHOOK_SECRET');
  if (secret && req.headers.get('x-webhook-secret') !== secret) {
    return new Response('Unauthorized', { status: 401 });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceKey) return new Response('Mangler miljøvariabler', { status: 500 });
  const admin = createClient(supabaseUrl, serviceKey);

  const nowIso = new Date().toISOString();

  // Forfalte, ikke-eskalerte, fortsatt åpne forespørsler.
  const { data: due, error } = await admin
    .from('help_requests')
    .select('id, family_group_id, senior_id, recipient_id')
    .lte('escalation_due_at', nowIso)
    .eq('escalation_level', 0)
    .is('escalation_stopped_at', null)
    .in('status', ['SENT', 'DELIVERED', 'VIEWED']);
  if (error) return new Response(error.message, { status: 500 });

  let escalated = 0;
  const logs: LogRow[] = [];

  for (const r of (due ?? []) as { id: string; family_group_id: string; senior_id: string; recipient_id: string | null }[]) {
    // Dobbeltsjekk: har den faktisk fått svar?
    const { count } = await admin
      .from('help_responses')
      .select('id', { count: 'exact', head: true })
      .eq('help_request_id', r.id);
    if ((count ?? 0) > 0) continue;

    // Marker som eskalert først, slik at vi ikke prøver igjen (ett nivå).
    await admin
      .from('help_requests')
      .update({ status: 'ESCALATED', escalated_at: nowIso, escalation_level: 1 })
      .eq('id', r.id);
    escalated++;

    // Finn sekundærkontakter (fallback: alle pårørende utenom senior + opprinnelig mottaker).
    const { data: members } = await admin
      .from('family_members')
      .select('user_id, member_role')
      .eq('group_id', r.family_group_id);
    const all = (members ?? []) as Member[];
    let targetIds = all
      .filter((m) => m.member_role === 'secondary_contact' && m.user_id !== r.senior_id && m.user_id !== r.recipient_id)
      .map((m) => m.user_id);
    if (targetIds.length === 0) {
      targetIds = all
        .filter((m) => m.member_role !== 'senior' && m.user_id !== r.senior_id && m.user_id !== r.recipient_id)
        .map((m) => m.user_id);
    }

    if (targetIds.length === 0) {
      logs.push({ user_id: null, type: 'escalation', related_help_request_id: r.id, status: 'no_recipient', error_message: null });
      continue;
    }

    const { data: senior } = await admin.from('profiles').select('name').eq('id', r.senior_id).maybeSingle();
    const seniorName = (senior?.name as string) || 'Et familiemedlem';
    const title = `${seniorName} venter fortsatt på svar`;
    const body = `${seniorName} ba om hjelp og har ikke fått svar ennå. Kan du se på det?`;

    const { data: tokens } = await admin
      .from('notification_tokens')
      .select('user_id, expo_push_token')
      .in('user_id', targetIds);
    const tokenRows = (tokens ?? []) as { user_id: string; expo_push_token: string }[];

    if (tokenRows.length === 0) {
      for (const uid of targetIds) {
        logs.push({ user_id: uid, type: 'escalation', related_help_request_id: r.id, status: 'no_token', error_message: null });
      }
      continue;
    }

    const messages = tokenRows.map((t) => ({
      to: t.expo_push_token,
      sound: 'default',
      title,
      body,
      data: { helpRequestId: r.id, type: 'escalation' },
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
        const ok = tickets[i]?.status === 'ok';
        logs.push({
          user_id: t.user_id,
          type: 'escalation',
          related_help_request_id: r.id,
          status: ok ? 'sent' : 'error',
          error_message: ok ? null : (tickets[i]?.message ?? 'ukjent feil'),
        });
      });
      await admin.from('notification_tokens').update({ last_used_at: nowIso }).in('user_id', targetIds);
    } catch (e) {
      for (const t of tokenRows) {
        logs.push({ user_id: t.user_id, type: 'escalation', related_help_request_id: r.id, status: 'error', error_message: String(e) });
      }
    }
  }

  if (logs.length > 0) await admin.from('notification_log').insert(logs);

  return new Response(JSON.stringify({ escalated }), { headers: { 'Content-Type': 'application/json' } });
});
