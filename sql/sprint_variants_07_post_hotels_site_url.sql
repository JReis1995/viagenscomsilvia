-- Sprint Variants 07 — link externo opcional por hotel.

alter table public.post_hotels
  add column if not exists site_url text;

comment on column public.post_hotels.site_url is
  'URL opcional do site oficial do hotel (visível no CRM; pode ser usado em UIs públicas no futuro).';
