-- Perfil pessoal independente do cadastro profissional.
-- Foto armazenada em pasta privada do usuário, acessível apenas ao dono.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('account-avatars','account-avatars',false,2097152,array['image/jpeg','image/png','image/webp'])
on conflict(id) do update set public=false,file_size_limit=2097152,allowed_mime_types=array['image/jpeg','image/png','image/webp'];
drop policy if exists "Account avatar read own" on storage.objects;
drop policy if exists "Account avatar upload own" on storage.objects;
drop policy if exists "Account avatar update own" on storage.objects;
drop policy if exists "Account avatar delete own" on storage.objects;
create policy "Account avatar read own" on storage.objects for select to authenticated using (bucket_id='account-avatars' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy "Account avatar upload own" on storage.objects for insert to authenticated with check (bucket_id='account-avatars' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy "Account avatar update own" on storage.objects for update to authenticated using (bucket_id='account-avatars' and (storage.foldername(name))[1]=(select auth.uid())::text) with check (bucket_id='account-avatars' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy "Account avatar delete own" on storage.objects for delete to authenticated using (bucket_id='account-avatars' and (storage.foldername(name))[1]=(select auth.uid())::text);
alter table public.professionals add column if not exists full_name text;
alter table public.professionals add column if not exists company_name text;
