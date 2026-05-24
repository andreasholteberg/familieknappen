-- =====================================================================
-- ADVARSEL: DEV-ONLY - IKKE PRODUKSJON - MA IKKE KJORES MOT EKTE BRUKERE
-- Dette skriptet oppretter demo-kontoer (astrid/anne/per@example.no) med
-- et kjent demo-passord. Kjor KUN mot et lokalt/utviklings-Supabase-prosjekt.
-- =====================================================================
-- Familieknappen - Lag 3 - Seed (KUN for utvikling)
-- Oppretter demo auth-brukere + familiegruppe + ett besvart eksempel + kalender.
-- Idempotent. Kjores av "supabase db reset", eller manuelt i SQL Editor.
--
-- Demo-innlogging (magisk lenke): astrid@example.no (senior),
-- anne@example.no (primaer), per@example.no (sekundaer).
-- I dev kan du ogsa bruke passord "familieknappen" via Supabase-dashbordet.

do $$
declare
  v_senior uuid := '11111111-1111-1111-1111-111111111111';
  v_anne   uuid := '22222222-2222-2222-2222-222222222222';
  v_per    uuid := '33333333-3333-3333-3333-333333333333';
  v_group  uuid := 'aaaaaaaa-0000-0000-0000-000000000001';
begin
  -- 1) Demo auth-brukere (best effort; auth-schemaet kan variere mellom versjoner).
  begin
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data
    ) values
      ('00000000-0000-0000-0000-000000000000', v_senior, 'authenticated', 'authenticated',
       'astrid@example.no', extensions.crypt('familieknappen', extensions.gen_salt('bf')), now(), now(), now(),
       '{"provider":"email","providers":["email"]}'::jsonb, jsonb_build_object('name','Astrid')),
      ('00000000-0000-0000-0000-000000000000', v_anne, 'authenticated', 'authenticated',
       'anne@example.no', extensions.crypt('familieknappen', extensions.gen_salt('bf')), now(), now(), now(),
       '{"provider":"email","providers":["email"]}'::jsonb, jsonb_build_object('name','Anne')),
      ('00000000-0000-0000-0000-000000000000', v_per, 'authenticated', 'authenticated',
       'per@example.no', extensions.crypt('familieknappen', extensions.gen_salt('bf')), now(), now(), now(),
       '{"provider":"email","providers":["email"]}'::jsonb, jsonb_build_object('name','Per'))
    on conflict (id) do nothing;

    insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    values
      (v_senior::text, v_senior, jsonb_build_object('sub', v_senior::text, 'email','astrid@example.no'), 'email', now(), now(), now()),
      (v_anne::text,   v_anne,   jsonb_build_object('sub', v_anne::text,   'email','anne@example.no'),   'email', now(), now(), now()),
      (v_per::text,    v_per,    jsonb_build_object('sub', v_per::text,    'email','per@example.no'),    'email', now(), now(), now())
    on conflict do nothing;
  exception when others then
    raise notice 'Demo auth-brukere ble ikke opprettet automatisk (%). Logg heller inn med magisk lenke for e-postene, og kjor app-data-delen etterpa.', sqlerrm;
  end;

  -- 2) App-data - kun hvis auth-brukerne finnes (unngar FK-feil).
  if exists (select 1 from auth.users where id = v_senior) then
    insert into public.profiles (id, name, role, email) values
      (v_senior, 'Astrid', 'senior',   'astrid@example.no'),
      (v_anne,   'Anne',   'relative', 'anne@example.no'),
      (v_per,    'Per',    'relative', 'per@example.no')
    on conflict (id) do update
      set name = excluded.name, role = excluded.role, email = excluded.email;

    insert into public.family_groups (id, name) values (v_group, 'Familien Berg')
    on conflict (id) do nothing;

    insert into public.family_members (group_id, user_id, relationship, member_role) values
      (v_group, v_senior, 'Mor',    'senior'),
      (v_group, v_anne,   'Datter', 'primary_contact'),
      (v_group, v_per,    'Sonn',   'secondary_contact')
    on conflict (group_id, user_id) do update
      set relationship = excluded.relationship, member_role = excluded.member_role;

    insert into public.help_requests
      (id, family_group_id, senior_id, recipient_id, message, status, seen_by_senior,
       created_at, delivered_at, viewed_at, answered_at)
    values
      ('dddddddd-0000-0000-0000-000000000001', v_group, v_senior, v_anne,
       'Er denne meldingen ekte?', 'ANSWERED', true,
       now() - interval '140 min', now() - interval '139 min',
       now() - interval '125 min', now() - interval '120 min')
    on conflict (id) do nothing;

    insert into public.help_responses
      (id, help_request_id, responder_id, quick_reply_type, created_at)
    values
      ('eeeeeeee-0000-0000-0000-000000000001', 'dddddddd-0000-0000-0000-000000000001',
       v_anne, 'DO_NOT_REPLY', now() - interval '120 min')
    on conflict (id) do nothing;

    insert into public.calendar_events (id, family_group_id, title, description, start_time, created_by) values
      ('cccccccc-0000-0000-0000-000000000001', v_group, 'Legetime', 'Dr. Hansen, legekontoret',
       date_trunc('day', now()) + interval '13 hour', v_anne),
      ('cccccccc-0000-0000-0000-000000000002', v_group, 'Anne kommer pa besok', 'Tar med middag',
       date_trunc('day', now()) + interval '17 hour 30 min', v_anne)
    on conflict (id) do nothing;

    insert into public.activity_status (user_id, last_seen_at, app_opened_today) values
      (v_senior, now() - interval '8 min', true)
    on conflict (user_id) do update
      set last_seen_at = excluded.last_seen_at, app_opened_today = excluded.app_opened_today;

    raise notice 'Familieknappen-seed fullfort. Logg inn med magisk lenke som astrid@example.no, anne@example.no eller per@example.no.';
  else
    raise notice 'Hopper over app-data-seed fordi demo auth-brukere mangler.';
  end if;
end $$;
