"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";

import { saveSiteContentAction } from "@/app/(dashboard)/crm/actions";
import { CrmVisualInlineEditProvider } from "@/components/crm/crm-inline-text";
import { SiteEditorFieldsForTab } from "@/components/crm/crm-site-editor-fields";
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
  const [registoOpen, setRegistoOpen] = useState(false);
  const [pedidoCamposOpen, setPedidoCamposOpen] = useState(false);
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

  const patchFns = {
    patch,
    patchQuizSuccess,
    patchAlma,
    patchAlmaItem,
    addAlmaItem,
    removeAlmaItem,
    moveAlmaItem,
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
            Vês o resultado logo no rascunho. Usa{" "}
            <strong className="font-medium text-ocean-800">
              Pedido: prova social, URLs e obrigado
            </strong>{" "}
            para todos os campos do formulário e da página «Obrigado», ou a{" "}
            <Link
              href="/crm/site?lista=1"
              className="font-medium underline underline-offset-2"
            >
              vista em lista
            </Link>
            .
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setPedidoCamposOpen(true)}
            className="rounded-xl border border-ocean-200 bg-white px-4 py-2 text-sm font-medium text-ocean-800 shadow-sm transition hover:bg-ocean-50"
          >
            Pedido: prova social, URLs e obrigado
          </button>
          <button
            type="button"
            onClick={() => setRegistoOpen(true)}
            className="rounded-xl border border-ocean-200 bg-white px-4 py-2 text-sm font-medium text-ocean-800 shadow-sm transition hover:bg-ocean-50"
          >
            Textos de «criar conta»
          </button>
          <Link
            href="/crm/site?lista=1"
            className="inline-flex items-center justify-center rounded-xl border border-transparent px-4 py-2 text-sm font-medium text-ocean-600 underline decoration-ocean-300 underline-offset-2 hover:text-ocean-900"
          >
            Vista em lista (URLs e formulário)
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
          className="relative left-1/2 mb-6 w-screen max-w-[100vw] -translate-x-1/2 overflow-x-hidden rounded-2xl border border-ocean-200/90 bg-sand shadow-inner"
          aria-label="Pré-visualização editável da página inicial"
        >
          <div className="border-b border-amber-200/70 bg-amber-50/95 px-3 py-2 text-center text-xs text-ocean-800">
            <span className="font-semibold">Pré-visualização sempre visível</span>
            <span className="text-ocean-600">
              {" "}
              — rascunho só teu até publicares (botão fixo em baixo). Cada bloco
              tem uma barra âmbar: arrasta «⋮⋮» para mudar a ordem no site
              público.
            </span>
          </div>
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
                },
              }}
            />
          </div>
        </section>
      </CrmVisualInlineEditProvider>

      {pedidoCamposOpen ? (
        <>
          <button
            type="button"
            aria-label="Fechar"
            className="fixed inset-0 z-[380] bg-ocean-950/40 backdrop-blur-[1px]"
            onClick={() => setPedidoCamposOpen(false)}
          />
          <div
            className="fixed left-1/2 top-1/2 z-[400] w-[min(100vw-24px,560px)] max-h-[min(92vh,820px)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border-2 border-ocean-300 bg-white p-5 shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="crm-pedido-campos-title"
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <h2
                id="crm-pedido-campos-title"
                className="font-serif text-lg text-ocean-900"
              >
                Pedido de proposta — campos completos
              </h2>
              <button
                type="button"
                onClick={() => setPedidoCamposOpen(false)}
                className="rounded-full border border-ocean-200 px-2 py-1 text-sm text-ocean-700 hover:bg-ocean-50"
              >
                Fechar
              </button>
            </div>
            <p className="mb-4 text-xs text-ocean-600">
              Textos do clima, prova social, URLs dos ícones (email / WhatsApp
              / Instagram) e página «Obrigado». Fecha e usa{" "}
              <strong className="font-medium text-ocean-800">Publicar</strong>{" "}
              em baixo para enviar ao site público.
            </p>
            <SiteEditorFieldsForTab tab="quiz" data={data} {...patchFns} />
          </div>
        </>
      ) : null}

      {registoOpen ? (
        <>
          <button
            type="button"
            aria-label="Fechar"
            className="fixed inset-0 z-[380] bg-ocean-950/40 backdrop-blur-[1px]"
            onClick={() => setRegistoOpen(false)}
          />
          <div
            className="fixed left-1/2 top-1/2 z-[400] w-[min(100vw-24px,440px)] max-h-[min(92vh,720px)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border-2 border-ocean-300 bg-white p-5 shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="crm-registo-title"
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <h2
                id="crm-registo-title"
                className="font-serif text-lg text-ocean-900"
              >
                Textos do ecrã «criar conta»
              </h2>
              <button
                type="button"
                onClick={() => setRegistoOpen(false)}
                className="rounded-full border border-ocean-200 px-2 py-1 text-sm text-ocean-700 hover:bg-ocean-50"
              >
                Fechar
              </button>
            </div>
            <p className="mb-4 text-xs text-ocean-600">
              Estes textos não aparecem na página inicial; só no registo.
            </p>
            <SiteEditorFieldsForTab tab="registo" data={data} {...patchFns} />
          </div>
        </>
      ) : null}

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
