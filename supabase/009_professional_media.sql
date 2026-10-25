-- TÁNAMÃO piloto: logo e catálogo de até 5 fotos por profissional.
-- Imagens do catálogo são públicas; não envie documentos ou fotos pessoais sensíveis.
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('professional-media','professional-media',true,3145728,array['image/jpeg','image/png','image/webp'])
on conflict(id) do update set public=true,file_size_limit=3145728,allowed_mime_types=array['image/jpeg','image/png','image/webp'];

drop policy if exists "Professional media owner insert" on storage.objects;
drop policy if exists "Professional media owner update" on storage.objects;
drop policy if exists "Professional media owner delete" on storage.objects;
create policy "Professional media owner insert" on storage.objects for insert to authenticated
with check (bucket_id='professional-media' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy "Professional media owner update" on storage.objects for update to authenticated
using (bucket_id='professional-media' and (storage.foldername(name))[1]=(select auth.uid())::text)
with check (bucket_id='professional-media' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy "Professional media owner delete" on storage.objects for delete to authenticated
using (bucket_id='professional-media' and (storage.foldername(name))[1]=(select auth.uid())::text);

grant select,insert,update,delete on public.gallery_photos to authenticated;
grant select on public.gallery_photos to anon;
-- Limite de 5 fotos garantido no banco, inclusive contra chamadas diretas à API.
create or replace function public.enforce_gallery_limit() returns trigger language plpgsql
set search_path = '' as $$
begin
 perform pg_advisory_xact_lock(hashtext(new.professional_id::text));
 if (select count(*) from public.gallery_photos where professional_id=new.professional_id) >= 5 then
  raise exception 'Limite de 5 fotos atingido';
 end if;
 return new;
end;$$;
drop trigger if exists gallery_limit_insert on public.gallery_photos;
create trigger gallery_limit_insert before insert on public.gallery_photos
for each row execute function public.enforce_gallery_limit();
