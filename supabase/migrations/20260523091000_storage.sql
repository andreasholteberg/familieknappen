-- Familieknappen - Lag 3 - 11 Storage (bilder til hjelpeforesporsler)
-- Privat bucket. Filsti-konvensjon: "<family_group_id>/<request_id>.jpg".
-- Lesing/opplasting kun for medlemmer av gruppa i forste mappeledd.

insert into storage.buckets (id, name, public)
values ('help-images', 'help-images', false)
on conflict (id) do nothing;

drop policy if exists "help_images_select" on storage.objects;
create policy "help_images_select" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'help-images'
    and public.is_group_member(((storage.foldername(name))[1])::uuid)
  );

drop policy if exists "help_images_insert" on storage.objects;
create policy "help_images_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'help-images'
    and public.is_group_member(((storage.foldername(name))[1])::uuid)
  );

drop policy if exists "help_images_update" on storage.objects;
create policy "help_images_update" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'help-images'
    and public.is_group_member(((storage.foldername(name))[1])::uuid)
  );
