"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import type { SiteContent } from "@/lib/site/site-content";

type Item = SiteContent["almaTestimonials"]["items"][number];

type Props = {
  eyebrow: string;
  title: string;
  items: Item[];
};

function isVisibleItem(it: Item): boolean {
  return it.quote.trim().length > 0 || it.imageUrl.trim().length > 0;
}

export function AlmaTestimonialsSlider({ eyebrow, title, items }: Props) {
  const visible = useMemo(
    () => items.filter(isVisibleItem),
    [items],
  );
  const [i, setI] = useState(0);
  const n = visible.length;

  useEffect(() => {
    setI((prev) => (n === 0 ? 0 : Math.min(prev, n - 1)));
  }, [n]);

  const go = useCallback(
    (delta: number) => {
      if (n === 0) return;
      setI((prev) => (prev + delta + n) % n);
    },
    [n],
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (n < 2) return;
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, n]);

  if (n === 0) return null;

  const cur = visible[i]!;
  const src = cur.imageUrl.trim();
  const hasImg = src.startsWith("http://") || src.startsWith("https://");

  return (
    <div className="mt-12 border-t border-ocean-100/80 pt-12">
      <p className="text-[11px] font-medium uppercase tracking-[0.35em] text-ocean-600">
        {eyebrow}
      </p>
      <h3 className="mt-3 font-serif text-2xl font-normal tracking-tight text-ocean-900 md:text-[1.65rem]">
        {title}
      </h3>
      <div className="relative mt-8 flex flex-col items-center gap-6 md:flex-row md:items-stretch md:justify-center md:gap-10">
        {n > 1 ? (
          <button
            type="button"
            onClick={() => go(-1)}
            className="order-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-ocean-200 bg-white text-ocean-700 shadow-sm transition hover:bg-ocean-50 md:order-none md:self-center"
            aria-label="Depoimento anterior"
          >
            ‹
          </button>
        ) : null}
        <article
          className="order-1 max-w-md rotate-[-1.2deg] rounded-sm bg-white p-4 pb-10 shadow-[0_12px_40px_-16px_rgba(15,61,57,0.45)] ring-1 ring-ocean-900/10 md:order-none"
          style={{
            boxShadow:
              "4px 6px 0 rgba(15,61,57,0.06), 0 20px 50px -20px rgba(15,61,57,0.35)",
          }}
        >
          {hasImg ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={src}
              alt=""
              className="aspect-[4/3] w-full object-cover object-center"
              loading="lazy"
            />
          ) : (
            <div className="flex aspect-[4/3] w-full items-center justify-center bg-ocean-50 text-sm text-ocean-400">
              Imagem (URL no CRM)
            </div>
          )}
          {cur.quote.trim() ? (
            <p className="mt-5 px-1 font-serif text-base italic leading-relaxed text-ocean-800 md:text-lg">
              «{cur.quote.trim()}»
            </p>
          ) : null}
          {cur.attribution.trim() ? (
            <p className="mt-4 px-1 text-right text-xs font-medium uppercase tracking-wider text-ocean-500">
              — {cur.attribution.trim()}
            </p>
          ) : null}
        </article>
        {n > 1 ? (
          <button
            type="button"
            onClick={() => go(1)}
            className="order-3 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-ocean-200 bg-white text-ocean-700 shadow-sm transition hover:bg-ocean-50 md:order-none md:self-center"
            aria-label="Próximo depoimento"
          >
            ›
          </button>
        ) : null}
      </div>
      {n > 1 ? (
        <p className="mt-4 text-center text-xs text-ocean-500">
          {i + 1} / {n}
        </p>
      ) : null}
    </div>
  );
}
