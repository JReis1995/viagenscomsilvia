-- Preferência de clima no pedido de proposta (quiz). Executar no Supabase se a coluna ainda não existir.
alter table public.leads
  add column if not exists clima_preferido text;

comment on column public.leads.clima_preferido is
  'Chave do passo clima do quiz: neve | praia | cidade | misto';
