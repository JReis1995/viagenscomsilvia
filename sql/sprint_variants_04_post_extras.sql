-- Sprint Variants 04 — extras opcionais por publicação.

create table if not exists public.post_extras (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  ordem integer not null default 0,
  tipo text not null default 'custom' check (
    tipo in ('transfer', 'guia', 'seguro', 'experiencia', 'custom')
  ),
  nome text not null,
  descricao text,
  preco_delta_eur numeric(10,2),
  preco_label text,
  default_selected boolean not null default false,
  status boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists post_extras_post_ordem_idx
  on public.post_extras (post_id, ordem asc);

create index if not exists post_extras_post_status_idx
  on public.post_extras (post_id, status);

drop trigger if exists post_extras_set_updated_at on public.post_extras;
create trigger post_extras_set_updated_at
  before update on public.post_extras
  for each row execute function public.set_updated_at();

alter table public.post_extras enable row level security;

drop policy if exists "post_extras_anon_select_published" on public.post_extras;
drop policy if exists "post_extras_auth_select" on public.post_extras;
drop policy if exists "post_extras_insert_consultora" on public.post_extras;
drop policy if exists "post_extras_update_consultora" on public.post_extras;
drop policy if exists "post_extras_delete_consultora" on public.post_extras;

create policy "post_extras_anon_select_published"
  on public.post_extras for select to anon
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

create policy "post_extras_auth_select"
  on public.post_extras for select to authenticated
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

create policy "post_extras_insert_consultora"
  on public.post_extras for insert to authenticated
  with check (public.auth_email_matches_consultora_list());

create policy "post_extras_update_consultora"
  on public.post_extras for update to authenticated
  using (public.auth_email_matches_consultora_list())
  with check (public.auth_email_matches_consultora_list());

create policy "post_extras_delete_consultora"
  on public.post_extras for delete to authenticated
  using (public.auth_email_matches_consultora_list());

grant select on public.post_extras to anon, authenticated;
grant insert, update, delete on public.post_extras to authenticated;
