-- Sprint 3 — Decisões do cliente, wishlist, alertas promo, posts (mapa + membros), prefs
-- Executar no Supabase SQL Editor após sprint2_cms_and_consultora_rls.sql

-- --- Decisões sobre orçamento (aprovar / pedir alterações) ---

create table if not exists public.lead_client_decisions (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads (id) on delete cascade,
  user_id uuid not null,
  decision text not null,
  note text,
  created_at timestamptz not null default now(),
  constraint lead_client_decisions_decision_check check (
    decision in ('approved', 'changes_requested')
  ),
  constraint lead_client_decisions_note_len check (
    note is null or char_length(trim(note)) <= 4000
  )
);

create index if not exists lead_client_decisions_lead_id_idx
  on public.lead_client_decisions (lead_id);

create index if not exists lead_client_decisions_created_at_idx
  on public.lead_client_decisions (created_at desc);

alter table public.lead_client_decisions enable row level security;

drop policy if exists "lcd_select_own_or_consultora" on public.lead_client_decisions;
drop policy if exists "lcd_insert_own_lead" on public.lead_client_decisions;

create policy "lcd_select_own_or_consultora"
  on public.lead_client_decisions for select to authenticated
  using (
    user_id = auth.uid()
    or public.auth_email_matches_consultora_list()
  );

create policy "lcd_insert_own_lead"
  on public.lead_client_decisions for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1
      from public.leads l
      where l.id = lead_id
        and lower(btrim(coalesce(l.email, ''))) = lower(btrim(coalesce(auth.jwt() ->> 'email', '')))
    )
  );

grant select, insert on public.lead_client_decisions to authenticated;

-- --- Wishlist (destinos / posts guardados) ---

create table if not exists public.wishlist_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  post_id uuid references public.posts (id) on delete cascade,
  destino_label text,
  created_at timestamptz not null default now(),
  constraint wishlist_post_or_destino check (
    post_id is not null
    or (destino_label is not null and length(btrim(destino_label)) > 0)
  )
);

create index if not exists wishlist_items_user_id_idx on public.wishlist_items (user_id);

create unique index if not exists wishlist_items_user_post_unique
  on public.wishlist_items (user_id, post_id)
  where post_id is not null;

alter table public.wishlist_items enable row level security;

drop policy if exists "wishlist_select_own" on public.wishlist_items;
drop policy if exists "wishlist_insert_own" on public.wishlist_items;
drop policy if exists "wishlist_delete_own" on public.wishlist_items;

create policy "wishlist_select_own"
  on public.wishlist_items for select to authenticated
  using (user_id = auth.uid());

create policy "wishlist_insert_own"
  on public.wishlist_items for insert to authenticated
  with check (user_id = auth.uid());

create policy "wishlist_delete_own"
  on public.wishlist_items for delete to authenticated
  using (user_id = auth.uid());

grant select, insert, delete on public.wishlist_items to authenticated;

-- --- Preferências de alertas de promoções (RGPD: opt-in explícito) ---

create table if not exists public.promo_alert_prefs (
  user_id uuid primary key,
  email text not null,
  opt_in boolean not null default false,
  updated_at timestamptz not null default now(),
  constraint promo_alert_prefs_email_nonempty check (char_length(btrim(email)) > 0)
);

alter table public.promo_alert_prefs enable row level security;

drop policy if exists "pap_select_own" on public.promo_alert_prefs;
drop policy if exists "pap_insert_own" on public.promo_alert_prefs;
drop policy if exists "pap_update_own" on public.promo_alert_prefs;

create policy "pap_select_own"
  on public.promo_alert_prefs for select to authenticated
  using (user_id = auth.uid());

create policy "pap_insert_own"
  on public.promo_alert_prefs for insert to authenticated
  with check (user_id = auth.uid());

create policy "pap_update_own"
  on public.promo_alert_prefs for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

grant select, insert, update on public.promo_alert_prefs to authenticated;

-- --- Posts: mapa + conteúdo só para registados ---

alter table public.posts add column if not exists membros_apenas boolean not null default false;
alter table public.posts add column if not exists slug_destino text;
alter table public.posts add column if not exists latitude double precision;
alter table public.posts add column if not exists longitude double precision;

create index if not exists posts_map_coords_idx
  on public.posts (latitude, longitude)
  where status = true
    and latitude is not null
    and longitude is not null
    and membros_apenas = false;

comment on column public.posts.membros_apenas is 'Se true, só utilizadores autenticados (não anónimos) veem no site.';
comment on column public.posts.slug_destino is 'Chave opcional para cruzar com propostas (ex.: maldivas).';

-- Anónimos: publicações públicas apenas (sem conteúdo exclusivo de membros)

drop policy if exists "anon_select_published_posts" on public.posts;

create policy "anon_select_published_posts"
  on public.posts for select to anon
  using (
    status = true
    and data_publicacao <= now()
    and coalesce(membros_apenas, false) = false
  );
