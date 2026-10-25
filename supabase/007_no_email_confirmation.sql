-- TÁNAMÃO: adaptar triagem ao cadastro sem confirmação obrigatória de e-mail.
-- Execute depois de desativar Confirm email no Supabase.
-- Segurança: somente conta autenticada; revisão para dados insuficientes ou duplicados.
create or replace function public.request_professional_publication()
returns text language plpgsql security definer set search_path = ''
as $$
declare
 p public.professionals%rowtype;
 needs_review boolean;
begin
 if auth.uid() is null then raise exception 'Entre na sua conta para continuar'; end if;
 select * into p from public.professionals where user_id=auth.uid() for update;
 if not found then raise exception 'Salve seu cadastro primeiro'; end if;
 if p.review_status='suspended' then return 'suspended'; end if;
 if p.published then return 'published'; end if;
 needs_review :=
  p.profession_id is null
  or not exists(select 1 from public.professions pr where pr.id=p.profession_id and pr.active)
  or length(btrim(coalesce(p.display_name,''))) < 3
  or length(btrim(coalesce(p.city,''))) < 2
  or coalesce(p.state_code,'') !~ '^[A-Z]{2}$'
  or coalesce(p.whatsapp,'') !~ '^[0-9]{10,13}$'
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
