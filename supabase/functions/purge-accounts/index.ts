/**
 * Familieknappen · Edge Function: purge-accounts (F-036)
 *
 * Endelig sletting av kontoer der angrefristen (30 dager) er ute, pluss
 * generell datahygiene (purge_old_records). Kjøres på en tidsplan, f.eks.
 * daglig via pg_cron + pg_net eller Supabase Schedules.
 *
 * Deploy:  supabase functions deploy purge-accounts --no-verify-jwt
 * Valgfri hemmelighet: header x-webhook-secret mot PUSH_WEBHOOK_SECRET.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req: Request): Promise<Response> => {
  const secret = Deno.env.get('PUSH_WEBHOOK_SECRET');
  if (secret && req.headers.get('x-webhook-secret') !== secret) {
    return new Response('Unauthorized', { status: 401 });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceKey) return new Response('Mangler miljøvariabler', { status: 500 });
  const admin = createClient(supabaseUrl, serviceKey);

  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { data: due, error } = await admin
    .from('profiles')
    .select('id')
    .not('deletion_requested_at', 'is', null)
    .lt('deletion_requested_at', cutoff);
  if (error) return new Response(error.message, { status: 500 });

  let deleted = 0;
  const errors: string[] = [];
  for (const row of (due ?? []) as { id: string }[]) {
    // Sletter auth-brukeren; FK-kaskaden fjerner profil og brukerdata.
    const { error: delError } = await admin.auth.admin.deleteUser(row.id);
    if (delError) errors.push(`${row.id}: ${delError.message}`);
    else deleted++;
  }

  // Generell datahygiene i samme kjøring.
  const { data: purged } = await admin.rpc('purge_old_records');

  return new Response(JSON.stringify({ deleted, errors, purged }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
