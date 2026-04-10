"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";

import type { SiteContent } from "@/lib/site/site-content";
import { getHeroTravelImageUrl } from "@/lib/site/social";

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
};

export function LuxuryHero({ copy }: Props) {
  const reduceMotion = useReducedMotion();
  const heroImageSrc =
    copy.heroImageUrl.trim() !== ""
      ? copy.heroImageUrl.trim()
      : getHeroTravelImageUrl();

  return (
    <section className="relative min-h-[min(92svh,900px)] overflow-hidden">
      <div className="absolute inset-0" aria-hidden>
        <motion.div
          className="relative h-full min-h-[min(92svh,900px)] w-full"
          initial={reduceMotion ? false : { scale: 1.12 }}
          animate={reduceMotion ? undefined : { scale: 1 }}
          transition={{ duration: 1.35, ease: [0.22, 1, 0.36, 1] as const }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- URL editável (Storage / CDN) */}
          <img
            src={heroImageSrc}
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-center"
            fetchPriority="high"
            decoding="async"
          />
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-t from-ocean-950 via-ocean-950/55 to-ocean-900/35" />
        <div className="absolute inset-0 bg-gradient-to-r from-ocean-950/80 via-transparent to-ocean-950/50" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_100%,rgba(15,61,57,0.5),transparent_65%)]" />
      </div>

      <div className="relative z-10 flex min-h-[min(92svh,900px)] flex-col justify-end px-5 pb-14 pt-28 sm:px-8 sm:pb-16 sm:pt-32 md:justify-center md:pb-20 md:pt-24">
        <div className="mx-auto w-full max-w-4xl text-center md:max-w-5xl md:text-left">
          <motion.p
            className="text-[10px] font-medium uppercase tracking-[0.42em] text-white/70 sm:text-[11px]"
            initial={reduceMotion ? false : "hidden"}
            animate={reduceMotion ? undefined : "show"}
            variants={fadeUp}
            custom={0}
          >
            {copy.eyebrow}
          </motion.p>
          <motion.h1
            className="mx-auto mt-6 max-w-[18ch] font-serif text-[2.75rem] font-normal leading-[1.02] tracking-tight text-white drop-shadow-sm sm:max-w-none sm:text-5xl md:text-6xl md:leading-[0.98] lg:text-[3.75rem] xl:text-[4rem] md:mx-0"
            initial={reduceMotion ? false : "hidden"}
            animate={reduceMotion ? undefined : "show"}
            variants={fadeUp}
            custom={0.07}
          >
            <span className="block text-white">{copy.line1}</span>
            <span className="mt-2 block bg-gradient-to-r from-amber-100 via-white to-cyan-100 bg-clip-text font-light italic text-transparent">
              {copy.line2Italic}
            </span>
            <span className="mt-1 block text-white/95">{copy.line3}</span>
          </motion.h1>
          <motion.p
            className="mx-auto mt-8 max-w-xl text-base leading-relaxed text-white/85 sm:text-lg md:mx-0 md:max-w-lg"
            initial={reduceMotion ? false : "hidden"}
            animate={reduceMotion ? undefined : "show"}
            variants={fadeUp}
            custom={0.15}
          >
            {copy.body}
          </motion.p>
          <motion.div
            className="mx-auto mt-10 flex max-w-lg flex-col gap-3 sm:flex-row sm:flex-wrap md:mx-0"
            initial={reduceMotion ? false : "hidden"}
            animate={reduceMotion ? undefined : "show"}
            variants={fadeUp}
            custom={0.22}
          >
            <a
              href="#pedido-orcamento"
              className="inline-flex h-14 min-h-[3.5rem] items-center justify-center rounded-full bg-white px-10 text-[15px] font-semibold tracking-wide text-ocean-900 shadow-[0_20px_50px_-18px_rgba(0,0,0,0.4)] transition hover:bg-ocean-50"
            >
              {copy.ctaPrimary}
            </a>
            <a
              href="#inspiracoes"
              className="inline-flex h-14 min-h-[3.5rem] items-center justify-center rounded-full border-2 border-white/35 bg-white/10 px-9 text-[15px] font-semibold tracking-wide text-white backdrop-blur-md transition hover:border-white/55 hover:bg-white/20"
            >
              {copy.ctaSecondary}
            </a>
          </motion.div>
          <motion.div
            className="mx-auto mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-xs font-medium uppercase tracking-[0.2em] text-white/55 md:mx-0 md:justify-start"
            initial={reduceMotion ? false : "hidden"}
            animate={reduceMotion ? undefined : "show"}
            variants={fadeUp}
            custom={0.28}
          >
            <span>{copy.trust1}</span>
            <span className="hidden text-white/30 sm:inline" aria-hidden>
              ·
            </span>
            <span>{copy.trust2}</span>
            <Link
              href="/login"
              className="w-full text-center normal-case tracking-normal text-white/80 underline-offset-4 hover:text-white hover:underline sm:w-auto sm:pl-2"
            >
              {copy.consultoraLinkLabel}
            </Link>
          </motion.div>
        </div>
      </div>

      <motion.div
        className="relative z-10 flex justify-center pb-8 md:absolute md:bottom-8 md:left-1/2 md:-translate-x-1/2 md:pb-0"
        initial={reduceMotion ? false : { opacity: 0 }}
        animate={reduceMotion ? undefined : { opacity: 1 }}
        transition={{ delay: 0.55, duration: 0.6 }}
        aria-hidden
      >
        <span className="flex flex-col items-center gap-2 text-[10px] font-medium uppercase tracking-[0.35em] text-white/45">
          {copy.scrollHint}
          <span className="block h-10 w-px bg-gradient-to-b from-white/40 to-transparent" />
        </span>
      </motion.div>
    </section>
  );
}
