-- Sprint Variants 01 — extensão da tabela posts para suporte a variantes.
-- Executar antes das migrações 02..06.

alter table public.posts
  add column if not exists slug text,
  add column if not exists preco_base_eur numeric(10,2),
  add column if not exists has_variants boolean not null default false;

comment on column public.posts.slug is 'Slug SEO-friendly para rota /publicacoes/[slug].';
comment on column public.posts.preco_base_eur is 'Preço base em EUR para cálculo de variantes.';
comment on column public.posts.has_variants is 'Flag de rollout: true quando a publicação usa hotéis/extras/voos.';

-- Gera base de slug em kebab-case.
create or replace function public.slugify_text(input text)
returns text
language sql
immutable
as $$
  select nullif(
    trim(
      both '-' from regexp_replace(
        regexp_replace(lower(coalesce(input, '')), '[^a-z0-9]+', '-', 'g'),
        '-{2,}',
        '-',
        'g'
      )
    ),
    ''
  );
$$;

-- Backfill de slugs com resolução de colisões.
with base as (
  select
    p.id,
    coalesce(public.slugify_text(p.titulo), left(replace(p.id::text, '-', ''), 12)) as base_slug
  from public.posts p
),
ranked as (
  select
    b.id,
    b.base_slug,
    row_number() over (partition by b.base_slug order by b.id) as rn
  from base b
),
generated as (
  select
    r.id,
    case
      when r.rn = 1 then r.base_slug
      else r.base_slug || '-' || (r.rn - 1)::text
    end as final_slug
  from ranked r
)
update public.posts p
set slug = g.final_slug
from generated g
where p.id = g.id
  and (p.slug is null or btrim(p.slug) = '');

create unique index if not exists posts_slug_unique_idx
  on public.posts (lower(slug))
  where slug is not null and btrim(slug) <> '';

create index if not exists posts_has_variants_idx
  on public.posts (has_variants)
  where has_variants = true;
