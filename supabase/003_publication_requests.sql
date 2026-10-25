-- Solicitação de publicação do perfil profissional
alter table public.professionals
 add column if not exists publication_requested_at timestamptz;

-- A solicitação não publica o perfil; apenas registra interesse para análise futura.
-- A proteção enforce_professional_draft continua impedindo publicação pelo cliente.
