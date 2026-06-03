-- Familieknappen controlled test reset.
--
-- Purpose:
-- - Remove local prototype/test data for the two known test accounts.
-- - Keep schema, RLS policies, functions, storage bucket, Supabase URL config,
--   and project configuration untouched.
--
-- How to use:
-- 1. Open Supabase Dashboard -> SQL Editor.
-- 2. Paste this script.
-- 3. Run it once as-is and inspect the returned counts.
-- 4. If the counts look right, change the final ROLLBACK to COMMIT and run again.
--
-- Important:
-- - This deletes family groups connected to the target users. Do not use this
--   if those groups contain real production data.
-- - Auth users are deleted at the end, which cascades to public.profiles.

begin;

create temp table reset_target_users as
select id, email
from auth.users
where lower(email) in (
  'andreasholteberg@gmail.com',
  'hholteberg@gmail.com'
);

create temp table reset_target_groups as
select distinct fm.group_id as id
from public.family_members fm
join reset_target_users u on u.id = fm.user_id
union
select distinct gi.family_group_id as id
from public.group_invitations gi
where lower(gi.invited_email) in (
  'andreasholteberg@gmail.com',
  'hholteberg@gmail.com'
)
or gi.created_by in (select id from reset_target_users)
union
select distinct hr.family_group_id as id
from public.help_requests hr
where hr.senior_id in (select id from reset_target_users)
or hr.recipient_id in (select id from reset_target_users);

create temp table reset_target_requests as
select distinct hr.id
from public.help_requests hr
where hr.family_group_id in (select id from reset_target_groups)
or hr.senior_id in (select id from reset_target_users)
or hr.recipient_id in (select id from reset_target_users);

-- Preview what will be touched.
select 'auth.users' as table_name, count(*) as rows_found from reset_target_users
union all
select 'public.family_groups', count(*) from reset_target_groups
union all
select 'public.help_requests', count(*) from reset_target_requests
union all
select 'public.group_invitations', count(*)
from public.group_invitations
where family_group_id in (select id from reset_target_groups)
or created_by in (select id from reset_target_users)
or lower(invited_email) in ('andreasholteberg@gmail.com', 'hholteberg@gmail.com')
union all
select 'public.notification_tokens', count(*)
from public.notification_tokens
where user_id in (select id from reset_target_users)
union all
select 'public.notification_log', count(*)
from public.notification_log
where user_id in (select id from reset_target_users)
or related_help_request_id in (select id from reset_target_requests)
union all
select 'storage.objects help-images', count(*)
from storage.objects so
where so.bucket_id = 'help-images'
and exists (
  select 1
  from reset_target_groups g
  where so.name like g.id::text || '/%'
);

-- Delete leaf/dependent data first.
delete from storage.objects so
where so.bucket_id = 'help-images'
and exists (
  select 1
  from reset_target_groups g
  where so.name like g.id::text || '/%'
);

delete from public.notification_log
where user_id in (select id from reset_target_users)
or related_help_request_id in (select id from reset_target_requests);

delete from public.notification_tokens
where user_id in (select id from reset_target_users);

delete from public.activity_status
where user_id in (select id from reset_target_users);

delete from public.help_responses
where responder_id in (select id from reset_target_users)
or help_request_id in (select id from reset_target_requests);

delete from public.help_requests
where id in (select id from reset_target_requests);

delete from public.calendar_events
where family_group_id in (select id from reset_target_groups)
or created_by in (select id from reset_target_users);

delete from public.group_invitations
where family_group_id in (select id from reset_target_groups)
or created_by in (select id from reset_target_users)
or lower(invited_email) in (
  'andreasholteberg@gmail.com',
  'hholteberg@gmail.com'
);

delete from public.family_members
where group_id in (select id from reset_target_groups)
or user_id in (select id from reset_target_users);

delete from public.family_groups
where id in (select id from reset_target_groups);

delete from public.profiles
where id in (select id from reset_target_users);

delete from auth.users
where id in (select id from reset_target_users);

-- Safety default: nothing is actually deleted unless you change this to COMMIT.
rollback;
