-- Familieknappen · RPC-røyktest (F-059)
--
-- Kjøres mot en LOKAL Supabase (aldri produksjon):
--   supabase db reset
--   psql "$(supabase status -o json | jq -r .DB_URL)" -f supabase/tests/rpc_smoke.sql
--
-- Hele testen kjører i én transaksjon som rulles tilbake – ingen spor etter.
-- Simulerer innloggede brukere ved å sette request.jwt.claims slik PostgREST
-- gjør. Feiler med exception hvis en forventning ikke holder.

begin;

-- Testbrukere (auth-trigger oppretter profiles-rader).
insert into auth.users (id, email)
values
  ('00000000-0000-4000-8000-000000000001', 'rpc-test-relative@example.test'),
  ('00000000-0000-4000-8000-000000000002', 'rpc-test-senior@example.test');

do $$
declare
  v_relative uuid := '00000000-0000-4000-8000-000000000001';
  v_senior   uuid := '00000000-0000-4000-8000-000000000002';
  v_group    uuid;
  v_code     text;
  v_res      jsonb;
  v_role     public.app_role;
  v_at       timestamptz;
begin
  ---------------------------------------------------------------
  -- Som pårørende: opprett gruppe
  ---------------------------------------------------------------
  perform set_config('request.jwt.claims',
    json_build_object('sub', v_relative, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);

  v_group := public.create_family_group('Testfamilien');
  if v_group is null then raise exception 'create_family_group ga null'; end if;
  raise notice 'OK: create_family_group';

  -- Dobbel oppretting skal avvises
  begin
    perform public.create_family_group('Enda en');
    raise exception 'FEIL: dobbel gruppeoppretting ble ikke avvist';
  exception when others then
    if sqlerrm like '%allerede medlem%' then
      raise notice 'OK: dobbel gruppeoppretting avvist';
    else raise; end if;
  end;

  ---------------------------------------------------------------
  -- Paringskode: opprett som primær, løs inn som senior
  ---------------------------------------------------------------
  v_res := public.create_pairing_code(v_group, 'senior');
  v_code := v_res->>'code';
  if v_code !~ '^[0-9]{6}$' then raise exception 'ugyldig kodeformat: %', v_code; end if;
  raise notice 'OK: create_pairing_code';

  -- Bytt til senior-bruker
  perform set_config('request.jwt.claims',
    json_build_object('sub', v_senior, 'role', 'authenticated')::text, true);

  -- Feil kode skal avvises
  begin
    perform public.pair_with_code('000000');
    raise exception 'FEIL: feil kode ble ikke avvist';
  exception when others then
    if sqlerrm like '%feil eller utløpt%' then
      raise notice 'OK: feil kode avvist';
    else raise; end if;
  end;

  -- Riktig kode skal melde inn med riktig rolle
  v_res := public.pair_with_code(v_code);
  if (v_res->>'family_group_id')::uuid <> v_group then
    raise exception 'paret mot feil gruppe';
  end if;
  select role into v_role from public.profiles where id = v_senior;
  if v_role <> 'senior' then raise exception 'profilrolle ble ikke senior: %', v_role; end if;
  if not exists (select 1 from public.family_members where user_id = v_senior and group_id = v_group) then
    raise exception 'medlemskap mangler etter paring';
  end if;
  raise notice 'OK: pair_with_code';

  -- Brukt kode skal avvises
  begin
    perform public.pair_with_code(v_code);
    raise exception 'FEIL: brukt kode ble ikke avvist';
  exception when others then
    if sqlerrm like '%feil eller utløpt%' then
      raise notice 'OK: brukt kode avvist';
    else raise; end if;
  end;

  ---------------------------------------------------------------
  -- Kontosletting: be om + angre
  ---------------------------------------------------------------
  v_at := public.request_account_deletion();
  if v_at is null then raise exception 'request_account_deletion ga null'; end if;
  if (select deletion_requested_at from public.profiles where id = v_senior) is null then
    raise exception 'deletion_requested_at ble ikke satt';
  end if;
  perform public.cancel_account_deletion();
  if (select deletion_requested_at from public.profiles where id = v_senior) is not null then
    raise exception 'cancel_account_deletion nullstilte ikke';
  end if;
  raise notice 'OK: request/cancel_account_deletion';

  ---------------------------------------------------------------
  -- Ikke-primær skal ikke kunne lage paringskode
  ---------------------------------------------------------------
  begin
    perform public.create_pairing_code(v_group, 'secondary_contact');
    raise exception 'FEIL: senior fikk lage paringskode';
  exception when others then
    if sqlerrm like '%kontaktpersonen%' then
      raise notice 'OK: ikke-primær avvist for paringskode';
    else raise; end if;
  end;

  raise notice 'ALLE RPC-RØYKTESTER OK';
end;
$$;

rollback;
