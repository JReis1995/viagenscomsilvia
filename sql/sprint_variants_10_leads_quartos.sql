-- Sprint Variants 10 — quartos no pedido de lead

alter table public.leads
  add column if not exists pedido_quartos integer;

alter table public.leads
  drop constraint if exists leads_pedido_quartos_check;

alter table public.leads
  add constraint leads_pedido_quartos_check
  check (pedido_quartos is null or (pedido_quartos >= 1 and pedido_quartos <= 20));

comment on column public.leads.pedido_quartos is
  'Quantidade de quartos necessária indicada pelo cliente no pedido.';
