-- TÁNAMÃO: administração de solicitações de publicação
-- Execute no SQL Editor do Supabase.
create table if not exists public.admin_users (
 user_id uuid primary key references auth.users(id) on delete cascade,
 created_at timestamptz not null default now()
);
alter table public.admin_users enable row level security;
revoke all on public.admin_users from anon, authenticated;

-- A função só pode ser chamada por usuário autenticado cadastrado como administrador.
create or replace function public.admin_list_professionals()
returns table (
 id uuid, display_name text, city text, state_code text, whatsapp text,
 bio text, published boolean, publication_requested_at timestamptz, profession_name text
)
language plpgsql security definer set search_path = ''
as $$
begin
 if auth.uid() is null or not exists
   (select 1 from public.admin_users a where a.user_id = auth.uid()) then
  raise exception 'Acesso não autorizado';
 end if;
 return query
 select p.id,p.display_name,p.city,p.state_code,p.whatsapp,p.bio,
 p.published,p.publication_requested_at,pr.name
 from public.professionals p
 left join public.professions pr on pr.id=p.profession_id
 where p.publication_requested_at is not null
 order by p.publication_requested_at desc;
end;
$$;
revoke all on function public.admin_list_professionals() from public, anon;
grant execute on function public.admin_list_professionals() to authenticated;

create or replace function public.admin_review_professional(target_id uuid, approve boolean)
returns void language plpgsql security definer set search_path = ''
as $$
begin
 if auth.uid() is null or not exists
   (select 1 from public.admin_users a where a.user_id = auth.uid()) then
  raise exception 'Acesso não autorizado';
 end if;
 if not exists(select 1 from public.professionals p
               where p.id=target_id and p.publication_requested_at is not null) then
  raise exception 'Solicitação não encontrada';
 end if;
 update public.professionals set published=approve,updated_at=now()
 where id=target_id;
end;
$$;
revoke all on function public.admin_review_professional(uuid,boolean) from public, anon;
grant execute on function public.admin_review_professional(uuid,boolean) to authenticated;

-- Ajusta o bloqueio de autopublicação: administrador publica somente pela função segura.
create or replace function public.enforce_professional_draft()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
 if current_user = 'authenticated' then new.published := false; end if;
 return new;
end; $$;

-- IMPORTANTE: após executar, conceda acesso de administrador à sua conta
-- substituindo o email abaixo no SQL Editor (não no aplicativo):
-- insert into public.admin_users(user_id)
-- select id from auth.users where email='SEU_EMAIL_AQUI'
-- on conflict do nothing;
