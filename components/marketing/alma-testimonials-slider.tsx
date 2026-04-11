"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { CrmInlineText } from "@/components/crm/crm-inline-text";
import type { SiteContent } from "@/lib/site/site-content";

type Item = SiteContent["almaTestimonials"]["items"][number];

type Props = {
  eyebrow: string;
  title: string;
  items: Item[];
  crm?: {
    patchHeading: (field: "eyebrow" | "title", value: string) => void;
    patchItem: (
      index: number,
      field: "quote" | "attribution",
      value: string,
    ) => void;
  };
};

function isVisibleItem(it: Item): boolean {
  return it.quote.trim().length > 0 || it.imageUrl.trim().length > 0;
}

export function AlmaTestimonialsSlider({ eyebrow, title, items, crm }: Props) {
  const visible = useMemo(
    () => items.filter(isVisibleItem),
    [items],
  );
  const [i, setI] = useState(0);
  const n = visible.length;

  /* Manter índice válido quando a lista filtrada encolhe (ex.: CRM). */
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sincronizar índice com n
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

  const navLock = crm ? "pointer-events-none opacity-60" : "";

  if (n === 0 && !crm) return null;

  const cur = n > 0 ? visible[i]! : null;
  const itemIdx = cur ? items.indexOf(cur) : -1;
  const src = cur ? cur.imageUrl.trim() : "";
  const hasImg = src.startsWith("http://") || src.startsWith("https://");

  return (
    <div
      id="secao-depoimentos"
      className="scroll-mt-28 mt-12 border-t border-ocean-100/80 pt-12"
    >
      <p className="text-[11px] font-medium uppercase tracking-[0.35em] text-ocean-600">
        {crm ? (
          <CrmInlineText
            label="Depoimentos — linha pequena"
            value={eyebrow}
            onApply={(v) => crm.patchHeading("eyebrow", v)}
          />
        ) : (
          eyebrow
        )}
      </p>
      <h3 className="mt-3 font-serif text-2xl font-normal tracking-tight text-ocean-900 md:text-[1.65rem]">
        {crm ? (
          <CrmInlineText
            label="Depoimentos — título"
            value={title}
            onApply={(v) => crm.patchHeading("title", v)}
          />
        ) : (
          title
        )}
      </h3>
      {n === 0 && crm ? (
        <p className="mt-6 text-center text-sm text-ocean-600">
          Ainda não há depoimentos visíveis. Na{" "}
          <a href="/crm/site?lista=1" className="font-medium underline">
            vista em lista
          </a>{" "}
          podes adicionar cartões e colar links de fotos.
        </p>
      ) : null}
      {cur && itemIdx >= 0 ? (
      <div className="relative mt-8 flex flex-col items-center gap-6 md:flex-row md:items-stretch md:justify-center md:gap-10">
        {n > 1 ? (
          <button
            type="button"
            onClick={() => go(-1)}
            className={`order-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-ocean-200 bg-white text-ocean-700 shadow-sm transition hover:bg-ocean-50 md:order-none md:self-center ${navLock}`}
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
          {crm ? (
            <p className="mt-5 px-1 font-serif text-base italic leading-relaxed text-ocean-800 md:text-lg">
              «
              <CrmInlineText
                label="Texto do depoimento"
                multiline
                value={cur.quote}
                onApply={(v) => crm.patchItem(itemIdx, "quote", v)}
              />
              »
            </p>
          ) : cur.quote.trim() ? (
            <p className="mt-5 px-1 font-serif text-base italic leading-relaxed text-ocean-800 md:text-lg">
              «{cur.quote.trim()}»
            </p>
          ) : null}
          {crm ? (
            <p className="mt-4 px-1 text-right text-xs font-medium uppercase tracking-wider text-ocean-500">
              —{" "}
              <CrmInlineText
                label="Assinatura do depoimento"
                value={cur.attribution}
                onApply={(v) => crm.patchItem(itemIdx, "attribution", v)}
              />
            </p>
          ) : cur.attribution.trim() ? (
            <p className="mt-4 px-1 text-right text-xs font-medium uppercase tracking-wider text-ocean-500">
              — {cur.attribution.trim()}
            </p>
          ) : null}
        </article>
        {n > 1 ? (
          <button
            type="button"
            onClick={() => go(1)}
            className={`order-3 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-ocean-200 bg-white text-ocean-700 shadow-sm transition hover:bg-ocean-50 md:order-none md:self-center ${navLock}`}
            aria-label="Próximo depoimento"
          >
            ›
          </button>
        ) : null}
      </div>
      ) : null}
      {n > 1 ? (
        <p className="mt-4 text-center text-xs text-ocean-500">
          {i + 1} / {n}
        </p>
      ) : null}
    </div>
  );
}
