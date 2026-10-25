-- Finalização consciente: sem fotos só mediante confirmação explícita.
alter table public.professionals add column if not exists no_gallery_acknowledged_at timestamptz;

create or replace function public.confirm_professional_without_photos()
returns void language plpgsql security definer set search_path = ''
as $$
declare p public.professionals%rowtype;
begin
 if auth.uid() is null then raise exception 'Entre na sua conta'; end if;
 select * into p from public.professionals where user_id=auth.uid() for update;
 if not found then raise exception 'Salve seus dados profissionais primeiro'; end if;
 update public.professionals set no_gallery_acknowledged_at=now() where id=p.id;
end;$$;
revoke all on function public.confirm_professional_without_photos() from public,anon;
grant execute on function public.confirm_professional_without_photos() to authenticated;

create or replace function public.request_professional_publication()
returns text language plpgsql security definer set search_path = ''
as $$
declare p public.professionals%rowtype; email_ok boolean; needs_review boolean;
begin
 if auth.uid() is null then raise exception 'Entre na sua conta para continuar'; end if;
 select * into p from public.professionals where user_id=auth.uid() for update;
 if not found then raise exception 'Salve seu cadastro primeiro'; end if;
 if p.review_status='suspended' then return 'suspended'; end if;
 if not exists(select 1 from public.gallery_photos g where g.professional_id=p.id)
    and p.no_gallery_acknowledged_at is null then
  raise exception 'Adicione fotos dos serviços ou confirme que deseja publicar sem fotos';
 end if;
 if p.published then return 'published'; end if;
 select (u.email_confirmed_at is not null) into email_ok from auth.users u where u.id=auth.uid();
 needs_review := coalesce(not email_ok,true)
  or p.profession_id is null
  or not exists(select 1 from public.professions pr where pr.id=p.profession_id and pr.active)
  or length(btrim(p.display_name)) < 3
  or length(btrim(p.city)) < 2
  or p.state_code !~ '^[A-Z]{2}$'
  or p.whatsapp !~ '^[0-9]{10,13}$'
  or length(btrim(coalesce(p.bio,''))) < 15
  or exists(select 1 from public.professionals x where x.id<>p.id and x.whatsapp=p.whatsapp and x.published);
 update public.professionals
 set publication_requested_at=coalesce(publication_requested_at,now()),
 published=not needs_review,
 review_status=case when needs_review then 'manual_review' else 'published' end,
 updated_at=now() where id=p.id;
 return case when needs_review then 'manual_review' else 'published' end;
end;$$;
revoke all on function public.request_professional_publication() from public,anon;
grant execute on function public.request_professional_publication() to authenticated;
