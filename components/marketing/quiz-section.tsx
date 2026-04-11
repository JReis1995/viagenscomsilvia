"use client";

import { Suspense } from "react";

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
  alma?: SiteContent["almaTestimonials"];
  prefill?: PedidoOrcamentoPrefill | null;
  /** Força remontagem quando mudam os query params (ex.: clique vindo de uma publicação). */
  quizKey?: string;
  crm?: {
    patchQuiz: (field: keyof SiteContent["quiz"], value: string) => void;
  };
};

export function QuizSection({
  copy,
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

  const showAside =
    crm ||
    Boolean(stat) ||
    Boolean(proofEyebrow) ||
    testimonialItems.length > 0 ||
    hasContactIcons;

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

          <div
            className={`mt-12 ${showAside ? "grid gap-10 md:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] md:items-start md:gap-12 lg:gap-14" : ""} ${crm ? "pointer-events-none opacity-90" : ""}`}
          >
            {showAside ? (
            <aside className="order-1 space-y-5 md:order-1">
              {/* Coluna lateral ficava com pointer-events bloqueados pela grelha do CRM */}
              <div className={crm ? "pointer-events-auto" : undefined}>
              {stat || proofEyebrow || crm ? (
                <div className="rounded-2xl border border-ocean-100/90 bg-gradient-to-br from-white via-white to-ocean-50/35 py-5 pl-5 pr-4 shadow-md shadow-ocean-900/[0.06] md:border-l-[3px] md:border-l-terracotta/90 md:pl-6">
                  {proofEyebrow || crm ? (
                    <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-ocean-500 md:text-left">
                      {crm ? (
                        <CrmInlineText
                          label="Pedido — linha pequena da prova social"
                          value={copy.socialProofEyebrow}
                          onApply={(v) => crm.patchQuiz("socialProofEyebrow", v)}
                        />
                      ) : (
                        proofEyebrow
                      )}
                    </p>
                  ) : null}
                  {stat ? (
                    <p className="mt-3 text-center text-[15px] font-serif font-normal leading-relaxed text-ocean-800 md:text-left md:text-base">
                      {crm ? (
                        <CrmInlineText
                          label="Pedido — texto da prova social"
                          multiline
                          value={copy.socialProofStat}
                          onApply={(v) => crm.patchQuiz("socialProofStat", v)}
                        />
                      ) : (
                        stat
                      )}
                    </p>
                  ) : crm ? (
                    <p className="mt-3 text-xs text-ocean-500">
                      <CrmInlineText
                        label="Pedido — texto da prova social"
                        multiline
                        value={copy.socialProofStat}
                        onApply={(v) => crm.patchQuiz("socialProofStat", v)}
                      />
                    </p>
                  ) : null}
                  {hasContactIcons ? (
                    <FalarComSilviaIconLinks
                      channels={channels}
                      title={falarLabel}
                    />
                  ) : null}
                </div>
              ) : hasContactIcons ? (
                <div className="rounded-2xl border border-ocean-100/90 bg-gradient-to-br from-white via-white to-ocean-50/35 px-5 py-5 shadow-md shadow-ocean-900/[0.06] md:border-l-[3px] md:border-l-terracotta/90 md:pl-6">
                  <FalarComSilviaIconLinks
                    channels={channels}
                    title={falarLabel}
                    embedded={false}
                  />
                </div>
              ) : null}

              {!crm &&
              process.env.NODE_ENV === "development" &&
              !hasContactIcons ? (
                <p className="text-center text-xs text-ocean-500 md:text-left">
                  Dica (dev): define{" "}
                  <code className="rounded bg-ocean-100/80 px-1 text-[11px]">
                    NEXT_PUBLIC_CONTACT_EMAIL
                  </code>
                  ,{" "}
                  <code className="rounded bg-ocean-100/80 px-1 text-[11px]">
                    NEXT_PUBLIC_CONTACT_WHATSAPP_URL
                  </code>{" "}
                  e/ou{" "}
                  <code className="rounded bg-ocean-100/80 px-1 text-[11px]">
                    NEXT_PUBLIC_CONTACT_INSTAGRAM_URL
                  </code>{" "}
                  no .env.local, ou URLs no CRM.
                </p>
              ) : null}

              {testimonialItems.length > 0 ? (
                <div className="space-y-4">
                  <p className="text-center text-[10px] font-semibold uppercase tracking-[0.25em] text-ocean-500 md:text-left">
                    Vozes de viajantes
                  </p>
                  <ul className="space-y-4">
                    {testimonialItems.map((it, i) => (
                      <li
                        key={`${i}-${it.attribution}`}
                        className="rounded-2xl border border-ocean-100/90 bg-white/85 px-4 py-4 shadow-sm"
                      >
                        <p className="font-serif text-sm italic leading-relaxed text-ocean-800 line-clamp-4 md:text-[15px]">
                          «{it.quote.trim()}»
                        </p>
                        {it.attribution.trim() ? (
                          <p className="mt-3 text-xs font-medium text-ocean-600">
                            {it.attribution.trim()}
                          </p>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              </div>
            </aside>
            ) : null}

            <div
              className={
                showAside
                  ? `order-2 min-w-0 md:order-2${crm ? " pointer-events-auto" : ""}`
                  : `mx-auto max-w-3xl${crm ? " pointer-events-auto" : ""}`
              }
            >
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

          {crm ? (
            <p className="mt-4 text-center text-xs text-ocean-500">
              O formulário em passos fica pausado aqui. Para todos os campos do
              pedido (clima, prova social, URLs, página «Obrigado»), usa o botão
              fixo{" "}
              <strong className="font-medium text-ocean-700">
                Pedido: prova social, URLs e obrigado
              </strong>{" "}
              no topo, ou a{" "}
              <a href="/crm/site?lista=1" className="font-medium underline">
                vista em lista
              </a>{" "}
              → separador «Pedido de proposta».
            </p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
