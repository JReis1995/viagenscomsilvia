"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";

import { saveSiteContentAction } from "@/app/(dashboard)/crm/actions";
import { CrmVisualInlineEditProvider } from "@/components/crm/crm-inline-text";
import { MarketingHomeSections } from "@/components/marketing/marketing-home-sections";
import type { SiteContent } from "@/lib/site/site-content";
import { pushSitePreviewDraftToStorage } from "@/lib/site/site-preview-storage";
import type { PublishedPost } from "@/types/post";

type Props = {
  initial: SiteContent;
  posts: PublishedPost[];
};

export function CrmSiteVisualEditor({ initial, posts }: Props) {
  const [data, setData] = useState<SiteContent>(initial);
  const [baseline, setBaseline] = useState<SiteContent>(initial);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const isDirty = useMemo(
    () => JSON.stringify(data) !== JSON.stringify(baseline),
    [data, baseline],
  );

  useEffect(() => {
    const t = window.setTimeout(() => pushSitePreviewDraftToStorage(data), 320);
    return () => window.clearTimeout(t);
  }, [data]);

  function patch<K extends keyof SiteContent>(
    section: K,
    field: keyof SiteContent[K],
    value: string,
  ) {
    setData((d) => ({
      ...d,
      [section]: { ...d[section], [field]: value },
    }));
  }

  function patchQuizSuccess(
    field: keyof SiteContent["quizSuccess"],
    value: string,
  ) {
    setData((d) => ({
      ...d,
      quizSuccess: { ...d.quizSuccess, [field]: value },
    }));
  }

  function patchAlma(field: "eyebrow" | "title", value: string) {
    setData((d) => ({
      ...d,
      almaTestimonials: { ...d.almaTestimonials, [field]: value },
    }));
  }

  function patchAlmaItem(
    index: number,
    field: "imageUrl" | "quote" | "attribution",
    value: string,
  ) {
    setData((d) => ({
      ...d,
      almaTestimonials: {
        ...d.almaTestimonials,
        items: d.almaTestimonials.items.map((it, i) =>
          i === index ? { ...it, [field]: value } : it,
        ),
      },
    }));
  }

  function addAlmaItem() {
    setData((d) => ({
      ...d,
      almaTestimonials: {
        ...d.almaTestimonials,
        items: [
          ...d.almaTestimonials.items,
          { imageUrl: "", quote: "", attribution: "" },
        ].slice(0, 12),
      },
    }));
  }

  function removeAlmaItem(index: number) {
    setData((d) => ({
      ...d,
      almaTestimonials: {
        ...d.almaTestimonials,
        items: d.almaTestimonials.items.filter((_, i) => i !== index),
      },
    }));
  }

  function moveAlmaItem(index: number, dir: -1 | 1) {
    setData((d) => {
      const arr = [...d.almaTestimonials.items];
      const j = index + dir;
      if (j < 0 || j >= arr.length) return d;
      const a = arr[index]!;
      const b = arr[j]!;
      arr[index] = b;
      arr[j] = a;
      return {
        ...d,
        almaTestimonials: { ...d.almaTestimonials, items: arr },
      };
    });
  }

  function patchTravelStories(
    field: "eyebrow" | "title" | "subtitle",
    value: string,
  ) {
    setData((d) => ({
      ...d,
      travelStories: { ...d.travelStories, [field]: value },
    }));
  }

  function patchTravelStoryItem(
    index: number,
    field:
      | "headline"
      | "nightsBudgetLine"
      | "blurb"
      | "linkUrl"
      | "linkLabel",
    value: string,
  ) {
    setData((d) => ({
      ...d,
      travelStories: {
        ...d.travelStories,
        items: d.travelStories.items.map((it, i) =>
          i === index ? { ...it, [field]: value } : it,
        ),
      },
    }));
  }

  function addTravelStoryItem() {
    setData((d) => ({
      ...d,
      travelStories: {
        ...d.travelStories,
        items: [
          ...d.travelStories.items,
          {
            headline: "",
            nightsBudgetLine: "",
            blurb: "",
            linkUrl: "",
            linkLabel: "",
          },
        ].slice(0, 12),
      },
    }));
  }

  function removeTravelStoryItem(index: number) {
    setData((d) => ({
      ...d,
      travelStories: {
        ...d.travelStories,
        items: d.travelStories.items.filter((_, i) => i !== index),
      },
    }));
  }

  function moveTravelStoryItem(index: number, dir: -1 | 1) {
    setData((d) => {
      const arr = [...d.travelStories.items];
      const j = index + dir;
      if (j < 0 || j >= arr.length) return d;
      const a = arr[index]!;
      const b = arr[j]!;
      arr[index] = b;
      arr[j] = a;
      return { ...d, travelStories: { ...d.travelStories, items: arr } };
    });
  }

  function patchHowWeWork(
    field:
      | "eyebrow"
      | "title"
      | "subtitle"
      | "firstContactTitle"
      | "firstContactBody"
      | "timingsTitle"
      | "timingsBody",
    value: string,
  ) {
    setData((d) => ({
      ...d,
      howWeWork: { ...d.howWeWork, [field]: value },
    }));
  }

  function patchHowWeWorkStep(
    index: number,
    field: "title" | "body",
    value: string,
  ) {
    setData((d) => ({
      ...d,
      howWeWork: {
        ...d.howWeWork,
        steps: d.howWeWork.steps.map((s, i) =>
          i === index ? { ...s, [field]: value } : s,
        ),
      },
    }));
  }

  function addHowWeWorkStep() {
    setData((d) => ({
      ...d,
      howWeWork: {
        ...d.howWeWork,
        steps: [...d.howWeWork.steps, { title: "", body: "" }].slice(0, 8),
      },
    }));
  }

  function removeHowWeWorkStep(index: number) {
    setData((d) => ({
      ...d,
      howWeWork: {
        ...d.howWeWork,
        steps: d.howWeWork.steps.filter((_, i) => i !== index),
      },
    }));
  }

  function moveHowWeWorkStep(index: number, dir: -1 | 1) {
    setData((d) => {
      const arr = [...d.howWeWork.steps];
      const j = index + dir;
      if (j < 0 || j >= arr.length) return d;
      const a = arr[index]!;
      const b = arr[j]!;
      arr[index] = b;
      arr[j] = a;
      return { ...d, howWeWork: { ...d.howWeWork, steps: arr } };
    });
  }

  const patchFns = {
    patch,
    patchQuizSuccess,
    patchAlma,
    patchAlmaItem,
    addAlmaItem,
    removeAlmaItem,
    moveAlmaItem,
    patchTravelStories,
    patchTravelStoryItem,
    addTravelStoryItem,
    removeTravelStoryItem,
    moveTravelStoryItem,
    patchHowWeWork,
    patchHowWeWorkStep,
    addHowWeWorkStep,
    removeHowWeWorkStep,
    moveHowWeWorkStep,
  };

  function submit() {
    setMessage(null);
    startTransition(() => {
      void (async () => {
        const res = await saveSiteContentAction(data);
        if (res.ok) {
          setBaseline(data);
          setMessage(
            "Publicado. O site visível para todos actualiza em cerca de um minuto.",
          );
        } else {
          setMessage(`Erro: ${res.error}`);
        }
      })();
    });
  }

  return (
    <>
      <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-ocean-200 bg-ocean-50/40 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-ocean-800">
          <p className="font-medium text-ocean-900">
            Clica directamente nas frases do site para as editares — abre-se
            uma caixa por cima, como num construtor de páginas.
          </p>
          <p className="mt-1 text-xs text-ocean-600">
            Todo o texto do site edita-se na pré-visualização: no pedido,
            carrega em «Começar» para abrir o formulário imersivo e clicar nas
            perguntas e opções; no fim dessa secção há o bloco da página
            «Obrigado». A{" "}
            <Link
              href="/crm/site?lista=1"
              className="font-medium underline underline-offset-2"
            >
              vista em lista
            </Link>{" "}
            mantém os mesmos campos em separadores, se preferires.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/crm/site?lista=1"
            className="inline-flex items-center justify-center rounded-xl border border-ocean-200 bg-white px-4 py-2 text-sm font-medium text-ocean-800 shadow-sm transition hover:bg-ocean-50"
          >
            Vista em lista
          </Link>
        </div>
      </div>

      {isDirty ? (
        <p
          className="mb-4 rounded-xl border border-amber-200/90 bg-amber-50 px-4 py-3 text-sm text-amber-950"
          role="status"
        >
          <span className="font-semibold">Rascunho (só tu).</span> A pré-visualização
          em baixo mostra este rascunho. O site público só muda com{" "}
          <strong className="font-medium text-amber-950">Publicar no site</strong>
          .{" "}
          <button
            type="button"
            className="font-semibold text-ocean-900 underline decoration-ocean-400 underline-offset-2 hover:text-ocean-950"
            onClick={() => {
              if (
                window.confirm(
                  "Descartar o rascunho e voltar ao último conteúdo publicado?",
                )
              ) {
                setData(baseline);
              }
            }}
          >
            Reverter para o último publicado
          </button>
          .
        </p>
      ) : null}

      {message ? (
        <p
          className={`mb-4 rounded-xl border px-4 py-3 text-sm ${
            message.startsWith("Erro")
              ? "border-terracotta/40 bg-terracotta/10 text-ocean-900"
              : "border-emerald-200 bg-emerald-50 text-emerald-900"
          }`}
        >
          {message}
        </p>
      ) : null}

      <CrmVisualInlineEditProvider active>
        <section
          className="relative left-1/2 mb-6 w-screen max-w-[100vw] -translate-x-1/2 rounded-2xl border border-ocean-200/90 bg-sand shadow-inner"
          aria-label="Pré-visualização editável da página inicial"
        >
          <div
            className="sticky top-0 z-[100] border-b border-amber-200/80 bg-amber-50/95 px-3 py-2 text-center text-xs text-ocean-800 shadow-[0_1px_0_rgba(0,0,0,0.04)] backdrop-blur-md supports-[backdrop-filter]:bg-amber-50/90"
            role="note"
          >
            <span className="font-semibold">Pré-visualização sempre visível</span>
            <span className="text-ocean-600">
              {" "}
              — rascunho só teu até publicares (botão fixo em baixo). Cada bloco
              tem uma barra âmbar: arrasta «⋮⋮» para mudar a ordem no site
              público.
            </span>
          </div>
          <div className="overflow-x-hidden">
            <div className="pb-24">
            <MarketingHomeSections
              site={data}
              posts={posts}
              prefill={null}
              quizKey="crm-visual"
              viewerUserId={null}
              wishlistedPostIds={[]}
              onLayoutOrderChange={(homeOrderCsv) =>
                setData((d) => ({
                  ...d,
                  layout: { ...d.layout, homeOrderCsv },
                }))
              }
              crm={{
                hero: {
                  patchHero: (f, v) => patch("hero", f, v),
                  patchQuiz: (f, v) => patch("quiz", f, v),
                },
                feed: {
                  patchFeed: (f, v) => patch("feed", f, v),
                  patchFeatured: (f, v) => patch("featuredVideo", f, v),
                },
                social: {
                  patch: (f, v) => patch("socialFeed", f, v),
                },
                consultora: {
                  patchConsultora: (f, v) => patch("consultora", f, v),
                  patchAlmaHeading: (f, v) => patchAlma(f, v),
                  patchAlmaItem: (i, f, v) => patchAlmaItem(i, f, v),
                },
                quiz: {
                  patchQuiz: (f, v) => patch("quiz", f, v),
                  patchQuizSuccess: (f, v) => patchQuizSuccess(f, v),
                },
                stories: {
                  patchHeading: (field, v) => patchTravelStories(field, v),
                  patchItem: (index, field, v) =>
                    patchTravelStoryItem(index, field, v),
                  addItem: addTravelStoryItem,
                  removeItem: removeTravelStoryItem,
                  moveItem: moveTravelStoryItem,
                },
                process: {
                  patch: (field, v) => patchHowWeWork(field, v),
                  patchStep: (index, field, v) =>
                    patchHowWeWorkStep(index, field, v),
                  addStep: addHowWeWorkStep,
                  removeStep: removeHowWeWorkStep,
                  moveStep: moveHowWeWorkStep,
                },
                account: {
                  patch: (field, v) =>
                    patch("registerIncentive", field, v),
                },
              }}
            />
            </div>
          </div>
        </section>
      </CrmVisualInlineEditProvider>

      <div className="fixed bottom-0 left-0 right-0 z-[210] border-t border-ocean-200 bg-white/95 px-4 py-3 shadow-[0_-6px_24px_-8px_rgba(0,0,0,0.12)] backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <p className="order-2 text-center text-xs text-ocean-500 sm:order-1 sm:max-w-lg sm:text-left">
            Cartões do feed em{" "}
            <Link
              href="/crm/publicacoes"
              className="font-medium text-ocean-700 underline"
            >
              Publicações
            </Link>
            .{" "}
            {isDirty ? (
              <span className="font-medium text-amber-800">
                Rascunho por publicar.
              </span>
            ) : (
              <span>O site público está alinhado com o último guardado.</span>
            )}
          </p>
          <div className="order-1 flex w-full flex-wrap items-stretch justify-center gap-2 sm:order-2 sm:w-auto sm:justify-end">
            {isDirty ? (
              <button
                type="button"
                onClick={() => {
                  if (
                    window.confirm(
                      "Descartar o rascunho e voltar ao último publicado?",
                    )
                  ) {
                    setData(baseline);
                  }
                }}
                className="min-h-[3rem] flex-1 rounded-2xl border border-ocean-200 bg-white px-4 py-3 text-sm font-semibold text-ocean-800 shadow-sm transition hover:bg-ocean-50 sm:flex-none"
              >
                Descartar rascunho
              </button>
            ) : null}
            <button
              type="button"
              disabled={pending}
              onClick={() => submit()}
              className="min-h-[3rem] w-full flex-1 rounded-2xl bg-ocean-900 px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-ocean-800 disabled:opacity-50 sm:w-auto"
            >
              {pending ? "A publicar…" : "Publicar no site"}
              <span className="mt-0.5 block text-xs font-normal text-white/85">
                Rascunho → visitantes
              </span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
