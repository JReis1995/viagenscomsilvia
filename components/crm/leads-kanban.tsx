"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { updateLeadStatusAction } from "@/app/(dashboard)/crm/actions";
import { LeadQuizDetailModal } from "@/components/crm/lead-quiz-detail-modal";
import { ProposalSendModal } from "@/components/crm/proposal-send-modal";
import {
  LEAD_BOARD_COLUMNS,
  OUTROS_COLUMN_KEY,
  groupLeadsByBoardColumn,
  type LeadBoardStatus,
} from "@/lib/crm/lead-board";
import type { LeadBoardRow } from "@/types/lead";

type ClientThreadEntry = { message: string; created_at: string };

type Props = {
  initialLeads: LeadBoardRow[];
  /** Mensagens enviadas pelo cliente (área /conta), por id da lead. */
  clientThreadsByLeadId?: Record<string, ClientThreadEntry[]>;
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

function ClientThreadPanel({
  leadId,
  threads,
}: {
  leadId: string;
  threads: Record<string, ClientThreadEntry[]>;
}) {
  const t = threads[leadId];
  if (!t?.length) return null;
  return (
    <details className="mt-3 rounded-lg border border-ocean-200 bg-ocean-50/60 px-2 py-2 text-left">
      <summary className="cursor-pointer list-none text-xs font-semibold text-ocean-800 [&::-webkit-details-marker]:hidden">
        Mensagens do cliente ({t.length})
      </summary>
      <ul className="mt-2 max-h-40 space-y-2 overflow-y-auto border-t border-ocean-100 pt-2">
        {t.map((m, i) => (
          <li
            key={`${m.created_at}-${i}`}
            className="rounded-md bg-white/80 px-2 py-1.5 text-xs text-ocean-800"
          >
            <p className="whitespace-pre-wrap">{m.message}</p>
            <p className="mt-0.5 text-[10px] text-ocean-500">
              {formatPedidoDate(m.created_at)}
            </p>
          </li>
        ))}
      </ul>
    </details>
  );
}

export function LeadsKanban({
  initialLeads,
  clientThreadsByLeadId = {},
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

  useEffect(() => {
    leadsRef.current = leads;
  }, [leads]);

  const grouped = useMemo(() => groupLeadsByBoardColumn(leads), [leads]);
  const outrosCount = grouped.get(OUTROS_COLUMN_KEY)?.length ?? 0;

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

      <div className="flex gap-4 overflow-x-auto pb-3 [-ms-overflow-style:none] [scrollbar-width:thin] [&::-webkit-scrollbar]:h-1.5">
        {LEAD_BOARD_COLUMNS.map((col) => {
          const list = grouped.get(col.status) ?? [];
          const isOver =
            dragOverColumn === col.status &&
            dragLeadId !== null;

          return (
            <div
              key={col.status}
              className="flex w-[min(100%,320px)] shrink-0 flex-col rounded-2xl border border-ocean-100/90 bg-ocean-50/40"
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
                  {list.length}{" "}
                  {list.length === 1 ? "lead" : "leads"}
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
                        dragLeadId === lead.id ? "opacity-50 ring-2 ring-ocean-400/50" : ""
                      } ${updatingId === lead.id ? "cursor-wait" : "cursor-grab active:cursor-grabbing"}`}
                    >
                      <div className="flex flex-col gap-1">
                        <p className="font-medium text-ocean-900">
                          {lead.nome}
                        </p>
                        <a
                          href={`mailto:${encodeURIComponent(lead.email)}`}
                          className="truncate text-sm text-ocean-600 underline-offset-2 hover:text-ocean-800 hover:underline"
                        >
                          {lead.email}
                        </a>
                        {lead.telemovel?.trim() ? (
                          <a
                            href={`tel:${lead.telemovel.replace(/\s/g, "")}`}
                            className="truncate text-xs font-medium text-ocean-700 underline-offset-2 hover:text-ocean-900 hover:underline"
                          >
                            {lead.telemovel.trim()}
                          </a>
                        ) : null}
                        <p className="text-xs text-ocean-500">
                          Pedido · {formatPedidoDate(lead.data_pedido)}
                        </p>
                        {lead.destino_sonho ? (
                          <p className="mt-2 line-clamp-2 text-sm text-ocean-700">
                            {lead.destino_sonho}
                          </p>
                        ) : null}
                        {lead.data_envio_orcamento ? (
                          <p className="mt-2 text-[11px] font-medium text-ocean-600">
                            Orçamento enviado ·{" "}
                            {formatPedidoDate(lead.data_envio_orcamento)}
                          </p>
                        ) : null}
                        <ClientThreadPanel
                          leadId={lead.id}
                          threads={clientThreadsByLeadId}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => setQuizDetailLeadId(lead.id)}
                        className="mt-3 w-full rounded-xl border border-ocean-200/90 bg-sand/40 py-2 text-xs font-semibold text-ocean-800 transition hover:bg-sand/60"
                      >
                        Ver brief do pedido
                      </button>
                      <button
                        type="button"
                        onClick={() => setProposalLeadId(lead.id)}
                        className="mt-2 w-full rounded-xl border border-ocean-200 bg-white py-2 text-xs font-semibold text-ocean-800 transition hover:bg-ocean-50"
                      >
                        Enviar orçamento (PDF + email)
                      </button>
                      <label className="mt-3 flex flex-col gap-1">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-ocean-500">
                          Estado
                        </span>
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
                      </label>
                    </article>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}

        {outrosCount > 0 ? (
          <div
            className="flex w-[min(100%,320px)] shrink-0 flex-col rounded-2xl border border-dashed border-ocean-200 bg-white/50"
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
              /* Não gravamos __outros__ na BD — largar aqui não altera estado */
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
                    } ${updatingId === lead.id ? "cursor-wait" : "cursor-grab active:cursor-grabbing"}`}
                  >
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-800/90">
                      Estado na BD: {lead.status}
                    </p>
                    <p className="mt-2 font-medium text-ocean-900">
                      {lead.nome}
                    </p>
                    <a
                      href={`mailto:${encodeURIComponent(lead.email)}`}
                      className="mt-1 block truncate text-sm text-ocean-600 underline-offset-2 hover:underline"
                    >
                      {lead.email}
                    </a>
                    {lead.telemovel?.trim() ? (
                      <a
                        href={`tel:${lead.telemovel.replace(/\s/g, "")}`}
                        className="mt-0.5 block truncate text-xs font-medium text-ocean-700 underline-offset-2 hover:underline"
                      >
                        {lead.telemovel.trim()}
                      </a>
                    ) : null}
                    {lead.data_envio_orcamento ? (
                      <p className="mt-2 text-[11px] font-medium text-ocean-600">
                        Orçamento enviado ·{" "}
                        {formatPedidoDate(lead.data_envio_orcamento)}
                      </p>
                    ) : null}
                    <ClientThreadPanel
                      leadId={lead.id}
                      threads={clientThreadsByLeadId}
                    />
                    <button
                      type="button"
                      onClick={() => setQuizDetailLeadId(lead.id)}
                      className="mt-3 w-full rounded-xl border border-ocean-200/90 bg-sand/40 py-2 text-xs font-semibold text-ocean-800 transition hover:bg-sand/60"
                    >
                      Ver brief do pedido
                    </button>
                    <button
                      type="button"
                      onClick={() => setProposalLeadId(lead.id)}
                      className="mt-2 w-full rounded-xl border border-ocean-200 bg-white py-2 text-xs font-semibold text-ocean-800 transition hover:bg-ocean-50"
                    >
                      Enviar orçamento (PDF + email)
                    </button>
                    <label className="mt-3 flex flex-col gap-1">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-ocean-500">
                        Normalizar para
                      </span>
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
                    </label>
                  </article>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

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
    </div>
  );
}
