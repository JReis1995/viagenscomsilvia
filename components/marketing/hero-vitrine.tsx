"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { CrmInlineText } from "@/components/crm/crm-inline-text";
import { HeroTravelDates } from "@/components/marketing/hero-travel-dates";
import { PostInfoModalCta } from "@/components/marketing/post-info-modal-cta";
import { displayPostTitle } from "@/lib/marketing/hero-destinos";
import { heroPostBackdrop } from "@/lib/marketing/hero-post-media";
import type { SiteContent } from "@/lib/site/site-content";
import type { PublishedPost } from "@/types/post";

const AUTO_MS = 5000;

type Props = {
  posts: PublishedPost[];
  copy: SiteContent["hero"];
  navLock: string;
  crm?: {
    patchHero: (field: keyof SiteContent["hero"], value: string) => void;
  };
};

export function HeroVitrine({ posts, copy, navLock, crm }: Props) {
  const reduceMotion = useReducedMotion();
  const slides = useMemo(
    () => posts.filter((p) => p.media_url?.trim()),
    [posts],
  );
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const safeIndex = slides.length > 0 ? index % slides.length : 0;
  const current = slides[safeIndex] ?? null;

  const go = useCallback(
    (dir: -1 | 1) => {
      if (slides.length === 0) return;
      setIndex((i) => {
        const n = slides.length;
        return (i + dir + n) % n;
      });
    },
    [slides.length],
  );

  useEffect(() => {
    if (slides.length <= 1 || reduceMotion || paused) return;
    const t = window.setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, AUTO_MS);
    return () => window.clearInterval(t);
  }, [slides.length, reduceMotion, paused]);

  if (!current) return null;

  return (
    <section
      id="topo-pagina-inicial"
      className="relative min-h-[min(92svh,900px)] scroll-mt-28 overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="absolute inset-0" aria-hidden>
        {slides.map((post, i) => {
          const vis = heroPostBackdrop(post);
          if (!vis) return null;
          const active = i === safeIndex;
          return (
            <div
              key={post.id}
              className={`absolute inset-0 transition-opacity duration-[900ms] ease-out ${
                active ? "z-[1] opacity-100" : "z-0 opacity-0"
              }`}
            >
              {vis.kind === "file-video" ? (
                <video
                  src={vis.src}
                  className="absolute inset-0 h-full w-full object-cover object-center"
                  muted
                  playsInline
                  loop
                  autoPlay={active}
                  preload="metadata"
                />
              ) : (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={vis.src}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover object-center"
                  fetchPriority={i === 0 ? "high" : "low"}
                  decoding="async"
                />
              )}
            </div>
          );
        })}
        <div className="absolute inset-0 z-[2] bg-gradient-to-r from-ocean-950/92 via-ocean-950/65 to-ocean-950/45" />
        <div className="absolute inset-0 z-[2] bg-gradient-to-t from-ocean-950/90 via-transparent to-ocean-900/25" />
      </div>

      <button
        type="button"
        aria-label="Publicação anterior"
        onClick={() => go(-1)}
        className="pointer-events-auto absolute left-2 top-1/2 z-30 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-black/30 text-white backdrop-blur-sm transition hover:bg-black/45 md:flex lg:left-6"
      >
        <span aria-hidden className="text-xl leading-none">‹</span>
      </button>
      <button
        type="button"
        aria-label="Publicação seguinte"
        onClick={() => go(1)}
        className="pointer-events-auto absolute right-2 top-1/2 z-30 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-black/30 text-white backdrop-blur-sm transition hover:bg-black/45 md:flex lg:right-6"
      >
        <span aria-hidden className="text-xl leading-none">›</span>
      </button>

      <div className="relative z-20 mx-auto flex min-h-[min(92svh,900px)] w-full max-w-6xl flex-col justify-center gap-10 px-5 pb-24 pt-24 sm:px-8 sm:pb-20 sm:pt-28 lg:flex-row lg:items-center lg:gap-14 lg:pb-28">
        <div className="flex min-w-0 flex-1 flex-col justify-center text-center lg:max-w-xl lg:text-left">
          {crm ? (
            <p className="text-[10px] font-medium uppercase tracking-[0.35em] text-white/60">
              <CrmInlineText
                label="Linha pequena (eyebrow) do topo"
                variant="onDark"
                value={copy.eyebrow}
                onApply={(v) => crm.patchHero("eyebrow", v)}
              />
            </p>
          ) : copy.eyebrow.trim() ? (
            <p className="text-[10px] font-medium uppercase tracking-[0.35em] text-white/60">
              {copy.eyebrow}
            </p>
          ) : null}

          <motion.h2
            key={current.id}
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="mt-4 font-serif text-3xl font-semibold leading-[1.08] tracking-tight text-white drop-shadow-md sm:text-4xl md:text-5xl"
          >
            {displayPostTitle(current.titulo)}
          </motion.h2>

          {current.descricao?.trim() ? (
            <motion.p
              key={`${current.id}-d`}
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={reduceMotion ? undefined : { opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.05 }}
              className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-white/88 sm:text-base lg:mx-0"
            >
              {current.descricao.trim()}
            </motion.p>
          ) : null}

          {current.preco_desde?.trim() ? (
            <motion.div
              key={`${current.id}-p`}
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={reduceMotion ? undefined : { opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.08 }}
              className="mx-auto mt-6 lg:mx-0"
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-amber-200/90">
                A partir de
              </p>
              <p className="mt-1 font-serif text-3xl font-medium text-amber-100 sm:text-4xl">
                {current.preco_desde.trim()}
              </p>
              <p className="mt-1 text-xs text-white/55">Indicativo · sujeito a confirmação</p>
            </motion.div>
          ) : null}

          <div
            className={`mx-auto mt-8 flex flex-wrap justify-center gap-3 lg:mx-0 lg:justify-start ${navLock}`}
          >
            <PostInfoModalCta
              post={current}
              label="Mais informações"
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-white px-7 text-sm font-semibold text-ocean-900 shadow-lg ring-2 ring-white/30 transition hover:bg-ocean-50"
            />
          </div>
        </div>

        <div className="w-full shrink-0 lg:max-w-[min(32rem,44vw)] lg:min-w-[20rem]">
          <HeroTravelDates navLock={navLock} posts={posts} />
        </div>
      </div>

      {slides.length > 1 ? (
        <div
          className="pointer-events-auto absolute bottom-24 left-1/2 z-30 flex -translate-x-1/2 gap-2 md:bottom-28"
          role="tablist"
          aria-label="Escolher publicação em destaque"
        >
          {slides.map((p, i) => (
            <button
              key={p.id}
              type="button"
              role="tab"
              aria-selected={i === safeIndex}
              onClick={() => setIndex(i)}
              className={`h-2.5 w-2.5 rounded-full transition sm:h-3 sm:w-3 ${
                i === safeIndex
                  ? "bg-white shadow-[0_0_0_2px_rgba(255,255,255,0.35)]"
                  : "bg-white/40 hover:bg-white/70"
              }`}
              aria-label={`Destaque ${i + 1} de ${slides.length}`}
            />
          ))}
        </div>
      ) : null}

      {crm ? (
        <div className="pointer-events-auto relative z-20 border-t border-white/10 bg-black/25 px-5 py-3 text-center text-[11px] text-white/70 backdrop-blur-sm">
          <span className="crm-hero-pe">
            Modo vitrine: os títulos longos do topo não aparecem aqui — edita-os em{" "}
            <Link href="/crm/site?lista=1" className="underline underline-offset-2">
              CRM · Site (lista)
            </Link>
            .
          </span>
        </div>
      ) : null}

    </section>
  );
}
