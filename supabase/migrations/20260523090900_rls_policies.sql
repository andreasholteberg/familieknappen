-- Familieknappen - Lag 3 - 10 Row Level Security
-- Hovedregel: ingen kan lese gruppedata uten a vaere medlem av samme family_group.
-- Idempotent: drop policy if exists for create.

alter table public.profiles        enable row level security;
alter table public.family_groups   enable row level security;
alter table public.family_members  enable row level security;
alter table public.help_requests   enable row level security;
alter table public.help_responses  enable row level security;
alter table public.calendar_events enable row level security;
alter table public.activity_status enable row level security;

-- ---------- profiles ----------
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.shares_group_with(id));

drop policy if exists profiles_insert on public.profiles;
create policy profiles_insert on public.profiles
  for insert to authenticated
  with check (id = auth.uid());

drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- ---------- family_groups ----------
drop policy if exists family_groups_select on public.family_groups;
create policy family_groups_select on public.family_groups
  for select to authenticated
  using (public.is_group_member(id));

drop policy if exists family_groups_insert on public.family_groups;
create policy family_groups_insert on public.family_groups
  for insert to authenticated
  with check (true);

drop policy if exists family_groups_update on public.family_groups;
create policy family_groups_update on public.family_groups
  for update to authenticated
  using (public.is_group_member(id))
  with check (public.is_group_member(id));

-- ---------- family_members ----------
drop policy if exists family_members_select on public.family_members;
create policy family_members_select on public.family_members
  for select to authenticated
  using (public.is_group_member(group_id));

drop policy if exists family_members_insert on public.family_members;
create policy family_members_insert on public.family_members
  for insert to authenticated
  with check (user_id = auth.uid() or public.is_group_member(group_id));

drop policy if exists family_members_update on public.family_members;
create policy family_members_update on public.family_members
  for update to authenticated
  using (public.is_group_member(group_id))
  with check (public.is_group_member(group_id));

drop policy if exists family_members_delete on public.family_members;
create policy family_members_delete on public.family_members
  for delete to authenticated
  using (public.is_group_member(group_id));

-- ---------- help_requests ----------
drop policy if exists help_requests_select on public.help_requests;
create policy help_requests_select on public.help_requests
  for select to authenticated
  using (public.is_group_member(family_group_id));

drop policy if exists help_requests_insert on public.help_requests;
create policy help_requests_insert on public.help_requests
  for insert to authenticated
  with check (public.is_group_member(family_group_id));

drop policy if exists help_requests_update on public.help_requests;
create policy help_requests_update on public.help_requests
  for update to authenticated
  using (public.is_group_member(family_group_id))
  with check (public.is_group_member(family_group_id));

-- ---------- help_responses ----------
drop policy if exists help_responses_select on public.help_responses;
create policy help_responses_select on public.help_responses
  for select to authenticated
  using (public.is_group_member(public.request_group(help_request_id)));

drop policy if exists help_responses_insert on public.help_responses;
create policy help_responses_insert on public.help_responses
  for insert to authenticated
  with check (
    responder_id = auth.uid()
    and public.is_group_member(public.request_group(help_request_id))
  );

drop policy if exists help_responses_update on public.help_responses;
create policy help_responses_update on public.help_responses
  for update to authenticated
  using (responder_id = auth.uid())
  with check (responder_id = auth.uid());

-- ---------- calendar_events ----------
drop policy if exists calendar_events_select on public.calendar_events;
create policy calendar_events_select on public.calendar_events
  for select to authenticated
  using (public.is_group_member(family_group_id));

drop policy if exists calendar_events_insert on public.calendar_events;
create policy calendar_events_insert on public.calendar_events
  for insert to authenticated
  with check (public.is_group_member(family_group_id));

drop policy if exists calendar_events_update on public.calendar_events;
create policy calendar_events_update on public.calendar_events
  for update to authenticated
  using (public.is_group_member(family_group_id))
  with check (public.is_group_member(family_group_id));

drop policy if exists calendar_events_delete on public.calendar_events;
create policy calendar_events_delete on public.calendar_events
  for delete to authenticated
  using (public.is_group_member(family_group_id));

-- ---------- activity_status ----------
drop policy if exists activity_status_select on public.activity_status;
create policy activity_status_select on public.activity_status
  for select to authenticated
  using (user_id = auth.uid() or public.shares_group_with(user_id));

drop policy if exists activity_status_insert on public.activity_status;
create policy activity_status_insert on public.activity_status
  for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists activity_status_update on public.activity_status;
create policy activity_status_update on public.activity_status
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
