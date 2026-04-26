-- Sprint Variants 11 — pets_allowed por variante (extras e voo).

alter table public.post_extras
  add column if not exists pets_allowed boolean;

alter table public.post_flight_options
  add column if not exists pets_allowed boolean;

comment on column public.post_extras.pets_allowed is
  'Se true, extra permite animais; false não permite; null = indiferente/não definido.';

comment on column public.post_flight_options.pets_allowed is
  'Se true, voo permite animais; false não permite; null = indiferente/não definido.';
