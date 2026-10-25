-- Permite ao proprietário consultar seus próprios arquivos, inclusive logo,
-- sem expor a listagem de arquivos de outros usuários.
drop policy if exists "Professional media owner select" on storage.objects;
create policy "Professional media owner select" on storage.objects
for select to authenticated
using (bucket_id='professional-media' and (storage.foldername(name))[1]=(select auth.uid())::text);
