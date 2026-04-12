"use client";

import Link from "next/link";

import { CrmInlineText } from "@/components/crm/crm-inline-text";
import type { SiteContent } from "@/lib/site/site-content";

type StoryItem = SiteContent["travelStories"]["items"][number];

type Crm = {
  patchHeading: (field: "eyebrow" | "title" | "subtitle", value: string) => void;
  patchItem: (
    index: number,
    field:
      | "headline"
      | "nightsBudgetLine"
      | "blurb"
      | "linkUrl"
      | "linkLabel",
    value: string,
  ) => void;
  addItem: () => void;
  removeItem: (index: number) => void;
  moveItem: (index: number, dir: -1 | 1) => void;
};

type Props = {
  copy: SiteContent["travelStories"];
  /** Só no modo arrastar blocos, sem CRM: mensagem mínima. */
  showPlaceholder?: boolean;
  crm?: Crm;
};

function isStoryVisible(it: StoryItem): boolean {
  return Boolean(
    it.headline.trim() ||
      it.nightsBudgetLine.trim() ||
      it.blurb.trim(),
  );
}

export function TravelStoriesSection({
  copy,
  showPlaceholder,
  crm,
}: Props) {
  const visibleItems = copy.items.filter(isStoryVisible);
  const editIndices = crm
    ? copy.items.map((_, i) => i)
    : visibleItems.map((it) => copy.items.indexOf(it));

  if (!crm && visibleItems.length === 0) {
    if (!showPlaceholder) return null;
    return (
      <section
        id="historias-curadoria"
        className="scroll-mt-24 border-t border-ocean-100/80 bg-white py-14 md:py-16"
        aria-label={copy.title}
      >
        <div className="mx-auto max-w-6xl px-4 text-center sm:px-6">
          <p className="text-sm text-ocean-500">
            Bloco «Histórias rápidas» — publica o site e adiciona cartões na
            vista com pré-visualização (clica nos textos desta zona depois de a
            colocares na ordem da home).
          </p>
        </div>
      </section>
    );
  }

  return (
    <section
      id="historias-curadoria"
      className="scroll-mt-24 border-t border-ocean-100/80 bg-gradient-to-b from-white to-sand/40 py-14 md:py-20"
      aria-labelledby="historias-curadoria-heading"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <header className="max-w-2xl">
          {(crm || copy.eyebrow.trim()) ? (
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ocean-500">
              {crm ? (
                <CrmInlineText
                  label="Histórias — linha pequena"
                  value={copy.eyebrow}
                  onApply={(v) => crm.patchHeading("eyebrow", v)}
                />
              ) : (
                copy.eyebrow
              )}
            </p>
          ) : null}
          <h2
            id="historias-curadoria-heading"
            className="mt-2 font-serif text-2xl font-normal tracking-tight text-ocean-900 md:text-3xl"
          >
            {crm ? (
              <CrmInlineText
                label="Histórias — título"
                value={copy.title}
                onApply={(v) => crm.patchHeading("title", v)}
              />
            ) : (
              copy.title
            )}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-ocean-600 md:text-base">
            {crm ? (
              <CrmInlineText
                label="Histórias — subtítulo"
                multiline
                value={copy.subtitle}
                onApply={(v) => crm.patchHeading("subtitle", v)}
              />
            ) : (
              copy.subtitle
            )}
          </p>
        </header>

        {crm ? (
          <p className="mt-6 text-xs text-ocean-600">
            Clica em cada texto para editar. Para uma história nova, usa{" "}
            <strong className="font-medium text-ocean-800">Adicionar história</strong>{" "}
            em baixo (máx. 12). Link e rótulo do link são opcionais.
          </p>
        ) : null}

        <div className="mt-10 flex gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:thin] md:grid md:grid-cols-2 md:overflow-visible md:pb-0 xl:grid-cols-3">
          {editIndices.map((itemIndex) => {
            const it = copy.items[itemIndex]!;
            const href = it.linkUrl.trim();
            const label = it.linkLabel.trim() || "Ver mais";
            const isUrl =
              href.startsWith("https://") || href.startsWith("http://");

            return (
              <article
                key={`story-${itemIndex}`}
                className="flex w-[min(100%,320px)] shrink-0 flex-col rounded-2xl border border-ocean-100/90 bg-white/90 p-5 shadow-sm md:w-auto"
              >
                {crm ? (
                  <div className="mb-2 flex flex-wrap gap-2 text-[11px] text-ocean-600">
                    <span className="font-medium">#{itemIndex + 1}</span>
                    <button
                      type="button"
                      className="underline decoration-ocean-300"
                      onClick={() => crm.moveItem(itemIndex, -1)}
                      disabled={itemIndex === 0}
                    >
                      Subir
                    </button>
                    <button
                      type="button"
                      className="underline decoration-ocean-300"
                      onClick={() => crm.moveItem(itemIndex, 1)}
                      disabled={itemIndex === copy.items.length - 1}
                    >
                      Descer
                    </button>
                    <button
                      type="button"
                      className="font-medium text-terracotta underline"
                      onClick={() => crm.removeItem(itemIndex)}
                    >
                      Remover
                    </button>
                  </div>
                ) : null}
                <h3 className="font-serif text-lg text-ocean-900">
                  {crm ? (
                    <CrmInlineText
                      label="Título da história"
                      value={it.headline}
                      onApply={(v) =>
                        crm.patchItem(itemIndex, "headline", v)
                      }
                    />
                  ) : (
                    it.headline
                  )}
                </h3>
                {crm ? (
                  <p className="mt-2 text-sm font-medium text-ocean-700">
                    <CrmInlineText
                      label="Noites e orçamento (uma linha)"
                      value={it.nightsBudgetLine}
                      onApply={(v) =>
                        crm.patchItem(itemIndex, "nightsBudgetLine", v)
                      }
                    />
                  </p>
                ) : it.nightsBudgetLine.trim() ? (
                  <p className="mt-2 text-sm font-medium text-ocean-700">
                    {it.nightsBudgetLine}
                  </p>
                ) : null}
                {crm ? (
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-ocean-600">
                    <CrmInlineText
                      label="Texto curto da história"
                      multiline
                      value={it.blurb}
                      onApply={(v) => crm.patchItem(itemIndex, "blurb", v)}
                    />
                  </p>
                ) : it.blurb.trim() ? (
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-ocean-600">
                    {it.blurb}
                  </p>
                ) : null}
                {crm ? (
                  <div className="crm-ts-pe mt-4 space-y-2 border-t border-ocean-100/80 pt-3 text-xs text-ocean-600">
                    <p>
                      <span className="font-medium text-ocean-700">
                        Rótulo do link:{" "}
                      </span>
                      <CrmInlineText
                        label="Rótulo do link"
                        value={it.linkLabel}
                        onApply={(v) =>
                          crm.patchItem(itemIndex, "linkLabel", v)
                        }
                      />
                    </p>
                    <p>
                      <span className="font-medium text-ocean-700">URL: </span>
                      <CrmInlineText
                        label="URL do link (mapa, post…)"
                        value={it.linkUrl}
                        onApply={(v) =>
                          crm.patchItem(itemIndex, "linkUrl", v)
                        }
                      />
                    </p>
                  </div>
                ) : isUrl ? (
                  <Link
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex text-sm font-semibold text-ocean-800 underline decoration-ocean-300 underline-offset-2 hover:text-ocean-950"
                  >
                    {label}
                  </Link>
                ) : null}
              </article>
            );
          })}
        </div>

        {crm && copy.items.length < 12 ? (
          <div className="mt-8 flex justify-center">
            <button
              type="button"
              onClick={() => crm.addItem()}
              className="rounded-full border-2 border-dashed border-ocean-300 bg-white px-6 py-3 text-sm font-semibold text-ocean-800 transition hover:border-ocean-500 hover:bg-ocean-50"
            >
              + Adicionar história
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
