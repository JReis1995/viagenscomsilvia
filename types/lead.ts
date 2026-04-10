/** Colunas do quadro CRM — valores gravados em `leads.status`. */
export type LeadBoardRow = {
  id: string;
  nome: string;
  email: string;
  telemovel: string | null;
  status: string;
  data_pedido: string;
  data_envio_orcamento: string | null;
  /** JSONB — validar com `parseDetalhesProposta` quando necessário */
  detalhes_proposta: unknown;
  vibe: string | null;
  companhia: string | null;
  destino_sonho: string | null;
  orcamento_estimado: string | null;
  auto_followup: boolean;
};
