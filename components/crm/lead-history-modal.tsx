"use client";

import { useEffect, useMemo } from "react";

import { LeadTimelineEntry } from "@/components/crm/lead-timeline-entry";
import {
  buildLeadTimeline,
  type ClientDecisionEntry,
  type ClientThreadEntry,
  type CrmThreadEmailEntry,
} from "@/lib/crm/lead-timeline";
import type { LeadBoardRow } from "@/types/lead";

function formatWhen(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("pt-PT", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

type Props = {
  lead: LeadBoardRow;
  clientThread: ClientThreadEntry[];
  clientDecisions: ClientDecisionEntry[];
  crmOutboundEmails: CrmThreadEmailEntry[];
  onClose: () => void;
};

export function LeadHistoryModal({
  lead,
  clientThread,
  clientDecisions,
  crmOutboundEmails,
  onClose,
}: Props) {
  const rows = useMemo(
    () =>
      buildLeadTimeline(
        lead,
        clientThread,
        clientDecisions,
        crmOutboundEmails,
      ),
    [lead, clientThread, clientDecisions, crmOutboundEmails],
  );

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
      className="fixed inset-0 z-[55] flex items-end justify-center bg-ocean-950/50 p-0 pt-[max(0.75rem,env(safe-area-inset-top))] sm:items-center sm:p-4"
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
      <div className="relative z-10 flex max-h-[min(88dvh,620px)] w-full max-w-md flex-col overflow-hidden rounded-t-2xl border border-ocean-100 bg-white shadow-xl sm:max-w-lg sm:rounded-2xl">
        <div className="shrink-0 border-b border-ocean-100 px-4 py-3 sm:px-5">
          <h2
            id="lead-history-title"
            className="font-serif text-lg text-ocean-900"
          >
            Histórico
          </h2>
          <p className="mt-0.5 text-sm text-ocean-600">{lead.nome}</p>
        </div>
        <ul className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-3 pl-6 sm:px-5 sm:pl-7">
          {rows.length === 0 ? (
            <li className="text-sm text-ocean-500">Sem eventos.</li>
          ) : (
            rows.map((row, i) => (
              <LeadTimelineEntry
                key={`${row.at}-${row.kind}-${i}`}
                row={row}
                formatWhen={formatWhen}
              />
            ))
          )}
        </ul>
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
