-- Atribuição de marketing, pedido rápido e colunas para analytics no CRM.
-- Executar no Supabase SQL Editor.

alter table public.leads
  add column if not exists pedido_rapido boolean not null default false;

alter table public.leads
  add column if not exists utm_source text;

alter table public.leads
  add column if not exists utm_medium text;

alter table public.leads
  add column if not exists utm_campaign text;

alter table public.leads
  add column if not exists utm_content text;

alter table public.leads
  add column if not exists utm_term text;

alter table public.leads
  add column if not exists referrer text;

alter table public.leads
  add column if not exists landing_path text;

comment on column public.leads.pedido_rapido is
  'True quando o cliente enviou o atalho «pedido rápido» (sem quiz completo).';

comment on column public.leads.landing_path is
  'Path + query da primeira página da sessão (ex.: /?utm_source=ig).';
