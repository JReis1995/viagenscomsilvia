"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { Eye, EyeOff, LayoutGrid, Loader2, Settings2 } from "lucide-react";

import {
  type CrmDashboardJanela,
  type CrmDashboardStats,
  buildDashboardHref,
  isValidDashboardYmdRange,
  normalizeDashboardStatusAllowlist,
  uiSelectionFromAllowlist,
} from "@/lib/crm/dashboard-stats";
import {
  LEAD_BOARD_COLUMNS,
  OUTROS_COLUMN_KEY,
} from "@/lib/crm/lead-board";

export const CRM_DASHBOARD_WIDGET_IDS = [
  "by_status",
  "open",
  "closed_won",
  "closed_cancelled",
  "closed_archived",
  "revenue_won",
  "revenue_lost",
  "revenue_potential",
  "conversion",
  "hit_ratio",
  "unread",
] as const;

export type CrmDashboardWidgetId = (typeof CRM_DASHBOARD_WIDGET_IDS)[number];

const WIDGET_LABELS: Record<CrmDashboardWidgetId, string> = {
  by_status: "Contagem por estado",
  open: "Leads em aberto",
  closed_won: "Fechadas — Ganho",
  closed_cancelled: "Fechadas — Cancelado",
  closed_archived: "Arquivo geral (Arquivado)",
  revenue_won: "Total faturado (valor nas propostas — Ganho)",
  revenue_lost: "Total perdido (valor — Cancelado)",
  revenue_potential: "Total potencial (valor — pipeline aberto)",
  conversion: "Taxa de conversão (Ganho vs Cancelado)",
  hit_ratio: "Hit ratio (Ganho vs com proposta enviada)",
  unread: "Leads com mensagem por ler",
};

const DEFAULT_VISIBILITY: Record<CrmDashboardWidgetId, boolean> = {
  by_status: true,
  open: true,
  closed_won: true,
  closed_cancelled: true,
  closed_archived: true,
  revenue_won: true,
  revenue_lost: true,
  revenue_potential: true,
  conversion: true,
  hit_ratio: true,
  unread: true,
};

function storageKeyWidgets(email: string) {
  return `crm-dashboard-widgets:v1:${encodeURIComponent(email.toLowerCase().trim())}`;
}

type LsDashboardFilters = {
  date:
    | { kind: "preset"; janela: "tudo" | "30" | "90" }
    | { kind: "custom"; desdeYmd: string; ateYmd: string };
  statusAllowlist: string[] | null;
};

function storageKeyFilters(email: string) {
  return `crm-dashboard-filters:v1:${encodeURIComponent(email.toLowerCase().trim())}`;
}

function persistFiltersLs(email: string, data: LsDashboardFilters) {
  try {
    localStorage.setItem(storageKeyFilters(email), JSON.stringify(data));
  } catch {
    /* ignore */
  }
}

function pct(n: number | null): string {
  if (n === null || Number.isNaN(n)) return "—";
  return `${Math.round(n * 1000) / 10}%`;
}

function formatEUR(n: number): string {
  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: "EUR",
  }).format(n);
}

const STATUS_FILTER_ROWS = [
  ...LEAD_BOARD_COLUMNS.map((c) => ({ key: c.status, label: c.title })),
  { key: OUTROS_COLUMN_KEY, label: "Outros estados" },
] as const;

type Props = {
  stats: CrmDashboardStats;
  userEmail: string;
};

export function CrmDashboard({ stats, userEmail }: Props) {
  const router = useRouter();
  const [visibility, setVisibility] =
    useState<Record<CrmDashboardWidgetId, boolean>>(DEFAULT_VISIBILITY);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [desdeInput, setDesdeInput] = useState("");
  const [ateInput, setAteInput] = useState("");
  const [statusSelection, setStatusSelection] = useState<Set<string>>(
    () => new Set(),
  );
  const [filterHint, setFilterHint] = useState<string | null>(null);
  const [pendingNav, startNav] = useTransition();
  const ranLsHydrate = useRef(false);

  const allowKey = useMemo(() => {
    const a = stats.statusAllowlist;
    if (a === null) return "all";
    if (a.length === 0) return "none";
    return a.join("|");
  }, [stats.statusAllowlist]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKeyWidgets(userEmail));
      if (!raw) {
        setHydrated(true);
        return;
      }
      const parsed = JSON.parse(raw) as Record<string, boolean>;
      const merged = { ...DEFAULT_VISIBILITY };
      for (const id of CRM_DASHBOARD_WIDGET_IDS) {
        if (typeof parsed[id] === "boolean") merged[id] = parsed[id];
      }
      setVisibility(merged);
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, [userEmail]);

  useEffect(() => {
    if (stats.dateFilter.type === "custom") {
      setDesdeInput(stats.dateFilter.desdeYmd);
      setAteInput(stats.dateFilter.ateYmd);
    } else {
      setDesdeInput("");
      setAteInput("");
    }
  }, [stats.dateFilter]);

  useEffect(() => {
    setStatusSelection(uiSelectionFromAllowlist(stats.statusAllowlist));
  }, [allowKey]);

  useEffect(() => {
    if (ranLsHydrate.current) return;
    if (typeof window === "undefined") return;
    if (window.location.search.length > 1) {
      ranLsHydrate.current = true;
      return;
    }
    ranLsHydrate.current = true;
    try {
      const raw = localStorage.getItem(storageKeyFilters(userEmail));
      if (!raw) return;
      const o = JSON.parse(raw) as LsDashboardFilters;
      if (!o?.date) return;
      startNav(() => {
        router.replace(
          buildDashboardHref({
            date: o.date,
            statusAllowlist:
              o.statusAllowlist === undefined ? null : o.statusAllowlist,
          }),
        );
      });
    } catch {
      /* ignore */
    }
  }, [router, userEmail]);

  const persist = useCallback(
    (next: Record<CrmDashboardWidgetId, boolean>) => {
      setVisibility(next);
      try {
        localStorage.setItem(
          storageKeyWidgets(userEmail),
          JSON.stringify(next),
        );
      } catch {
        /* ignore */
      }
    },
    [userEmail],
  );

  const toggle = useCallback(
    (id: CrmDashboardWidgetId) => {
      persist({ ...visibility, [id]: !visibility[id] });
    },
    [persist, visibility],
  );

  const applyNavigation = useCallback(
    (href: string, ls: LsDashboardFilters) => {
      setFilterHint(null);
      persistFiltersLs(userEmail, ls);
      startNav(() => {
        router.push(href);
      });
    },
    [router, userEmail],
  );

  const applyCustomRangeAndStates = useCallback(() => {
    const d0 = desdeInput.trim();
    const d1 = ateInput.trim();
    if (!isValidDashboardYmdRange(d0, d1)) {
      setFilterHint(
        "Datas inválidas ou intervalo demasiado longo (máx. 731 dias). Usa AAAA-MM-DD em UTC.",
      );
      return;
    }
    const allow = normalizeDashboardStatusAllowlist(statusSelection);
    const href = buildDashboardHref({
      date: { kind: "custom", desdeYmd: d0, ateYmd: d1 },
      statusAllowlist: allow,
    });
    applyNavigation(href, {
      date: { kind: "custom", desdeYmd: d0, ateYmd: d1 },
      statusAllowlist: allow,
    });
  }, [applyNavigation, ateInput, desdeInput, statusSelection]);

  const presetHref = useCallback(
    (janela: "tudo" | "30" | "90") =>
      buildDashboardHref({
        date: { kind: "preset", janela },
        statusAllowlist: stats.statusAllowlist,
      }),
    [stats.statusAllowlist],
  );

  const onPresetClick = useCallback(
    (janela: "tudo" | "30" | "90") => {
      persistFiltersLs(userEmail, {
        date: { kind: "preset", janela },
        statusAllowlist: stats.statusAllowlist,
      });
    },
    [stats.statusAllowlist, userEmail],
  );

  const janelaLabel: Record<CrmDashboardJanela, string> = {
    tudo: "Todo o período",
    "30": "Últimos 30 dias",
    "90": "Últimos 90 dias",
    custom: "Intervalo personalizado",
  };

  const activePreset: "tudo" | "30" | "90" | null =
    stats.dateFilter.type === "preset" ? stats.dateFilter.janela : null;

  const vis = hydrated ? visibility : DEFAULT_VISIBILITY;

  function toggleStatusKey(key: string) {
    setStatusSelection((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function selectAllStatuses() {
    setStatusSelection(
      uiSelectionFromAllowlist(null),
    );
  }

  function clearAllStatuses() {
    setStatusSelection(new Set());
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ocean-900 md:text-3xl">
            Dashboard
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-ocean-700">
            Números do quadro de leads. O período filtra pela data em que o
            pedido entrou (
            <code className="rounded bg-ocean-50 px-1 text-xs">data_pedido</code>
            ). Intervalos personalizados usam início e fim do dia em{" "}
            <strong className="font-medium text-ocean-900">UTC</strong>. Podes
            restringir também por estados; as preferências de período e estados
            guardam-se neste browser (chave{" "}
            <code className="rounded bg-ocean-50 px-1 text-xs">
              crm-dashboard-filters:v1
            </code>
            ).
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setFiltersOpen((o) => !o)}
            className="inline-flex items-center gap-2 rounded-2xl border border-ocean-200 bg-white px-4 py-2 text-sm font-medium text-ocean-800 shadow-sm transition hover:bg-ocean-50"
          >
            <LayoutGrid className="h-4 w-4 shrink-0" aria-hidden />
            Filtros (datas e estados)
          </button>
          <button
            type="button"
            onClick={() => setSettingsOpen((o) => !o)}
            className="inline-flex items-center gap-2 rounded-2xl border border-ocean-200 bg-white px-4 py-2 text-sm font-medium text-ocean-800 shadow-sm transition hover:bg-ocean-50"
          >
            <Settings2 className="h-4 w-4 shrink-0" aria-hidden />
            Personalizar widgets
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-ocean-100 bg-white p-4 shadow-sm md:p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-ocean-500">
          Período activo
        </p>
        <p className="mt-2 text-sm text-ocean-800">
          <span className="font-semibold text-ocean-900">
            {stats.periodLabel}
          </span>
        </p>
        <p className="mt-1 text-sm text-ocean-700">
          Estados:{" "}
          <span className="font-medium text-ocean-900">
            {stats.statusFilterLabel}
          </span>
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {(["tudo", "30", "90"] as const).map((j) => (
            <Link
              key={j}
              href={presetHref(j)}
              scroll={false}
              onClick={() => onPresetClick(j)}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                activePreset === j
                  ? "bg-ocean-900 text-white shadow"
                  : "border border-ocean-200 bg-ocean-50/50 text-ocean-800 hover:bg-ocean-100"
              }`}
            >
              {janelaLabel[j]}
            </Link>
          ))}
        </div>
        <p className="mt-3 text-xs text-ocean-600">
          Total de fichas neste filtro:{" "}
          <span className="font-semibold text-ocean-900">{stats.total}</span>
          {pendingNav ? (
            <Loader2
              className="ml-2 inline h-3.5 w-3.5 animate-spin text-ocean-500"
              aria-hidden
            />
          ) : null}
        </p>
      </div>

      {filtersOpen ? (
        <div
          className="rounded-2xl border border-ocean-200 bg-ocean-50/60 p-4 md:p-5"
          role="region"
          aria-label="Filtros de datas e estados"
        >
          <p className="text-sm font-semibold text-ocean-900">
            Intervalo personalizado (UTC)
          </p>
          <p className="mt-1 text-xs text-ocean-600">
            O dia começa às 00:00:00 UTC e termina às 23:59:59.999 UTC.
          </p>
          <div className="mt-3 flex flex-wrap items-end gap-3">
            <label className="text-xs font-semibold text-ocean-600">
              Desde
              <input
                type="date"
                value={desdeInput}
                onChange={(e) => setDesdeInput(e.target.value)}
                className="mt-1 block rounded-xl border border-ocean-200 bg-white px-3 py-2 text-sm text-ocean-900"
              />
            </label>
            <label className="text-xs font-semibold text-ocean-600">
              Até
              <input
                type="date"
                value={ateInput}
                onChange={(e) => setAteInput(e.target.value)}
                className="mt-1 block rounded-xl border border-ocean-200 bg-white px-3 py-2 text-sm text-ocean-900"
              />
            </label>
            <button
              type="button"
              disabled={pendingNav}
              onClick={() => applyCustomRangeAndStates()}
              className="rounded-xl bg-ocean-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              Aplicar datas e estados
            </button>
          </div>
          {filterHint ? (
            <p className="mt-2 text-sm text-red-700">{filterHint}</p>
          ) : null}

          <div className="mt-6 border-t border-ocean-200 pt-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-ocean-900">
                Estados a incluir nas contagens
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => selectAllStatuses()}
                  className="rounded-lg border border-ocean-200 bg-white px-2 py-1 text-xs font-medium text-ocean-800"
                >
                  Todos
                </button>
                <button
                  type="button"
                  onClick={() => clearAllStatuses()}
                  className="rounded-lg border border-ocean-200 bg-white px-2 py-1 text-xs font-medium text-ocean-800"
                >
                  Nenhum
                </button>
              </div>
            </div>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {STATUS_FILTER_ROWS.map((row) => (
                <li key={row.key}>
                  <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-ocean-100 bg-white px-3 py-2 text-sm text-ocean-800 shadow-sm">
                    <input
                      type="checkbox"
                      checked={statusSelection.has(row.key)}
                      onChange={() => toggleStatusKey(row.key)}
                      className="h-4 w-4 rounded border-ocean-300 text-ocean-800"
                    />
                    {row.label}
                  </label>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-ocean-600">
              Depois de alterar caixas, carrega em «Aplicar datas e estados» (também
              revalida quando mudas só o intervalo).
            </p>
          </div>
        </div>
      ) : null}

      {settingsOpen ? (
        <div
          className="rounded-2xl border border-ocean-200 bg-ocean-50/60 p-4 md:p-5"
          role="region"
          aria-label="Definições dos widgets"
        >
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-ocean-900">
            <LayoutGrid className="h-4 w-4" aria-hidden />
            Mostrar ou ocultar cartões
          </div>
          <p className="mb-4 text-xs text-ocean-600">
            A escolha fica guardada neste browser (por utilizadora). Podes
            ligar e desligar cada bloco; os números vêm sempre do servidor.
          </p>
          <ul className="grid gap-2 sm:grid-cols-2">
            {CRM_DASHBOARD_WIDGET_IDS.map((id) => (
              <li key={id}>
                <button
                  type="button"
                  onClick={() => toggle(id)}
                  className={`flex w-full items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-left text-sm transition ${
                    vis[id]
                      ? "border-ocean-200 bg-white text-ocean-900 shadow-sm hover:border-ocean-300"
                      : "border-ocean-100 bg-white/70 text-ocean-500 hover:bg-white"
                  }`}
                >
                  <span>{WIDGET_LABELS[id]}</span>
                  {vis[id] ? (
                    <Eye className="h-4 w-4 shrink-0 text-ocean-600" />
                  ) : (
                    <EyeOff className="h-4 w-4 shrink-0 text-ocean-400" />
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {vis.open ? (
          <StatCard
            title="Leads em aberto"
            value={stats.openLeads}
            hint="Nem Ganho, nem Cancelado, nem Arquivado (inclui «Outros estados» se existirem e estiverem no filtro)."
          />
        ) : null}
        {vis.closed_won ? (
          <StatCard
            title="Ganho"
            value={stats.closedWon}
            hint="Estado «Ganho» no universo filtrado."
          />
        ) : null}
        {vis.closed_cancelled ? (
          <StatCard
            title="Cancelado"
            value={stats.closedCancelled}
            hint="Estado «Cancelado» no universo filtrado."
          />
        ) : null}
        {vis.closed_archived ? (
          <StatCard
            title="Arquivo geral"
            value={stats.closedArchived}
            hint="Estado «Arquivado» (pausado / sem conversão)."
          />
        ) : null}
        {vis.revenue_won ? (
          <MoneyStatCard
            title="Total faturado"
            amount={stats.totalFaturadoEUR}
            hint="Soma do campo «valor total» da última proposta gravada na ficha (`detalhes_proposta`), só para leads em Ganho dentro do período e estados seleccionados. Valores não reconhecidos são ignorados."
          />
        ) : null}
        {vis.revenue_lost ? (
          <MoneyStatCard
            title="Total perdido"
            amount={stats.totalPerdidoEUR}
            hint="Igual ao faturado, mas para leads em Cancelado no filtro actual."
          />
        ) : null}
        {vis.revenue_potential ? (
          <MoneyStatCard
            title="Total potencial"
            amount={stats.totalPotencialEUR}
            hint="Soma do valor na ficha para leads em aberto (nem Ganho, nem Cancelado, nem Arquivado) que entram no filtro."
          />
        ) : null}
        {vis.unread ? (
          <StatCard
            title="Com mensagem nova"
            value={stats.unreadLeads}
            hint="Fichas com ponto vermelho (email ou mensagem por tratar), dentro do filtro."
          />
        ) : null}
        {vis.conversion ? (
          <div className="sm:col-span-2 lg:col-span-3">
            <div className="rounded-2xl border border-ocean-100 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-ocean-900">
                Taxa de conversão (decisão final)
              </h2>
              <p className="mt-1 text-3xl font-bold tabular-nums text-ocean-900">
                {pct(stats.conversionRate)}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-ocean-700">
                <strong className="text-ocean-900">Fórmula:</strong> Ganho ÷
                (Ganho + Cancelado), só com fichas no universo actual (período +
                estados seleccionados). O Arquivado{" "}
                <strong className="text-ocean-900">não entra</strong> no
                denominador — mede a decisão entre ganhar ou cancelar depois de
                trabalhada a oportunidade.
              </p>
              <p className="mt-2 text-xs text-ocean-500">
                Valores: {stats.conversionGanho} ganho ·{" "}
                {stats.conversionCancelado} cancelado
                {stats.conversionGanho + stats.conversionCancelado === 0
                  ? " — sem fechos neste filtro, por isso mostramos «—»."
                  : ""}
              </p>
            </div>
          </div>
        ) : null}
        {vis.hit_ratio ? (
          <div className="sm:col-span-2 lg:col-span-3">
            <div className="rounded-2xl border border-ocean-100 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-ocean-900">
                Hit ratio (ligado a proposta / orçamento)
              </h2>
              <p className="mt-1 text-3xl font-bold tabular-nums text-ocean-900">
                {pct(stats.hitRatio)}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-ocean-700">
                <strong className="text-ocean-900">Fórmula:</strong> Ganho ÷
                número de leads no universo filtrado com{" "}
                <code className="rounded bg-ocean-50 px-1 text-xs">
                  data_envio_orcamento
                </code>{" "}
                preenchida. É um denominador diferente da taxa de conversão
                acima: mede ganhos face a quem recebeu proposta registada no CRM,
                não face a cancelamentos.
              </p>
              <p className="mt-2 text-xs text-ocean-500">
                Denominador (com proposta enviada): {stats.hitRatioDenominator}{" "}
                · Ganho no filtro: {stats.conversionGanho}
                {stats.hitRatioDenominator === 0
                  ? " — sem envios registados neste filtro."
                  : ""}
              </p>
            </div>
          </div>
        ) : null}
        {vis.by_status ? (
          <div className="sm:col-span-2 lg:col-span-3">
            <div className="rounded-2xl border border-ocean-100 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-ocean-900">
                Por estado
              </h2>
              <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {LEAD_BOARD_COLUMNS.map((col) => (
                  <li
                    key={col.status}
                    className="flex items-center justify-between rounded-xl border border-ocean-100 bg-ocean-50/30 px-3 py-2 text-sm"
                  >
                    <span className="text-ocean-800">{col.title}</span>
                    <span className="font-semibold tabular-nums text-ocean-900">
                      {stats.byStatus[col.status] ?? 0}
                    </span>
                  </li>
                ))}
                {(stats.byStatus[OUTROS_COLUMN_KEY] ?? 0) > 0 ? (
                  <li className="flex items-center justify-between rounded-xl border border-terracotta/30 bg-terracotta/5 px-3 py-2 text-sm">
                    <span className="text-ocean-800">Outros estados</span>
                    <span className="font-semibold tabular-nums text-ocean-900">
                      {stats.byStatus[OUTROS_COLUMN_KEY] ?? 0}
                    </span>
                  </li>
                ) : null}
              </ul>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  hint,
}: {
  title: string;
  value: number;
  hint: string;
}) {
  return (
    <div className="rounded-2xl border border-ocean-100 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-medium text-ocean-600">{title}</h2>
      <p className="mt-2 text-3xl font-bold tabular-nums text-ocean-900">
        {value}
      </p>
      <p className="mt-3 text-xs leading-relaxed text-ocean-500">{hint}</p>
    </div>
  );
}

function MoneyStatCard({
  title,
  amount,
  hint,
}: {
  title: string;
  amount: number;
  hint: string;
}) {
  return (
    <div className="rounded-2xl border border-ocean-100 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-medium text-ocean-600">{title}</h2>
      <p className="mt-2 text-2xl font-bold tabular-nums text-ocean-900 sm:text-3xl">
        {formatEUR(amount)}
      </p>
      <p className="mt-3 text-xs leading-relaxed text-ocean-500">{hint}</p>
    </div>
  );
}
