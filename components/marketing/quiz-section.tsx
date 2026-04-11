import { Suspense } from "react";

import { ScrollToPedidoAnchor } from "@/components/marketing/scroll-to-pedido-anchor";
import { TravelQuiz } from "@/components/marketing/travel-quiz";
import type { PedidoOrcamentoPrefill } from "@/lib/marketing/pedido-orcamento";
import type { SiteContent } from "@/lib/site/site-content";

type Props = {
  copy: SiteContent["quiz"];
  prefill?: PedidoOrcamentoPrefill | null;
  /** Força remontagem quando mudam os query params (ex.: clique vindo de uma publicação). */
  quizKey?: string;
};

export function QuizSection({ copy, prefill = null, quizKey = "default" }: Props) {
  return (
    <div className="border-t border-ocean-100/60 bg-gradient-to-b from-sand via-ocean-50/20 to-sand">
      <ScrollToPedidoAnchor />
      {/* #quiz mantém links antigos; #pedido-orcamento é o destino preferido */}
      <div id="quiz" className="h-px scroll-mt-24 overflow-hidden opacity-0" aria-hidden />
      <section
        id="pedido-orcamento"
        className="scroll-mt-24 px-5 py-20 sm:px-6 md:py-28"
        aria-labelledby="pedido-orcamento-heading"
      >
      <div className="mx-auto max-w-3xl">
        <p className="text-center text-[11px] font-medium uppercase tracking-[0.35em] text-ocean-500">
          {copy.eyebrow}
        </p>
        <h2
          id="pedido-orcamento-heading"
          className="mt-4 text-center font-serif text-3xl font-normal tracking-tight text-ocean-900 md:text-4xl"
        >
          {copy.title}
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-center text-base leading-relaxed text-ocean-600 md:text-lg">
          {copy.body}
        </p>
        <div className="mt-14">
          <Suspense
            fallback={
              <div
                className="min-h-[280px] rounded-3xl border border-ocean-100 bg-white/80"
                aria-hidden
              />
            }
          >
            <TravelQuiz key={quizKey} prefill={prefill} quizCopy={copy} />
          </Suspense>
        </div>
      </div>
      </section>
    </div>
  );
}
