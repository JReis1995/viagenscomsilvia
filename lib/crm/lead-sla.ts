import type { LeadBoardRow } from "@/types/lead";

import {
  boardColumnKeyForStatus,
  OUTROS_COLUMN_KEY,
} from "@/lib/crm/lead-board";

export type LeadSlaLevel = "green" | "yellow" | "red" | "muted";

const FINAL_STATUSES = new Set(["Ganho", "Cancelado", "Arquivado"]);

export function parseSlaHours(raw: string, fallback: number): number {
  const n = Number.parseInt(raw.trim(), 10);
  if (Number.isFinite(n) && n > 0 && n < 10_000) {
    return n;
  }
  return fallback;
}

/**
 * Indicador visual de SLA: tempo desde `data_pedido` vs limiares (horas) configuráveis no CMS.
 * Estados finais ou coluna «outros» ficam neutros.
 */
export function leadPedidoSla(
  lead: LeadBoardRow,
  greenMaxHours: number,
  yellowMaxHours: number,
  nowMs = Date.now(),
): { level: LeadSlaLevel; hours: number; label: string } {
  const col = boardColumnKeyForStatus(lead.status);
  if (col === OUTROS_COLUMN_KEY || FINAL_STATUSES.has(lead.status)) {
    return { level: "muted", hours: 0, label: "—" };
  }

  const t = new Date(lead.data_pedido).getTime();
  if (Number.isNaN(t)) {
    return { level: "muted", hours: 0, label: "?" };
  }

  const hours = Math.max(0, (nowMs - t) / 3_600_000);
  const age =
    hours < 72
      ? `${(Math.round(hours * 10) / 10).toString().replace(/\.0$/, "")} h`
      : `${Math.round(hours / 24)} d`;

  if (hours <= greenMaxHours) {
    return { level: "green", hours, label: `há ${age}` };
  }
  if (hours <= yellowMaxHours) {
    return { level: "yellow", hours, label: `há ${age}` };
  }
  return { level: "red", hours, label: `há ${age}` };
}

export type LeadCardSlaBorderTone = "neutral" | "yellow" | "red";

/**
 * Borda do cartão no Kanban: usa os limiares do CMS (horas desde `data_pedido`).
 * Até `greenMaxHours` inclusivé → neutra; acima até `yellowMaxHours` → amarela; acima → vermelha.
 * Estados finais e coluna «outros» ficam sempre neutros.
 */
export function leadCardSlaBorderTone(
  lead: LeadBoardRow,
  greenMaxHours = 24,
  yellowMaxHours = 48,
  /** Para testes; omissão usa a hora actual no módulo (não no componente React). */
  nowMs?: number,
): LeadCardSlaBorderTone {
  const now = nowMs ?? Date.now();
  const col = boardColumnKeyForStatus(lead.status);
  if (col === OUTROS_COLUMN_KEY || FINAL_STATUSES.has(lead.status)) {
    return "neutral";
  }
  const t = new Date(lead.data_pedido).getTime();
  if (Number.isNaN(t)) return "neutral";
  const hours = Math.max(0, (now - t) / 3_600_000);
  const greenH = Math.max(1 / 60, greenMaxHours);
  let yellowH = yellowMaxHours;
  if (yellowH <= greenH) {
    yellowH = greenH + 24;
  }
  if (hours > yellowH) return "red";
  if (hours > greenH) return "yellow";
  return "neutral";
}

export function leadCardSlaBorderClass(tone: LeadCardSlaBorderTone): string {
  switch (tone) {
    case "red":
      return "border-red-400/85";
    case "yellow":
      return "border-amber-400/85";
    default:
      return "border-ocean-100";
  }
}

/** Tempo decorrido desde o pedido — texto neutro (sem níveis de cor). */
export function leadHoursSincePedidoLabel(
  lead: LeadBoardRow,
  nowMs = Date.now(),
): string {
  const t = new Date(lead.data_pedido).getTime();
  if (Number.isNaN(t)) return "?";
  const hours = Math.max(0, (nowMs - t) / 3_600_000);
  const rounded = Math.round(hours * 10) / 10;
  const text = rounded % 1 === 0 ? String(rounded) : rounded.toFixed(1);
  return `há ${text}h`;
}
