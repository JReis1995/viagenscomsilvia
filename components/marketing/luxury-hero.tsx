"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useMemo } from "react";

import { HeroTravelDates } from "@/components/marketing/hero-travel-dates";
import { HeroVitrine } from "@/components/marketing/hero-vitrine";
import { CrmInlineText } from "@/components/crm/crm-inline-text";
import type { SiteContent } from "@/lib/site/site-content";
import { getHeroTravelImageUrl } from "@/lib/site/social";
import type { PublishedPost } from "@/types/post";

const fadeUp = {
  hidden: { opacity: 0, y: 26 },
  show: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.75, delay, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

type Props = {
  copy: SiteContent["hero"];
  /** Publicações visíveis no site — carrossel horizontal no topo. */
  posts: PublishedPost[];
  /** CRM: edição inline + links/botões desactivados */
  crm?: {
    patchHero: (field: keyof SiteContent["hero"], value: string) => void;
  };
};

function isHttpUrl(s: string): boolean {
  const t = s.trim();
  return t.startsWith("https://") || t.startsWith("http://");
}

export function LuxuryHero({ copy, crm, posts }: Props) {
  const reduceMotion = useReducedMotion();
  const lock = !!crm;
  /** Bloqueia navegação/cliques nos botões no CRM, mas permite editar rótulos via CrmInlineText. */
  const navLock = lock
    ? "pointer-events-none [&_.crm-hero-pe]:pointer-events-auto"
    : "";

  const vitrineSlides = useMemo(
    () => posts.filter((p) => p.media_url?.trim()),
    [posts],
  );

  if (vitrineSlides.length > 0) {
    return (
      <HeroVitrine posts={posts} copy={copy} navLock={navLock} crm={crm} />
    );
  }

  const heroImageSrc =
    copy.heroImageUrl.trim() !== ""
      ? copy.heroImageUrl.trim()
      : getHeroTravelImageUrl();

  const videoUrl = copy.heroVideoUrl.trim();
  const posterUrl = copy.heroVideoPosterUrl.trim();
  const useVideo = isHttpUrl(videoUrl) && !reduceMotion;

  return (
    <section
      id="topo-pagina-inicial"
      className="relative min-h-[min(92svh,900px)] scroll-mt-28 overflow-hidden"
    >
      <div className="absolute inset-0" aria-hidden>
        <motion.div
          className="relative h-full min-h-[min(92svh,900px)] w-full"
          initial={reduceMotion ? false : { scale: 1.12 }}
          animate={reduceMotion ? undefined : { scale: 1 }}
          transition={{ duration: 1.35, ease: [0.22, 1, 0.36, 1] as const }}
        >
          {useVideo ? (
            <video
              className="absolute inset-0 h-full w-full object-cover object-center"
              autoPlay
              muted
              playsInline
              loop
              poster={posterUrl && isHttpUrl(posterUrl) ? posterUrl : undefined}
            >
              <source src={videoUrl} />
            </video>
          ) : (
            /* eslint-disable-next-line @next/next/no-img-element -- URL editável (Storage / CDN) */
            <img
              key={heroImageSrc}
              src={heroImageSrc}
              alt=""
              className="absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-700"
              fetchPriority="high"
              decoding="async"
            />
          )}
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-t from-ocean-950 via-ocean-950/55 to-ocean-900/35" />
        <div className="absolute inset-0 bg-gradient-to-r from-ocean-950/80 via-transparent to-ocean-950/50" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_100%,rgba(15,61,57,0.5),transparent_65%)]" />
      </div>

      <div className="relative z-10 flex min-h-[min(92svh,900px)] flex-col justify-center px-5 pb-16 pt-24 sm:px-8 sm:pb-16 sm:pt-28 md:pb-20 md:pt-24">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 text-center md:text-left lg:flex-row lg:items-center lg:gap-14">
          <div className="min-w-0 flex-1">
            <motion.p
              className="text-[10px] font-medium uppercase tracking-[0.42em] text-white/70 sm:text-[11px]"
              initial={reduceMotion ? false : "hidden"}
              animate={reduceMotion ? undefined : "show"}
              variants={fadeUp}
              custom={0}
            >
              <CrmInlineText
                label="Linha pequena (eyebrow) do topo"
                variant="onDark"
                value={copy.eyebrow}
                onApply={(v) => {
                  crm?.patchHero("eyebrow", v);
                }}
              />
            </motion.p>
            <motion.h1
              className="mx-auto mt-6 max-w-[18ch] font-serif text-[2.75rem] font-normal leading-[1.02] tracking-tight text-white drop-shadow-sm sm:max-w-none sm:text-5xl md:text-6xl md:leading-[0.98] lg:text-[3.75rem] xl:text-[4rem] md:mx-0"
              initial={reduceMotion ? false : "hidden"}
              animate={reduceMotion ? undefined : "show"}
              variants={fadeUp}
              custom={0.04}
            >
              <span className="block text-white">
                <CrmInlineText
                  label="Título — linha 1"
                  variant="onDark"
                  value={copy.line1}
                  onApply={(v) => {
                    crm?.patchHero("line1", v);
                  }}
                />
              </span>
              {crm ? (
                <span className="mt-2 block font-light italic text-amber-100">
                  <CrmInlineText
                    label="Título — linha em itálico"
                    variant="onDark"
                    value={copy.line2Italic}
                    onApply={(v) => crm.patchHero("line2Italic", v)}
                  />
                </span>
              ) : (
                <span className="mt-2 block bg-gradient-to-r from-amber-100 via-white to-cyan-100 bg-clip-text font-light italic text-transparent">
                  {copy.line2Italic}
                </span>
              )}
              <span className="mt-1 block text-white/95">
                <CrmInlineText
                  label="Título — linha final"
                  variant="onDark"
                  value={copy.line3}
                  onApply={(v) => {
                    crm?.patchHero("line3", v);
                  }}
                />
              </span>
            </motion.h1>
            <motion.p
              className="mx-auto mt-8 max-w-xl text-base leading-relaxed text-white/85 sm:text-lg md:mx-0 md:max-w-lg"
              initial={reduceMotion ? false : "hidden"}
              animate={reduceMotion ? undefined : "show"}
              variants={fadeUp}
              custom={0.1}
            >
              <CrmInlineText
                label="Parágrafo principal do topo"
                variant="onDark"
                multiline
                value={copy.body}
                onApply={(v) => {
                  crm?.patchHero("body", v);
                }}
              />
            </motion.p>
          </div>

          <motion.div
            className="w-full shrink-0 lg:max-w-[min(34rem,45vw)] lg:min-w-[21rem]"
            initial={reduceMotion ? false : "hidden"}
            animate={reduceMotion ? undefined : "show"}
            variants={fadeUp}
            custom={0.14}
          >
            <HeroTravelDates navLock={navLock} posts={posts} />
          </motion.div>
        </div>
      </div>

    </section>
  );
}
