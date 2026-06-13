/**
 * Familieknappen · Edge Function: notify-call (F-029)
 *
 * Kalles fra appen når senior trykker «Ring» i ringeflyten. Sender push til
 * ALLE pårørende i gruppa («X prøver å nå deg på telefon») slik at noen tar
 * den selv om primærkontakten ikke svarer. Best effort – appen feiler stille
 * hvis push ikke er konfigurert.
 *
 * Deploy:  supabase functions deploy notify-call
 * (MED JWT-verifisering – kun innloggede brukere kan kalle den.)
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

Deno.serve(async (req: Request): Promise<Response> => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  if (!supabaseUrl || !serviceKey || !anonKey) {
    return new Response('Mangler miljøvariabler', { status: 500 });
  }

  // Hvem ringer? Hentes fra innsenderens JWT.
  const authHeader = req.headers.get('Authorization') ?? '';
  const asUser = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userError } = await asUser.auth.getUser();
  if (userError || !userData?.user) return new Response('Unauthorized', { status: 401 });
  const callerId = userData.user.id;

  const admin = createClient(supabaseUrl, serviceKey);
  const nowIso = new Date().toISOString();

  const { data: membership } = await admin
    .from('family_members')
    .select('group_id')
    .eq('user_id', callerId)
    .limit(1)
    .maybeSingle();
  if (!membership) {
    return new Response(JSON.stringify({ notified: 0 }), { headers: { 'Content-Type': 'application/json' } });
  }
  const groupId = (membership as { group_id: string }).group_id;

  const { data: caller } = await admin.from('profiles').select('name').eq('id', callerId).maybeSingle();
  const callerName = (caller?.name as string) || 'Et familiemedlem';

  const { data: members } = await admin
    .from('family_members')
    .select('user_id, member_role')
    .eq('group_id', groupId);
  const targetIds = ((members ?? []) as { user_id: string; member_role: string }[])
    .filter((m) => m.member_role !== 'senior' && m.user_id !== callerId)
    .map((m) => m.user_id);
  if (targetIds.length === 0) {
    return new Response(JSON.stringify({ notified: 0 }), { headers: { 'Content-Type': 'application/json' } });
  }

  const { data: tokens } = await admin
    .from('notification_tokens')
    .select('user_id, expo_push_token')
    .in('user_id', targetIds);
  const tokenRows = (tokens ?? []) as { user_id: string; expo_push_token: string }[];

  type LogRow = {
    user_id: string | null;
    type: string;
    related_help_request_id: string | null;
    status: string;
    error_message: string | null;
  };
  const logs: LogRow[] = targetIds
    .filter((id) => !tokenRows.some((t) => t.user_id === id))
    .map((id) => ({
      user_id: id,
      type: 'call_alert',
      related_help_request_id: null,
      status: 'no_token',
      error_message: null,
    }));

  let notified = 0;
  if (tokenRows.length > 0) {
    const messages = tokenRows.map((t) => ({
      to: t.expo_push_token,
      sound: 'default',
      title: `${callerName} prøver å nå deg`,
      body: `${callerName} ringer familien nå. Kan du ta telefonen?`,
      data: { type: 'call_alert' },
    }));
    try {
      const res = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(messages),
      });
      const json = await res.json();
      const tickets = Array.isArray(json?.data) ? json.data : [];
      const deadTokens: string[] = [];
      tokenRows.forEach((t, i) => {
        const ticket = tickets[i];
        const ok = ticket?.status === 'ok';
        if (ok) notified++;
        if (!ok && ticket?.details?.error === 'DeviceNotRegistered') deadTokens.push(t.expo_push_token);
        logs.push({
          user_id: t.user_id,
          type: 'call_alert',
          related_help_request_id: null,
          status: ok ? 'sent' : 'error',
          error_message: ok ? null : (ticket?.message ?? 'ukjent feil'),
        });
      });
      if (deadTokens.length > 0) {
        await admin.from('notification_tokens').delete().in('expo_push_token', deadTokens);
      }
      await admin.from('notification_tokens').update({ last_used_at: nowIso }).in('user_id', targetIds);
    } catch (e) {
      for (const t of tokenRows) {
        logs.push({ user_id: t.user_id, type: 'call_alert', related_help_request_id: null, status: 'error', error_message: String(e) });
      }
    }
  }

  if (logs.length > 0) await admin.from('notification_log').insert(logs);

  return new Response(JSON.stringify({ notified }), { headers: { 'Content-Type': 'application/json' } });
});
