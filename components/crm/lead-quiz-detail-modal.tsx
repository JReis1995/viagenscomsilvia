"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  registerLeadInboundEmailAction,
  updateLeadNotasInternasAction,
} from "@/app/(dashboard)/crm/actions";
import { LeadEmailComposeModal } from "@/components/crm/lead-email-compose-modal";
import { LeadTimelineEntry } from "@/components/crm/lead-timeline-entry";
import { buildLeadTimeline } from "@/lib/crm/lead-timeline";
import type {
  ClientDecisionEntry,
  ClientThreadEntry,
  CrmThreadEmailEntry,
} from "@/lib/crm/lead-timeline";
import { climaLabelForKey } from "@/lib/marketing/quiz-clima";
import { DEFAULT_SITE_CONTENT } from "@/lib/site/site-content";
import type { LeadBoardRow } from "@/types/lead";

type Props = {
  lead: LeadBoardRow;
  onClose: () => void;
  clientThread?: ClientThreadEntry[];
  clientDecisions?: ClientDecisionEntry[];
  crmOutboundEmails?: CrmThreadEmailEntry[];
  onNotasSaved?: (leadId: string, notas: string | null) => void;
};

function formatTimelineWhen(iso: string): string {
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

function formatPedidoDate(iso: string): string {
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

function displayText(value: string | null | undefined): string {
  const t = value?.trim();
  return t && t.length > 0 ? t : "—";
}

export function LeadQuizDetailModal({
  lead,
  onClose,
  clientThread = [],
  clientDecisions = [],
  crmOutboundEmails = [],
  onNotasSaved,
}: Props) {
  const router = useRouter();
  const [notas, setNotas] = useState(lead.notas_internas?.trim() ?? "");
  const [notasMsg, setNotasMsg] = useState<string | null>(null);
  const [pendingNotas, startNotasTransition] = useTransition();
  const [emailComposeOpen, setEmailComposeOpen] = useState(false);
  const [inboundSubject, setInboundSubject] = useState("");
  const [inboundBody, setInboundBody] = useState("");
  const [inboundMsg, setInboundMsg] = useState<string | null>(null);
  const [pendingInbound, startInboundTransition] = useTransition();

  useEffect(() => {
    setNotas(lead.notas_internas?.trim() ?? "");
    setNotasMsg(null);
    setInboundSubject("");
    setInboundBody("");
    setInboundMsg(null);
  }, [lead.id, lead.notas_internas]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      e.preventDefault();
      onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const timeline = useMemo(
    () =>
      buildLeadTimeline(
        lead,
        clientThread,
        clientDecisions,
        crmOutboundEmails,
      ),
    [lead, clientThread, clientDecisions, crmOutboundEmails],
  );

  function saveInboundReply() {
    setInboundMsg(null);
    startInboundTransition(() => {
      void (async () => {
        const res = await registerLeadInboundEmailAction(
          lead.id,
          inboundSubject,
          inboundBody,
        );
        if (res.ok) {
          setInboundSubject("");
          setInboundBody("");
          setInboundMsg("Resposta registada no histórico.");
          router.refresh();
        } else {
          setInboundMsg(`Erro: ${res.error}`);
        }
      })();
    });
  }

  function saveNotas() {
    setNotasMsg(null);
    startNotasTransition(() => {
      void (async () => {
        const res = await updateLeadNotasInternasAction(lead.id, notas);
        if (res.ok) {
          const trimmed = notas.trim() || null;
          onNotasSaved?.(lead.id, trimmed);
          setNotasMsg("Notas guardadas.");
          router.refresh();
        } else {
          setNotasMsg(`Erro: ${res.error}`);
        }
      })();
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ocean-900/40 p-0 pt-[max(0.75rem,env(safe-area-inset-top))] sm:items-center sm:p-4"
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
      <div className="relative z-10 flex max-h-[min(92dvh,720px)] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl border border-ocean-100 border-b-0 bg-white shadow-xl sm:max-h-[min(88vh,720px)] sm:rounded-2xl sm:border-b">
        <div className="shrink-0 border-b border-ocean-100 bg-sand/30 px-5 py-4">
          <h2
            id="quiz-detail-title"
            className="font-serif text-xl font-normal text-ocean-900"
          >
            Pedido de proposta
          </h2>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-ocean-600">
            <span className="font-medium text-ocean-800">{lead.nome}</span>
            {lead.pedido_rapido ? (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-900">
                Pedido rápido
              </span>
            ) : null}
            {" · "}
            <button
              type="button"
              className="text-ocean-700 underline decoration-ocean-400 underline-offset-2 hover:text-ocean-900"
              onClick={() => setEmailComposeOpen(true)}
            >
              {lead.email}
            </button>
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

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:pb-4">
          <section className="rounded-xl border border-ocean-200/80 bg-ocean-50/40 p-3">
            <h3 className="text-[10px] font-semibold uppercase tracking-wider text-ocean-600">
              Notas internas (só equipa)
            </h3>
            <p className="mt-1 text-xs text-ocean-500">
              O cliente não vê este texto. Usa para próximos passos ou
              contexto.
            </p>
            <textarea
              className="mt-2 min-h-[88px] w-full resize-y rounded-lg border border-ocean-200 bg-white px-3 py-2 text-sm text-ocean-900 shadow-sm focus:border-ocean-400 focus:outline-none focus:ring-2 focus:ring-ocean-200"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Ex.: ligar terça; preferência hotel boutique…"
              maxLength={8000}
              rows={4}
            />
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={pendingNotas}
                onClick={() => saveNotas()}
                className="rounded-lg bg-ocean-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-ocean-800 disabled:opacity-50"
              >
                {pendingNotas ? "A guardar…" : "Guardar notas"}
              </button>
              {notasMsg ? (
                <span
                  className={`text-xs ${
                    notasMsg.startsWith("Erro")
                      ? "text-terracotta"
                      : "text-emerald-800"
                  }`}
                >
                  {notasMsg}
                </span>
              ) : null}
            </div>
          </section>

          <section className="mt-4 rounded-xl border border-ocean-200/80 bg-white p-3 shadow-sm">
            <h3 className="text-[10px] font-semibold uppercase tracking-wider text-ocean-600">
              Resposta da lead por email
            </h3>
            <p className="mt-1 text-xs text-ocean-500">
              Se ela respondeu na tua caixa (Gmail, etc.) e isso não aparece
              aqui, cola o assunto e o texto — fica como{" "}
              <span className="font-medium text-ocean-700">Recebido</span> no
              histórico. (Automático: Resend Inbound + webhook — ver Primeiros
              passos.)
            </p>
            <input
              type="text"
              value={inboundSubject}
              onChange={(e) => setInboundSubject(e.target.value)}
              disabled={pendingInbound}
              placeholder="Assunto do email"
              className="mt-2 w-full rounded-lg border border-ocean-200 px-3 py-2 text-sm text-ocean-900 shadow-sm focus:border-ocean-400 focus:outline-none focus:ring-2 focus:ring-ocean-200 disabled:opacity-60"
            />
            <textarea
              value={inboundBody}
              onChange={(e) => setInboundBody(e.target.value)}
              disabled={pendingInbound}
              placeholder="Corpo da mensagem (podes colar da caixa de entrada)"
              rows={4}
              className="mt-2 min-h-[72px] w-full resize-y rounded-lg border border-ocean-200 px-3 py-2 text-sm text-ocean-900 shadow-sm focus:border-ocean-400 focus:outline-none focus:ring-2 focus:ring-ocean-200 disabled:opacity-60"
            />
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={
                  pendingInbound ||
                  !inboundSubject.trim() ||
                  !inboundBody.trim()
                }
                onClick={() => saveInboundReply()}
                className="rounded-lg bg-ocean-800 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-ocean-700 disabled:opacity-50"
              >
                {pendingInbound ? "A gravar…" : "Registar resposta recebida"}
              </button>
              {inboundMsg ? (
                <span
                  className={`text-xs ${
                    inboundMsg.startsWith("Erro")
                      ? "text-terracotta"
                      : "text-emerald-800"
                  }`}
                >
                  {inboundMsg}
                </span>
              ) : null}
            </div>
          </section>

          <section className="mt-6">
            <h3 className="text-[10px] font-semibold uppercase tracking-wider text-ocean-500">
              Histórico (ordem cronológica)
            </h3>
            <ul className="mt-3 space-y-4 border-l-2 border-ocean-200 pl-4">
              {timeline.length === 0 ? (
                <li className="text-sm text-ocean-500">Sem eventos.</li>
              ) : (
                timeline.map((row, i) => (
                  <LeadTimelineEntry
                    key={`${row.at}-${row.kind}-${i}`}
                    row={row}
                    formatWhen={formatTimelineWhen}
                  />
                ))
              )}
            </ul>
          </section>

          <p className="mt-6 text-[10px] font-semibold uppercase tracking-wider text-ocean-500">
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
                Clima / ambiente
              </dt>
              <dd className="mt-0.5 whitespace-pre-wrap text-ocean-900">
                {lead.clima_preferido?.trim()
                  ? climaLabelForKey(
                      lead.clima_preferido.trim(),
                      DEFAULT_SITE_CONTENT.quiz,
                    )
                  : "—"}
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
            <div className="rounded-xl border border-ocean-100/90 bg-ocean-50/35 px-3 py-2.5">
              <dt className="text-[10px] font-semibold uppercase tracking-wider text-ocean-500">
                Atribuição (marketing)
              </dt>
              <dd className="mt-0.5 space-y-1 text-xs text-ocean-900">
                <p>
                  <span className="text-ocean-500">UTM: </span>
                  {lead.utm_source?.trim() ||
                  lead.utm_medium?.trim() ||
                  lead.utm_campaign?.trim() ? (
                    <>
                      {[lead.utm_source, lead.utm_medium, lead.utm_campaign]
                        .map((x) => x?.trim())
                        .filter(Boolean)
                        .join(" · ")}
                    </>
                  ) : (
                    "—"
                  )}
                </p>
                {lead.utm_content?.trim() ? (
                  <p>
                    <span className="text-ocean-500">Conteúdo: </span>
                    {lead.utm_content.trim()}
                  </p>
                ) : null}
                {lead.utm_term?.trim() ? (
                  <p>
                    <span className="text-ocean-500">Termo: </span>
                    {lead.utm_term.trim()}
                  </p>
                ) : null}
                <p className="break-all">
                  <span className="text-ocean-500">Referrer: </span>
                  {lead.referrer?.trim() ? lead.referrer.trim() : "—"}
                </p>
                <p className="break-all">
                  <span className="text-ocean-500">Entrada: </span>
                  {lead.landing_path?.trim() ? lead.landing_path.trim() : "—"}
                </p>
              </dd>
            </div>
          </dl>
        </div>

        <div className="shrink-0 border-t border-ocean-100 bg-white px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:pb-3">
          <p className="mb-2 text-center text-[11px] text-ocean-500">
            Tecla{" "}
            <kbd className="rounded border border-ocean-200 bg-ocean-50 px-1.5 py-0.5 font-mono text-[10px] text-ocean-700">
              Esc
            </kbd>{" "}
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

      {emailComposeOpen ? (
        <LeadEmailComposeModal
          lead={lead}
          preset="free"
          onClose={() => setEmailComposeOpen(false)}
        />
      ) : null}
    </div>
  );
}
