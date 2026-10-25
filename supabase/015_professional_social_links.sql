-- Links públicos opcionais do perfil profissional
alter table public.professionals
 add column if not exists website_url text,
 add column if not exists instagram_url text,
 add column if not exists facebook_url text,
 add column if not exists linkedin_url text,
 add column if not exists tiktok_url text;
