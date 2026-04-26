"use client";

import Link from "next/link";
import { Suspense, useState } from "react";

import { CrmInlineText } from "@/components/crm/crm-inline-text";
import { ScrollToPedidoAnchor } from "@/components/marketing/scroll-to-pedido-anchor";
import { FalarComSilviaIconLinks } from "@/components/marketing/falar-com-silvia-icon-links";
import { TravelQuiz } from "@/components/marketing/travel-quiz";
import {
  hasAnyContactChannel,
  resolveContactChannels,
} from "@/lib/marketing/contact-channels";
import type { PedidoOrcamentoPrefill } from "@/lib/marketing/pedido-orcamento";
import type { SiteContent } from "@/lib/site/site-content";

type Props = {
  copy: SiteContent["quiz"];
  quizSuccess: SiteContent["quizSuccess"];
  alma?: SiteContent["almaTestimonials"];
  prefill?: PedidoOrcamentoPrefill | null;
  /** Força remontagem quando mudam os query params (ex.: clique vindo de uma publicação). */
  quizKey?: string;
  crm?: {
    patchQuiz: (field: keyof SiteContent["quiz"], value: string) => void;
    patchQuizSuccess: (
      field: keyof SiteContent["quizSuccess"],
      value: string,
    ) => void;
  };
};

export function QuizSection({
  copy,
  quizSuccess,
  alma,
  prefill = null,
  quizKey = "default",
  crm,
}: Props) {
  const channels = resolveContactChannels(
    copy.falarComSilviaUrl,
    copy.falarComSilviaInstagramUrl,
  );
  const hasContactIcons = !crm && hasAnyContactChannel(channels);
  const falarLabel =
    copy.falarComSilviaLabel.trim() || "Falar com a Sílvia";
  const proofEyebrow = copy.socialProofEyebrow.trim();
  const stat = copy.socialProofStat.trim();
  const testimonialItems = (alma?.items ?? [])
    .filter((it) => it.quote.trim().length > 0)
    .slice(0, 2);
  const [quickNome, setQuickNome] = useState("");
  const [quickEmail, setQuickEmail] = useState("");
  const [quickTelemovel, setQuickTelemovel] = useState("");
  const [quickObs, setQuickObs] = useState(prefill?.destinoSonho ?? "");
  const [quickBusy, setQuickBusy] = useState(false);
  const [quickMsg, setQuickMsg] = useState<string | null>(null);

  async function submitQuickRequest() {
    setQuickMsg(null);
    if (quickNome.trim().length < 2) {
      setQuickMsg("Indica o teu nome.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(quickEmail.trim())) {
      setQuickMsg("Indica um email válido.");
      return;
    }
    if (quickObs.trim().length < 2) {
      setQuickMsg("Escreve uma observação breve sobre a viagem.");
      return;
    }
    setQuickBusy(true);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pedido_rapido: true,
          nome: quickNome.trim(),
          email: quickEmail.trim(),
          telemovel: quickTelemovel.trim(),
          destino_sonho: quickObs.trim().slice(0, 300),
          website_url: "",
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setQuickMsg(data.error ?? "Não foi possível enviar o pedido.");
        return;
      }
      setQuickMsg("Pedido enviado com sucesso. A Sílvia entra em contacto em breve.");
      setQuickObs("");
    } catch {
      setQuickMsg("Erro de rede. Tenta novamente.");
    } finally {
      setQuickBusy(false);
    }
  }

  return (
    <div className="border-t border-ocean-100/60 bg-gradient-to-b from-sand via-ocean-50/20 to-sand">
      <ScrollToPedidoAnchor />
      {/* #quiz mantém links antigos; #pedido-orcamento é o destino preferido */}
      <div id="quiz" className="h-px scroll-mt-24 overflow-hidden opacity-0" aria-hidden />
      <section
        id="pedido-orcamento"
        className="scroll-mt-28 px-5 py-20 sm:px-6 md:py-28"
        aria-labelledby="pedido-orcamento-heading"
      >
        <div className="mx-auto max-w-5xl">
          <p className="text-center text-[11px] font-medium uppercase tracking-[0.35em] text-ocean-500">
            {crm ? (
              <CrmInlineText
                label="Pedido de proposta — linha pequena"
                value={copy.eyebrow}
                onApply={(v) => crm.patchQuiz("eyebrow", v)}
              />
            ) : (
              copy.eyebrow
            )}
          </p>
          <h2
            id="pedido-orcamento-heading"
            className="mt-4 text-center font-serif text-3xl font-normal tracking-tight text-ocean-900 md:text-4xl"
          >
            {crm ? (
              <CrmInlineText
                label="Pedido de proposta — título"
                value={copy.title}
                onApply={(v) => crm.patchQuiz("title", v)}
              />
            ) : (
              copy.title
            )}
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-center text-base leading-relaxed text-ocean-600 md:text-lg">
            {crm ? (
              <CrmInlineText
                label="Pedido de proposta — texto"
                multiline
                value={copy.body}
                onApply={(v) => crm.patchQuiz("body", v)}
              />
            ) : (
              copy.body
            )}
          </p>

          {crm ? (
            <div className="mx-auto mt-8 max-w-xl rounded-2xl border border-dashed border-ocean-200 bg-ocean-50/40 px-4 py-4 text-sm">
              <p className="text-xs font-medium text-ocean-600">
                Ícones de contacto (email, WhatsApp, Instagram) abaixo da frase
                de confiança no site público — env ou URLs aqui.
              </p>
              <p className="mt-2 font-medium text-ocean-900">
                <CrmInlineText
                  label="Título acima dos ícones"
                  value={copy.falarComSilviaLabel}
                  onApply={(v) => crm.patchQuiz("falarComSilviaLabel", v)}
                />
              </p>
              <p className="mt-2 break-all text-xs text-ocean-700">
                <CrmInlineText
                  label="URL WhatsApp (wa.me…) ou mailto: (opcional)"
                  value={copy.falarComSilviaUrl}
                  onApply={(v) => crm.patchQuiz("falarComSilviaUrl", v)}
                />
              </p>
              <p className="mt-2 break-all text-xs text-ocean-700">
                <CrmInlineText
                  label="URL perfil Instagram"
                  value={copy.falarComSilviaInstagramUrl}
                  onApply={(v) => crm.patchQuiz("falarComSilviaInstagramUrl", v)}
                />
              </p>
            </div>
          ) : null}

          {crm ? (
            <div className={`mt-12 ${crm ? "pointer-events-none opacity-90" : ""}`}>
              <div className={`mx-auto max-w-3xl${crm ? " pointer-events-auto" : ""}`}>
                <Suspense
                  fallback={
                    <div
                      className="min-h-[280px] rounded-3xl border border-ocean-100 bg-white/80"
                      aria-hidden
                    />
                  }
                >
                  <TravelQuiz
                    key={quizKey}
                    prefill={prefill}
                    quizCopy={copy}
                    crm={crm}
                  />
                </Suspense>
              </div>
            </div>
          ) : (
            <div className="mx-auto mt-12 max-w-4xl rounded-3xl border border-ocean-100 bg-white p-6 shadow-sm md:p-8">
              {(proofEyebrow || stat) ? (
                <div className="rounded-2xl bg-ocean-50 px-4 py-4">
                  {proofEyebrow ? (
                    <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-ocean-600">
                      {proofEyebrow}
                    </p>
                  ) : null}
                  {stat ? (
                    <p className="mt-2 text-base leading-relaxed text-ocean-800">{stat}</p>
                  ) : null}
                </div>
              ) : null}
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <Link
                  href="#publicacoes"
                  className="rounded-full bg-ocean-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-ocean-800"
                >
                  Ver publicações
                </Link>
                <Link
                  href="/mapa"
                  className="rounded-full border border-ocean-200 px-5 py-2.5 text-sm font-semibold text-ocean-800 transition hover:bg-ocean-50"
                >
                  Explorar no mapa
                </Link>
              </div>
              <div className="mt-5 rounded-2xl border border-ocean-100 bg-sand p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ocean-600">
                  Pedido rápido
                </p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <input
                    type="text"
                    value={quickNome}
                    onChange={(e) => setQuickNome(e.target.value)}
                    className="rounded-xl border border-ocean-200 bg-white px-3 py-2 text-sm"
                    placeholder="Nome"
                  />
                  <input
                    type="email"
                    value={quickEmail}
                    onChange={(e) => setQuickEmail(e.target.value)}
                    className="rounded-xl border border-ocean-200 bg-white px-3 py-2 text-sm"
                    placeholder="Email"
                  />
                  <input
                    type="text"
                    value={quickTelemovel}
                    onChange={(e) => setQuickTelemovel(e.target.value)}
                    className="rounded-xl border border-ocean-200 bg-white px-3 py-2 text-sm sm:col-span-2"
                    placeholder="Telemóvel (opcional)"
                  />
                  <textarea
                    rows={3}
                    value={quickObs}
                    onChange={(e) => setQuickObs(e.target.value)}
                    className="rounded-xl border border-ocean-200 bg-white px-3 py-2 text-sm sm:col-span-2"
                    placeholder="Observações sobre a viagem que imaginas"
                  />
                </div>
                {quickMsg ? (
                  <p
                    className={`mt-2 text-sm ${
                      quickMsg.startsWith("Pedido enviado")
                        ? "text-emerald-700"
                        : "text-terracotta"
                    }`}
                  >
                    {quickMsg}
                  </p>
                ) : null}
                <button
                  type="button"
                  disabled={quickBusy}
                  onClick={() => void submitQuickRequest()}
                  className="mt-3 rounded-full bg-ocean-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-ocean-800 disabled:opacity-60"
                >
                  {quickBusy ? "A enviar..." : "Enviar pedido"}
                </button>
              </div>
              {hasContactIcons ? (
                <div className="mt-5 border-t border-ocean-100 pt-4">
                  <FalarComSilviaIconLinks channels={channels} title={falarLabel} />
                </div>
              ) : null}
              {testimonialItems.length > 0 ? (
                <ul className="mt-5 grid gap-3 md:grid-cols-2">
                  {testimonialItems.map((it, i) => (
                    <li
                      key={`${i}-${it.attribution}`}
                      className="rounded-2xl border border-ocean-100 bg-sand px-4 py-4"
                    >
                      <p className="font-serif text-sm italic leading-relaxed text-ocean-900">
                        «{it.quote.trim()}»
                      </p>
                      {it.attribution.trim() ? (
                        <p className="mt-2 text-xs font-medium text-ocean-600">
                          {it.attribution.trim()}
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          )}

          {crm ? (
            <div className="mx-auto mt-14 max-w-3xl space-y-6 rounded-2xl border border-dashed border-ocean-300 bg-ocean-50/50 px-5 py-6 text-left md:px-8">
              <p className="text-xs font-semibold uppercase tracking-wide text-ocean-600">
                Abre o formulário (Começar) para editar os passos imersivos a
                clicar · página «Obrigado» abaixo
              </p>
              <div>
                <p className="text-xs font-medium text-ocean-700">
                  Mensagem se já houver pedido em aberto (mesmo contacto)
                </p>
                <p className="mt-2 text-sm text-ocean-800">
                  <CrmInlineText
                    label="Mensagem pedido duplicado"
                    multiline
                    value={copy.duplicateOpenLeadMessage}
                    onApply={(v) => crm.patchQuiz("duplicateOpenLeadMessage", v)}
                  />
                </p>
              </div>
              <p className="border-t border-ocean-200 pt-4 text-xs font-semibold uppercase tracking-wide text-ocean-600">
                Página «Obrigado» (usa {"{nome}"} na saudação se quiseres)
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-xs text-ocean-600">
                  Saudação
                  <span className="mt-1 block text-sm text-ocean-900">
                    <CrmInlineText
                      label="Obrigado — saudação"
                      value={quizSuccess.greetingLine}
                      onApply={(v) => crm.patchQuizSuccess("greetingLine", v)}
                    />
                  </span>
                </label>
                <label className="block text-xs text-ocean-600">
                  Título principal
                  <span className="mt-1 block text-sm text-ocean-900">
                    <CrmInlineText
                      label="Obrigado — título"
                      value={quizSuccess.headline}
                      onApply={(v) => crm.patchQuizSuccess("headline", v)}
                    />
                  </span>
                </label>
              </div>
              <label className="block text-xs text-ocean-600">
                Texto do corpo
                <span className="mt-1 block text-sm text-ocean-900">
                  <CrmInlineText
                    label="Obrigado — corpo"
                    multiline
                    value={quizSuccess.body}
                    onApply={(v) => crm.patchQuizSuccess("body", v)}
                  />
                </span>
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-xs text-ocean-600">
                  Título «próximos passos»
                  <span className="mt-1 block text-sm text-ocean-900">
                    <CrmInlineText
                      label="Obrigado — título próximos passos"
                      value={quizSuccess.nextStepsTitle}
                      onApply={(v) => crm.patchQuizSuccess("nextStepsTitle", v)}
                    />
                  </span>
                </label>
                <label className="block text-xs text-ocean-600">
                  Texto próximos passos
                  <span className="mt-1 block text-sm text-ocean-900">
                    <CrmInlineText
                      label="Obrigado — texto próximos passos"
                      multiline
                      value={quizSuccess.nextStepsBody}
                      onApply={(v) => crm.patchQuizSuccess("nextStepsBody", v)}
                    />
                  </span>
                </label>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <label className="block text-xs text-ocean-600">
                  Rótulo WhatsApp
                  <span className="mt-1 block text-sm text-ocean-900">
                    <CrmInlineText
                      label="Obrigado — WhatsApp"
                      value={quizSuccess.whatsappCtaLabel}
                      onApply={(v) =>
                        crm.patchQuizSuccess("whatsappCtaLabel", v)
                      }
                    />
                  </span>
                </label>
                <label className="block text-xs text-ocean-600">
                  Rótulo Calendly
                  <span className="mt-1 block text-sm text-ocean-900">
                    <CrmInlineText
                      label="Obrigado — Calendly"
                      value={quizSuccess.calendlyCtaLabel}
                      onApply={(v) =>
                        crm.patchQuizSuccess("calendlyCtaLabel", v)
                      }
                    />
                  </span>
                </label>
                <label className="block text-xs text-ocean-600">
                  Rótulo criar conta
                  <span className="mt-1 block text-sm text-ocean-900">
                    <CrmInlineText
                      label="Obrigado — criar conta"
                      value={quizSuccess.criarContaCtaLabel}
                      onApply={(v) =>
                        crm.patchQuizSuccess("criarContaCtaLabel", v)
                      }
                    />
                  </span>
                </label>
              </div>
              <label className="block text-xs text-ocean-600">
                Texto Spotify
                <span className="mt-1 block text-sm text-ocean-900">
                  <CrmInlineText
                    label="Obrigado — Spotify"
                    multiline
                    value={quizSuccess.spotifyLabel}
                    onApply={(v) => crm.patchQuizSuccess("spotifyLabel", v)}
                  />
                </span>
              </label>
              <label className="block text-xs text-ocean-600">
                URL Spotify
                <span className="mt-1 block break-all text-sm text-ocean-900">
                  <CrmInlineText
                    label="Obrigado — URL Spotify"
                    value={quizSuccess.spotifyUrl}
                    onApply={(v) => crm.patchQuizSuccess("spotifyUrl", v)}
                  />
                </span>
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-xs text-ocean-600">
                  Botão voltar à home
                  <span className="mt-1 block text-sm text-ocean-900">
                    <CrmInlineText
                      label="Obrigado — voltar home"
                      value={quizSuccess.backHomeLabel}
                      onApply={(v) => crm.patchQuizSuccess("backHomeLabel", v)}
                    />
                  </span>
                </label>
                <label className="block text-xs text-ocean-600">
                  Nota email confirmação
                  <span className="mt-1 block text-sm text-ocean-900">
                    <CrmInlineText
                      label="Obrigado — email confirmado"
                      multiline
                      value={quizSuccess.emailConfirmLine}
                      onApply={(v) =>
                        crm.patchQuizSuccess("emailConfirmLine", v)
                      }
                    />
                  </span>
                </label>
              </div>
              <label className="block text-xs text-ocean-600">
                URL imagem de fundo do cartão (opcional)
                <span className="mt-1 block break-all text-sm text-ocean-900">
                  <CrmInlineText
                    label="Obrigado — imagem fundo"
                    value={quizSuccess.cardBackgroundUrl}
                    onApply={(v) =>
                      crm.patchQuizSuccess("cardBackgroundUrl", v)
                    }
                  />
                </span>
              </label>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
