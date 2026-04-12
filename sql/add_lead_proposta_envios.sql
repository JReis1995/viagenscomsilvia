-- Histórico de cada envio de orçamento em PDF (valor, título, etc.).
-- Permite vários envios por lead e distinguir valores no CRM.

CREATE TABLE IF NOT EXISTS public.lead_proposta_envios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.leads (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  valor_total text NOT NULL,
  titulo text NOT NULL,
  destino text,
  datas text,
  snapshot jsonb
);

CREATE INDEX IF NOT EXISTS lead_proposta_envios_lead_id_idx
  ON public.lead_proposta_envios (lead_id);

CREATE INDEX IF NOT EXISTS lead_proposta_envios_created_at_idx
  ON public.lead_proposta_envios (created_at);

COMMENT ON TABLE public.lead_proposta_envios IS
  'Um registo por cada envio de proposta por email (CRM); snapshot = JSON gravado em detalhes_proposta nesse envio.';
