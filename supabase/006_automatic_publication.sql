-- TÁNAMÃO 2.0 - publicação automática com triagem inicial
-- Execute após 005_publication_status.sql.
-- Clientes não podem alterar diretamente status ou publicação.
create or replace function public.enforce_professional_draft()
returns trigger language plpgsql security invoker set search_path = ''
as $$
begin
 if current_user = 'authenticated' then
  if tg_op = 'INSERT' then
   new.published := false;
   new.review_status := 'pending';
  else
   new.published := old.published;
   new.review_status := old.review_status;
  end if;
 end if;
 return new;
end;
$$;

-- Solicitação com validação no servidor e verificação do e-mail confirmado.
create or replace function public.request_professional_publication()
returns text
language plpgsql security definer set search_path = ''
as $$
declare
 p public.professionals%rowtype;
 email_ok boolean;
 needs_review boolean;
begin
 if auth.uid() is null then
  raise exception 'Entre na sua conta para continuar';
 end if;
 select * into p from public.professionals where user_id=auth.uid() for update;
 if not found then raise exception 'Salve seu cadastro primeiro'; end if;
 if p.review_status='suspended' then return 'suspended'; end if;
 if p.published then return 'published'; end if;
 select (u.email_confirmed_at is not null) into email_ok
 from auth.users u where u.id=auth.uid();
 needs_review := coalesce(not email_ok,true)
  or p.profession_id is null
  or not exists(select 1 from public.professions pr where pr.id=p.profession_id and pr.active)
  or length(btrim(p.display_name)) < 3
  or length(btrim(p.city)) < 2
  or p.state_code !~ '^[A-Z]{2}$'
  or p.whatsapp !~ '^[0-9]{10,13}$'
  or length(btrim(coalesce(p.bio,''))) < 15
  or exists(select 1 from public.professionals x
            where x.id<>p.id and x.whatsapp=p.whatsapp and x.published);
 update public.professionals
 set publication_requested_at=coalesce(publication_requested_at,now()),
     published=not needs_review,
     review_status=case when needs_review then 'manual_review' else 'published' end,
     updated_at=now()
 where id=p.id;
 return case when needs_review then 'manual_review' else 'published' end;
end;
$$;
revoke all on function public.request_professional_publication() from public,anon;
grant execute on function public.request_professional_publication() to authenticated;

-- Preserva compatibilidade do painel de aprovação.
create or replace function public.admin_review_professional(target_id uuid, approve boolean)
returns void language plpgsql security definer set search_path = ''
as $$
begin
 if auth.uid() is null or not exists
 (select 1 from public.admin_users a where a.user_id=auth.uid()) then
  raise exception 'Acesso não autorizado';
 end if;
 if not exists(select 1 from public.professionals p where p.id=target_id
               and p.publication_requested_at is not null) then
  raise exception 'Solicitação não encontrada';
 end if;
 update public.professionals
 set published=approve,
 review_status=case when approve then 'published' else 'manual_review' end,
 updated_at=now()
 where id=target_id;
end;
$$;
revoke all on function public.admin_review_professional(uuid,boolean) from public,anon;
grant execute on function public.admin_review_professional(uuid,boolean) to authenticated;
