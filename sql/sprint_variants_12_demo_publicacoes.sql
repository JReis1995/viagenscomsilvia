-- Sprint Variants 12 — atualizar publicações existentes + criar demos para a Sílvia.
-- Objetivo: ter exemplos reais no CRM com hotéis/extras/voos/quartos e pets_allowed.

begin;

-- 1) Atualizar publicações existentes (ajusta os slugs conforme os teus dados reais).
do $$
declare
  has_data_fim_publicacao boolean;
begin
  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'posts'
      and column_name = 'data_fim_publicacao'
  )
  into has_data_fim_publicacao;

  if has_data_fim_publicacao then
    execute $sql$
      update public.posts
      set
        has_variants = true,
        pets_allowed = coalesce(pets_allowed, true),
        data_fim_publicacao = null,
        updated_at = now()
      where slug in (
        'madeira-classica',
        'tailandia-lua-mel',
        'japao-outono'
      )
    $sql$;
  else
    execute $sql$
      update public.posts
      set
        has_variants = true,
        pets_allowed = coalesce(pets_allowed, true),
        updated_at = now()
      where slug in (
        'madeira-classica',
        'tailandia-lua-mel',
        'japao-outono'
      )
    $sql$;
  end if;
end $$;

-- 2) Limpar demos antigas (idempotente).
delete from public.posts
where slug in (
  'demo-pets-madeira-2026',
  'demo-cidade-family-2026',
  'demo-safari-tanzania-2026',
  'demo-neve-alpes-2026',
  'demo-capitais-leste-2026'
);

-- 3) Criar publicações de exemplo.
do $$
declare
  has_data_fim_publicacao boolean;
begin
  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'posts'
      and column_name = 'data_fim_publicacao'
  )
  into has_data_fim_publicacao;

  if has_data_fim_publicacao then
    execute $sql$
      insert into public.posts (
        tipo,
        slug,
        titulo,
        descricao,
        media_url,
        preco_desde,
        preco_base_eur,
        has_variants,
        link_cta,
        status,
        data_publicacao,
        data_fim_publicacao,
        ordem_site,
        membros_apenas,
        feed_vibe_slugs,
        hover_line,
        pets_allowed
      )
      values
        (
          'promocao',
          'demo-pets-madeira-2026',
          'Madeira Pet Friendly — Primavera 2026',
          'Exemplo de publicação com variantes completas para testar fluxo de hotéis, quartos, extras e voo.',
          'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1600&q=80',
          'desde 1 290 EUR',
          1290,
          true,
          null,
          true,
          now() - interval '2 day',
          null,
          20,
          false,
          array['natureza', 'praia', 'romance'],
          'Leva o teu animal contigo, sem complicações.',
          true
        ),
        (
          'inspiracao',
          'demo-cidade-family-2026',
          'City Break em Família — Outono 2026',
          'Exemplo de publicação com variantes para cenário familiar urbano.',
          'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=1600&q=80',
          'desde 890 EUR',
          890,
          true,
          null,
          true,
          now() - interval '1 day',
          null,
          21,
          false,
          array['cidade', 'familia'],
          'Plano flexível para famílias com crianças.',
          null
        ),
        (
          'promocao',
          'demo-safari-tanzania-2026',
          'Safari na Tanzânia — Verão 2026',
          'Demonstração com foco em natureza e experiências de safari.',
          'https://images.unsplash.com/photo-1516426122078-c23e76319801?w=1600&q=80',
          'desde 2 490 EUR',
          2490,
          true,
          null,
          true,
          now() - interval '20 hour',
          null,
          22,
          false,
          array['aventura', 'natureza'],
          'Game drives e lodge com vista para a savana.',
          null
        ),
        (
          'promocao',
          'demo-neve-alpes-2026',
          'Neve nos Alpes — Inverno 2026',
          'Demonstração para escapadinha de neve com hotel e voo.',
          'https://images.unsplash.com/photo-1551524164-6cf2ac7b2d29?w=1600&q=80',
          'desde 1 590 EUR',
          1590,
          true,
          null,
          true,
          now() - interval '16 hour',
          null,
          23,
          false,
          array['neve', 'montanha'],
          'Ideal para quem quer neve sem complicações.',
          null
        ),
        (
          'inspiracao',
          'demo-capitais-leste-2026',
          'Capitais de Leste — Primavera 2026',
          'Demonstração de circuito urbano com opções de voo.',
          'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1600&q=80',
          'desde 1 190 EUR',
          1190,
          true,
          null,
          true,
          now() - interval '12 hour',
          null,
          24,
          false,
          array['cidade', 'cultura'],
          'Praga, Viena e Budapeste no mesmo plano.',
          null
        )
    $sql$;
  else
    execute $sql$
      insert into public.posts (
        tipo,
        slug,
        titulo,
        descricao,
        media_url,
        preco_desde,
        preco_base_eur,
        has_variants,
        link_cta,
        status,
        data_publicacao,
        ordem_site,
        membros_apenas,
        feed_vibe_slugs,
        hover_line,
        pets_allowed
      )
      values
        (
          'promocao',
          'demo-pets-madeira-2026',
          'Madeira Pet Friendly — Primavera 2026',
          'Exemplo de publicação com variantes completas para testar fluxo de hotéis, quartos, extras e voo.',
          'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1600&q=80',
          'desde 1 290 EUR',
          1290,
          true,
          null,
          true,
          now() - interval '2 day',
          20,
          false,
          array['natureza', 'praia', 'romance'],
          'Leva o teu animal contigo, sem complicações.',
          true
        ),
        (
          'inspiracao',
          'demo-cidade-family-2026',
          'City Break em Família — Outono 2026',
          'Exemplo de publicação com variantes para cenário familiar urbano.',
          'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=1600&q=80',
          'desde 890 EUR',
          890,
          true,
          null,
          true,
          now() - interval '1 day',
          21,
          false,
          array['cidade', 'familia'],
          'Plano flexível para famílias com crianças.',
          null
        ),
        (
          'promocao',
          'demo-safari-tanzania-2026',
          'Safari na Tanzânia — Verão 2026',
          'Demonstração com foco em natureza e experiências de safari.',
          'https://images.unsplash.com/photo-1516426122078-c23e76319801?w=1600&q=80',
          'desde 2 490 EUR',
          2490,
          true,
          null,
          true,
          now() - interval '20 hour',
          22,
          false,
          array['aventura', 'natureza'],
          'Game drives e lodge com vista para a savana.',
          null
        ),
        (
          'promocao',
          'demo-neve-alpes-2026',
          'Neve nos Alpes — Inverno 2026',
          'Demonstração para escapadinha de neve com hotel e voo.',
          'https://images.unsplash.com/photo-1551524164-6cf2ac7b2d29?w=1600&q=80',
          'desde 1 590 EUR',
          1590,
          true,
          null,
          true,
          now() - interval '16 hour',
          23,
          false,
          array['neve', 'montanha'],
          'Ideal para quem quer neve sem complicações.',
          null
        ),
        (
          'inspiracao',
          'demo-capitais-leste-2026',
          'Capitais de Leste — Primavera 2026',
          'Demonstração de circuito urbano com opções de voo.',
          'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1600&q=80',
          'desde 1 190 EUR',
          1190,
          true,
          null,
          true,
          now() - interval '12 hour',
          24,
          false,
          array['cidade', 'cultura'],
          'Praga, Viena e Budapeste no mesmo plano.',
          null
        )
    $sql$;
  end if;
end $$;

with inserted_posts as (
  select p.id, p.slug
  from public.posts p
  where p.slug in ('demo-pets-madeira-2026', 'demo-cidade-family-2026')
),
madeira as (
  select id as post_id from inserted_posts where slug = 'demo-pets-madeira-2026'
),
cidade as (
  select id as post_id from inserted_posts where slug = 'demo-cidade-family-2026'
),
hotels as (
  insert into public.post_hotels (
    post_id,
    ordem,
    nome,
    descricao,
    regime,
    condicoes,
    preco_delta_eur,
    preco_label,
    pets_allowed,
    status
  )
  select
    m.post_id,
    0,
    'Hotel Jardim Atlântico',
    'Hotel de natureza com trilhos e áreas verdes.',
    'Pequeno-almoço',
    'Pet kit de boas-vindas incluído.',
    0,
    'Incluído no preço base',
    true,
    true
  from madeira m
  union all
  select
    m.post_id,
    1,
    'Resort Funchal Premium',
    'Resort com spa e vista mar.',
    'Meia pensão',
    'Aceita animais até 12kg.',
    220,
    '+220 EUR',
    true,
    true
  from madeira m
  union all
  select
    c.post_id,
    0,
    'Urban Suites Centro',
    'Hotel central para famílias.',
    'Só alojamento',
    'Sem animais nas áreas comuns.',
    0,
    'Incluído no preço base',
    false,
    true
  from cidade c
  returning id, post_id, nome
)
insert into public.post_hotel_room_options (
  hotel_id,
  ordem,
  nome,
  capacidade_adultos,
  capacidade_criancas,
  preco_delta_eur,
  preco_label,
  status
)
select
  h.id,
  0,
  'Duplo Standard',
  2,
  0,
  0,
  'Base',
  true
from hotels h
union all
select
  h.id,
  1,
  'Familiar',
  2,
  2,
  150,
  '+150 EUR',
  true
from hotels h;

-- Media dos hotéis (imagens de demonstração).
with hotel_targets as (
  select
    h.id as hotel_id,
    p.slug as post_slug,
    h.nome as hotel_nome
  from public.post_hotels h
  join public.posts p on p.id = h.post_id
  where p.slug in ('demo-pets-madeira-2026', 'demo-cidade-family-2026')
)
insert into public.post_hotel_media (
  hotel_id,
  ordem,
  kind,
  url,
  alt
)
select
  ht.hotel_id,
  0,
  'image',
  case
    when ht.hotel_nome = 'Hotel Jardim Atlântico'
      then 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1600&q=80'
    when ht.hotel_nome = 'Resort Funchal Premium'
      then 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=1600&q=80'
    else 'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=1600&q=80'
  end,
  case
    when ht.hotel_nome = 'Hotel Jardim Atlântico'
      then 'Vista exterior do Hotel Jardim Atlântico'
    when ht.hotel_nome = 'Resort Funchal Premium'
      then 'Piscina e zona lounge do Resort Funchal Premium'
    else 'Fachada do Urban Suites Centro'
  end
from hotel_targets ht
union all
select
  ht.hotel_id,
  1,
  'image',
  case
    when ht.hotel_nome = 'Hotel Jardim Atlântico'
      then 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=1600&q=80'
    when ht.hotel_nome = 'Resort Funchal Premium'
      then 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1600&q=80'
    else 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1600&q=80'
  end,
  case
    when ht.hotel_nome = 'Hotel Jardim Atlântico'
      then 'Quarto duplo com varanda no Hotel Jardim Atlântico'
    when ht.hotel_nome = 'Resort Funchal Premium'
      then 'Suite com vista mar no Resort Funchal Premium'
    else 'Quarto familiar no Urban Suites Centro'
  end
from hotel_targets ht
union all
select
  ht.hotel_id,
  2,
  'video',
  case
    when ht.hotel_nome = 'Hotel Jardim Atlântico'
      then 'https://www.w3schools.com/html/mov_bbb.mp4'
    when ht.hotel_nome = 'Resort Funchal Premium'
      then 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4'
    else 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4'
  end,
  case
    when ht.hotel_nome = 'Hotel Jardim Atlântico'
      then 'Vídeo de ambiente do Hotel Jardim Atlântico'
    when ht.hotel_nome = 'Resort Funchal Premium'
      then 'Vídeo de ambiente do Resort Funchal Premium'
    else 'Vídeo de ambiente do Urban Suites Centro'
  end
from hotel_targets ht;

-- Extras de demo
with madeira as (
  select id as post_id
  from public.posts
  where slug = 'demo-pets-madeira-2026'
),
cidade as (
  select id as post_id
  from public.posts
  where slug = 'demo-cidade-family-2026'
)
insert into public.post_extras (
  post_id,
  ordem,
  tipo,
  nome,
  descricao,
  preco_delta_eur,
  preco_label,
  pets_allowed,
  default_selected,
  status
)
select
  m.post_id,
  0,
  'transfer',
  'Transfer aeroporto-hotel',
  'Transfer privado ida e volta.',
  80,
  '+80 EUR',
  true,
  true,
  true
from madeira m
union all
select
  m.post_id,
  1,
  'seguro',
  'Seguro viagem premium',
  'Cobertura extra para bagagem e assistência.',
  45,
  '+45 EUR',
  true,
  false,
  true
from madeira m
union all
select
  c.post_id,
  0,
  'experiencia',
  'Passe city pass 48h',
  'Transportes + entradas em museus.',
  55,
  '+55 EUR',
  false,
  false,
  true
from cidade c;

-- Voos de demo
with madeira as (
  select id as post_id
  from public.posts
  where slug = 'demo-pets-madeira-2026'
),
cidade as (
  select id as post_id
  from public.posts
  where slug = 'demo-cidade-family-2026'
)
insert into public.post_flight_options (
  post_id,
  ordem,
  label,
  origem_iata,
  destino_iata,
  data_partida,
  data_regresso,
  cia,
  classe,
  bagagem_text,
  descricao,
  preco_delta_eur,
  preco_label,
  pets_allowed,
  status
)
select
  m.post_id,
  0,
  'Lisboa -> Funchal (horário manhã)',
  'LIS',
  'FNC',
  (current_date + 45),
  (current_date + 52),
  'TAP',
  'economy',
  '1 mala cabine + 1 item pessoal',
  'Opção recomendada para check-in cedo.',
  210,
  '+210 EUR',
  true,
  true
from madeira m
union all
select
  c.post_id,
  0,
  'Porto -> Barcelona (direto)',
  'OPO',
  'BCN',
  (current_date + 30),
  (current_date + 34),
  'Vueling',
  'economy',
  'Bagagem de mão incluída',
  'Voo direto para escapadinha familiar.',
  180,
  '+180 EUR',
  false,
  true
from cidade c;

-- 4) Mais 3 viagens demo (hotel + quartos + media + extras + voos).
with inserted_posts as (
  select p.id, p.slug
  from public.posts p
  where p.slug in (
    'demo-safari-tanzania-2026',
    'demo-neve-alpes-2026',
    'demo-capitais-leste-2026'
  )
),
safari as (
  select id as post_id from inserted_posts where slug = 'demo-safari-tanzania-2026'
),
neve as (
  select id as post_id from inserted_posts where slug = 'demo-neve-alpes-2026'
),
capitais as (
  select id as post_id from inserted_posts where slug = 'demo-capitais-leste-2026'
),
hotels as (
  insert into public.post_hotels (
    post_id,
    ordem,
    nome,
    descricao,
    regime,
    condicoes,
    preco_delta_eur,
    preco_label,
    pets_allowed,
    status
  )
  select
    s.post_id,
    0,
    'Savanna Lodge Experience',
    'Lodge com vista para a savana e safaris guiados.',
    'Pensão completa',
    'Inclui dois game drives por dia.',
    0,
    'Incluído no preço base',
    false,
    true
  from safari s
  union all
  select
    n.post_id,
    0,
    'Alpine Snow Resort',
    'Hotel de montanha perto das pistas.',
    'Meia pensão',
    'Transfer diário para a estância.',
    0,
    'Incluído no preço base',
    false,
    true
  from neve n
  union all
  select
    c.post_id,
    0,
    'Grand City Central Hotel',
    'Hotel central para circuito nas capitais.',
    'Pequeno-almoço',
    'Walking tour de boas-vindas incluído.',
    0,
    'Incluído no preço base',
    null,
    true
  from capitais c
  returning id, post_id, nome
)
insert into public.post_hotel_room_options (
  hotel_id,
  ordem,
  nome,
  capacidade_adultos,
  capacidade_criancas,
  preco_delta_eur,
  preco_label,
  status
)
select h.id, 0, 'Duplo Conforto', 2, 0, 0, 'Base', true
from hotels h
union all
select h.id, 1, 'Suite Premium', 2, 1, 260, '+260 EUR', true
from hotels h;

with hotel_targets as (
  select
    h.id as hotel_id,
    h.nome as hotel_nome
  from public.post_hotels h
  join public.posts p on p.id = h.post_id
  where p.slug in (
    'demo-safari-tanzania-2026',
    'demo-neve-alpes-2026',
    'demo-capitais-leste-2026'
  )
)
insert into public.post_hotel_media (
  hotel_id,
  ordem,
  kind,
  url,
  alt
)
select
  ht.hotel_id,
  0,
  'image',
  case
    when ht.hotel_nome = 'Savanna Lodge Experience'
      then 'https://images.unsplash.com/photo-1549366021-9f761d040a94?w=1600&q=80'
    when ht.hotel_nome = 'Alpine Snow Resort'
      then 'https://images.unsplash.com/photo-1605540436563-5bca919ae766?w=1600&q=80'
    else 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1600&q=80'
  end,
  case
    when ht.hotel_nome = 'Savanna Lodge Experience'
      then 'Exterior do Savanna Lodge Experience'
    when ht.hotel_nome = 'Alpine Snow Resort'
      then 'Exterior nevado do Alpine Snow Resort'
    else 'Lobby do Grand City Central Hotel'
  end
from hotel_targets ht
union all
select
  ht.hotel_id,
  1,
  'video',
  case
    when ht.hotel_nome = 'Savanna Lodge Experience'
      then 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
    when ht.hotel_nome = 'Alpine Snow Resort'
      then 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4'
    else 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4'
  end,
  case
    when ht.hotel_nome = 'Savanna Lodge Experience'
      then 'Vídeo de ambiente do Savanna Lodge Experience'
    when ht.hotel_nome = 'Alpine Snow Resort'
      then 'Vídeo de ambiente do Alpine Snow Resort'
    else 'Vídeo de ambiente do Grand City Central Hotel'
  end
from hotel_targets ht;

with safari as (
  select id as post_id from public.posts where slug = 'demo-safari-tanzania-2026'
),
neve as (
  select id as post_id from public.posts where slug = 'demo-neve-alpes-2026'
),
capitais as (
  select id as post_id from public.posts where slug = 'demo-capitais-leste-2026'
)
insert into public.post_extras (
  post_id,
  ordem,
  tipo,
  nome,
  descricao,
  preco_delta_eur,
  preco_label,
  pets_allowed,
  default_selected,
  status
)
select s.post_id, 0, 'experiencia', 'Safari jeep 4x4', 'Saída ao nascer do sol com guia.', 180, '+180 EUR', false, true, true
from safari s
union all
select n.post_id, 0, 'seguro', 'Seguro neve premium', 'Cobertura para atividades de inverno.', 65, '+65 EUR', false, false, true
from neve n
union all
select c.post_id, 0, 'transfer', 'Transfer entre cidades', 'Comboio/transfer entre capitais incluído.', 120, '+120 EUR', null, false, true
from capitais c;

with safari as (
  select id as post_id from public.posts where slug = 'demo-safari-tanzania-2026'
),
neve as (
  select id as post_id from public.posts where slug = 'demo-neve-alpes-2026'
),
capitais as (
  select id as post_id from public.posts where slug = 'demo-capitais-leste-2026'
)
insert into public.post_flight_options (
  post_id,
  ordem,
  label,
  origem_iata,
  destino_iata,
  data_partida,
  data_regresso,
  cia,
  classe,
  bagagem_text,
  descricao,
  preco_delta_eur,
  preco_label,
  pets_allowed,
  status
)
select
  s.post_id,
  0,
  'Lisboa -> Kilimanjaro (1 escala)',
  'LIS',
  'JRO',
  (current_date + 60),
  (current_date + 68),
  'Qatar Airways',
  'economy',
  'Mala cabine + mala porão 23kg',
  'Chegada no dia anterior ao primeiro safari.',
  690,
  '+690 EUR',
  false,
  true
from safari s
union all
select
  n.post_id,
  0,
  'Porto -> Genebra (direto)',
  'OPO',
  'GVA',
  (current_date + 50),
  (current_date + 57),
  'easyJet',
  'economy',
  'Bagagem de mão incluída',
  'Voo ideal para semana de neve.',
  240,
  '+240 EUR',
  false,
  true
from neve n
union all
select
  c.post_id,
  0,
  'Lisboa -> Praga | Budapeste -> Lisboa',
  'LIS',
  'PRG',
  (current_date + 40),
  (current_date + 47),
  'TAP',
  'economy',
  'Mala cabine incluída',
  'Open-jaw para otimizar o circuito.',
  320,
  '+320 EUR',
  null,
  true
from capitais c;

commit;
