"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { updateLeadStatusAction } from "@/app/(dashboard)/crm/actions";
import {
  LeadEmailComposeModal,
  type EmailComposePreset,
} from "@/components/crm/lead-email-compose-modal";
import { LeadHistoryModal } from "@/components/crm/lead-history-modal";
import { LeadQuizDetailModal } from "@/components/crm/lead-quiz-detail-modal";
import { ProposalSendModal } from "@/components/crm/proposal-send-modal";
import {
  LEAD_BOARD_COLUMNS,
  OUTROS_COLUMN_KEY,
  groupLeadsByBoardColumn,
  isCanonicalLeadStatus,
  type LeadBoardStatus,
} from "@/lib/crm/lead-board";
import { buildLeadTimeline } from "@/lib/crm/lead-timeline";
import type {
  ClientDecisionEntry,
  ClientThreadEntry,
  CrmThreadEmailEntry,
} from "@/lib/crm/lead-timeline";
import { leadUrgency, sortLeadsByUrgency } from "@/lib/crm/lead-urgency";
import { whatsappHrefForLead } from "@/lib/crm/whatsapp-lead-link";
import type { LeadBoardRow } from "@/types/lead";

type Props = {
  initialLeads: LeadBoardRow[];
  /** Mensagens enviadas pelo cliente (área /conta), por id da lead. */
  clientThreadsByLeadId?: Record<string, ClientThreadEntry[]>;
  /** Aprovações / pedidos de alteração (área /conta). */
  clientDecisionsByLeadId?: Record<string, ClientDecisionEntry[]>;
  /** Emails enviados pelo CRM (Resend), por id da lead. */
  crmOutboundByLeadId?: Record<string, CrmThreadEmailEntry[]>;
};

function formatPedidoDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("pt-PT", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function LeadQuickContactBar({
  lead,
  onComposeEmail,
}: {
  lead: LeadBoardRow;
  onComposeEmail: () => void;
}) {
  const wa = useMemo(
    () => whatsappHrefForLead(lead.telemovel, lead.nome),
    [lead.telemovel, lead.nome],
  );
  const [flash, setFlash] = useState<"email" | "tel" | null>(null);

  const telClean = lead.telemovel?.replace(/\s/g, "") ?? "";

  async function copyToClipboard(text: string, kind: "email" | "tel") {
    try {
      await navigator.clipboard.writeText(text);
      setFlash(kind);
      window.setTimeout(() => setFlash(null), 1400);
    } catch {
      setFlash(null);
    }
  }

  return (
    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
      <button
        type="button"
        className="rounded-lg border border-ocean-200 bg-white px-2 py-1 text-[11px] font-semibold text-ocean-800 transition hover:bg-ocean-50"
        onClick={() => void copyToClipboard(lead.email, "email")}
      >
        {flash === "email" ? "Copiado" : "Copiar email"}
      </button>
      {telClean ? (
        <button
          type="button"
          className="rounded-lg border border-ocean-200 bg-white px-2 py-1 text-[11px] font-semibold text-ocean-800 transition hover:bg-ocean-50"
          onClick={() => void copyToClipboard(telClean, "tel")}
        >
          {flash === "tel" ? "Copiado" : "Copiar telemóvel"}
        </button>
      ) : null}
      <button
        type="button"
        className="rounded-lg border border-ocean-200 bg-ocean-50/80 px-2 py-1 text-[11px] font-semibold text-ocean-800 hover:bg-ocean-100"
        onClick={onComposeEmail}
      >
        Email
      </button>
      {wa ? (
        <a
          href={wa}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center rounded-lg border border-emerald-200 bg-emerald-50/90 px-2 py-1 text-[11px] font-semibold text-emerald-900 hover:bg-emerald-100"
          title="WhatsApp — só com consentimento da lead"
        >
          WhatsApp
        </a>
      ) : null}
    </div>
  );
}

type LeadCardInnerProps = {
  lead: LeadBoardRow;
  showUrgencyLine: boolean;
  showStatusBadge?: boolean;
  historyCount: number;
  onOpenHistory: () => void;
  onComposeEmail: () => void;
};

function LeadCardInner({
  lead,
  showUrgencyLine,
  showStatusBadge,
  historyCount,
  onOpenHistory,
  onComposeEmail,
}: LeadCardInnerProps) {
  const urgency = useMemo(() => leadUrgency(lead), [lead]);

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex flex-wrap items-center gap-2">
          {showStatusBadge ? (
            <span className="inline-flex rounded-full border border-ocean-200 bg-ocean-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-ocean-800">
              {lead.status}
            </span>
          ) : null}
          {showUrgencyLine ? (
            <span
              className="inline-flex max-w-full rounded-full bg-amber-100/90 px-2 py-0.5 text-[10px] font-medium text-amber-950"
              title={urgency.reason}
            >
              {urgency.reason}
            </span>
          ) : null}
        </div>
        <button
          type="button"
          onClick={onOpenHistory}
          className="shrink-0 rounded-lg border border-ocean-200 bg-white px-2 py-1 text-[10px] font-semibold text-ocean-800 hover:bg-ocean-50"
        >
          Histórico{historyCount > 0 ? ` (${historyCount})` : ""}
        </button>
      </div>

      <div className="mt-2 flex flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-medium text-ocean-900">{lead.nome}</p>
          {lead.pedido_rapido ? (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-900">
              Rápido
            </span>
          ) : null}
        </div>
        <p
          className="truncate font-mono text-xs text-ocean-600"
          title={lead.email}
        >
          {lead.email}
        </p>
        {lead.telemovel?.trim() ? (
          <a
            href={`tel:${lead.telemovel.replace(/\s/g, "")}`}
            className="truncate text-xs font-medium text-ocean-700 underline-offset-2 hover:text-ocean-900 hover:underline"
          >
            {lead.telemovel.trim()}
          </a>
        ) : null}
        <LeadQuickContactBar lead={lead} onComposeEmail={onComposeEmail} />
        <p className="text-[11px] text-ocean-500">
          Pedido · {formatPedidoDate(lead.data_pedido)}
        </p>
        {lead.destino_sonho ? (
          <p className="line-clamp-2 text-sm text-ocean-700">
            {lead.destino_sonho}
          </p>
        ) : null}
        {lead.utm_source?.trim() ||
        lead.utm_campaign?.trim() ||
        lead.landing_path?.trim() ? (
          <p className="text-[10px] leading-snug text-ocean-500">
            {lead.utm_source?.trim() ? (
              <span>
                origem: {lead.utm_source.trim()}
                {lead.utm_medium?.trim()
                  ? ` / ${lead.utm_medium.trim()}`
                  : ""}
                {lead.utm_campaign?.trim()
                  ? ` · ${lead.utm_campaign.trim()}`
                  : ""}
              </span>
            ) : null}
            {lead.landing_path?.trim() ? (
              <span className="mt-0.5 block truncate">
                entrada: {lead.landing_path.trim()}
              </span>
            ) : null}
          </p>
        ) : null}
        {lead.data_envio_orcamento ? (
          <p className="text-[11px] font-medium text-ocean-600">
            Orçamento enviado ·{" "}
            {formatPedidoDate(lead.data_envio_orcamento)}
          </p>
        ) : null}
      </div>
    </>
  );
}

export function LeadsKanban({
  initialLeads,
  clientThreadsByLeadId = {},
  clientDecisionsByLeadId = {},
  crmOutboundByLeadId = {},
}: Props) {
  const [leads, setLeads] = useState<LeadBoardRow[]>(initialLeads);
  const leadsRef = useRef(leads);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragLeadId, setDragLeadId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [proposalLeadId, setProposalLeadId] = useState<string | null>(null);
  const [quizDetailLeadId, setQuizDetailLeadId] = useState<string | null>(
    null,
  );
  const [viewMode, setViewMode] = useState<"board" | "today">("board");
  const [composeState, setComposeState] = useState<{
    leadId: string;
    preset: EmailComposePreset;
  } | null>(null);
  const [historyLeadId, setHistoryLeadId] = useState<string | null>(null);

  useEffect(() => {
    leadsRef.current = leads;
  }, [leads]);

  const grouped = useMemo(() => groupLeadsByBoardColumn(leads), [leads]);
  const outrosCount = grouped.get(OUTROS_COLUMN_KEY)?.length ?? 0;
  const todayOrdered = useMemo(() => sortLeadsByUrgency(leads), [leads]);

  const moveLeadToStatus = useCallback(
    async (leadId: string, newStatus: LeadBoardStatus) => {
      const previous = leadsRef.current;
      const target = previous.find((l) => l.id === leadId);
      if (!target || target.status === newStatus) return;

      setUpdatingId(leadId);
      setError(null);
      setLeads((list) =>
        list.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l)),
      );

      const res = await updateLeadStatusAction(leadId, newStatus);

      setUpdatingId(null);

      if (!res.ok) {
        setLeads(previous);
        setError(
          res.error ||
            "Não foi possível atualizar o estado. Verifica a ligação e tenta de novo.",
        );
      }
    },
    [],
  );

  const statusOptions = useMemo(
    () => LEAD_BOARD_COLUMNS.map((c) => c.status),
    [],
  );

  const proposalLead = useMemo(
    () => (proposalLeadId ? leads.find((l) => l.id === proposalLeadId) : null),
    [leads, proposalLeadId],
  );

  const quizDetailLead = useMemo(
    () =>
      quizDetailLeadId ? leads.find((l) => l.id === quizDetailLeadId) : null,
    [leads, quizDetailLeadId],
  );

  const composeLead = useMemo(() => {
    if (!composeState) return null;
    return leads.find((l) => l.id === composeState.leadId) ?? null;
  }, [leads, composeState]);

  const historyLead = useMemo(() => {
    if (!historyLeadId) return null;
    return leads.find((l) => l.id === historyLeadId) ?? null;
  }, [leads, historyLeadId]);

  function openEmailCompose(leadId: string, preset: EmailComposePreset) {
    setComposeState({ leadId, preset });
  }

  function preferFollowUpFirst(lead: LeadBoardRow): boolean {
    if (!lead.data_envio_orcamento) return false;
    return (
      lead.status === "Proposta enviada" || lead.status === "Em contacto"
    );
  }

  function leadActions(lead: LeadBoardRow, ctx: "board" | "today") {
    const terminal =
      lead.status === "Ganho" ||
      lead.status === "Cancelado" ||
      lead.status === "Arquivado";

    const followUpFirst =
      ctx === "today" && !terminal && preferFollowUpFirst(lead);

    return (
      <>
        <button
          type="button"
          onClick={() => setQuizDetailLeadId(lead.id)}
          className="mt-3 w-full rounded-xl border border-ocean-200/90 bg-sand/40 py-2 text-xs font-semibold text-ocean-800 transition hover:bg-sand/60"
        >
          Ver brief do pedido
        </button>
        {terminal ? (
          <button
            type="button"
            onClick={() => openEmailCompose(lead.id, "free")}
            className="mt-2 w-full rounded-xl border border-ocean-200 bg-white py-2 text-xs font-semibold text-ocean-800 transition hover:bg-ocean-50"
          >
            Email ao cliente
          </button>
        ) : followUpFirst ? (
          <>
            <button
              type="button"
              onClick={() => openEmailCompose(lead.id, "followup")}
              className="mt-2 w-full rounded-xl bg-ocean-900 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-ocean-800"
            >
              Follow-up por email
            </button>
            <button
              type="button"
              onClick={() => setProposalLeadId(lead.id)}
              className="mt-2 w-full rounded-xl border border-ocean-200 bg-white py-2 text-xs font-semibold text-ocean-800 transition hover:bg-ocean-50"
            >
              Reenviar orçamento (PDF)
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setProposalLeadId(lead.id)}
            className="mt-2 w-full rounded-xl border border-ocean-200 bg-white py-2 text-xs font-semibold text-ocean-800 transition hover:bg-ocean-50"
          >
            Enviar orçamento (PDF + email)
          </button>
        )}
        <label className="mt-3 flex flex-col gap-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-ocean-500">
            {isCanonicalLeadStatus(lead.status) ? "Estado" : "Normalizar para"}
          </span>
          {isCanonicalLeadStatus(lead.status) ? (
            <select
              className="rounded-lg border border-ocean-200 bg-sand/50 px-2 py-1.5 text-sm text-ocean-800"
              value={lead.status}
              onChange={(e) => {
                const v = e.target.value as LeadBoardStatus;
                void moveLeadToStatus(lead.id, v);
              }}
              disabled={updatingId === lead.id}
            >
              {statusOptions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          ) : (
            <select
              className="rounded-lg border border-ocean-200 bg-sand/50 px-2 py-1.5 text-sm text-ocean-800"
              defaultValue=""
              onChange={(e) => {
                const v = e.target.value as LeadBoardStatus;
                if (v) void moveLeadToStatus(lead.id, v);
              }}
              disabled={updatingId === lead.id}
            >
              <option value="" disabled>
                Escolher coluna…
              </option>
              {statusOptions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          )}
        </label>
      </>
    );
  }

  return (
    <div className="space-y-6">
      {error ? (
        <div
          className="rounded-2xl border border-terracotta/40 bg-terracotta/10 px-4 py-3 text-sm text-ocean-900"
          role="alert"
        >
          {error}
        </div>
      ) : null}

      <div className="flex flex-col gap-3 rounded-2xl border border-ocean-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 text-sm text-ocean-700">
          <p className="font-medium text-ocean-900">Vista do painel</p>
          <p className="mt-1 text-xs text-ocean-600">
            {viewMode === "board"
              ? "Quadro por estado."
              : "Fila por urgência; com orçamento enviado, «Follow-up por email» abre Gmail/Outlook na web."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <div
            className="inline-flex rounded-xl border border-ocean-200 bg-ocean-50/50 p-0.5"
            role="group"
            aria-label="Alternar vista"
          >
            <button
              type="button"
              onClick={() => setViewMode("board")}
              className={`rounded-[10px] px-3 py-1.5 text-xs font-semibold transition ${
                viewMode === "board"
                  ? "bg-ocean-900 text-white shadow-sm"
                  : "text-ocean-700 hover:bg-white/80"
              }`}
            >
              Quadro
            </button>
            <button
              type="button"
              onClick={() => setViewMode("today")}
              className={`rounded-[10px] px-3 py-1.5 text-xs font-semibold transition ${
                viewMode === "today"
                  ? "bg-ocean-900 text-white shadow-sm"
                  : "text-ocean-700 hover:bg-white/80"
              }`}
            >
              Hoje
            </button>
          </div>
          <Link
            href="/crm/primeiros-passos"
            className="text-xs font-medium text-ocean-600 underline decoration-ocean-300 underline-offset-2 hover:text-ocean-900"
          >
            Primeiros passos
          </Link>
        </div>
      </div>

      {viewMode === "today" ? (
        <div className="rounded-2xl border border-ocean-100/90 bg-ocean-50/30 p-4">
          {todayOrdered.length === 0 ? (
            <p className="text-sm text-ocean-600">Sem leads.</p>
          ) : (
            <ul className="space-y-4">
              {todayOrdered.map((lead) => (
                <li key={lead.id}>
                  <article
                    className={`rounded-xl border border-ocean-100 bg-white p-4 shadow-sm ${
                      updatingId === lead.id ? "opacity-60" : ""
                    }`}
                  >
                    <LeadCardInner
                      lead={lead}
                      showUrgencyLine
                      showStatusBadge
                      historyCount={
                        buildLeadTimeline(
                          lead,
                          clientThreadsByLeadId[lead.id] ?? [],
                          clientDecisionsByLeadId[lead.id] ?? [],
                          crmOutboundByLeadId[lead.id] ?? [],
                        ).length
                      }
                      onOpenHistory={() => setHistoryLeadId(lead.id)}
                      onComposeEmail={() =>
                        openEmailCompose(lead.id, "free")
                      }
                    />
                    {leadActions(lead, "today")}
                  </article>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <div className="flex touch-pan-x snap-x snap-mandatory gap-4 overflow-x-auto pb-3 [-ms-overflow-style:none] [scrollbar-width:thin] [&::-webkit-scrollbar]:h-1.5">
          {LEAD_BOARD_COLUMNS.map((col) => {
            const list = grouped.get(col.status) ?? [];
            const isOver =
              dragOverColumn === col.status && dragLeadId !== null;

            return (
              <div
                key={col.status}
                className="flex w-[min(100%,320px)] shrink-0 snap-start flex-col rounded-2xl border border-ocean-100/90 bg-ocean-50/40"
                data-column-status={col.status}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";
                  setDragOverColumn(col.status);
                }}
                onDragLeave={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                    setDragOverColumn((cur) =>
                      cur === col.status ? null : cur,
                    );
                  }
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  const id = e.dataTransfer.getData("text/lead-id");
                  setDragOverColumn(null);
                  setDragLeadId(null);
                  if (id) void moveLeadToStatus(id, col.status);
                }}
              >
                <div
                  className={`border-b border-ocean-100/80 px-4 py-3 transition-colors ${
                    isOver ? "bg-ocean-100/60" : "bg-white/60"
                  }`}
                >
                  <h2 className="font-semibold text-ocean-900">{col.title}</h2>
                  <p className="mt-0.5 text-xs text-ocean-600">{col.hint}</p>
                  <p className="mt-2 text-[11px] font-medium uppercase tracking-wider text-ocean-500">
                    {list.length} {list.length === 1 ? "lead" : "leads"}
                  </p>
                </div>
                <ul className="flex min-h-[120px] flex-1 flex-col gap-3 p-3">
                  {list.map((lead) => (
                    <li key={lead.id}>
                      <article
                        draggable={updatingId !== lead.id}
                        onDragStart={(e) => {
                          e.dataTransfer.setData("text/lead-id", lead.id);
                          e.dataTransfer.effectAllowed = "move";
                          setDragLeadId(lead.id);
                        }}
                        onDragEnd={() => {
                          setDragLeadId(null);
                          setDragOverColumn(null);
                        }}
                        className={`rounded-xl border border-ocean-100 bg-white p-4 shadow-sm transition ${
                          updatingId === lead.id ? "opacity-60" : ""
                        } ${
                          dragLeadId === lead.id
                            ? "opacity-50 ring-2 ring-ocean-400/50"
                            : ""
                        } ${
                          updatingId === lead.id
                            ? "cursor-wait"
                            : "cursor-grab active:cursor-grabbing"
                        }`}
                      >
                        <LeadCardInner
                          lead={lead}
                          showUrgencyLine={false}
                          historyCount={
                            buildLeadTimeline(
                              lead,
                              clientThreadsByLeadId[lead.id] ?? [],
                              clientDecisionsByLeadId[lead.id] ?? [],
                              crmOutboundByLeadId[lead.id] ?? [],
                            ).length
                          }
                          onOpenHistory={() => setHistoryLeadId(lead.id)}
                          onComposeEmail={() =>
                            openEmailCompose(lead.id, "free")
                          }
                        />
                        {leadActions(lead, "board")}
                      </article>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}

          {outrosCount > 0 ? (
            <div
              className="flex w-[min(100%,320px)] shrink-0 snap-start flex-col rounded-2xl border border-dashed border-ocean-200 bg-white/50"
              data-column-status={OUTROS_COLUMN_KEY}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOverColumn(OUTROS_COLUMN_KEY);
              }}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                  setDragOverColumn((cur) =>
                    cur === OUTROS_COLUMN_KEY ? null : cur,
                  );
                }
              }}
              onDrop={(e) => {
                e.preventDefault();
                setDragLeadId(null);
                setDragOverColumn(null);
              }}
            >
              <div className="border-b border-ocean-100/80 bg-amber-50/80 px-4 py-3">
                <h2 className="font-semibold text-ocean-900">Outros estados</h2>
                <p className="mt-0.5 text-xs text-ocean-600">
                  Valores antigos ou personalizados. Usa o menu Estado para
                  normalizar.
                </p>
                <p className="mt-2 text-[11px] font-medium uppercase tracking-wider text-ocean-500">
                  {outrosCount} {outrosCount === 1 ? "lead" : "leads"}
                </p>
              </div>
              <ul className="flex min-h-[120px] flex-1 flex-col gap-3 p-3">
                {(grouped.get(OUTROS_COLUMN_KEY) ?? []).map((lead) => (
                  <li key={lead.id}>
                    <article
                      draggable={updatingId !== lead.id}
                      onDragStart={(e) => {
                        e.dataTransfer.setData("text/lead-id", lead.id);
                        e.dataTransfer.effectAllowed = "move";
                        setDragLeadId(lead.id);
                      }}
                      onDragEnd={() => {
                        setDragLeadId(null);
                        setDragOverColumn(null);
                      }}
                      className={`rounded-xl border border-ocean-100 bg-white p-4 shadow-sm ${
                        updatingId === lead.id ? "opacity-60" : ""
                      } ${
                        updatingId === lead.id
                          ? "cursor-wait"
                          : "cursor-grab active:cursor-grabbing"
                      }`}
                    >
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-800/90">
                        Estado na BD: {lead.status}
                      </p>
                      <div className="mt-2">
                        <LeadCardInner
                          lead={lead}
                          showUrgencyLine={false}
                          historyCount={
                            buildLeadTimeline(
                              lead,
                              clientThreadsByLeadId[lead.id] ?? [],
                              clientDecisionsByLeadId[lead.id] ?? [],
                              crmOutboundByLeadId[lead.id] ?? [],
                            ).length
                          }
                          onOpenHistory={() => setHistoryLeadId(lead.id)}
                          onComposeEmail={() =>
                            openEmailCompose(lead.id, "free")
                          }
                        />
                      </div>
                      {leadActions(lead, "board")}
                    </article>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      )}

      <p className="text-xs text-ocean-500">
        Arrasta o cartão entre colunas ou usa o menu Estado. Em{" "}
        <strong className="font-medium text-ocean-700">
          Enviar orçamento
        </strong>{" "}
        pré-visualiza o PDF no modal e só depois envias por email; grava{" "}
        <code className="rounded bg-ocean-100/80 px-1 text-[10px]">
          detalhes_proposta
        </code>
        .
      </p>

      {quizDetailLead ? (
        <LeadQuizDetailModal
          lead={quizDetailLead}
          onClose={() => setQuizDetailLeadId(null)}
          clientThread={clientThreadsByLeadId[quizDetailLead.id] ?? []}
          clientDecisions={clientDecisionsByLeadId[quizDetailLead.id] ?? []}
          crmOutboundEmails={crmOutboundByLeadId[quizDetailLead.id] ?? []}
          onNotasSaved={(leadId, notas) =>
            setLeads((list) =>
              list.map((l) =>
                l.id === leadId ? { ...l, notas_internas: notas } : l,
              ),
            )
          }
        />
      ) : null}

      {proposalLead ? (
        <ProposalSendModal
          lead={proposalLead}
          onClose={() => setProposalLeadId(null)}
          onViewQuiz={() => {
            const id = proposalLead.id;
            setProposalLeadId(null);
            setQuizDetailLeadId(id);
          }}
        />
      ) : null}

      {composeLead && composeState ? (
        <LeadEmailComposeModal
          lead={composeLead}
          preset={composeState.preset}
          onClose={() => setComposeState(null)}
        />
      ) : null}

      {historyLead ? (
        <LeadHistoryModal
          lead={historyLead}
          clientThread={clientThreadsByLeadId[historyLead.id] ?? []}
          clientDecisions={clientDecisionsByLeadId[historyLead.id] ?? []}
          crmOutboundEmails={crmOutboundByLeadId[historyLead.id] ?? []}
          onClose={() => setHistoryLeadId(null)}
        />
      ) : null}
    </div>
  );
}
