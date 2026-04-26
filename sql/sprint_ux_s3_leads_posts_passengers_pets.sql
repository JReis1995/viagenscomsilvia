-- Sprint UX S3 — Passageiros por idade + preferências opcionais em leads e publicações
-- Executar no Supabase SQL Editor após as migrations anteriores.

-- ---------------------------------------------------------------------
-- LEADS: passageiros e animais de estimação (opcional)
-- ---------------------------------------------------------------------

alter table public.leads
  add column if not exists pedido_adultos integer,
  add column if not exists pedido_criancas integer,
  add column if not exists pedido_idades_criancas jsonb,
  add column if not exists pedido_animais_estimacao boolean;

-- checks base para evitar dados incoerentes vindos de integrações externas
alter table public.leads
  drop constraint if exists leads_pedido_adultos_check;
alter table public.leads
  add constraint leads_pedido_adultos_check
  check (pedido_adultos is null or pedido_adultos >= 1);

alter table public.leads
  drop constraint if exists leads_pedido_criancas_check;
alter table public.leads
  add constraint leads_pedido_criancas_check
  check (pedido_criancas is null or pedido_criancas >= 0);

comment on column public.leads.pedido_adultos is
  'Número de adultos (18+) pedido no topo do site.';
comment on column public.leads.pedido_criancas is
  'Número de crianças (0-17) pedido no topo do site.';
comment on column public.leads.pedido_idades_criancas is
  'Lista JSON com idade de cada criança (0-17), pela ordem indicada no formulário.';
comment on column public.leads.pedido_animais_estimacao is
  'Preferência do cliente sobre viajar com animais de estimação (true/false/null = sem preferência).';

-- ---------------------------------------------------------------------
-- POSTS: preferências opcionais para cruzar com pedidos
-- ---------------------------------------------------------------------

alter table public.posts
  add column if not exists pets_allowed boolean,
  add column if not exists capacidade_min integer,
  add column if not exists capacidade_max integer;

alter table public.posts
  drop constraint if exists posts_capacidade_intervalo_check;
alter table public.posts
  add constraint posts_capacidade_intervalo_check
  check (
    capacidade_min is null
    or capacidade_max is null
    or capacidade_max >= capacidade_min
  );

comment on column public.posts.pets_allowed is
  'Se a opção alojamento/experiência normalmente aceita animais (true/false/null = não definido).';
comment on column public.posts.capacidade_min is
  'Capacidade mínima sugerida para o pacote/publicação (opcional).';
comment on column public.posts.capacidade_max is
  'Capacidade máxima sugerida para o pacote/publicação (opcional).';
