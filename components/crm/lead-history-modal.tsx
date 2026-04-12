"use client";

import { useEffect, useMemo } from "react";

import { markLeadCrmMessagesReadAction } from "@/app/(dashboard)/crm/actions";
import { LeadTimelineChat } from "@/components/crm/lead-timeline-chat";
import {
  buildLeadTimeline,
  type ClientDecisionEntry,
  type ClientThreadEntry,
  type CrmThreadEmailEntry,
  type LeadPropostaEnvioRow,
} from "@/lib/crm/lead-timeline";
import type { LeadBoardRow } from "@/types/lead";

type Props = {
  lead: LeadBoardRow;
  clientThread: ClientThreadEntry[];
  clientDecisions: ClientDecisionEntry[];
  crmOutboundEmails: CrmThreadEmailEntry[];
  propostaEnvios?: LeadPropostaEnvioRow[];
  onClose: () => void;
  /** Chamado após gravar `has_unread_messages = false` com sucesso. */
  onMessagesViewed?: (leadId: string) => void;
};

export function LeadHistoryModal({
  lead,
  clientThread,
  clientDecisions,
  crmOutboundEmails,
  propostaEnvios = [],
  onClose,
  onMessagesViewed,
}: Props) {
  const rows = useMemo(
    () =>
      buildLeadTimeline(
        lead,
        clientThread,
        clientDecisions,
        crmOutboundEmails,
        propostaEnvios,
      ),
    [lead, clientThread, clientDecisions, crmOutboundEmails, propostaEnvios],
  );

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const res = await markLeadCrmMessagesReadAction(lead.id);
      if (!cancelled && res.ok) {
        onMessagesViewed?.(lead.id);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [lead.id, onMessagesViewed]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      e.preventDefault();
      e.stopPropagation();
      onClose();
    }
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[55] flex items-end justify-center bg-ocean-950/50 sm:items-center sm:p-3 md:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="lead-history-title"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Fechar"
        onClick={onClose}
      />
      <div className="relative z-10 flex max-h-[100dvh] w-full max-w-xl flex-col overflow-hidden rounded-t-2xl border border-ocean-100 bg-white shadow-2xl sm:max-h-[min(92dvh,900px)] sm:rounded-2xl">
        <div className="shrink-0 border-b border-ocean-100 px-4 py-3 sm:px-5">
          <h2
            id="lead-history-title"
            className="font-serif text-lg text-ocean-900"
          >
            Histórico
          </h2>
          <p className="mt-0.5 text-sm text-ocean-600">{lead.nome}</p>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-5">
          <LeadTimelineChat rows={rows} />
        </div>
        <div className="shrink-0 border-t border-ocean-100 px-4 py-3 sm:px-5">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl border border-ocean-200 py-2 text-sm font-medium text-ocean-800 hover:bg-ocean-50"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
