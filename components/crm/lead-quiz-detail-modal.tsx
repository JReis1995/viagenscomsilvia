"use client";

import { useEffect } from "react";

import type { LeadBoardRow } from "@/types/lead";

type Props = {
  lead: LeadBoardRow;
  onClose: () => void;
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

function displayText(value: string | null | undefined): string {
  const t = value?.trim();
  return t && t.length > 0 ? t : "—";
}

export function LeadQuizDetailModal({ lead, onClose }: Props) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      e.preventDefault();
      onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ocean-900/40 p-3 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="quiz-detail-title"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Fechar"
        onClick={onClose}
      />
      <div className="relative z-10 flex max-h-[min(88vh,640px)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-ocean-100 bg-white shadow-xl">
        <div className="shrink-0 border-b border-ocean-100 bg-sand/30 px-5 py-4">
          <h2
            id="quiz-detail-title"
            className="font-serif text-xl font-normal text-ocean-900"
          >
            Pedido de proposta
          </h2>
          <p className="mt-1 text-sm text-ocean-600">
            <span className="font-medium text-ocean-800">{lead.nome}</span>
            {" · "}
            <a
              href={`mailto:${encodeURIComponent(lead.email)}`}
              className="text-ocean-700 underline-offset-2 hover:underline"
            >
              {lead.email}
            </a>
            {lead.telemovel?.trim() ? (
              <>
                {" · "}
                <a
                  href={`tel:${lead.telemovel.replace(/\s/g, "")}`}
                  className="text-ocean-700 underline-offset-2 hover:underline"
                >
                  {lead.telemovel.trim()}
                </a>
              </>
            ) : null}
          </p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-ocean-500">
            O que o cliente indicou
          </p>
          <dl className="mt-3 space-y-3 text-sm">
            <div className="rounded-xl border border-ocean-100/90 bg-ocean-50/35 px-3 py-2.5">
              <dt className="text-[10px] font-semibold uppercase tracking-wider text-ocean-500">
                Telemóvel
              </dt>
              <dd className="mt-0.5 text-ocean-900">
                {lead.telemovel?.trim() ? (
                  <a
                    href={`tel:${lead.telemovel.replace(/\s/g, "")}`}
                    className="font-medium text-ocean-800 underline-offset-2 hover:underline"
                  >
                    {lead.telemovel.trim()}
                  </a>
                ) : (
                  "—"
                )}
              </dd>
            </div>
            <div className="rounded-xl border border-ocean-100/90 bg-ocean-50/35 px-3 py-2.5">
              <dt className="text-[10px] font-semibold uppercase tracking-wider text-ocean-500">
                Data do pedido
              </dt>
              <dd className="mt-0.5 text-ocean-900">
                {formatPedidoDate(lead.data_pedido)}
              </dd>
            </div>
            <div className="rounded-xl border border-ocean-100/90 bg-ocean-50/35 px-3 py-2.5">
              <dt className="text-[10px] font-semibold uppercase tracking-wider text-ocean-500">
                Estilo de viagem
              </dt>
              <dd className="mt-0.5 whitespace-pre-wrap text-ocean-900">
                {displayText(lead.vibe)}
              </dd>
            </div>
            <div className="rounded-xl border border-ocean-100/90 bg-ocean-50/35 px-3 py-2.5">
              <dt className="text-[10px] font-semibold uppercase tracking-wider text-ocean-500">
                Com quem viaja
              </dt>
              <dd className="mt-0.5 whitespace-pre-wrap text-ocean-900">
                {displayText(lead.companhia)}
              </dd>
            </div>
            <div className="rounded-xl border border-ocean-100/90 bg-ocean-50/35 px-3 py-2.5">
              <dt className="text-[10px] font-semibold uppercase tracking-wider text-ocean-500">
                Destino / sonho
              </dt>
              <dd className="mt-0.5 whitespace-pre-wrap text-ocean-900">
                {displayText(lead.destino_sonho)}
              </dd>
            </div>
            <div className="rounded-xl border border-ocean-100/90 bg-ocean-50/35 px-3 py-2.5">
              <dt className="text-[10px] font-semibold uppercase tracking-wider text-ocean-500">
                Orçamento indicado
              </dt>
              <dd className="mt-0.5 whitespace-pre-wrap text-ocean-900">
                {displayText(lead.orcamento_estimado)}
              </dd>
            </div>
            <div className="rounded-xl border border-ocean-100/90 bg-ocean-50/35 px-3 py-2.5">
              <dt className="text-[10px] font-semibold uppercase tracking-wider text-ocean-500">
                Follow-up automático
              </dt>
              <dd className="mt-0.5 text-ocean-900">
                {lead.auto_followup ? "Sim" : "Não"}
              </dd>
            </div>
          </dl>
        </div>

        <div className="shrink-0 border-t border-ocean-100 bg-white px-5 py-3">
          <p className="mb-2 text-center text-[11px] text-ocean-500">
            Tecla <kbd className="rounded border border-ocean-200 bg-ocean-50 px-1.5 py-0.5 font-mono text-[10px] text-ocean-700">Esc</kbd>{" "}
            para fechar
          </p>
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-full border border-ocean-200 bg-white py-2.5 text-sm font-medium text-ocean-800 hover:bg-ocean-50"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
