import type { LeadBoardRow } from "@/types/lead";

import { boardColumnKeyForStatus, OUTROS_COLUMN_KEY } from "@/lib/crm/lead-board";

export type LeadUrgencyInfo = {
  score: number;
  reason: string;
};

const MS_DAY = 86_400_000;

function daysBetween(fromIso: string, toMs: number): number {
  const t = new Date(fromIso).getTime();
  if (Number.isNaN(t)) return 0;
  return Math.max(0, (toMs - t) / MS_DAY);
}

/**
 * Ordenação da fila «Hoje»: maior score = tratar primeiro.
 * Estados finais ou arquivados ficam no fim.
 */
export function leadUrgency(lead: LeadBoardRow, nowMs = Date.now()): LeadUrgencyInfo {
  const key = boardColumnKeyForStatus(lead.status);
  if (key === OUTROS_COLUMN_KEY) {
    return {
      score: -500,
      reason: `Outro · ${lead.status.slice(0, 18)}${lead.status.length > 18 ? "…" : ""}`,
    };
  }

  const daysPedido = daysBetween(lead.data_pedido, nowMs);

  if (lead.status === "Arquivado" || lead.status === "Cancelado") {
    return {
      score: -400 + Math.min(daysPedido, 365) * 0.01,
      reason: lead.status === "Cancelado" ? "Cancelada" : "Arquivada",
    };
  }

  if (lead.status === "Ganho") {
    return {
      score: -300 + Math.min(daysPedido, 365) * 0.01,
      reason: "Ganho",
    };
  }

  if (lead.status === "Nova Lead") {
    let score = 800 + daysPedido * 55;
    const d = daysPedido < 1 ? "<1" : String(Math.floor(daysPedido));
    const tags: string[] = [`Nova · ${d}d`];
    if (!lead.data_envio_orcamento) {
      score += 120;
      tags.push("s/ orç.");
    }
    if (lead.pedido_rapido) {
      score += 70;
      tags.push("rápido");
    }
    if (lead.auto_followup) {
      score += 25;
      tags.push("auto FU");
    }
    return { score, reason: tags.join(" · ") };
  }

  if (lead.status === "Em contacto") {
    const score = 520 + daysPedido * 35;
    const d = daysPedido < 1 ? "<1" : String(Math.floor(daysPedido));
    return {
      score,
      reason: `Contacto · ${d}d`,
    };
  }

  if (lead.status === "Proposta enviada") {
    const refIso = lead.data_envio_orcamento ?? lead.data_pedido;
    const days = daysBetween(refIso, nowMs);
    const score = 600 + days * 42;
    const d = days < 1 ? "<1" : String(Math.floor(days));
    return {
      score,
      reason: `Proposta · ${d}d`,
    };
  }

  return { score: 0, reason: lead.status };
}

export function sortLeadsByUrgency(leads: LeadBoardRow[]): LeadBoardRow[] {
  const now = Date.now();
  return [...leads].sort((a, b) => {
    const ua = leadUrgency(a, now);
    const ub = leadUrgency(b, now);
    if (ub.score !== ua.score) return ub.score - ua.score;
    return new Date(b.data_pedido).getTime() - new Date(a.data_pedido).getTime();
  });
}
