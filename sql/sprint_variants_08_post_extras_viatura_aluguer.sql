-- Sprint Variants 08 — incluir tipo "viatura_aluguer" nos extras.

alter table public.post_extras
  drop constraint if exists post_extras_tipo_check;

alter table public.post_extras
  add constraint post_extras_tipo_check
  check (
    tipo in (
      'transfer',
      'guia',
      'seguro',
      'experiencia',
      'viatura_aluguer',
      'custom'
    )
  );
