-- Qualificação comercial (passo 3 do plano): janela de datas, flexibilidade, voos/hotel.
-- Executar no Supabase SQL Editor após deploy.

alter table public.leads
  add column if not exists janela_datas text;

alter table public.leads
  add column if not exists flexibilidade_datas text;

alter table public.leads
  add column if not exists ja_tem_voos_hotel text;

comment on column public.leads.janela_datas is 'Janela de datas indicada pelo cliente (texto livre).';
comment on column public.leads.flexibilidade_datas is 'Chave interna: fixas | mais_menos_semana | totalmente_flexivel.';
comment on column public.leads.ja_tem_voos_hotel is 'Chave interna: nada | so_voos | so_hotel | ambos.';
