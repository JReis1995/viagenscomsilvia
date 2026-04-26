-- Seed de demonstração para CRM/publicações.
-- IMPORTANTE: registos marcados com "EXEMPLO — apagar" para limpeza manual após validação.
--
-- Ordem recomendada no SQL Editor (evita publicações invisíveis no site após seed):
--   sprint3_plan_features.sql (policy anon_select_published_posts)
--   → grant_posts_public_select.sql (GRANT SELECT posts para anon)
--   → sprint_ux_s2_feed_vibes.sql (colunas feed_vibe_slugs, hover_line, se ainda não existirem)
--   → este ficheiro (seed_demo_posts.sql)
--
-- Se o INSERT falhar, copia a mensagem de erro do SQL Editor — costuma ser coluna em falta
-- ou RLS a bloquear o INSERT (este script deve ser executado como postgres / service role).

insert into public.posts (
  id,
  tipo,
  titulo,
  descricao,
  media_url,
  preco_desde,
  link_cta,
  status,
  data_publicacao,
  ordem_site,
  membros_apenas,
  slug_destino,
  latitude,
  longitude,
  feed_vibe_slugs,
  hover_line
)
values
  (
    gen_random_uuid(),
    'promocao',
    'EXEMPLO — apagar | Maldivas 6 noites',
    'Resort 5* com pequeno-almoço e transfer incluído.',
    'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&w=1600&q=80',
    'desde 2 190 € por pessoa',
    null,
    true,
    (now() at time zone 'utc') - interval '2 days',
    10,
    false,
    'maldivas',
    3.2028,
    73.2207,
    array['praia', 'romance']::text[],
    'EXEMPLO — apagar | Água turquesa e villa sobre o mar.'
  ),
  (
    gen_random_uuid(),
    'inspiracao',
    'EXEMPLO — apagar | Zanzibar boutique',
    'Roteiro descontraído com praia, cultura local e pôr-do-sol no Índico.',
    'https://images.unsplash.com/photo-1577717903315-1691ae25ab3f?auto=format&fit=crop&w=1600&q=80',
    null,
    null,
    true,
    (now() at time zone 'utc') - interval '3 days',
    20,
    false,
    'zanzibar',
    -6.1659,
    39.2026,
    array['praia', 'retiro']::text[],
    'EXEMPLO — apagar | Ritmo leve e mar quente todo o ano.'
  ),
  (
    gen_random_uuid(),
    'video',
    'EXEMPLO — apagar | Dubai em família',
    'Vídeo de inspiração com hotéis family-friendly e experiências no deserto.',
    'https://www.youtube.com/watch?v=aqz-KE-bpKQ',
    'desde 1 450 € por pessoa',
    null,
    true,
    (now() at time zone 'utc') - interval '4 days',
    30,
    false,
    'dubai',
    25.2048,
    55.2708,
    array['familia', 'cidade']::text[],
    'EXEMPLO — apagar | Cidade, sol e experiências para todas as idades.'
  ),
  (
    gen_random_uuid(),
    'video',
    'EXEMPLO — apagar | Lua-de-mel no Índico',
    'Vídeo curto com hotéis e experiências românticas.',
    'https://samplelib.com/lib/preview/mp4/sample-5s.mp4',
    'desde 2 490 € por pessoa',
    null,
    true,
    (now() at time zone 'utc') - interval '5 days',
    40,
    false,
    'mauricias',
    -20.3484,
    57.5522,
    array['romance', 'lua-de-mel']::text[],
    'EXEMPLO — apagar | Ideal para viagem a dois.'
  );

-- Verificação (deve devolver as linhas inseridas, com status true e data no passado):
-- select id, titulo, status, data_publicacao, membros_apenas
-- from public.posts
-- where titulo ilike 'EXEMPLO%'
-- order by data_publicacao desc;
