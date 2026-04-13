import type { SupabaseClient } from "@supabase/supabase-js";

import {
  parseDetalhesProposta,
  parseValorTotalEUR,
} from "@/lib/crm/detalhes-proposta";
import {
  LEAD_BOARD_COLUMNS,
  OUTROS_COLUMN_KEY,
  isCanonicalLeadStatus,
} from "@/lib/crm/lead-board";

/** Janela temporal aplicada a `data_pedido` (quando o pedido entrou). */
export type CrmDashboardJanela = "tudo" | "30" | "90" | "custom";

export type DashboardDateFilter =
  | { type: "preset"; janela: "tudo" | "30" | "90" }
  | {
      type: "custom";
      fromIso: string;
      toIso: string;
      desdeYmd: string;
      ateYmd: string;
    };

export type CrmDashboardRow = {
  status: string;
  data_pedido: string;
  data_envio_orcamento: string | null;
  has_unread_messages?: boolean | null;
  detalhes_proposta?: unknown;
};

export type CrmDashboardStats = {
  janela: CrmDashboardJanela;
  dateFilter: DashboardDateFilter;
  /** Texto curto para o cartão de filtros (período). */
  periodLabel: string;
  /** Texto curto sobre filtro de estados. */
  statusFilterLabel: string;
  /**
   * `null` = todos os estados; `[]` = universo vazio (nada seleccionado);
   * caso contrário lista de `status` canónicos e/ou `OUTROS_COLUMN_KEY`.
   */
  statusAllowlist: string[] | null;
  /** Linhas incluídas após filtros de data e estado. */
  total: number;
  byStatus: Record<string, number>;
  openLeads: number;
  closedWon: number;
  closedCancelled: number;
  closedArchived: number;
  unreadLeads: number;
  conversionRate: number | null;
  conversionGanho: number;
  conversionCancelado: number;
  hitRatio: number | null;
  hitRatioDenominator: number;
  /** Soma de `valor_total` (última proposta na ficha) em estados Ganho, no filtro. */
  totalFaturadoEUR: number;
  /** Soma em estados Cancelado. */
  totalPerdidoEUR: number;
  /** Soma em pipeline aberto (nem Ganho, Cancelado nem Arquivado). */
  totalPotencialEUR: number;
};

const MAX_CUSTOM_RANGE_DAYS = 731;

/** Ordem fixa para URLs e UI (inclui «Outros estados»). */
export const DASHBOARD_STATUS_FILTER_KEYS: readonly string[] = [
  ...LEAD_BOARD_COLUMNS.map((c) => c.status),
  OUTROS_COLUMN_KEY,
];

export function normalizeDashboardStatusAllowlist(
  selected: Set<string>,
): string[] | null {
  const ordered = DASHBOARD_STATUS_FILTER_KEYS;
  if (selected.size === 0) return [];
  if (ordered.every((k) => selected.has(k))) return null;
  return ordered.filter((k) => selected.has(k));
}

export function uiSelectionFromAllowlist(allow: string[] | null): Set<string> {
  const ordered = DASHBOARD_STATUS_FILTER_KEYS;
  if (allow === null) return new Set(ordered);
  return new Set(allow);
}

function parseYmdToUtcMidnight(ymd: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd.trim());
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const dt = new Date(Date.UTC(y, mo - 1, d));
  if (
    dt.getUTCFullYear() !== y ||
    dt.getUTCMonth() !== mo - 1 ||
    dt.getUTCDate() !== d
  ) {
    return null;
  }
  return dt.getTime();
}

export function isValidDashboardYmdRange(desde: string, ate: string): boolean {
  return utcYmdRangeToIso(desde.trim(), ate.trim()) !== null;
}

function utcYmdRangeToIso(desdeYmd: string, ateYmd: string): {
  fromIso: string;
  toIso: string;
} | null {
  const t0 = parseYmdToUtcMidnight(desdeYmd);
  const t1 = parseYmdToUtcMidnight(ateYmd);
  if (t0 === null || t1 === null || t0 > t1) return null;
  const spanDays = (t1 - t0) / (86_400_000) + 1;
  if (spanDays > MAX_CUSTOM_RANGE_DAYS) return null;
  return {
    fromIso: new Date(t0).toISOString(),
    toIso: new Date(t1 + 86_400_000 - 1).toISOString(),
  };
}

export function parseDashboardJanela(raw: string | undefined): "tudo" | "30" | "90" {
  if (raw === "30" || raw === "90") return raw;
  return "tudo";
}

export function dashboardJanelaFromIso(
  janela: "tudo" | "30" | "90",
): string | null {
  if (janela === "tudo") return null;
  const days = janela === "30" ? 30 : 90;
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString();
}

export function buildDashboardDateFilterFromSearchParams(sp: {
  janela?: string;
  desde?: string;
  ate?: string;
}): DashboardDateFilter {
  const desde = sp.desde?.trim();
  const ate = sp.ate?.trim();
  if (desde && ate) {
    const iso = utcYmdRangeToIso(desde, ate);
    if (iso) {
      return {
        type: "custom",
        fromIso: iso.fromIso,
        toIso: iso.toIso,
        desdeYmd: desde,
        ateYmd: ate,
      };
    }
  }
  const janela = parseDashboardJanela(sp.janela);
  return { type: "preset", janela };
}

/**
 * `undefined` / string vazia ausente → todos os estados (`null`).
 * String presente mas vazia após parse → `[]` (universo vazio).
 */
export function parseDashboardStatusAllowlist(
  raw: string | undefined,
): string[] | null {
  if (raw === undefined) return null;
  const trimmed = raw.trim();
  if (!trimmed) return [];
  const allowed = new Set(DASHBOARD_STATUS_FILTER_KEYS);
  const parts = trimmed
    .split(",")
    .map((s) => s.trim())
    .filter((s) => allowed.has(s));
  return parts.length === 0 ? [] : parts;
}

export function serializeDashboardStatusAllowlist(
  allow: string[] | null,
): string | undefined {
  if (allow === null) return undefined;
  if (allow.length === 0) return "";
  return allow.join(",");
}

export type DashboardHrefDate =
  | { kind: "preset"; janela: "tudo" | "30" | "90" }
  | { kind: "custom"; desdeYmd: string; ateYmd: string };

export function buildDashboardHref(opts: {
  date: DashboardHrefDate;
  statusAllowlist: string[] | null;
}): string {
  const p = new URLSearchParams();
  if (opts.date.kind === "custom") {
    p.set("desde", opts.date.desdeYmd);
    p.set("ate", opts.date.ateYmd);
  } else if (opts.date.janela !== "tudo") {
    p.set("janela", opts.date.janela);
  }
  const es = serializeDashboardStatusAllowlist(opts.statusAllowlist);
  if (es !== undefined) p.set("estados", es);
  const q = p.toString();
  return q ? `/crm/dashboard?${q}` : "/crm/dashboard";
}

function rowMatchesStatusAllowlist(
  row: CrmDashboardRow,
  allow: string[] | null,
): boolean {
  if (allow === null) return true;
  if (allow.length === 0) return false;
  if (isCanonicalLeadStatus(row.status)) {
    return allow.includes(row.status);
  }
  return allow.includes(OUTROS_COLUMN_KEY);
}

export function filterDashboardRowsByStatus(
  rows: CrmDashboardRow[],
  allow: string[] | null,
): CrmDashboardRow[] {
  if (allow === null) return rows;
  return rows.filter((r) => rowMatchesStatusAllowlist(r, allow));
}

export function buildDashboardPeriodLabel(df: DashboardDateFilter): string {
  if (df.type === "preset") {
    if (df.janela === "tudo") return "Todo o período";
    if (df.janela === "30") return "Últimos 30 dias (desde data_pedido, UTC)";
    return "Últimos 90 dias (desde data_pedido, UTC)";
  }
  return `De ${df.desdeYmd} a ${df.ateYmd} (início e fim do dia em UTC)`;
}

export function buildDashboardStatusFilterLabel(
  allow: string[] | null,
): string {
  if (allow === null) return "Todos os estados";
  if (allow.length === 0) return "Nenhum estado seleccionado";
  const titles: Map<string, string> = new Map();
  for (const c of LEAD_BOARD_COLUMNS) {
    titles.set(c.status, c.title);
  }
  titles.set(OUTROS_COLUMN_KEY, "Outros estados");
  const bits = allow.map((s) => titles.get(s) ?? s);
  return bits.join(", ");
}

function janelaFromDateFilter(df: DashboardDateFilter): CrmDashboardJanela {
  return df.type === "custom" ? "custom" : df.janela;
}

/**
 * Agrega estatísticas para o dashboard CRM.
 * Ver `sql/crm_dashboard_verification.sql` para queries manuais equivalentes.
 */
export function aggregateDashboardStats(
  rows: CrmDashboardRow[],
  dateFilter: DashboardDateFilter,
  statusAllowlist: string[] | null,
): CrmDashboardStats {
  const filtered = filterDashboardRowsByStatus(rows, statusAllowlist);
  const byStatus: Record<string, number> = {};
  for (const col of LEAD_BOARD_COLUMNS) {
    byStatus[col.status] = 0;
  }
  byStatus[OUTROS_COLUMN_KEY] = 0;

  let openLeads = 0;
  let closedWon = 0;
  let closedCancelled = 0;
  let closedArchived = 0;
  let unreadLeads = 0;
  let hitRatioDenominator = 0;
  let totalFaturadoEUR = 0;
  let totalPerdidoEUR = 0;
  let totalPotencialEUR = 0;

  for (const row of filtered) {
    const key = isCanonicalLeadStatus(row.status)
      ? row.status
      : OUTROS_COLUMN_KEY;
    byStatus[key] = (byStatus[key] ?? 0) + 1;

    const s = row.status;
    if (s !== "Ganho" && s !== "Cancelado" && s !== "Arquivado") {
      openLeads += 1;
    }
    if (s === "Ganho") closedWon += 1;
    if (s === "Cancelado") closedCancelled += 1;
    if (s === "Arquivado") closedArchived += 1;
    if (row.has_unread_messages) unreadLeads += 1;
    if (row.data_envio_orcamento) hitRatioDenominator += 1;

    const det = parseDetalhesProposta(row.detalhes_proposta);
    const amount = det?.valor_total
      ? parseValorTotalEUR(det.valor_total)
      : null;
    if (amount !== null) {
      if (s === "Ganho") totalFaturadoEUR += amount;
      else if (s === "Cancelado") totalPerdidoEUR += amount;
      else if (s !== "Ganho" && s !== "Cancelado" && s !== "Arquivado") {
        totalPotencialEUR += amount;
      }
    }
  }

  const conversionGanho = byStatus["Ganho"] ?? 0;
  const conversionCancelado = byStatus["Cancelado"] ?? 0;
  const conversionDenom = conversionGanho + conversionCancelado;
  const conversionRate =
    conversionDenom > 0 ? conversionGanho / conversionDenom : null;

  const hitRatio =
    hitRatioDenominator > 0 ? conversionGanho / hitRatioDenominator : null;

  return {
    janela: janelaFromDateFilter(dateFilter),
    dateFilter,
    periodLabel: buildDashboardPeriodLabel(dateFilter),
    statusFilterLabel: buildDashboardStatusFilterLabel(statusAllowlist),
    statusAllowlist,
    total: filtered.length,
    byStatus,
    openLeads,
    closedWon,
    closedCancelled,
    closedArchived,
    unreadLeads,
    conversionRate,
    conversionGanho,
    conversionCancelado,
    hitRatio,
    hitRatioDenominator,
    totalFaturadoEUR,
    totalPerdidoEUR,
    totalPotencialEUR,
  };
}

export async function fetchCrmDashboardRows(
  db: SupabaseClient,
  dateFilter: DashboardDateFilter,
): Promise<{ rows: CrmDashboardRow[]; error: string | null }> {
  let q = db
    .from("leads")
    .select(
      "status, data_pedido, data_envio_orcamento, has_unread_messages, detalhes_proposta",
    );
  if (dateFilter.type === "preset") {
    const fromIso = dashboardJanelaFromIso(dateFilter.janela);
    if (fromIso) {
      q = q.gte("data_pedido", fromIso);
    }
  } else {
    q = q
      .gte("data_pedido", dateFilter.fromIso)
      .lte("data_pedido", dateFilter.toIso);
  }
  const { data, error } = await q;
  if (error) {
    return { rows: [], error: error.message };
  }
  return {
    rows: (data ?? []) as CrmDashboardRow[],
    error: null,
  };
}
