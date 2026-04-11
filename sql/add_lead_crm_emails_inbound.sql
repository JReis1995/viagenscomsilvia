-- Permite gravar respostas recebidas por email (manual ou webhook Resend Inbound).
-- Executar no Supabase depois de add_lead_crm_emails.sql.

alter table public.lead_crm_emails
  drop constraint if exists lead_crm_emails_direction_chk;

alter table public.lead_crm_emails
  add constraint lead_crm_emails_direction_chk
  check (direction in ('outbound', 'inbound'));

comment on table public.lead_crm_emails is
  'Mensagens trocadas com a lead: envio manual pelo CRM (outbound) ou receção por email (inbound).';
