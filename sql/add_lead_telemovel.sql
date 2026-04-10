-- Contacto telefónico no pedido de proposta (site).
-- Executar no Supabase SQL Editor.

alter table public.leads
  add column if not exists telemovel text;

comment on column public.leads.telemovel is
  'Telemóvel indicado no formulário público de pedido de orçamento.';
