-- TÁNAMÃO 2.0 — esquema inicial (executar uma vez no SQL Editor)
create extension if not exists pgcrypto;

create table if not exists public.professions (
 id uuid primary key default gen_random_uuid(),
 name text not null unique,
 slug text not null unique,
 active boolean not null default true,
 created_at timestamptz not null default now()
);
create table if not exists public.professionals (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null unique references auth.users(id) on delete cascade,
 display_name text not null check (char_length(display_name) between 2 and 120),
 slug text not null unique,
 profession_id uuid references public.professions(id),
 city text not null,
 state_code text not null check (char_length(state_code)=2),
 neighborhood text,
 bio text,
 whatsapp text not null,
 avatar_url text,
 status text not null default 'available' check(status in ('available','busy','unavailable')),
 published boolean not null default false,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create table if not exists public.services (
 id uuid primary key default gen_random_uuid(),
 professional_id uuid not null references public.professionals(id) on delete cascade,
 title text not null check (char_length(title) between 2 and 120),
 description text,
 price_from numeric(12,2) check(price_from is null or price_from >= 0),
 created_at timestamptz not null default now()
);
create table if not exists public.gallery_photos (
 id uuid primary key default gen_random_uuid(),
 professional_id uuid not null references public.professionals(id) on delete cascade,
 storage_path text not null,
 caption text,
 visible boolean not null default true,
 created_at timestamptz not null default now()
);
create table if not exists public.reviews (
 id uuid primary key default gen_random_uuid(),
 professional_id uuid not null references public.professionals(id) on delete cascade,
 reviewer_id uuid not null references auth.users(id) on delete cascade,
 stars integer not null check(stars between 1 and 5),
 comment text not null check(char_length(comment) between 3 and 2000),
 professional_reply text,
 confirmed_service boolean not null default false,
 moderation_status text not null default 'published' check(moderation_status in ('published','hidden','under_review')),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 constraint reviewer_not_null check (reviewer_id is not null)
);

create index if not exists idx_professionals_search on public.professionals(profession_id, state_code, city) where published;
create index if not exists idx_services_professional on public.services(professional_id);
create index if not exists idx_photos_professional on public.gallery_photos(professional_id);
create index if not exists idx_reviews_professional on public.reviews(professional_id);

alter table public.professions enable row level security;
alter table public.professionals enable row level security;
alter table public.services enable row level security;
alter table public.gallery_photos enable row level security;
alter table public.reviews enable row level security;

create policy "Public reads active professions" on public.professions for select using (active);
create policy "Public reads published professionals" on public.professionals for select using (published or auth.uid() = user_id);
create policy "Owner creates professional" on public.professionals for insert to authenticated with check (auth.uid() = user_id);
create policy "Owner updates professional" on public.professionals for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Owner deletes professional" on public.professionals for delete to authenticated using (auth.uid() = user_id);

create policy "Public reads services of published professionals" on public.services for select using (exists(select 1 from public.professionals p where p.id=professional_id and (p.published or p.user_id=auth.uid())));
create policy "Owner inserts services" on public.services for insert to authenticated with check (exists(select 1 from public.professionals p where p.id=professional_id and p.user_id=auth.uid()));
create policy "Owner updates services" on public.services for update to authenticated using (exists(select 1 from public.professionals p where p.id=professional_id and p.user_id=auth.uid()));
create policy "Owner deletes services" on public.services for delete to authenticated using (exists(select 1 from public.professionals p where p.id=professional_id and p.user_id=auth.uid()));

create policy "Public reads visible photos of published professionals" on public.gallery_photos for select using (exists(select 1 from public.professionals p where p.id=professional_id and ((p.published and visible) or p.user_id=auth.uid())));
create policy "Owner inserts photos" on public.gallery_photos for insert to authenticated with check (exists(select 1 from public.professionals p where p.id=professional_id and p.user_id=auth.uid()));
create policy "Owner updates photos" on public.gallery_photos for update to authenticated using (exists(select 1 from public.professionals p where p.id=professional_id and p.user_id=auth.uid()));
create policy "Owner deletes photos" on public.gallery_photos for delete to authenticated using (exists(select 1 from public.professionals p where p.id=professional_id and p.user_id=auth.uid()));

create policy "Public reads published reviews" on public.reviews for select using (moderation_status='published' and exists(select 1 from public.professionals p where p.id=professional_id and p.published));
-- Reviews remain read-only until server-side antifraud, ownership and moderation flows are implemented.
-- No client insert/update/delete policy intentionally.
