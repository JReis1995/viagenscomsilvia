-- Sprint 1: alerta de mensagens novas (emails inbound via Resend).
-- Executar no Supabase SQL Editor (ou via migration).

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS has_unread_messages boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.leads.has_unread_messages IS
  'True quando chega email inbound associado à lead; deve passar a false quando a utilizadora consultar o histórico (app).';
