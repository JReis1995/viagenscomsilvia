"use client";

import { motion, useReducedMotion } from "framer-motion";

import { CrmInlineText } from "@/components/crm/crm-inline-text";
import type { SiteContent } from "@/lib/site/site-content";
import {
  getFeaturedVideoPosterUrl,
  getInstagramVideoPostUrl,
} from "@/lib/site/social";

function LargePlayIcon() {
  return (
    <span className="flex h-20 w-20 items-center justify-center rounded-full bg-white/95 text-ocean-900 shadow-[0_16px_48px_-12px_rgba(0,0,0,0.45)] ring-2 ring-white/50 backdrop-blur-sm transition group-hover:scale-110 md:h-24 md:w-24">
      <svg
        className="ml-1 h-9 w-9 md:h-10 md:w-10"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden
      >
        <path d="M8 5v14l11-7z" />
      </svg>
    </span>
  );
}

type Props = {
  copy: SiteContent["featuredVideo"];
  crm?: {
    patch: (field: keyof SiteContent["featuredVideo"], value: string) => void;
  };
};

export function FeaturedPublicationVideo({ copy, crm }: Props) {
  const reduceMotion = useReducedMotion();
  const href =
    copy.instagramUrl.trim() !== ""
      ? copy.instagramUrl.trim()
      : getInstagramVideoPostUrl();
  const poster =
    copy.posterUrl.trim() !== ""
      ? copy.posterUrl.trim()
      : getFeaturedVideoPosterUrl();

  const lock = crm ? "pointer-events-none" : "";

  return (
    <motion.div
      className="mt-14"
      initial={reduceMotion ? false : { opacity: 0, y: 24 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] as const }}
    >
      <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.35em] text-ocean-500">
        {crm ? (
          <CrmInlineText
            label="Linha pequena do vídeo em destaque"
            value={copy.eyebrow}
            onApply={(v) => crm.patch("eyebrow", v)}
          />
        ) : (
          copy.eyebrow
        )}
      </p>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={`group relative block overflow-hidden rounded-[1.75rem] shadow-[0_28px_64px_-28px_rgba(15,61,57,0.45)] ring-1 ring-ocean-900/10 md:rounded-[2rem] ${lock}`}
      >
        <div className="relative aspect-[21/11] min-h-[220px] w-full sm:aspect-[21/9] sm:min-h-[280px] md:min-h-[320px]">
          {poster ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={poster}
              alt=""
              className="absolute inset-0 h-full w-full object-cover transition duration-[1.2s] ease-out group-hover:scale-[1.04]"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-ocean-800 via-ocean-700 to-ocean-900" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-ocean-950/95 via-ocean-950/40 to-ocean-950/20" />
          {!reduceMotion ? (
            <motion.div
              className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-terracotta/20 blur-3xl"
              animate={{ opacity: [0.25, 0.45, 0.25], scale: [1, 1.08, 1] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              aria-hidden
            />
          ) : null}
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 px-6 text-center md:flex-row md:gap-8 md:text-left">
            <LargePlayIcon />
            <div className={`max-w-md text-white ${crm ? "[&_.crm-ov]:pointer-events-auto" : ""}`}>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/75">
                {crm ? (
                  <CrmInlineText
                    label="Etiqueta do vídeo em destaque"
                    variant="onDark"
                    value={copy.kicker}
                    onApply={(v) => crm.patch("kicker", v)}
                    className="crm-ov"
                  />
                ) : (
                  copy.kicker
                )}
              </p>
              <p className="mt-2 font-serif text-2xl font-normal leading-tight md:text-3xl">
                {crm ? (
                  <CrmInlineText
                    label="Título do vídeo em destaque"
                    variant="onDark"
                    multiline
                    value={copy.title}
                    onApply={(v) => crm.patch("title", v)}
                    className="crm-ov"
                  />
                ) : (
                  copy.title
                )}
              </p>
              <p className="mt-3 text-sm text-white/80">
                {crm ? (
                  <CrmInlineText
                    label="Subtítulo do vídeo em destaque"
                    variant="onDark"
                    multiline
                    value={copy.subtitle}
                    onApply={(v) => crm.patch("subtitle", v)}
                    className="crm-ov"
                  />
                ) : (
                  copy.subtitle
                )}
              </p>
            </div>
          </div>
        </div>
      </a>
    </motion.div>
  );
}
