-- Execute no SQL Editor do Supabase TÁNAMÃO 2.0.
-- Profissões iniciais para permitir o cadastro de rascunhos.
insert into public.professions (name,slug) values
('Pintor','pintor'),('Pedreiro','pedreiro'),('Eletricista','eletricista'),
('Encanador','encanador'),('Manicure','manicure'),('Diarista','diarista'),
('Cozinheira','cozinheira'),('Mecânico','mecanico'),('Cabeleireiro','cabeleireiro'),
('Barbeiro','barbeiro'),('Montador de móveis','montador-de-moveis'),
('Jardineiro','jardineiro'),('Motorista','motorista'),('Técnico de ar-condicionado','tecnico-ar-condicionado'),
('Fotógrafo','fotografo'),('Confeiteiro','confeiteiro'),('Costureira','costureira'),
('Designer de unhas','designer-de-unhas'),('Lava-rápido','lava-rapido'),
('Reformas em geral','reformas-em-geral')
on conflict (slug) do nothing;

-- Evita publicação pelo próprio cliente antes de criarmos validação de contato e moderação.
-- A publicação futura será feita somente por fluxo administrativo seguro.
create or replace function public.enforce_professional_draft()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if auth.role() = 'authenticated' then
    new.published := false;
  end if;
  return new;
end; $$;
drop trigger if exists enforce_professional_draft_trigger on public.professionals;
create trigger enforce_professional_draft_trigger before insert or update on public.professionals
for each row execute function public.enforce_professional_draft();
