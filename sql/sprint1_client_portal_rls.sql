-- Sprint 1 — Portal do cliente + RLS (executar no Supabase SQL Editor)
-- 1) Garante que `configuracoes_globais.consultora_email` = email da Sílvia (Auth), igual a CONSULTORA_EMAIL no .env da app.
-- 2) Anon insert em leads (quiz) mantém-se; estas políticas substituem o acesso authenticated às leads.

create table if not exists public.lead_client_updates (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads (id) on delete cascade,
  user_id uuid not null,
  message text not null,
  created_at timestamptz not null default now(),
  constraint lead_client_updates_message_nonempty check (char_length(trim(message)) > 0)
);

create index if not exists lead_client_updates_lead_id_idx
  on public.lead_client_updates (lead_id);

create index if not exists lead_client_updates_created_at_idx
  on public.lead_client_updates (created_at desc);

alter table public.lead_client_updates enable row level security;

drop policy if exists "authenticated_select_leads" on public.leads;
drop policy if exists "authenticated_update_leads" on public.leads;
drop policy if exists "authenticated_delete_leads" on public.leads;
drop policy if exists "leads_select_consultora_cfg" on public.leads;
drop policy if exists "leads_select_client_own_email" on public.leads;
drop policy if exists "leads_update_consultora_cfg" on public.leads;
drop policy if exists "leads_delete_consultora_cfg" on public.leads;

create policy "leads_select_consultora_cfg"
  on public.leads for select to authenticated
  using (
    exists (
      select 1
      from public.configuracoes_globais cg
      where cg.consultora_email is not null
        and lower(trim(cg.consultora_email)) = lower(trim(coalesce(auth.jwt() ->> 'email', '')))
    )
  );

create policy "leads_select_client_own_email"
  on public.leads for select to authenticated
  using (
    lower(trim(coalesce(public.leads.email, ''))) = lower(trim(coalesce(auth.jwt() ->> 'email', '')))
  );

create policy "leads_update_consultora_cfg"
  on public.leads for update to authenticated
  using (
    exists (
      select 1
      from public.configuracoes_globais cg
      where cg.consultora_email is not null
        and lower(trim(cg.consultora_email)) = lower(trim(coalesce(auth.jwt() ->> 'email', '')))
    )
  )
  with check (
    exists (
      select 1
      from public.configuracoes_globais cg
      where cg.consultora_email is not null
        and lower(trim(cg.consultora_email)) = lower(trim(coalesce(auth.jwt() ->> 'email', '')))
    )
  );

create policy "leads_delete_consultora_cfg"
  on public.leads for delete to authenticated
  using (
    exists (
      select 1
      from public.configuracoes_globais cg
      where cg.consultora_email is not null
        and lower(trim(cg.consultora_email)) = lower(trim(coalesce(auth.jwt() ->> 'email', '')))
    )
  );

drop policy if exists "lcu_select_consultora_or_author" on public.lead_client_updates;
drop policy if exists "lcu_insert_client_own_lead" on public.lead_client_updates;

create policy "lcu_select_consultora_or_author"
  on public.lead_client_updates for select to authenticated
  using (
    user_id = auth.uid()
    or exists (
      select 1
      from public.configuracoes_globais cg
      where cg.consultora_email is not null
        and lower(trim(cg.consultora_email)) = lower(trim(coalesce(auth.jwt() ->> 'email', '')))
    )
  );

create policy "lcu_insert_client_own_lead"
  on public.lead_client_updates for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1
      from public.leads l
      where l.id = lead_id
        and lower(trim(coalesce(l.email, ''))) = lower(trim(coalesce(auth.jwt() ->> 'email', '')))
    )
  );

grant select, insert on public.lead_client_updates to authenticated;
