-- Imagens das publicações (CRM) — bucket público para leitura no site.
-- Executar no Supabase SQL Editor após sprint2_cms_and_consultora_rls.sql
-- (requer função public.auth_email_matches_consultora_list()).

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'post-media',
  'post-media',
  true,
  209715200, -- 200 MiB (vídeos + imagens em alta)
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'video/mp4',
    'video/webm',
    'video/quicktime'
  ]::text[]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Leitura pública (homepage / feed com <img src="…">)
drop policy if exists "post_media_select_public" on storage.objects;
create policy "post_media_select_public"
  on storage.objects for select
  using (bucket_id = 'post-media');

-- Escrita só para emails da lista de consultoras (igual ao CRM posts)
drop policy if exists "post_media_insert_consultora" on storage.objects;
create policy "post_media_insert_consultora"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'post-media'
    and public.auth_email_matches_consultora_list()
  );

drop policy if exists "post_media_update_consultora" on storage.objects;
create policy "post_media_update_consultora"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'post-media'
    and public.auth_email_matches_consultora_list()
  )
  with check (
    bucket_id = 'post-media'
    and public.auth_email_matches_consultora_list()
  );

drop policy if exists "post_media_delete_consultora" on storage.objects;
create policy "post_media_delete_consultora"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'post-media'
    and public.auth_email_matches_consultora_list()
  );
