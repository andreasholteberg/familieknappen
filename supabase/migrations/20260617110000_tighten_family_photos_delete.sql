-- Familieknappen - F-063 hardening: storage-delete skal matche tabell-RLS.
-- Bare opplaster eller primærkontakt kan slette en aktiv bildefil.

drop policy if exists "family_photos_storage_delete" on storage.objects;
create policy "family_photos_storage_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'family-photos'
    and exists (
      select 1
        from public.family_photos fp
       where fp.storage_path = storage.objects.name
         and (
           fp.uploaded_by = auth.uid()
           or public.is_primary_contact(fp.family_group_id)
         )
    )
  );
