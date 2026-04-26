-- Sprint Variants 09 — Fase 3 (sazonalidade, disponibilidade, quartos e eventos).

create table if not exists public.post_hotel_seasons (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null references public.post_hotels (id) on delete cascade,
  ordem integer not null default 0,
  label text not null,
  start_month_day text not null check (start_month_day ~ '^(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$'),
  end_month_day text not null check (end_month_day ~ '^(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$'),
  preco_delta_eur numeric(10,2),
  preco_label text,
  status boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists post_hotel_seasons_hotel_ordem_idx
  on public.post_hotel_seasons (hotel_id, ordem asc);

drop trigger if exists post_hotel_seasons_set_updated_at on public.post_hotel_seasons;
create trigger post_hotel_seasons_set_updated_at
  before update on public.post_hotel_seasons
  for each row execute function public.set_updated_at();

alter table public.post_hotel_seasons enable row level security;

drop policy if exists "post_hotel_seasons_anon_select_published" on public.post_hotel_seasons;
drop policy if exists "post_hotel_seasons_auth_select" on public.post_hotel_seasons;
drop policy if exists "post_hotel_seasons_write_consultora" on public.post_hotel_seasons;

create policy "post_hotel_seasons_anon_select_published"
  on public.post_hotel_seasons for select to anon
  using (
    status = true
    and exists (
      select 1
      from public.post_hotels h
      join public.posts p on p.id = h.post_id
      where h.id = hotel_id
        and h.status = true
        and p.status = true
        and p.data_publicacao <= now()
        and coalesce(p.membros_apenas, false) = false
    )
  );

create policy "post_hotel_seasons_auth_select"
  on public.post_hotel_seasons for select to authenticated
  using (
    public.auth_email_matches_consultora_list()
    or (
      status = true
      and exists (
        select 1
        from public.post_hotels h
        join public.posts p on p.id = h.post_id
        where h.id = hotel_id
          and h.status = true
          and p.status = true
          and p.data_publicacao <= now()
      )
    )
  );

create policy "post_hotel_seasons_write_consultora"
  on public.post_hotel_seasons for all to authenticated
  using (public.auth_email_matches_consultora_list())
  with check (public.auth_email_matches_consultora_list());

grant select on public.post_hotel_seasons to anon, authenticated;
grant insert, update, delete on public.post_hotel_seasons to authenticated;

create table if not exists public.post_hotel_availability (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null references public.post_hotels (id) on delete cascade,
  data_inicio date not null,
  data_fim date not null,
  disponivel boolean not null default true,
  quartos_disponiveis integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint post_hotel_availability_dates_check check (data_fim >= data_inicio),
  constraint post_hotel_availability_rooms_check check (quartos_disponiveis is null or quartos_disponiveis >= 0)
);

create index if not exists post_hotel_availability_hotel_dates_idx
  on public.post_hotel_availability (hotel_id, data_inicio, data_fim);

drop trigger if exists post_hotel_availability_set_updated_at on public.post_hotel_availability;
create trigger post_hotel_availability_set_updated_at
  before update on public.post_hotel_availability
  for each row execute function public.set_updated_at();

alter table public.post_hotel_availability enable row level security;

drop policy if exists "post_hotel_availability_anon_select_published" on public.post_hotel_availability;
drop policy if exists "post_hotel_availability_auth_select" on public.post_hotel_availability;
drop policy if exists "post_hotel_availability_write_consultora" on public.post_hotel_availability;

create policy "post_hotel_availability_anon_select_published"
  on public.post_hotel_availability for select to anon
  using (
    exists (
      select 1
      from public.post_hotels h
      join public.posts p on p.id = h.post_id
      where h.id = hotel_id
        and h.status = true
        and p.status = true
        and p.data_publicacao <= now()
        and coalesce(p.membros_apenas, false) = false
    )
  );

create policy "post_hotel_availability_auth_select"
  on public.post_hotel_availability for select to authenticated
  using (
    public.auth_email_matches_consultora_list()
    or exists (
      select 1
      from public.post_hotels h
      join public.posts p on p.id = h.post_id
      where h.id = hotel_id
        and h.status = true
        and p.status = true
        and p.data_publicacao <= now()
    )
  );

create policy "post_hotel_availability_write_consultora"
  on public.post_hotel_availability for all to authenticated
  using (public.auth_email_matches_consultora_list())
  with check (public.auth_email_matches_consultora_list());

grant select on public.post_hotel_availability to anon, authenticated;
grant insert, update, delete on public.post_hotel_availability to authenticated;

create table if not exists public.post_hotel_room_options (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null references public.post_hotels (id) on delete cascade,
  ordem integer not null default 0,
  nome text not null,
  capacidade_adultos integer,
  capacidade_criancas integer,
  preco_delta_eur numeric(10,2),
  preco_label text,
  status boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists post_hotel_room_options_hotel_ordem_idx
  on public.post_hotel_room_options (hotel_id, ordem asc);

drop trigger if exists post_hotel_room_options_set_updated_at on public.post_hotel_room_options;
create trigger post_hotel_room_options_set_updated_at
  before update on public.post_hotel_room_options
  for each row execute function public.set_updated_at();

alter table public.post_hotel_room_options enable row level security;

drop policy if exists "post_hotel_room_options_anon_select_published" on public.post_hotel_room_options;
drop policy if exists "post_hotel_room_options_auth_select" on public.post_hotel_room_options;
drop policy if exists "post_hotel_room_options_write_consultora" on public.post_hotel_room_options;

create policy "post_hotel_room_options_anon_select_published"
  on public.post_hotel_room_options for select to anon
  using (
    status = true
    and exists (
      select 1
      from public.post_hotels h
      join public.posts p on p.id = h.post_id
      where h.id = hotel_id
        and h.status = true
        and p.status = true
        and p.data_publicacao <= now()
        and coalesce(p.membros_apenas, false) = false
    )
  );

create policy "post_hotel_room_options_auth_select"
  on public.post_hotel_room_options for select to authenticated
  using (
    public.auth_email_matches_consultora_list()
    or (
      status = true
      and exists (
        select 1
        from public.post_hotels h
        join public.posts p on p.id = h.post_id
        where h.id = hotel_id
          and h.status = true
          and p.status = true
          and p.data_publicacao <= now()
      )
    )
  );

create policy "post_hotel_room_options_write_consultora"
  on public.post_hotel_room_options for all to authenticated
  using (public.auth_email_matches_consultora_list())
  with check (public.auth_email_matches_consultora_list());

grant select on public.post_hotel_room_options to anon, authenticated;
grant insert, update, delete on public.post_hotel_room_options to authenticated;

create table if not exists public.lead_post_choice_events (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.leads (id) on delete set null,
  post_id uuid not null references public.posts (id) on delete cascade,
  event_name text not null,
  hotel_id uuid references public.post_hotels (id) on delete set null,
  flight_option_id uuid references public.post_flight_options (id) on delete set null,
  extra_id uuid references public.post_extras (id) on delete set null,
  session_key text,
  event_payload jsonb,
  created_at timestamptz not null default now()
);

create index if not exists lead_post_choice_events_post_idx
  on public.lead_post_choice_events (post_id, created_at desc);
create index if not exists lead_post_choice_events_hotel_idx
  on public.lead_post_choice_events (hotel_id, created_at desc);
create index if not exists lead_post_choice_events_flight_idx
  on public.lead_post_choice_events (flight_option_id, created_at desc);

alter table public.lead_post_choice_events enable row level security;

drop policy if exists "lead_post_choice_events_insert_public" on public.lead_post_choice_events;
drop policy if exists "lead_post_choice_events_select_consultora" on public.lead_post_choice_events;

create policy "lead_post_choice_events_insert_public"
  on public.lead_post_choice_events for insert to anon, authenticated
  with check (post_id is not null and event_name is not null and length(event_name) > 0);

create policy "lead_post_choice_events_select_consultora"
  on public.lead_post_choice_events for select to authenticated
  using (public.auth_email_matches_consultora_list());

grant insert on public.lead_post_choice_events to anon, authenticated;
grant select on public.lead_post_choice_events to authenticated;
