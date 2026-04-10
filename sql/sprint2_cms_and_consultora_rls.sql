-- Sprint 2 — Várias consultoras + CMS do site
-- Executar no Supabase SQL Editor após sprint1_client_portal_rls.sql
--
-- 1) consultora_email em configuracoes_globais pode ter VÁRIOS emails separados por vírgula
--    (ex.: silvia@dominio.pt,jose.reis@flowly.pt). Deve coincidir com os emails em Auth e com CONSULTORA_EMAIL na app.
-- 2) Tabela site_content (singleton id=default) — textos/URLs editáveis no CRM (/crm/site).
-- 3) Coluna posts.ordem_site — número menor aparece primeiro no feed (agenda: data_publicacao + status).

create or replace function public.auth_email_matches_consultora_list()
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select exists (
    select 1
    from public.configuracoes_globais cg
    cross join lateral unnest(
      string_to_array(coalesce(cg.consultora_email, ''), ',')
    ) as parts(raw_part)
    where nullif(btrim(parts.raw_part), '') is not null
      and lower(btrim(parts.raw_part)) = lower(btrim(coalesce(auth.jwt() ->> 'email', '')))
  );
$$;

-- --- Leads + lead_client_updates: substituir match de um único email pela lista ---

drop policy if exists "leads_select_consultora_cfg" on public.leads;
drop policy if exists "leads_update_consultora_cfg" on public.leads;
drop policy if exists "leads_delete_consultora_cfg" on public.leads;
drop policy if exists "lcu_select_consultora_or_author" on public.lead_client_updates;

create policy "leads_select_consultora_cfg"
  on public.leads for select to authenticated
  using (public.auth_email_matches_consultora_list());

create policy "leads_update_consultora_cfg"
  on public.leads for update to authenticated
  using (public.auth_email_matches_consultora_list())
  with check (public.auth_email_matches_consultora_list());

create policy "leads_delete_consultora_cfg"
  on public.leads for delete to authenticated
  using (public.auth_email_matches_consultora_list());

create policy "lcu_select_consultora_or_author"
  on public.lead_client_updates for select to authenticated
  using (
    user_id = auth.uid()
    or public.auth_email_matches_consultora_list()
  );

-- --- Posts: ordem no site + RLS (só consultoras gerem; clientes autenticados só veem publicados) ---

alter table public.posts add column if not exists ordem_site integer not null default 0;

create index if not exists posts_feed_order_idx
  on public.posts (ordem_site asc, data_publicacao desc)
  where status = true;

drop policy if exists "authenticated_select_all_posts" on public.posts;
drop policy if exists "authenticated_insert_posts" on public.posts;
drop policy if exists "authenticated_update_posts" on public.posts;
drop policy if exists "authenticated_delete_posts" on public.posts;

create policy "authenticated_select_posts_consultora_or_published"
  on public.posts for select to authenticated
  using (
    (status = true and data_publicacao <= now())
    or public.auth_email_matches_consultora_list()
  );

create policy "authenticated_insert_posts_consultora"
  on public.posts for insert to authenticated
  with check (public.auth_email_matches_consultora_list());

create policy "authenticated_update_posts_consultora"
  on public.posts for update to authenticated
  using (public.auth_email_matches_consultora_list())
  with check (public.auth_email_matches_consultora_list());

create policy "authenticated_delete_posts_consultora"
  on public.posts for delete to authenticated
  using (public.auth_email_matches_consultora_list());

-- --- Conteúdo editorial do site (textos / URLs) ---

create table if not exists public.site_content (
  id text primary key,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

insert into public.site_content (id, payload)
values ('default', '{}'::jsonb)
on conflict (id) do nothing;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists site_content_set_updated_at on public.site_content;
create trigger site_content_set_updated_at
  before update on public.site_content
  for each row execute function public.set_updated_at();

alter table public.site_content enable row level security;

drop policy if exists "anon_select_site_content" on public.site_content;
drop policy if exists "authenticated_select_site_content" on public.site_content;
drop policy if exists "site_content_update_consultora" on public.site_content;

create policy "anon_select_site_content"
  on public.site_content for select to anon
  using (id = 'default');

create policy "authenticated_select_site_content"
  on public.site_content for select to authenticated
  using (id = 'default');

create policy "site_content_update_consultora"
  on public.site_content for update to authenticated
  using (public.auth_email_matches_consultora_list())
  with check (id = 'default' and public.auth_email_matches_consultora_list());

drop policy if exists "site_content_insert_consultora" on public.site_content;

create policy "site_content_insert_consultora"
  on public.site_content for insert to authenticated
  with check (id = 'default' and public.auth_email_matches_consultora_list());

grant select on public.site_content to anon, authenticated;
grant insert, update on public.site_content to authenticated;
