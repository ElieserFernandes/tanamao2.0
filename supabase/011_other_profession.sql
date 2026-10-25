-- Permite cadastrar profissão livre sob a categoria Outro.
insert into public.professions(name,slug,active) values ('Outro','outro',true) on conflict(slug) do update set active=true;
alter table public.professionals add column if not exists custom_profession text;
alter table public.professionals drop constraint if exists custom_profession_length;
alter table public.professionals add constraint custom_profession_length check (custom_profession is null or char_length(btrim(custom_profession)) between 3 and 80);
