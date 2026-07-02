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

type FamilyPhotoRow = { storage_path: string | null };

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
    const { data: photos, error: photosError } = await admin
      .from('family_photos')
      .select('storage_path')
      .eq('uploaded_by', row.id);
    if (photosError) {
      errors.push(`${row.id}: ${photosError.message}`);
      continue;
    }

    const photoPaths = ((photos ?? []) as FamilyPhotoRow[])
      .map((p) => p.storage_path)
      .filter((path): path is string => Boolean(path));
    if (photoPaths.length > 0) {
      const { error: storageError } = await admin.storage.from('family-photos').remove(photoPaths);
      if (storageError) {
        errors.push(`${row.id}: ${storageError.message}`);
        continue;
      }
    }

    // Slett hjelpebilder (help-images) for denne brukerens forespørsler, slik at
    // ingen bildefiler blir foreldreløse når help_requests slettes av FK-kaskaden.
    const { data: reqs, error: reqError } = await admin
      .from('help_requests')
      .select('image_path')
      .eq('senior_id', row.id)
      .not('image_path', 'is', null);
    if (reqError) {
      errors.push(`${row.id}: ${reqError.message}`);
      continue;
    }
    const helpPaths = ((reqs ?? []) as { image_path: string | null }[])
      .map((r) => r.image_path)
      .filter((path): path is string => Boolean(path));
    if (helpPaths.length > 0) {
      const { error: helpStorageError } = await admin.storage.from('help-images').remove(helpPaths);
      if (helpStorageError) {
        errors.push(`${row.id}: ${helpStorageError.message}`);
        continue;
      }
    }
    // TODO (MÅ AVKLARES): eldre foreldreløse help-images fra FØR denne fiksen
    // ryddes ikke automatisk her. Kjør en egen, verifisert dry-run/opprydding.

    // Sletter auth-brukeren; FK-kaskaden fjerner profil og brukerdata.
    const { error: delError } = await admin.auth.admin.deleteUser(row.id);
    if (delError) errors.push(`${row.id}: ${delError.message}`);
    else deleted++;
  }

  // Rydd familiegrupper som står igjen uten medlemmer (gruppenavn kan være
  // persondata, f.eks. «Familien Holteberg») – art. 17-hygiene.
  const { data: emptyGroups } = await admin
    .from('family_groups')
    .select('id, family_members(id)')
    .is('family_members.id', null);
  const emptyIds = ((emptyGroups ?? []) as { id: string; family_members: unknown[] }[])
    .filter((g) => !g.family_members || g.family_members.length === 0)
    .map((g) => g.id);
  if (emptyIds.length > 0) {
    await admin.from('family_groups').delete().in('id', emptyIds);
  }

  // Generell datahygiene i samme kjøring.
  const { data: purged } = await admin.rpc('purge_old_records');

  return new Response(JSON.stringify({ deleted, errors, purged }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
