-- Reaplica permissões e políticas para leitura e envio do catálogo.
grant usage on schema public to authenticated, anon;
grant select,insert,update,delete on table public.gallery_photos to authenticated;
grant select on table public.gallery_photos to anon;
alter table public.gallery_photos enable row level security;
drop policy if exists "Owner reads own gallery" on public.gallery_photos;
create policy "Owner reads own gallery" on public.gallery_photos for select to authenticated
using (exists (select 1 from public.professionals p where p.id=professional_id and p.user_id=(select auth.uid())));
drop policy if exists "Owner inserts photos" on public.gallery_photos;
create policy "Owner inserts photos" on public.gallery_photos for insert to authenticated
with check (exists(select 1 from public.professionals p where p.id=professional_id and p.user_id=(select auth.uid())));
drop policy if exists "Owner deletes photos" on public.gallery_photos;
create policy "Owner deletes photos" on public.gallery_photos for delete to authenticated
using (exists(select 1 from public.professionals p where p.id=professional_id and p.user_id=(select auth.uid())));
-- Permissão de listagem/atualização do logo no Storage
drop policy if exists "Professional media owner select" on storage.objects;
create policy "Professional media owner select" on storage.objects for select to authenticated
using(bucket_id='professional-media' and (storage.foldername(name))[1]=(select auth.uid())::text);
