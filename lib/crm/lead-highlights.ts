import type { CrmThreadEmailEntry } from "@/lib/crm/lead-timeline";
import type { LeadBoardRow } from "@/types/lead";

const MS_HOUR = 3_600_000;

/** Pedido com `data_pedido` nas últimas N horas — destaque «Novo pedido». */
export const FRESH_PEDIDO_HOURS = 48;

/** Inbound gravado nas últimas N horas — destaque «Resposta email». */
export const RECENT_INBOUND_EMAIL_HOURS = 72;

export function isFreshPedido(
  lead: LeadBoardRow,
  nowMs = Date.now(),
): boolean {
  const t = new Date(lead.data_pedido).getTime();
  if (Number.isNaN(t)) return false;
  return nowMs - t <= FRESH_PEDIDO_HOURS * MS_HOUR;
}

export function hasRecentInboundEmail(
  emails: CrmThreadEmailEntry[] | undefined,
  nowMs = Date.now(),
  hours = RECENT_INBOUND_EMAIL_HOURS,
): boolean {
  if (!emails?.length) return false;
  const cutoff = nowMs - hours * MS_HOUR;
  return emails.some((e) => {
    if (e.direction !== "inbound") return false;
    const ts = new Date(e.created_at).getTime();
    return !Number.isNaN(ts) && ts >= cutoff;
  });
}

/** Classes extra no cartão do quadro (anel + sombra). Inbound tem prioridade visual. */
export function leadCardHighlightRingClass(
  freshPedido: boolean,
  recentInbound: boolean,
): string {
  if (recentInbound) {
    return "ring-2 ring-emerald-400/60 shadow-md shadow-emerald-200/30";
  }
  if (freshPedido) {
    return "ring-2 ring-amber-400/55 shadow-md shadow-amber-200/25";
  }
  return "";
}
