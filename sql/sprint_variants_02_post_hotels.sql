-- Sprint Variants 02 — hotéis por publicação.

create table if not exists public.post_hotels (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  ordem integer not null default 0,
  nome text not null,
  descricao text,
  regime text,
  condicoes text,
  preco_delta_eur numeric(10,2),
  preco_label text,
  capacidade_min integer,
  capacidade_max integer,
  pets_allowed boolean,
  status boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint post_hotels_capacity_check check (
    capacidade_min is null
    or capacidade_max is null
    or capacidade_max >= capacidade_min
  )
);

create index if not exists post_hotels_post_ordem_idx
  on public.post_hotels (post_id, ordem asc);

create index if not exists post_hotels_post_status_idx
  on public.post_hotels (post_id, status);

drop trigger if exists post_hotels_set_updated_at on public.post_hotels;
create trigger post_hotels_set_updated_at
  before update on public.post_hotels
  for each row execute function public.set_updated_at();

alter table public.post_hotels enable row level security;

drop policy if exists "post_hotels_anon_select_published" on public.post_hotels;
drop policy if exists "post_hotels_auth_select" on public.post_hotels;
drop policy if exists "post_hotels_insert_consultora" on public.post_hotels;
drop policy if exists "post_hotels_update_consultora" on public.post_hotels;
drop policy if exists "post_hotels_delete_consultora" on public.post_hotels;

create policy "post_hotels_anon_select_published"
  on public.post_hotels for select to anon
  using (
    status = true
    and exists (
      select 1
      from public.posts p
      where p.id = post_id
        and p.status = true
        and p.data_publicacao <= now()
        and coalesce(p.membros_apenas, false) = false
    )
  );

create policy "post_hotels_auth_select"
  on public.post_hotels for select to authenticated
  using (
    public.auth_email_matches_consultora_list()
    or (
      status = true
      and exists (
        select 1
        from public.posts p
        where p.id = post_id
          and p.status = true
          and p.data_publicacao <= now()
      )
    )
  );

create policy "post_hotels_insert_consultora"
  on public.post_hotels for insert to authenticated
  with check (public.auth_email_matches_consultora_list());

create policy "post_hotels_update_consultora"
  on public.post_hotels for update to authenticated
  using (public.auth_email_matches_consultora_list())
  with check (public.auth_email_matches_consultora_list());

create policy "post_hotels_delete_consultora"
  on public.post_hotels for delete to authenticated
  using (public.auth_email_matches_consultora_list());

grant select on public.post_hotels to anon, authenticated;
grant insert, update, delete on public.post_hotels to authenticated;
