-- Familieknappen - Fase 2 fremskutt (F-063): «Bilder fra familien».
-- Enkel felles bildestrøm per familiegruppe: pårørende (og senior) kan dele
-- et bilde med en kort hilsen; alle i gruppa ser dem. Direkte ønsket av
-- pilot-seniorene (plan § 9.1.8 – enkleste modell valgt).

create table if not exists public.family_photos (
  id              uuid primary key default gen_random_uuid(),
  family_group_id uuid not null references public.family_groups(id) on delete cascade,
  uploaded_by     uuid not null references public.profiles(id) on delete cascade,
  storage_path    text not null,
  caption         text,
  created_at      timestamptz not null default now()
);

create index if not exists family_photos_group_idx
  on public.family_photos (family_group_id, created_at desc);

alter table public.family_photos enable row level security;

drop policy if exists family_photos_select on public.family_photos;
create policy family_photos_select on public.family_photos
  for select to authenticated
  using (public.is_group_member(family_group_id));

drop policy if exists family_photos_insert on public.family_photos;
create policy family_photos_insert on public.family_photos
  for insert to authenticated
  with check (
    public.is_group_member(family_group_id)
    and uploaded_by = auth.uid()
  );

-- Avsender kan slette sitt eget bilde; primærkontakt kan rydde i gruppas.
drop policy if exists family_photos_delete on public.family_photos;
create policy family_photos_delete on public.family_photos
  for delete to authenticated
  using (
    uploaded_by = auth.uid()
    or public.is_primary_contact(family_group_id)
  );

-- Privat bucket. Sti: "<family_group_id>/<photo_id>.jpg" (RLS leser gruppe fra sti).
insert into storage.buckets (id, name, public)
values ('family-photos', 'family-photos', false)
on conflict (id) do nothing;

drop policy if exists "family_photos_storage_select" on storage.objects;
create policy "family_photos_storage_select" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'family-photos'
    and public.is_group_member(((storage.foldername(name))[1])::uuid)
  );

drop policy if exists "family_photos_storage_insert" on storage.objects;
create policy "family_photos_storage_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'family-photos'
    and public.is_group_member(((storage.foldername(name))[1])::uuid)
  );

drop policy if exists "family_photos_storage_delete" on storage.objects;
create policy "family_photos_storage_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'family-photos'
    and public.is_group_member(((storage.foldername(name))[1])::uuid)
  );
