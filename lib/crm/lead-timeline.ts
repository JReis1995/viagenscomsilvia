import { climaLabelForKey } from "@/lib/marketing/quiz-clima";
import { DEFAULT_SITE_CONTENT } from "@/lib/site/site-content";
import type { LeadBoardRow } from "@/types/lead";

export type ClientThreadEntry = { message: string; created_at: string };

export type ClientDecisionEntry = {
  decision: string;
  note: string | null;
  created_at: string;
};

/** Mensagens em `lead_crm_emails` (envio CRM ou resposta recebida). */
export type CrmThreadEmailEntry = {
  direction: "outbound" | "inbound";
  subject: string;
  body_text: string;
  created_at: string;
};

/** @deprecated Usa `CrmThreadEmailEntry` (inclui `direction`). */
export type CrmOutboundEmailEntry = CrmThreadEmailEntry;

export type LeadTimelineDirection = "sent" | "received" | "system";

export type LeadTimelineKind =
  | "pedido"
  | "orcamento_pdf"
  | "cron"
  | "crm_email"
  | "crm_email_inbound"
  | "client_message"
  | "client_decision";

export type LeadTimelineRow = {
  at: string;
  title: string;
  body?: string;
  direction: LeadTimelineDirection;
  kind: LeadTimelineKind;
};

export function decisionLabelPt(d: string): string {
  if (d === "approved") return "Orçamento aprovado";
  if (d === "changes_requested") return "Pediu alterações";
  return d;
}

function line(label: string, value: string | null | undefined): string | null {
  const v = value?.trim();
  if (!v) return null;
  return `${label}: ${v}`;
}

/** Resumo legível do que veio no formulário (histórico “recebido”). */
export function buildSitePedidoTimelineBody(lead: LeadBoardRow): string {
  const lines: string[] = [];
  lines.push(
    lead.pedido_rapido
      ? "Tipo: pedido rápido (só destino)"
      : "Tipo: pedido completo (quiz no site)",
  );
  const dest = line("Destino / sonho", lead.destino_sonho);
  if (dest) lines.push(dest);
  const tel = line("Telemóvel", lead.telemovel);
  if (tel) lines.push(tel);
  if (!lead.pedido_rapido && lead.clima_preferido?.trim()) {
    lines.push(
      `Clima / ambiente: ${climaLabelForKey(
        lead.clima_preferido.trim(),
        DEFAULT_SITE_CONTENT.quiz,
      )}`,
    );
  }
  const vibe = line("Estilo de viagem", lead.vibe);
  if (vibe) lines.push(vibe);
  const comp = line("Com quem viaja", lead.companhia);
  if (comp) lines.push(comp);
  const orc = line("Orçamento indicado", lead.orcamento_estimado);
  if (orc) lines.push(orc);
  return lines.join("\n");
}

/** Eventos no site / CRM — ordem cronológica após construir. */
export function buildLeadTimeline(
  lead: LeadBoardRow,
  thread: ClientThreadEntry[] | undefined,
  decisions: ClientDecisionEntry[] | undefined,
  crmEmails?: CrmThreadEmailEntry[] | undefined,
): LeadTimelineRow[] {
  const rows: LeadTimelineRow[] = [];

  rows.push({
    at: lead.data_pedido,
    title: "Novo pedido recebido (site)",
    body: buildSitePedidoTimelineBody(lead),
    direction: "received",
    kind: "pedido",
  });

  if (lead.data_envio_orcamento) {
    rows.push({
      at: lead.data_envio_orcamento,
      title: "Orçamento em PDF enviado (CRM)",
      direction: "sent",
      kind: "orcamento_pdf",
    });
  }

  if (lead.data_ultimo_followup) {
    rows.push({
      at: lead.data_ultimo_followup,
      title: "Lembrete automático por email",
      direction: "system",
      kind: "cron",
    });
  }

  for (const e of crmEmails ?? []) {
    const inbound = e.direction === "inbound";
    rows.push({
      at: e.created_at,
      title: inbound
        ? e.subject.trim() || "Resposta por email"
        : e.subject.trim() || "(sem assunto)",
      body: e.body_text.trim(),
      direction: inbound ? "received" : "sent",
      kind: inbound ? "crm_email_inbound" : "crm_email",
    });
  }

  for (const m of thread ?? []) {
    rows.push({
      at: m.created_at,
      title: "Mensagem na área de cliente",
      body: m.message,
      direction: "received",
      kind: "client_message",
    });
  }

  for (const d of decisions ?? []) {
    rows.push({
      at: d.created_at,
      title: decisionLabelPt(d.decision),
      body: d.note?.trim() || undefined,
      direction: "received",
      kind: "client_decision",
    });
  }

  rows.sort(
    (a, b) => new Date(a.at).getTime() - new Date(b.at).getTime(),
  );
  return rows;
}
