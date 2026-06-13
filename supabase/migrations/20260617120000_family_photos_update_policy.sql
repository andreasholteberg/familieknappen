-- Familieknappen - F-063 bugfix: opplaster må kunne ferdigstille bilderaden.
-- Upload-flowen oppretter raden med storage_path = 'pending', laster opp fila,
-- og oppdaterer deretter raden med faktisk Storage-sti. Uten UPDATE-policy blir
-- fila liggende i Storage, mens appen bare ser "pending" og kan ikke vise bildet.

drop policy if exists family_photos_update on public.family_photos;
create policy family_photos_update on public.family_photos
  for update to authenticated
  using (
    uploaded_by = auth.uid()
    and public.is_group_member(family_group_id)
  )
  with check (
    uploaded_by = auth.uid()
    and public.is_group_member(family_group_id)
  );
