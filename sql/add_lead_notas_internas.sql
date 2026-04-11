-- Notas internas da consultora (CRM). Executar no Supabase SQL Editor.
-- Não são mostradas ao cliente no portal.

alter table public.leads
  add column if not exists notas_internas text;

comment on column public.leads.notas_internas is
  'Notas internas só para a equipa (CRM).';
