-- Sprint UX 2 — Filtros por «vibe» no feed + frase poética no hover
-- Executar no Supabase SQL Editor após sprints anteriores.

alter table public.posts add column if not exists feed_vibe_slugs text[] not null default '{}';
alter table public.posts add column if not exists hover_line text;

comment on column public.posts.feed_vibe_slugs is
  'Slugs do filtro emocional no site (ex.: romance, retiro, adrenalina). Coincidir com os slugs configurados em site_content.feed.';
comment on column public.posts.hover_line is
  'Frase curta mostrada no hover do cartão (opcional).';
