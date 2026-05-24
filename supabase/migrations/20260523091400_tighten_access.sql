-- Familieknappen - Lag 4 - 15 Strammere tilgang
-- - Kun primaerkontakt kan legge til/fjerne medlemmer og endre roller.
-- - secondary_contact kan ikke endre roller (de nar ikke UPDATE-policyen).
-- - Ingen kan gjore seg selv til primaer (trigger + indeks under).
-- - Aktivitetsstatus deles bare hvis brukeren har samtykket.
-- Idempotent.

-- Maks en primaerkontakt per gruppe (gjor "to primaerer" umulig pa DB-niva).
create unique index if not exists family_members_one_primary
  on public.family_members (group_id)
  where member_role = 'primary_contact';

-- ----- family_members: erstatt insert/update/delete -----
drop policy if exists family_members_insert on public.family_members;
create policy family_members_insert on public.family_members
  for insert to authenticated
  with check (
    -- primaerkontakten legger til medlemmer ...
    public.is_primary_contact(group_id)
    -- ... eller forste bruker oppretter sitt eget medlemskap i en tom gruppe
    -- (bootstrapping; trigger hindrer at dette gjores som primaerkontakt).
    or (user_id = auth.uid() and not public.group_has_members(group_id))
  );

drop policy if exists family_members_update on public.family_members;
create policy family_members_update on public.family_members
  for update to authenticated
  using (public.is_primary_contact(group_id))
  with check (public.is_primary_contact(group_id));

drop policy if exists family_members_delete on public.family_members;
create policy family_members_delete on public.family_members
  for delete to authenticated
  using (public.is_primary_contact(group_id));

-- (family_members_select beholdes uendret: alle gruppemedlemmer kan lese.)

-- ----- activity_status: les bare hvis eier ELLER samtykke er pa -----
drop policy if exists activity_status_select on public.activity_status;
create policy activity_status_select on public.activity_status
  for select to authenticated
  using (
    user_id = auth.uid()
    or (public.shares_group_with(user_id) and public.activity_sharing_on(user_id))
  );
