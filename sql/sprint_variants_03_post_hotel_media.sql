-- Sprint Variants 03 — media por hotel de publicação.

create table if not exists public.post_hotel_media (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null references public.post_hotels (id) on delete cascade,
  ordem integer not null default 0,
  kind text not null default 'image' check (kind in ('image', 'video')),
  url text not null,
  alt text,
  created_at timestamptz not null default now()
);

create index if not exists post_hotel_media_hotel_ordem_idx
  on public.post_hotel_media (hotel_id, ordem asc);

alter table public.post_hotel_media enable row level security;

drop policy if exists "post_hotel_media_anon_select_published" on public.post_hotel_media;
drop policy if exists "post_hotel_media_auth_select" on public.post_hotel_media;
drop policy if exists "post_hotel_media_insert_consultora" on public.post_hotel_media;
drop policy if exists "post_hotel_media_update_consultora" on public.post_hotel_media;
drop policy if exists "post_hotel_media_delete_consultora" on public.post_hotel_media;

create policy "post_hotel_media_anon_select_published"
  on public.post_hotel_media for select to anon
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

create policy "post_hotel_media_auth_select"
  on public.post_hotel_media for select to authenticated
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

create policy "post_hotel_media_insert_consultora"
  on public.post_hotel_media for insert to authenticated
  with check (public.auth_email_matches_consultora_list());

create policy "post_hotel_media_update_consultora"
  on public.post_hotel_media for update to authenticated
  using (public.auth_email_matches_consultora_list())
  with check (public.auth_email_matches_consultora_list());

create policy "post_hotel_media_delete_consultora"
  on public.post_hotel_media for delete to authenticated
  using (public.auth_email_matches_consultora_list());

grant select on public.post_hotel_media to anon, authenticated;
grant insert, update, delete on public.post_hotel_media to authenticated;
