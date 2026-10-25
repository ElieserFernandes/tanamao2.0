-- Preparação da publicação automática do TÁNAMÃO
-- Executar no SQL Editor após 004_admin_review.sql
alter table public.professionals
 add column if not exists review_status text not null default 'pending'
 check (review_status in ('pending','published','manual_review','suspended'));
create index if not exists idx_professionals_review_status
 on public.professionals(review_status);
-- A aprovação manual permanece ativa até o fluxo automático ser validado.
