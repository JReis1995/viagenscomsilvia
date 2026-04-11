"use client";

import { motion, useReducedMotion } from "framer-motion";

import { CrmInlineText } from "@/components/crm/crm-inline-text";
import { AlmaTestimonialsSlider } from "@/components/marketing/alma-testimonials-slider";
import type { SiteContent } from "@/lib/site/site-content";
import {
  getConsultoraPortraitUrl,
  getInstagramPhotoPostUrl,
  getInstagramVideoPostUrl,
} from "@/lib/site/social";

function PortraitFallback() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-ocean-100 via-sand to-ocean-50">
      <span
        className="font-serif text-7xl font-light text-ocean-700/40 md:text-8xl"
        aria-hidden
      >
        S
      </span>
      <p className="mt-5 text-center text-[10px] font-medium uppercase tracking-[0.35em] text-ocean-500/70">
        Viagens com Sílvia
      </p>
    </div>
  );
}

type Props = {
  copy: SiteContent["consultora"];
  alma: SiteContent["almaTestimonials"];
  crm?: {
    patchConsultora: (
      field: keyof SiteContent["consultora"],
      value: string,
    ) => void;
    patchAlmaHeading: (
      field: "eyebrow" | "title",
      value: string,
    ) => void;
    patchAlmaItem: (
      index: number,
      field: "quote" | "attribution",
      value: string,
    ) => void;
  };
};

export function ConsultoraSection({ copy, alma, crm }: Props) {
  const reduceMotion = useReducedMotion();
  const portraitUrl =
    copy.portraitUrl.trim() !== ""
      ? copy.portraitUrl.trim()
      : getConsultoraPortraitUrl();
  const photoPost =
    copy.linkPhoto.trim() !== ""
      ? copy.linkPhoto.trim()
      : getInstagramPhotoPostUrl();
  const videoPost =
    copy.linkVideo.trim() !== ""
      ? copy.linkVideo.trim()
      : getInstagramVideoPostUrl();

  const portraitIsConfigured =
    portraitUrl &&
    (portraitUrl.startsWith("http://") || portraitUrl.startsWith("https://"));

  const lock = crm ? "pointer-events-none" : "";
  const ctaLock = crm
    ? "pointer-events-none [&_.crm-consultora-pe]:pointer-events-auto"
    : "";

  return (
    <section
      id="secao-consultora"
      className="scroll-mt-28 border-t border-ocean-100/70 bg-sand px-5 py-20 sm:px-6 md:py-28"
      aria-labelledby="consultora-heading"
    >
      <div className="mx-auto max-w-6xl space-y-12 lg:space-y-16">
        <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] lg:gap-16">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, x: -12 }}
          whileInView={reduceMotion ? undefined : { opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{
            duration: 0.65,
            ease: [0.22, 1, 0.36, 1] as const,
          }}
        >
          <p className="text-[11px] font-medium uppercase tracking-[0.35em] text-ocean-600">
            {crm ? (
              <CrmInlineText
                label="Consultora — linha pequena"
                value={copy.eyebrow}
                onApply={(v) => crm.patchConsultora("eyebrow", v)}
              />
            ) : (
              copy.eyebrow
            )}
          </p>
          <h2
            id="consultora-heading"
            className="mt-4 font-serif text-3xl font-normal tracking-tight text-ocean-900 md:text-[2.35rem] md:leading-tight"
          >
            {crm ? (
              <CrmInlineText
                label="Consultora — título"
                value={copy.title}
                onApply={(v) => crm.patchConsultora("title", v)}
              />
            ) : (
              copy.title
            )}
          </h2>
          <p className="mt-6 text-base leading-relaxed text-ocean-700 md:text-lg">
            {crm ? (
              <CrmInlineText
                label="Consultora — primeiro parágrafo"
                multiline
                value={copy.p1}
                onApply={(v) => crm.patchConsultora("p1", v)}
              />
            ) : (
              copy.p1
            )}
          </p>
          <p className="mt-5 text-base leading-relaxed text-ocean-700 md:text-lg">
            {crm ? (
              <CrmInlineText
                label="Consultora — segundo parágrafo"
                multiline
                value={copy.p2}
                onApply={(v) => crm.patchConsultora("p2", v)}
              />
            ) : (
              copy.p2
            )}
          </p>
          <blockquote className="mt-10 rounded-[1.75rem] border border-ocean-100/90 bg-white/70 px-6 py-6 shadow-sm backdrop-blur-sm md:px-8 md:py-7">
            <p className="font-serif text-lg italic leading-relaxed text-ocean-800 md:text-xl">
              {crm ? (
                <CrmInlineText
                  label="Consultora — citação"
                  multiline
                  value={copy.quote}
                  onApply={(v) => crm.patchConsultora("quote", v)}
                />
              ) : (
                copy.quote
              )}
            </p>
          </blockquote>
          <div className={`mt-8 flex flex-wrap gap-3 ${lock}`}>
            <a
              href={photoPost}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-ocean-700 underline-offset-4 hover:text-ocean-900 hover:underline"
            >
              Ver publicação no Instagram
            </a>
            <span className="text-ocean-300" aria-hidden>
              ·
            </span>
            <a
              href={videoPost}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-ocean-700 underline-offset-4 hover:text-ocean-900 hover:underline"
            >
              Ver vídeo no Instagram
            </a>
          </div>
          <a
            href="#pedido-orcamento"
            className={`mt-10 inline-flex h-14 min-h-[3.5rem] items-center justify-center rounded-full bg-ocean-900 px-9 text-sm font-semibold tracking-wide text-white shadow-[0_18px_40px_-20px_rgba(15,61,57,0.5)] transition hover:bg-ocean-800 ${ctaLock}`}
          >
            {crm ? (
              <CrmInlineText
                label="Texto do botão pedido de proposta"
                variant="onDark"
                value={copy.ctaQuiz}
                onApply={(v) => crm.patchConsultora("ctaQuiz", v)}
                className="crm-consultora-pe text-white"
              />
            ) : (
              copy.ctaQuiz
            )}
          </a>
        </motion.div>

        <motion.div
          className="relative mx-auto aspect-[4/5] w-full max-w-sm overflow-hidden rounded-[2rem] shadow-[0_28px_60px_-32px_rgba(15,61,57,0.38)] ring-1 ring-ocean-900/[0.06] lg:mx-0 lg:max-w-none"
          initial={reduceMotion ? false : { opacity: 0, x: 16 }}
          whileInView={reduceMotion ? undefined : { opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.7, delay: 0.06, ease: [0.22, 1, 0.36, 1] as const }}
        >
          {portraitIsConfigured ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={portraitUrl!}
                alt=""
                className="absolute inset-0 h-full w-full object-cover object-center"
                loading="lazy"
                decoding="async"
              />
            </>
          ) : (
            <PortraitFallback />
          )}
          <div
            className={
              portraitIsConfigured
                ? "pointer-events-none absolute inset-0 bg-gradient-to-t from-ocean-900/30 via-transparent to-transparent"
                : "pointer-events-none absolute inset-0 bg-gradient-to-t from-ocean-900/45 via-transparent to-transparent"
            }
            aria-hidden
          />
        </motion.div>
        </div>
        <AlmaTestimonialsSlider
          eyebrow={alma.eyebrow}
          title={alma.title}
          items={alma.items}
          crm={
            crm
              ? {
                  patchHeading: crm.patchAlmaHeading,
                  patchItem: crm.patchAlmaItem,
                }
              : undefined
          }
        />
      </div>
    </section>
  );
}
