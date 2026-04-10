import type { LeadBoardRow } from "@/types/lead";

export const LEAD_BOARD_COLUMNS = [
  {
    status: "Nova Lead",
    title: "Nova lead",
    hint: "Primeiro contacto",
  },
  {
    status: "Em contacto",
    title: "Em contacto",
    hint: "A qualificar o pedido",
  },
  {
    status: "Proposta enviada",
    title: "Proposta enviada",
    hint: "Aguarda resposta",
  },
  {
    status: "Ganho",
    title: "Ganho",
    hint: "Reserva fechada",
  },
  {
    status: "Cancelado",
    title: "Cancelado",
    hint: "Cliente desistiu ou pediu cancelamento",
  },
  {
    status: "Arquivado",
    title: "Arquivado",
    hint: "Sem conversão ou pausado",
  },
] as const;

export type LeadBoardStatus = (typeof LEAD_BOARD_COLUMNS)[number]["status"];

const CANONICAL = new Set<string>(
  LEAD_BOARD_COLUMNS.map((c) => c.status),
);

export const OUTROS_COLUMN_KEY = "__outros__";

export function isCanonicalLeadStatus(status: string): status is LeadBoardStatus {
  return CANONICAL.has(status);
}

export function boardColumnKeyForStatus(status: string): LeadBoardStatus | typeof OUTROS_COLUMN_KEY {
  return isCanonicalLeadStatus(status) ? status : OUTROS_COLUMN_KEY;
}

export function groupLeadsByBoardColumn(
  leads: LeadBoardRow[],
): Map<string, LeadBoardRow[]> {
  const map = new Map<string, LeadBoardRow[]>();
  for (const col of LEAD_BOARD_COLUMNS) {
    map.set(col.status, []);
  }
  map.set(OUTROS_COLUMN_KEY, []);

  for (const lead of leads) {
    const key = boardColumnKeyForStatus(lead.status);
    map.get(key)!.push(lead);
  }

  return map;
}
