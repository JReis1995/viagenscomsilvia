-- Sprint 4 — Campanhas promo (CRM), auditoria de impersonate, atribuição na lead
-- Executar no Supabase SQL Editor após sprint3_plan_features.sql
--
-- No servidor (ex.: Vercel + .env): define também CAMPAIGN_LINK_SECRET — segredo
-- longo e aleatório para assinar links por destinatário (campanhas por email).

-- --- Campanhas criadas no CRM (desconto + ligação a publicação) ---
create table if not exists public.promo_campaigns (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references public.posts (id) on delete set null,
  discount_percent integer not null default 10,
  titulo_publicacao text not null,
  link_publicacao text not null,
  link_formulario_base text not null,
  expires_at timestamptz not null,
  created_by text,
  created_at timestamptz not null default now(),
  constraint promo_campaigns_discount_range check (
    discount_percent >= 0 and discount_percent <= 100
  ),
  constraint promo_campaigns_titulo_len check (char_length(btrim(titulo_publicacao)) > 0),
  constraint promo_campaigns_links_nonempty check (
    char_length(btrim(link_publicacao)) > 0
    and char_length(btrim(link_formulario_base)) > 0
  )
);

comment on table public.promo_campaigns is
  'Campanhas de email promo criadas no CRM; links assinados por destinatário.';

create index if not exists promo_campaigns_created_at_idx
  on public.promo_campaigns (created_at desc);

alter table public.promo_campaigns enable row level security;

-- Sem políticas para authenticated/anon: acesso à tabela só via service role no servidor (bypass RLS).

-- --- Auditoria mínima: consultora abre sessão como cliente (magic link) ---
create table if not exists public.crm_impersonation_audit (
  id uuid primary key default gen_random_uuid(),
  consultora_user_id uuid,
  consultora_email text not null,
  target_user_id uuid not null,
  created_at timestamptz not null default now()
);

create index if not exists crm_impersonation_audit_created_at_idx
  on public.crm_impersonation_audit (created_at desc);

alter table public.crm_impersonation_audit enable row level security;

comment on table public.crm_impersonation_audit is
  'Registo de pedidos de magic link «ver como cliente» (RGPD: uso consciente).';

-- --- Lead: referência à campanha quando o token no formulário é válido ---
alter table public.leads
  add column if not exists promo_campaign_id uuid references public.promo_campaigns (id) on delete set null;

create index if not exists leads_promo_campaign_id_idx
  on public.leads (promo_campaign_id)
  where promo_campaign_id is not null;

comment on column public.leads.promo_campaign_id is
  'Preenchido quando o pedido chega com token de campanha válido e email coincidente.';
