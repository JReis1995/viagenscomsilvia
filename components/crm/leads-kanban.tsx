"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { updateLeadStatusAction } from "@/app/(dashboard)/crm/actions";
import {
  LeadEmailComposeModal,
  type EmailComposePreset,
} from "@/components/crm/lead-email-compose-modal";
import { LeadHistoryModal } from "@/components/crm/lead-history-modal";
import { LeadQuizDetailModal } from "@/components/crm/lead-quiz-detail-modal";
import { CrmManualLeadModal } from "@/components/crm/crm-manual-lead-modal";
import { ProposalSendModal } from "@/components/crm/proposal-send-modal";
import {
  LEAD_KANBAN_WORK_COLUMNS,
  OUTROS_COLUMN_KEY,
  groupLeadsForWorkBoard,
  type LeadBoardStatus,
} from "@/lib/crm/lead-board";
import type {
  ClientDecisionEntry,
  ClientThreadEntry,
  CrmThreadEmailEntry,
  LeadPropostaEnvioRow,
} from "@/lib/crm/lead-timeline";
import { parseDetalhesProposta } from "@/lib/crm/detalhes-proposta";
import { leadUrgency, sortLeadsByUrgency } from "@/lib/crm/lead-urgency";
import {
  leadCardSlaBorderClass,
  leadCardSlaBorderTone,
  leadHoursSincePedidoLabel,
} from "@/lib/crm/lead-sla";
import { whatsappHrefForLead } from "@/lib/crm/whatsapp-lead-link";
import {
  DEFAULT_SITE_CONTENT,
  type SiteContent,
} from "@/lib/site/site-content";
import type { LeadBoardRow } from "@/types/lead";

type Props = {
  initialLeads: LeadBoardRow[];
  /** Mensagens enviadas pelo cliente (área /conta), por id da lead. */
  clientThreadsByLeadId?: Record<string, ClientThreadEntry[]>;
  /** Aprovações / pedidos de alteração (área /conta). */
  clientDecisionsByLeadId?: Record<string, ClientDecisionEntry[]>;
  /** Emails enviados pelo CRM (Resend), por id da lead. */
  crmOutboundByLeadId?: Record<string, CrmThreadEmailEntry[]>;
  /** Histórico de envios de orçamento em PDF (tabela `lead_proposta_envios`). */
  propostaEnviosByLeadId?: Record<string, LeadPropostaEnvioRow[]>;
  /** Limiares SLA (horas) — editáveis em Conteúdo do site → Quadro de leads. */
  slaGreenMaxHours?: number;
  slaYellowMaxHours?: number;
  /** Rótulos do quiz (qualificação, duplicados). */
  quizCopy?: SiteContent["quiz"];
};

function IconCopy({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width={16}
      height={16}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function IconMail({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width={16}
      height={16}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  );
}

function IconFilePdf({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width={16}
      height={16}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <path d="M9 15h6M9 11h2" />
    </svg>
  );
}

function IconWhatsApp({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width={16}
      height={16}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function IconChat({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width={16}
      height={16}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

type LeadCardInnerProps = {
  lead: LeadBoardRow;
  showStatusLine?: boolean;
  /** Número de envios de orçamento (histórico + legado). */
  orcamentoEnviosCount: number;
  onComposeEmail: () => void;
  onVerDetalhes: () => void;
  onSendProposal: () => void;
  onOpenHistorico: () => void;
  /** Envia a ficha para a secção Arquivo (estado «Arquivado»). */
  onArchive?: () => void;
};

function LeadCardInner({
  lead,
  showStatusLine,
  orcamentoEnviosCount,
  onComposeEmail,
  onVerDetalhes,
  onSendProposal,
  onOpenHistorico,
  onArchive,
}: LeadCardInnerProps) {
  const wa = useMemo(
    () => whatsappHrefForLead(lead.telemovel, lead.nome),
    [lead.telemovel, lead.nome],
  );
  const [copyFlash, setCopyFlash] = useState(false);
  const slaText = useMemo(() => leadHoursSincePedidoLabel(lead), [lead]);
  const hasUnread = Boolean(lead.has_unread_messages);
  const ultimoValorOrcamento = useMemo(() => {
    const d = parseDetalhesProposta(lead.detalhes_proposta);
    return d?.valor_total?.trim() || null;
  }, [lead.detalhes_proposta]);

  const terminal =
    lead.status === "Ganho" ||
    lead.status === "Cancelado" ||
    lead.status === "Arquivado";

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(lead.email);
      setCopyFlash(true);
      window.setTimeout(() => setCopyFlash(false), 1200);
    } catch {
      setCopyFlash(false);
    }
  }

  return (
    <div className="relative pr-5">
      {hasUnread ? (
        <div
          className="absolute right-0 top-0 flex items-center gap-1"
          title="Nova mensagem por email"
        >
          <span className="sr-only">Nova mensagem por email</span>
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-full bg-red-500 shadow-sm ring-2 ring-white"
            aria-hidden
          />
        </div>
      ) : null}

      {showStatusLine ? (
        <div className="mb-2 inline-flex max-w-full rounded-lg border border-ocean-200 bg-ocean-50 px-2.5 py-1">
          <span className="text-xs font-semibold text-ocean-900">
            {lead.status}
          </span>
        </div>
      ) : null}

      <h3 className="text-base font-semibold leading-snug tracking-tight text-ocean-900">
        {lead.nome}
      </h3>

      <p
        className="mt-1.5 truncate text-xs text-ocean-600"
        title={lead.email}
      >
        {lead.email}
      </p>

      <div className="mt-1 flex items-center gap-1.5 text-xs text-ocean-500">
        <span className="tabular-nums" title="Tempo desde o pedido">
          {slaText}
        </span>
      </div>

      {lead.data_envio_orcamento && ultimoValorOrcamento ? (
        <p className="mt-1.5 text-xs leading-snug text-ocean-700">
          <span className="font-medium text-ocean-900">Orçamento enviado:</span>{" "}
          {ultimoValorOrcamento}
          {orcamentoEnviosCount > 1 ? (
            <span className="text-ocean-500">
              {" "}
              · {orcamentoEnviosCount} envios
            </span>
          ) : null}
        </p>
      ) : lead.data_envio_orcamento ? (
        <p className="mt-1.5 text-xs text-ocean-600">
          Orçamento enviado (valor não guardado no registo atual).
        </p>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-ocean-100/90 pt-2.5">
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => void copyEmail()}
            className="rounded-lg p-1.5 text-ocean-600 transition hover:bg-ocean-50 hover:text-ocean-900"
            title={copyFlash ? "Copiado" : "Copiar email"}
            aria-label={copyFlash ? "Email copiado" : "Copiar email"}
          >
            <IconCopy className={copyFlash ? "text-emerald-600" : undefined} />
          </button>
          <button
            type="button"
            onClick={onComposeEmail}
            className="rounded-lg p-1.5 text-ocean-600 transition hover:bg-ocean-50 hover:text-ocean-900"
            title="Email ao cliente"
            aria-label="Compor email ao cliente"
          >
            <IconMail />
          </button>
          <button
            type="button"
            onClick={onOpenHistorico}
            className="rounded-lg p-1.5 text-ocean-600 transition hover:bg-ocean-50 hover:text-ocean-900"
            title="Histórico / mensagens"
            aria-label="Abrir histórico da lead"
          >
            <IconChat />
          </button>
          {!terminal ? (
            <button
              type="button"
              onClick={onSendProposal}
              className="rounded-lg p-1.5 text-ocean-600 transition hover:bg-ocean-50 hover:text-ocean-900"
              title="Enviar orçamento (PDF + email)"
              aria-label="Enviar orçamento em PDF"
            >
              <IconFilePdf />
            </button>
          ) : null}
          {wa ? (
            <a
              href={wa}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg p-1.5 text-emerald-700 transition hover:bg-emerald-50"
              title="WhatsApp — só com consentimento da lead"
              aria-label="Abrir WhatsApp"
            >
              <IconWhatsApp />
            </a>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1">
          {onArchive && lead.status !== "Arquivado" ? (
            <button
              type="button"
              onClick={onArchive}
              className="text-xs font-medium text-ocean-500 underline decoration-ocean-200 underline-offset-2 hover:text-ocean-800"
            >
              Arquivar
            </button>
          ) : null}
          <button
            type="button"
            onClick={onVerDetalhes}
            className="text-xs font-medium text-ocean-700 underline decoration-ocean-300 underline-offset-2 hover:text-ocean-950"
          >
            Ver detalhes
          </button>
        </div>
      </div>
    </div>
  );
}

const ARCHIVE_RESTORE_OPTIONS: { value: LeadBoardStatus; label: string }[] = [
  { value: "Nova Lead", label: "Nova lead" },
  { value: "Em contacto", label: "Em contacto" },
  { value: "Proposta enviada", label: "Proposta enviada" },
  { value: "Ganho", label: "Ganho" },
  { value: "Cancelado", label: "Cancelado" },
];

function ArchiveLeadRow({
  lead,
  orcamentoEnviosCount,
  updatingId,
  onVerDetalhes,
  onSendProposal,
  onOpenHistorico,
  onComposeEmail,
  onRestore,
  slaCardBorderClassName,
}: {
  lead: LeadBoardRow;
  orcamentoEnviosCount: number;
  updatingId: string | null;
  onVerDetalhes: () => void;
  onSendProposal: () => void;
  onOpenHistorico: () => void;
  onComposeEmail: () => void;
  onRestore: (status: LeadBoardStatus) => void;
  slaCardBorderClassName: string;
}) {
  const [restoreTo, setRestoreTo] = useState<LeadBoardStatus>("Nova Lead");
  const busy = updatingId === lead.id;

  return (
    <li>
      <article
        className={`rounded-xl bg-white p-3 shadow-sm ${slaCardBorderClassName} ${
          busy ? "opacity-60" : ""
        }`}
      >
        <LeadCardInner
          lead={lead}
          showStatusLine
          orcamentoEnviosCount={orcamentoEnviosCount}
          onVerDetalhes={onVerDetalhes}
          onSendProposal={onSendProposal}
          onOpenHistorico={onOpenHistorico}
          onComposeEmail={onComposeEmail}
        />
        <div className="mt-3 border-t border-ocean-100/90 pt-3">
          <p className="text-[11px] font-medium text-ocean-600">
            Retirar do arquivo
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <label
              className="text-xs text-ocean-600"
              htmlFor={`restore-${lead.id}`}
            >
              Estado no quadro:
            </label>
            <select
              id={`restore-${lead.id}`}
              value={restoreTo}
              onChange={(e) =>
                setRestoreTo(e.target.value as LeadBoardStatus)
              }
              disabled={busy}
              className="min-w-[10rem] rounded-lg border border-ocean-200 bg-white px-2 py-1.5 text-xs text-ocean-900 shadow-sm focus:border-ocean-400 focus:outline-none focus:ring-2 focus:ring-ocean-100 disabled:opacity-60"
            >
              {ARCHIVE_RESTORE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={busy}
              onClick={() => onRestore(restoreTo)}
              className="rounded-lg bg-ocean-900 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-ocean-800 disabled:opacity-50"
            >
              Retirar do arquivo
            </button>
          </div>
        </div>
      </article>
    </li>
  );
}

function orcamentoEnviosCountForLead(
  lead: LeadBoardRow,
  map: Record<string, LeadPropostaEnvioRow[]>,
): number {
  const n = map[lead.id]?.length ?? 0;
  if (n > 0) return n;
  return lead.data_envio_orcamento ? 1 : 0;
}

export function LeadsKanban({
  initialLeads,
  clientThreadsByLeadId = {},
  clientDecisionsByLeadId = {},
  crmOutboundByLeadId = {},
  propostaEnviosByLeadId = {},
  slaGreenMaxHours = 24,
  slaYellowMaxHours = 48,
  quizCopy = DEFAULT_SITE_CONTENT.quiz,
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
  const [manualLeadOpen, setManualLeadOpen] = useState(false);
  const [workspaceTab, setWorkspaceTab] = useState<"work" | "archive">("work");

  const handleMessagesViewed = useCallback((leadId: string) => {
    setLeads((list) =>
      list.map((l) =>
        l.id === leadId ? { ...l, has_unread_messages: false } : l,
      ),
    );
  }, []);

  useEffect(() => {
    leadsRef.current = leads;
  }, [leads]);

  const grouped = useMemo(() => groupLeadsForWorkBoard(leads), [leads]);
  const outrosCount = grouped.get(OUTROS_COLUMN_KEY)?.length ?? 0;
  const archivedSorted = useMemo(
    () =>
      leads
        .filter((l) => l.status === "Arquivado")
        .sort(
          (a, b) =>
            new Date(b.data_pedido).getTime() -
            new Date(a.data_pedido).getTime(),
        ),
    [leads],
  );
  const todayOrdered = useMemo(
    () => sortLeadsByUrgency(leads.filter((l) => l.status !== "Arquivado")),
    [leads],
  );

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

  function emailPresetForCard(
    lead: LeadBoardRow,
    ctx: "board" | "today",
  ): EmailComposePreset {
    const terminal =
      lead.status === "Ganho" ||
      lead.status === "Cancelado" ||
      lead.status === "Arquivado";
    if (terminal) return "free";
    if (ctx === "today" && preferFollowUpFirst(lead)) return "followup";
    return "free";
  }

  function slaCardBorder(lead: LeadBoardRow): string {
    const tone = leadCardSlaBorderTone(
      lead,
      slaGreenMaxHours,
      slaYellowMaxHours,
    );
    return tone === "neutral"
      ? "border border-ocean-100"
      : `border-2 ${leadCardSlaBorderClass(tone)}`;
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

      <div
        className="flex flex-wrap gap-1 rounded-xl border border-ocean-100 bg-ocean-50/40 p-1"
        role="tablist"
        aria-label="Trabalho ou arquivo de leads"
      >
        <button
          type="button"
          role="tab"
          aria-selected={workspaceTab === "work"}
          onClick={() => setWorkspaceTab("work")}
          className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
            workspaceTab === "work"
              ? "bg-white text-ocean-900 shadow-sm"
              : "text-ocean-600 hover:bg-white/60 hover:text-ocean-900"
          }`}
        >
          Trabalho
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={workspaceTab === "archive"}
          onClick={() => setWorkspaceTab("archive")}
          className={`inline-flex items-center rounded-lg px-4 py-2 text-sm font-semibold transition ${
            workspaceTab === "archive"
              ? "bg-white text-ocean-900 shadow-sm"
              : "text-ocean-600 hover:bg-white/60 hover:text-ocean-900"
          }`}
        >
          Arquivo
          {archivedSorted.length > 0 ? (
            <span className="ml-2 rounded-full bg-ocean-200/90 px-2 py-0.5 text-[11px] font-bold tabular-nums text-ocean-800">
              {archivedSorted.length}
            </span>
          ) : null}
        </button>
      </div>

      {workspaceTab === "work" ? (
        <>
      <div className="flex flex-col gap-3 rounded-2xl border border-ocean-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 text-sm text-ocean-700">
          <p className="font-medium text-ocean-900">Vista do painel</p>
          <p className="mt-1 text-xs text-ocean-600">
            {viewMode === "board"
              ? "Quadro por estado — arrasta o cartão para mudar de coluna."
              : "Fila por urgência; o estado aparece no topo de cada cartão."}
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
          <button
            type="button"
            onClick={() => setManualLeadOpen(true)}
            className="rounded-[10px] border border-ocean-200 bg-white px-3 py-1.5 text-xs font-semibold text-ocean-800 shadow-sm transition hover:bg-ocean-50"
          >
            Nova lead manual
          </button>
        </div>
      </div>

      <p className="flex flex-wrap items-center gap-x-5 gap-y-1 text-[11px] text-ocean-600">
        <span className="inline-flex items-center gap-1.5">
          <span
            className="h-2.5 w-2.5 shrink-0 rounded border-2 border-ocean-200"
            aria-hidden
          />
          Borda neutra · até {slaGreenMaxHours}h desde o pedido
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span
            className="h-2.5 w-2.5 shrink-0 rounded border-2 border-amber-400/85"
            aria-hidden
          />
          Borda amarela · acima de {slaGreenMaxHours}h até {slaYellowMaxHours}h
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span
            className="h-2.5 w-2.5 shrink-0 rounded border-2 border-red-400/85"
            aria-hidden
          />
          Borda vermelha · acima de {slaYellowMaxHours}h
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span
            className="h-2 w-2 shrink-0 rounded-full bg-red-500"
            aria-hidden
          />
          Ponto vermelho · email novo por responder
        </span>
        <span className="text-ocean-500">
          (Ajusta estes limiares em Conteúdo do site → Quadro de leads.)
        </span>
      </p>

      {viewMode === "today" ? (
        <div className="rounded-2xl border border-ocean-100/90 bg-ocean-50/30 p-4">
          {todayOrdered.length === 0 ? (
            <p className="text-sm text-ocean-600">Sem leads.</p>
          ) : (
            <ul className="space-y-4">
              {todayOrdered.map((lead) => {
                const urgency = leadUrgency(lead);
                return (
                  <li key={lead.id}>
                    <article
                      className={`rounded-xl bg-white p-3 shadow-sm ${slaCardBorder(lead)} ${
                        updatingId === lead.id ? "opacity-60" : ""
                      }`}
                    >
                      {urgency.reason ? (
                        <p
                          className="mb-2 text-[10px] font-medium text-amber-900/85"
                          title={urgency.reason}
                        >
                          {urgency.reason}
                        </p>
                      ) : null}
                      <LeadCardInner
                        lead={lead}
                        showStatusLine
                        orcamentoEnviosCount={orcamentoEnviosCountForLead(
                          lead,
                          propostaEnviosByLeadId,
                        )}
                        onVerDetalhes={() => setQuizDetailLeadId(lead.id)}
                        onSendProposal={() => setProposalLeadId(lead.id)}
                        onOpenHistorico={() => setHistoryLeadId(lead.id)}
                        onComposeEmail={() =>
                          openEmailCompose(
                            lead.id,
                            emailPresetForCard(lead, "today"),
                          )
                        }
                        onArchive={() =>
                          void moveLeadToStatus(lead.id, "Arquivado")
                        }
                      />
                    </article>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : (
        <div className="flex touch-pan-x snap-x snap-mandatory gap-4 overflow-x-auto pb-3 [-ms-overflow-style:none] [scrollbar-width:thin] [&::-webkit-scrollbar]:h-1.5">
          {LEAD_KANBAN_WORK_COLUMNS.map((col) => {
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
                  {list.map((lead) => {
                    const dragging = dragLeadId === lead.id;
                    return (
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
                          className={`rounded-xl bg-white p-3 shadow-sm transition ${slaCardBorder(lead)} ${
                            updatingId === lead.id ? "opacity-60" : ""
                          } ${
                            dragging ? "opacity-50 ring-2 ring-ocean-400/50" : ""
                          } ${
                            updatingId === lead.id
                              ? "cursor-wait"
                              : "cursor-grab active:cursor-grabbing"
                          }`}
                        >
                          <LeadCardInner
                            lead={lead}
                            orcamentoEnviosCount={orcamentoEnviosCountForLead(
                              lead,
                              propostaEnviosByLeadId,
                            )}
                            onVerDetalhes={() => setQuizDetailLeadId(lead.id)}
                            onSendProposal={() => setProposalLeadId(lead.id)}
                            onOpenHistorico={() => setHistoryLeadId(lead.id)}
                            onComposeEmail={() =>
                              openEmailCompose(
                                lead.id,
                                emailPresetForCard(lead, "board"),
                              )
                            }
                            onArchive={() =>
                              void moveLeadToStatus(lead.id, "Arquivado")
                            }
                          />
                        </article>
                      </li>
                    );
                  })}
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
                  Valores antigos ou personalizados. Arrasta para uma coluna do
                  quadro para normalizar.
                </p>
                <p className="mt-2 text-[11px] font-medium uppercase tracking-wider text-ocean-500">
                  {outrosCount} {outrosCount === 1 ? "lead" : "leads"}
                </p>
              </div>
              <ul className="flex min-h-[120px] flex-1 flex-col gap-3 p-3">
                {(grouped.get(OUTROS_COLUMN_KEY) ?? []).map((lead) => {
                  const dragging = dragLeadId === lead.id;
                  return (
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
                        className={`rounded-xl bg-white p-3 shadow-sm transition ${slaCardBorder(lead)} ${
                          updatingId === lead.id ? "opacity-60" : ""
                        } ${
                          dragging ? "opacity-50 ring-2 ring-ocean-400/50" : ""
                        } ${
                          updatingId === lead.id
                            ? "cursor-wait"
                            : "cursor-grab active:cursor-grabbing"
                        }`}
                      >
                        <p className="mb-2 text-[10px] font-medium text-amber-900/85">
                          Estado na BD: {lead.status}
                        </p>
                        <LeadCardInner
                          lead={lead}
                          orcamentoEnviosCount={orcamentoEnviosCountForLead(
                            lead,
                            propostaEnviosByLeadId,
                          )}
                          onVerDetalhes={() => setQuizDetailLeadId(lead.id)}
                          onSendProposal={() => setProposalLeadId(lead.id)}
                          onOpenHistorico={() => setHistoryLeadId(lead.id)}
                          onComposeEmail={() =>
                            openEmailCompose(
                              lead.id,
                              emailPresetForCard(lead, "board"),
                            )
                          }
                          onArchive={() =>
                            void moveLeadToStatus(lead.id, "Arquivado")
                          }
                        />
                      </article>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null}
        </div>
      )}
        </>
      ) : (
        <div className="space-y-4">
          <div className="rounded-2xl border border-ocean-100 bg-white p-4 shadow-sm sm:p-5">
            <p className="font-medium text-ocean-900">Arquivo</p>
            <p className="mt-1 text-sm text-ocean-600">
              Fichas que marcaste com «Arquivar» ficam aqui, fora do quadro. Para
              as retirar do arquivo, escolhe em que coluna devem voltar e carrega
              em «Retirar do arquivo» em cada cartão.
            </p>
          </div>
          <div className="rounded-2xl border border-ocean-100/90 bg-ocean-50/30 p-4">
            {archivedSorted.length === 0 ? (
              <p className="text-sm text-ocean-600">
                Nada no arquivo. No separador Trabalho, usa «Arquivar» no canto de
                cada cartão.
              </p>
            ) : (
              <ul className="max-h-[min(70vh,840px)] space-y-4 overflow-y-auto pr-1">
                {archivedSorted.map((lead) => (
                  <ArchiveLeadRow
                    key={lead.id}
                    lead={lead}
                    orcamentoEnviosCount={orcamentoEnviosCountForLead(
                      lead,
                      propostaEnviosByLeadId,
                    )}
                    updatingId={updatingId}
                    slaCardBorderClassName={slaCardBorder(lead)}
                    onVerDetalhes={() => setQuizDetailLeadId(lead.id)}
                    onSendProposal={() => setProposalLeadId(lead.id)}
                    onOpenHistorico={() => setHistoryLeadId(lead.id)}
                    onComposeEmail={() =>
                      openEmailCompose(
                        lead.id,
                        emailPresetForCard(lead, "today"),
                      )
                    }
                    onRestore={(status) =>
                      void moveLeadToStatus(lead.id, status)
                    }
                  />
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      <p className="text-xs text-ocean-500">
        {workspaceTab === "work" ? (
          <>
            Arrasta o cartão entre colunas para mudar o estado, ou usa «Arquivar»
            para guardar a ficha no separador Arquivo. O ícone de conversa abre o
            histórico; o de PDF, o envio de orçamento. Em{" "}
            <strong className="font-medium text-ocean-700">Ver detalhes</strong>{" "}
            vês o pedido completo e a conversa.
          </>
        ) : (
          <>
            No arquivo as fichas não aparecem no quadro nem na vista Hoje.
            «Retirar do arquivo» volta a pô-las no estado que escolheres.
          </>
        )}
      </p>

      {quizDetailLead ? (
        <LeadQuizDetailModal
          lead={quizDetailLead}
          quizCopy={quizCopy}
          onClose={() => setQuizDetailLeadId(null)}
          clientThread={clientThreadsByLeadId[quizDetailLead.id] ?? []}
          clientDecisions={clientDecisionsByLeadId[quizDetailLead.id] ?? []}
          crmOutboundEmails={crmOutboundByLeadId[quizDetailLead.id] ?? []}
          propostaEnvios={
            propostaEnviosByLeadId[quizDetailLead.id] ?? []
          }
          onNotasSaved={(leadId, notas) =>
            setLeads((list) =>
              list.map((l) =>
                l.id === leadId ? { ...l, notas_internas: notas } : l,
              ),
            )
          }
          onMessagesViewed={handleMessagesViewed}
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
          propostaEnvios={propostaEnviosByLeadId[historyLead.id] ?? []}
          onClose={() => setHistoryLeadId(null)}
          onMessagesViewed={handleMessagesViewed}
        />
      ) : null}

      {manualLeadOpen ? (
        <CrmManualLeadModal onClose={() => setManualLeadOpen(false)} />
      ) : null}
    </div>
  );
}
