# TÁNAMÃO 2.0

Aplicativo brasileiro para descobrir profissionais por serviço e cidade, com contato direto via WhatsApp.

## Status

**Fase 1: interface inicial.** Busca visual, categorias e compartilhamento nativo implementados. A busca ainda não consulta profissionais reais; não há autenticação, pagamentos nem banco de dados configurados.

## Desenvolvimento

```bash
npm install
npm run dev
```

Acesse http://localhost:3000.

## Tecnologias

Next.js (App Router), React, TypeScript, CSS, Supabase (integração futura), Vercel.

## Próximas etapas

1. Criar projeto Supabase e definir tabelas, políticas RLS e Storage.
2. Configurar autenticação Google e e-mail.
3. Cadastro e perfis públicos dos profissionais.
4. Busca real, filtros e contatos WhatsApp.
5. Avaliações, confirmação bilateral e moderação.
6. Planos, pagamentos, administração e Radar de Demanda.

Não inserir segredos no repositório. Usar variáveis de ambiente na Vercel.
