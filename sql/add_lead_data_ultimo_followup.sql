-- Executar no Supabase SQL Editor (Sprint 5 — lembrete automático).
-- Evita reenviar o mesmo email em cada execução do cron.

alter table public.leads
  add column if not exists data_ultimo_followup timestamptz;

comment on column public.leads.data_ultimo_followup is
  'Data do último email automático de follow-up (lembrete).';
