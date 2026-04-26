-- Sprint Variants 05 — opções de voo por publicação.

create table if not exists public.post_flight_options (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  ordem integer not null default 0,
  label text not null,
  origem_iata text,
  destino_iata text,
  data_partida date,
  data_regresso date,
  cia text,
  classe text check (classe in ('economy', 'premium_economy', 'business', 'first')),
  bagagem_text text,
  descricao text,
  preco_delta_eur numeric(10,2),
  preco_label text,
  status boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint post_flight_options_iata_check check (
    (origem_iata is null or origem_iata ~ '^[A-Z]{3}$')
    and (destino_iata is null or destino_iata ~ '^[A-Z]{3}$')
  )
);

create index if not exists post_flight_options_post_ordem_idx
  on public.post_flight_options (post_id, ordem asc);

create index if not exists post_flight_options_post_status_idx
  on public.post_flight_options (post_id, status);

drop trigger if exists post_flight_options_set_updated_at on public.post_flight_options;
create trigger post_flight_options_set_updated_at
  before update on public.post_flight_options
  for each row execute function public.set_updated_at();

alter table public.post_flight_options enable row level security;

drop policy if exists "post_flight_options_anon_select_published" on public.post_flight_options;
drop policy if exists "post_flight_options_auth_select" on public.post_flight_options;
drop policy if exists "post_flight_options_insert_consultora" on public.post_flight_options;
drop policy if exists "post_flight_options_update_consultora" on public.post_flight_options;
drop policy if exists "post_flight_options_delete_consultora" on public.post_flight_options;

create policy "post_flight_options_anon_select_published"
  on public.post_flight_options for select to anon
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

create policy "post_flight_options_auth_select"
  on public.post_flight_options for select to authenticated
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

create policy "post_flight_options_insert_consultora"
  on public.post_flight_options for insert to authenticated
  with check (public.auth_email_matches_consultora_list());

create policy "post_flight_options_update_consultora"
  on public.post_flight_options for update to authenticated
  using (public.auth_email_matches_consultora_list())
  with check (public.auth_email_matches_consultora_list());

create policy "post_flight_options_delete_consultora"
  on public.post_flight_options for delete to authenticated
  using (public.auth_email_matches_consultora_list());

grant select on public.post_flight_options to anon, authenticated;
grant insert, update, delete on public.post_flight_options to authenticated;
