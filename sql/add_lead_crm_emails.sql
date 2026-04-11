-- Emails enviados pela consultora a partir do CRM (Resend + registo para histórico).
-- Executar no Supabase SQL Editor.

create table if not exists public.lead_crm_emails (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads (id) on delete cascade,
  direction text not null default 'outbound'
    constraint lead_crm_emails_direction_chk check (direction in ('outbound', 'inbound')),
  subject text not null,
  body_text text not null,
  resend_email_id text,
  sent_by_user_id uuid,
  created_at timestamptz not null default now(),
  constraint lead_crm_emails_subject_len check (char_length(trim(subject)) between 1 and 500),
  constraint lead_crm_emails_body_len check (char_length(trim(body_text)) between 1 and 16000)
);

create index if not exists lead_crm_emails_lead_id_created_idx
  on public.lead_crm_emails (lead_id, created_at asc);

comment on table public.lead_crm_emails is
  'Mensagens com a lead: envio manual pelo CRM (outbound) ou receção por email (inbound).';

alter table public.lead_crm_emails enable row level security;

drop policy if exists "lce_select_consultora" on public.lead_crm_emails;
drop policy if exists "lce_insert_consultora" on public.lead_crm_emails;

create policy "lce_select_consultora"
  on public.lead_crm_emails for select to authenticated
  using (public.auth_email_matches_consultora_list());

create policy "lce_insert_consultora"
  on public.lead_crm_emails for insert to authenticated
  with check (
    public.auth_email_matches_consultora_list()
    and exists (
      select 1 from public.leads l where l.id = lead_id
    )
  );

grant select, insert on public.lead_crm_emails to authenticated;
