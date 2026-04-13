-- Sprint 6 (CRM Inscritos) — Auditoria mínima de eliminação de conta pelo painel
-- Executar no Supabase SQL Editor após sprint4_promo_campaigns.sql
-- Sem políticas RLS para anon/authenticated: inserções só via service role no servidor.

create table if not exists public.crm_subscriber_delete_audit (
  id uuid primary key default gen_random_uuid(),
  consultora_user_id uuid,
  consultora_email text not null,
  target_user_id uuid not null,
  target_email text not null,
  created_at timestamptz not null default now()
);

create index if not exists crm_subscriber_delete_audit_created_at_idx
  on public.crm_subscriber_delete_audit (created_at desc);

alter table public.crm_subscriber_delete_audit enable row level security;

comment on table public.crm_subscriber_delete_audit is
  'Registo de eliminação de utilizador Auth a partir de CRM → Inscritos (RGPD).';
