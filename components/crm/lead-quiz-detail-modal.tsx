"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  deleteLeadAction,
  markLeadCrmMessagesReadAction,
  registerLeadInboundEmailAction,
  updateLeadAutoFollowupAction,
  updateLeadNotasInternasAction,
} from "@/app/(dashboard)/crm/actions";
import {
  LeadEmailComposeModal,
  type EmailComposePreset,
} from "@/components/crm/lead-email-compose-modal";
import { LeadPostChoiceBlock } from "@/components/crm/lead-post-choice-block";
import { LeadTimelineChat } from "@/components/crm/lead-timeline-chat";
import { parseDetalhesProposta } from "@/lib/crm/detalhes-proposta";
import { buildLeadTimeline } from "@/lib/crm/lead-timeline";
import type {
  ClientDecisionEntry,
  ClientThreadEntry,
  CrmThreadEmailEntry,
  LeadPropostaEnvioRow,
} from "@/lib/crm/lead-timeline";
import { climaLabelForKey } from "@/lib/marketing/quiz-clima";
import {
  flexibilidadeLabel,
  voosHotelLabel,
} from "@/lib/marketing/quiz-qualificacao";
import { DEFAULT_SITE_CONTENT } from "@/lib/site/site-content";
import type { SiteContent } from "@/lib/site/site-content";
import type { LeadBoardRow } from "@/types/lead";

type Props = {
  lead: LeadBoardRow;
  /** Rótulos do quiz (CMS); por omissão usa o texto publicado no site. */
  quizCopy?: SiteContent["quiz"];
  onClose: () => void;
  clientThread?: ClientThreadEntry[];
  clientDecisions?: ClientDecisionEntry[];
  crmOutboundEmails?: CrmThreadEmailEntry[];
  propostaEnvios?: LeadPropostaEnvioRow[];
  onNotasSaved?: (leadId: string, notas: string | null) => void;
  onAutoFollowupSaved?: (leadId: string, autoFollowup: boolean) => void;
  /** Após marcar mensagens CRM como vistas (remove o alerta no quadro). */
  onMessagesViewed?: (leadId: string) => void;
  /** Após eliminar a ficha com sucesso (o pai remove do estado local). */
  onLeadDeleted?: (leadId: string) => void;
};

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
  quizCopy = DEFAULT_SITE_CONTENT.quiz,
  onClose,
  clientThread = [],
  clientDecisions = [],
  crmOutboundEmails = [],
  propostaEnvios = [],
  onNotasSaved,
  onAutoFollowupSaved,
  onMessagesViewed,
  onLeadDeleted,
}: Props) {
  const router = useRouter();
  const [notas, setNotas] = useState(lead.notas_internas?.trim() ?? "");
  const [notasMsg, setNotasMsg] = useState<string | null>(null);
  const [pendingNotas, startNotasTransition] = useTransition();
  const [emailComposePreset, setEmailComposePreset] =
    useState<EmailComposePreset | null>(null);
  const [autoFollowup, setAutoFollowup] = useState(lead.auto_followup);
  const [autoFollowupMsg, setAutoFollowupMsg] = useState<string | null>(null);
  const [pendingAuto, startAutoTransition] = useTransition();
  const [inboundSubject, setInboundSubject] = useState("");
  const [inboundBody, setInboundBody] = useState("");
  const [inboundMsg, setInboundMsg] = useState<string | null>(null);
  const [pendingInbound, startInboundTransition] = useTransition();
  const [deletePending, setDeletePending] = useState(false);
  const [deleteErr, setDeleteErr] = useState<string | null>(null);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      e.preventDefault();
      onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

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

  const timeline = useMemo(
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

  const orcamentosResumoLista = useMemo(() => {
    if (propostaEnvios.length > 0) {
      return [...propostaEnvios].sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
    }
    if (!lead.data_envio_orcamento) return [];
    const d = parseDetalhesProposta(lead.detalhes_proposta);
    if (d) {
      return [
        {
          created_at: lead.data_envio_orcamento,
          valor_total: d.valor_total,
          titulo: d.titulo,
          destino: d.destino,
          datas: d.datas,
          inclui: d.inclui,
        } satisfies LeadPropostaEnvioRow,
      ];
    }
    return [
      {
        created_at: lead.data_envio_orcamento,
        valor_total: "—",
        titulo: "Orçamento enviado (sem detalhes na lead)",
        destino: null,
        datas: null,
        inclui: [],
      } satisfies LeadPropostaEnvioRow,
    ];
  }, [propostaEnvios, lead.data_envio_orcamento, lead.detalhes_proposta]);

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

  function toggleAutoFollowup(next: boolean) {
    setAutoFollowupMsg(null);
    startAutoTransition(() => {
      void (async () => {
        const res = await updateLeadAutoFollowupAction(lead.id, next);
        if (res.ok) {
          setAutoFollowup(next);
          onAutoFollowupSaved?.(lead.id, next);
          router.refresh();
        } else {
          setAutoFollowupMsg(`Erro: ${res.error}`);
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

  async function handleDeleteLead() {
    setDeleteErr(null);
    const label = `${lead.nome} (${lead.email})`;
    if (
      !window.confirm(
        `Eliminar permanentemente a lead ${label}? O histórico de emails CRM e envios de orçamento será apagado. Esta acção não pode ser anulada.`,
      )
    ) {
      return;
    }
    setDeletePending(true);
    const res = await deleteLeadAction(lead.id);
    setDeletePending(false);
    if (!res.ok) {
      setDeleteErr(res.error);
      return;
    }
    onLeadDeleted?.(lead.id);
    onClose();
    router.refresh();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ocean-900/45 sm:items-center sm:p-3 md:p-4"
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
      <div className="relative z-10 flex max-h-[100dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl border border-ocean-100 bg-white shadow-2xl sm:max-h-[min(92dvh,920px)] sm:rounded-2xl">
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
              onClick={() => setEmailComposePreset("free")}
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

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-5 sm:pb-4">
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
              Se ela respondeu na tua caixa de email e isso não aparece aqui,
              cola o assunto e o texto — fica como{" "}
              <span className="font-medium text-ocean-700">Recebido</span> no
              histórico. Se o teu email estiver ligado ao sistema de envio do
              site, as respostas podem passar a aparecer sozinhas; caso
              contrário, este registo manual resolve.
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
            <h3 className="text-xs font-semibold uppercase tracking-wider text-ocean-800">
              Orçamentos enviados ao cliente
            </h3>
            <p className="mt-1 text-xs text-ocean-600">
              Valor, lista incluída no PDF e descarga da versão correspondente.
            </p>
            {orcamentosResumoLista.length === 0 ? (
              <p className="mt-3 text-sm text-ocean-600">
                Ainda não foi enviada proposta em PDF por email a partir do CRM.
              </p>
            ) : (
              <ul className="mt-3 space-y-4">
                {orcamentosResumoLista.map((ev, i) => {
                  const pdfHref = ev.id
                    ? `/api/crm/leads/${lead.id}/proposta-pdf?envioId=${encodeURIComponent(ev.id)}`
                    : `/api/crm/leads/${lead.id}/proposta-pdf?legacy=1`;
                  const incluiLines =
                    ev.inclui?.map((s) => s.trim()).filter(Boolean) ?? [];
                  const podePdf =
                    Boolean(ev.id) ||
                    Boolean(parseDetalhesProposta(lead.detalhes_proposta));
                  return (
                    <li
                      key={ev.id ?? `legacy-${ev.created_at}-${i}`}
                      className="rounded-xl border-2 border-ocean-200 bg-ocean-50/95 px-4 py-3 shadow-sm"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-lg font-bold leading-tight text-ocean-950">
                            {ev.valor_total.trim()}
                          </p>
                          <p className="mt-1 text-sm font-medium text-ocean-900">
                            {ev.titulo}
                          </p>
                          <p className="mt-1 text-xs text-ocean-700">
                            {formatPedidoDate(ev.created_at)}
                          </p>
                          {ev.destino?.trim() || ev.datas?.trim() ? (
                            <p className="mt-2 text-sm text-ocean-800">
                              {[ev.destino?.trim(), ev.datas?.trim()]
                                .filter(Boolean)
                                .join(" · ")}
                            </p>
                          ) : null}
                        </div>
                        {podePdf ? (
                          <a
                            href={pdfHref}
                            className="inline-flex shrink-0 items-center justify-center rounded-xl bg-ocean-900 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-ocean-800"
                            download
                          >
                            Descarregar PDF
                          </a>
                        ) : null}
                      </div>
                      <div className="mt-3 border-t border-ocean-200/80 pt-3">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-ocean-800">
                          O que inclui (uma linha por item)
                        </p>
                        {incluiLines.length > 0 ? (
                          <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-snug text-ocean-950">
                            {incluiLines.map((line, j) => (
                              <li key={j}>{line}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="mt-2 text-xs text-ocean-600">
                            Sem lista guardada nesta versão. Se for envio antigo
                            antes do histórico, usa o PDF legado (última proposta
                            na lead) ou reenvia a partir do CRM.
                          </p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
            {propostaEnvios.length > 1 ? (
              <p className="mt-3 text-[11px] text-ocean-600">
                Cada envio fica com o seu PDF — o mais recente aparece primeiro.
              </p>
            ) : null}
          </section>

          <section className="mt-6">
            <h3 className="text-[10px] font-semibold uppercase tracking-wider text-ocean-500">
              Conversação / histórico
            </h3>
            <div className="mt-3 rounded-xl bg-ocean-50/40 px-2 py-3 sm:px-3">
              <LeadTimelineChat rows={timeline} />
            </div>
          </section>

          <LeadPostChoiceBlock lead={lead} />

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
                  ? climaLabelForKey(lead.clima_preferido.trim(), quizCopy)
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
                Passageiros (pedido no topo)
              </dt>
              <dd className="mt-0.5 whitespace-pre-wrap text-ocean-900">
                {lead.pedido_adultos || lead.pedido_criancas ? (
                  <>
                    {lead.pedido_adultos ?? 0} adulto(s)
                    {lead.pedido_criancas ? ` · ${lead.pedido_criancas} crianca(s)` : ""}
                    {lead.pedido_idades_criancas && lead.pedido_idades_criancas.length > 0
                      ? ` · idades: ${lead.pedido_idades_criancas.join(", ")}`
                      : ""}
                    {typeof lead.pedido_quartos === "number"
                      ? ` · ${lead.pedido_quartos} quarto(s)`
                      : ""}
                    {lead.pedido_animais_estimacao === true
                      ? " · com animais"
                      : lead.pedido_animais_estimacao === false
                        ? " · sem animais"
                        : ""}
                  </>
                ) : (
                  "—"
                )}
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
                Janela de datas
              </dt>
              <dd className="mt-0.5 whitespace-pre-wrap text-ocean-900">
                {displayText(lead.janela_datas)}
              </dd>
            </div>
            <div className="rounded-xl border border-ocean-100/90 bg-ocean-50/35 px-3 py-2.5">
              <dt className="text-[10px] font-semibold uppercase tracking-wider text-ocean-500">
                Flexibilidade de datas
              </dt>
              <dd className="mt-0.5 whitespace-pre-wrap text-ocean-900">
                {flexibilidadeLabel(lead.flexibilidade_datas, quizCopy)}
              </dd>
            </div>
            <div className="rounded-xl border border-ocean-100/90 bg-ocean-50/35 px-3 py-2.5">
              <dt className="text-[10px] font-semibold uppercase tracking-wider text-ocean-500">
                Voos / hotel já reservados
              </dt>
              <dd className="mt-0.5 whitespace-pre-wrap text-ocean-900">
                {voosHotelLabel(lead.ja_tem_voos_hotel, quizCopy)}
              </dd>
            </div>
            <div className="rounded-xl border border-ocean-100/90 bg-ocean-50/35 px-3 py-2.5">
              <dt className="text-[10px] font-semibold uppercase tracking-wider text-ocean-500">
                Follow-up automático (cron)
              </dt>
              <dd className="mt-0.5 space-y-2 text-ocean-900">
                <label className="flex cursor-pointer items-start gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={autoFollowup}
                    disabled={pendingAuto}
                    onChange={(e) => toggleAutoFollowup(e.target.checked)}
                    className="mt-0.5 rounded border-ocean-300 text-ocean-800"
                  />
                  <span>
                    Permitir que o sistema envie o lembrete automático por
                    email (quando a ficha estiver em «Nova Lead», sem orçamento,
                    e as condições globais do servidor estiverem activas).
                  </span>
                </label>
                <p className="text-[11px] leading-snug text-ocean-600">
                  O atraso mínimo desde o pedido até ao 1.º envio automático é
                  configurável no servidor com{" "}
                  <code className="rounded bg-ocean-100/80 px-1 font-mono text-[10px]">
                    FOLLOWUP_LEAD_MIN_DAYS
                  </code>{" "}
                  (por omissão 3 dias). A activação global (todas as fichas)
                  fica na base de dados, tabela{" "}
                  <code className="rounded bg-ocean-100/80 px-1 font-mono text-[10px]">
                    configuracoes_globais
                  </code>
                  — não aparece neste ecrã.
                </p>
                <button
                  type="button"
                  disabled={
                    !lead.email?.trim() || Boolean(emailComposePreset)
                  }
                  onClick={() =>
                    setEmailComposePreset("initial_followup_reminder")
                  }
                  className="w-full rounded-lg border border-ocean-200 bg-white px-3 py-2 text-left text-xs font-medium text-ocean-800 shadow-sm transition hover:bg-ocean-50 disabled:opacity-50"
                >
                  Lembrete inicial (modelo do automático) — rever e enviar…
                </button>
                {autoFollowupMsg ? (
                  <p
                    className={`text-xs ${
                      autoFollowupMsg.startsWith("Erro")
                        ? "text-terracotta"
                        : "text-emerald-800"
                    }`}
                  >
                    {autoFollowupMsg}
                  </p>
                ) : null}
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
            {lead.promo_campaign_id || lead.promo_campaigns ? (
              <div className="rounded-xl border border-amber-200/90 bg-amber-50/80 px-3 py-2.5">
                <dt className="text-[10px] font-semibold uppercase tracking-wider text-amber-900/90">
                  Campanha promo (email CRM)
                </dt>
                <dd className="mt-1.5 space-y-1.5 text-xs text-ocean-900">
                  {lead.promo_campaigns ? (
                    <>
                      <p className="text-sm font-semibold text-amber-950">
                        Aplicar{" "}
                        <span className="tabular-nums">
                          {lead.promo_campaigns.discount_percent}%
                        </span>{" "}
                        de desconto na proposta / orçamento (oferta registada nesta
                        campanha).
                      </p>
                      <p>
                        <span className="text-ocean-500">Campanha: </span>
                        {lead.promo_campaigns.titulo_publicacao.trim()}
                      </p>
                      <p className="tabular-nums">
                        <span className="text-ocean-500">Oferta válida até: </span>
                        {formatPedidoDate(lead.promo_campaigns.expires_at)}
                      </p>
                      <p className="break-all">
                        <span className="text-ocean-500">Link da publicação: </span>
                        <a
                          href={lead.promo_campaigns.link_publicacao.trim()}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-ocean-800 underline decoration-ocean-300 underline-offset-2"
                        >
                          Abrir
                        </a>
                      </p>
                    </>
                  ) : (
                    <p>
                      Esta ficha ficou ligada à campanha{" "}
                      <code className="rounded bg-white/80 px-1 font-mono text-[10px]">
                        {lead.promo_campaign_id}
                      </code>
                      . Os detalhes do desconto estão na tabela de campanhas na
                      base de dados.
                    </p>
                  )}
                  <p className="text-[11px] leading-snug text-ocean-600">
                    O cliente entrou pelo link do email (token na URL) e usou o{" "}
                    <strong className="font-medium text-ocean-800">
                      mesmo email
                    </strong>{" "}
                    que recebeu a campanha; o sistema gravou essa ligação ao
                    criar o pedido.
                  </p>
                </dd>
              </div>
            ) : null}
          </dl>
        </div>

        <div className="shrink-0 border-t border-ocean-100 bg-white px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:pb-3">
          <div className="mb-3 rounded-xl border border-red-200/80 bg-red-50/50 px-3 py-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-red-900/80">
              Zona de risco
            </p>
            <p className="mt-1 text-xs text-ocean-700">
              Elimina a ficha da base de dados. Não confundir com arquivar no
              quadro.
            </p>
            {deleteErr ? (
              <p className="mt-2 text-xs text-terracotta">{deleteErr}</p>
            ) : null}
            <button
              type="button"
              disabled={deletePending}
              onClick={() => void handleDeleteLead()}
              className="mt-2 w-full rounded-lg border border-red-300/90 bg-white py-2 text-xs font-semibold text-red-800 transition hover:bg-red-100/60 disabled:opacity-50"
            >
              {deletePending ? "A eliminar…" : "Eliminar ficha permanentemente"}
            </button>
          </div>
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

      {emailComposePreset ? (
        <LeadEmailComposeModal
          lead={lead}
          preset={emailComposePreset}
          onClose={() => setEmailComposePreset(null)}
        />
      ) : null}
    </div>
  );
}
