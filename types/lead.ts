/** Join opcional `promo_campaigns` quando a lead veio do link de campanha. */
export type LeadPromoCampaignEmbed = {
  discount_percent: number;
  titulo_publicacao: string;
  expires_at: string;
  link_publicacao: string;
};

export type LeadPostChoiceSnapshotItem = {
  id: string;
  label: string;
  preco_delta_eur?: number | null;
  preco_label?: string | null;
};

export type LeadPostChoice = {
  hotel_id?: string;
  extra_ids?: string[];
  flight_option_id?: string;
  notas_voo?: string;
  checkin_date?: string;
  checkout_date?: string;
  rooms?: Array<{
    room_option_id: string;
    qty: number;
  }>;
  rooms_required?: number;
  computed_total_eur?: number | null;
  currency?: "EUR";
  computed_at?: string;
  snapshot?: {
    hotel?: LeadPostChoiceSnapshotItem;
    extras?: LeadPostChoiceSnapshotItem[];
    flight?: LeadPostChoiceSnapshotItem;
  };
};

export type LeadPostChoiceFlightPrefill = {
  id: string;
  label: string;
  origem_iata: string | null;
  destino_iata: string | null;
  data_partida: string | null;
  data_regresso: string | null;
  cia: string | null;
  classe: string | null;
  bagagem_text: string | null;
  descricao: string | null;
};

/** Colunas do quadro CRM — valores gravados em `leads.status`. */
export type LeadBoardRow = {
  id: string;
  nome: string;
  email: string;
  telemovel: string | null;
  status: string;
  data_pedido: string;
  /** Lembrete automático (cron) — último envio. */
  data_ultimo_followup?: string | null;
  data_envio_orcamento: string | null;
  /** Notas internas da consultora (só CRM). Requer coluna em BD — ver sql/add_lead_notas_internas.sql */
  notas_internas?: string | null;
  /** JSONB — validar com `parseDetalhesProposta` quando necessário */
  detalhes_proposta: unknown;
  /** Chaves do quiz: neve | praia | cidade | misto */
  clima_preferido: string | null;
  vibe: string | null;
  companhia: string | null;
  destino_sonho: string | null;
  orcamento_estimado: string | null;
  /** Texto livre (ex.: «10–20 ago»). */
  janela_datas?: string | null;
  /** Chaves: fixas | mais_menos_semana | totalmente_flexivel */
  flexibilidade_datas?: string | null;
  /** Chaves: nada | so_voos | so_hotel | ambos */
  ja_tem_voos_hotel?: string | null;
  /** Pedido do hero/search (topo) */
  pedido_adultos?: number | null;
  pedido_criancas?: number | null;
  pedido_idades_criancas?: number[] | null;
  pedido_quartos?: number | null;
  pedido_animais_estimacao?: boolean | null;
  post_id?: string | null;
  post_choice?: LeadPostChoice | null;
  post_choice_hotel_thumb_url?: string | null;
  post_choice_hotel_gallery_urls?: string[] | null;
  post_choice_flight_prefill?: LeadPostChoiceFlightPrefill | null;
  post_titulo?: string | null;
  post_slug_destino?: string | null;
  auto_followup: boolean;
  pedido_rapido: boolean;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
  referrer: string | null;
  landing_path: string | null;
  /** Email inbound novo (webhook Resend) — ver sql/add_lead_has_unread_messages.sql */
  has_unread_messages?: boolean | null;
  /** Preenchido pelo servidor se o pedido trouxe token de campanha válido + email coincidente. */
  promo_campaign_id?: string | null;
  promo_campaigns?: LeadPromoCampaignEmbed | null;
};
