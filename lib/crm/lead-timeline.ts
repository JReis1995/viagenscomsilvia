import { parseDetalhesProposta } from "@/lib/crm/detalhes-proposta";
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

/** Registos em `lead_proposta_envios` (um por cada envio de PDF). */
export type LeadPropostaEnvioRow = {
  id?: string;
  created_at: string;
  valor_total: string;
  titulo: string;
  destino?: string | null;
  datas?: string | null;
  /** Itens do PDF (uma linha por elemento do quiz). */
  inclui?: string[];
};

type OrcamentoResumo = {
  valor_total: string;
  titulo: string;
  destino?: string | null;
  datas?: string | null;
  inclui?: string[];
};

export function buildOrcamentoResumoBody(ev: OrcamentoResumo): string {
  const lines: string[] = [];
  lines.push(`Valor: ${ev.valor_total.trim()}`);
  if (ev.titulo?.trim()) lines.push(`Título: ${ev.titulo.trim()}`);
  if (ev.destino?.trim()) lines.push(`Destino: ${ev.destino.trim()}`);
  if (ev.datas?.trim()) lines.push(`Datas: ${ev.datas.trim()}`);
  if (ev.inclui?.length) {
    lines.push("");
    lines.push("O que inclui:");
    for (const raw of ev.inclui) {
      const t = raw.trim();
      if (t) lines.push(`· ${t}`);
    }
  }
  return lines.join("\n");
}

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

function isCrmManualLead(lead: LeadBoardRow): boolean {
  return (
    lead.utm_medium?.trim().toLowerCase() === "manual" &&
    lead.utm_source?.trim().toLowerCase() === "crm"
  );
}

/** Resumo legível do que veio no formulário (histórico “recebido”). */
export function buildSitePedidoTimelineBody(lead: LeadBoardRow): string {
  const lines: string[] = [];
  if (isCrmManualLead(lead)) {
    lines.push("Origem: criada pela consultora no painel (sem formulário no site).");
  }
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
  propostaEnvios?: LeadPropostaEnvioRow[] | undefined,
): LeadTimelineRow[] {
  const rows: LeadTimelineRow[] = [];

  rows.push({
    at: lead.data_pedido,
    title: isCrmManualLead(lead)
      ? "Pedido registado no CRM (manual)"
      : "Novo pedido recebido (site)",
    body: buildSitePedidoTimelineBody(lead),
    direction: "received",
    kind: "pedido",
  });

  if (propostaEnvios && propostaEnvios.length > 0) {
    const sorted = [...propostaEnvios].sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    );
    for (const ev of sorted) {
      rows.push({
        at: ev.created_at,
        title: `Orçamento enviado · ${ev.valor_total.trim()}`,
        body: buildOrcamentoResumoBody({
          valor_total: ev.valor_total,
          titulo: ev.titulo,
          destino: ev.destino,
          datas: ev.datas,
          inclui: ev.inclui,
        }),
        direction: "sent",
        kind: "orcamento_pdf",
      });
    }
  } else if (lead.data_envio_orcamento) {
    const d = parseDetalhesProposta(lead.detalhes_proposta);
    rows.push({
      at: lead.data_envio_orcamento,
      title: d
        ? `Orçamento enviado · ${d.valor_total.trim()}`
        : "Orçamento em PDF enviado (CRM)",
      body: d
        ? buildOrcamentoResumoBody({
            valor_total: d.valor_total,
            titulo: d.titulo,
            destino: d.destino,
            datas: d.datas,
            inclui: d.inclui,
          })
        : undefined,
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
