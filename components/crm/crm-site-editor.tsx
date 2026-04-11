"use client";

import { useEffect, useMemo, useState, useTransition } from "react";

import { saveSiteContentAction } from "@/app/(dashboard)/crm/actions";
import {
  SiteEditorFieldsForTab,
  TabGuide,
  TABS,
  type TabId,
  type TabDef,
} from "@/components/crm/crm-site-editor-fields";
import type { SiteContent } from "@/lib/site/site-content";
import { pushSitePreviewDraftToStorage } from "@/lib/site/site-preview-storage";

type Props = {
  initial: SiteContent;
};

export function CrmSiteEditor({ initial }: Props) {
  const [data, setData] = useState<SiteContent>(initial);
  const [baseline, setBaseline] = useState<SiteContent>(initial);
  const [tab, setTab] = useState<TabId>("hero");
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const isDirty = useMemo(
    () => JSON.stringify(data) !== JSON.stringify(baseline),
    [data, baseline],
  );

  useEffect(() => {
    pushSitePreviewDraftToStorage(data);
  }, [data]);

  const activeTabDef = TABS.find((t) => t.id === tab)!;

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
            "Guardado com sucesso. O site público actualiza em cerca de um minuto; também podes recarregar a página inicial para ver já.",
          );
        } else {
          setMessage(`Erro: ${res.error}`);
        }
      })();
    });
  }

  function openPreview(hash?: string | null) {
    try {
      pushSitePreviewDraftToStorage(data);
      const path =
        hash && hash.length > 0
          ? `/crm/site/preview#${encodeURIComponent(hash)}`
          : "/crm/site/preview";
      window.open(path, "_blank", "noopener,noreferrer");
    } catch {
      setMessage("Não foi possível abrir a pré-visualização neste browser.");
    }
  }

  return (
    <>
      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_min(340px,40%)] lg:items-start lg:gap-8">
        <div className="min-w-0 space-y-6">
        <div className="rounded-2xl border border-ocean-100 bg-ocean-50/50 p-4 text-sm text-ocean-700">
          <p className="font-medium text-ocean-900">Três passos simples</p>
          <ol className="mt-2 list-decimal space-y-2 pl-5 leading-relaxed">
            <li>
              Escolhe o separador que corresponde à parte do site (a numeração
              segue a ordem da página, de cima para baixo).
            </li>
            <li>
              Usa <strong>Ver esta parte no rascunho</strong> ou o botão fixo
              em baixo: vês o site com as tuas alterações <em>antes</em> de
              publicar. Ninguém mais vê o rascunho.
            </li>
            <li>
              Quando gostares do resultado,{" "}
              <strong>Guardar no site</strong> publica o rascunho — aí sim fica
              visível para todos. Até lá, só tu vês as alterações (rascunho).
            </li>
          </ol>
          <p className="mt-3 text-xs text-ocean-600">
            As caixas do feed de publicações editam-se em{" "}
            <a href="/crm/publicacoes" className="font-medium underline">
              Publicações
            </a>
            . Preferes ver o site e clicar na zona a mudar?{" "}
            <a href="/crm/site" className="font-medium underline">
              Vista clicável
            </a>
            .
          </p>
        </div>

        {isDirty ? (
          <p
            className="rounded-xl border border-amber-200/90 bg-amber-50 px-4 py-3 text-sm text-amber-950"
            role="status"
          >
            <span className="font-semibold">Rascunho com alterações.</span> A
            pré-visualização mostra este rascunho; o site público só muda com{" "}
            <strong className="font-medium text-amber-950">Guardar no site</strong>
            . Podes{" "}
            <button
              type="button"
              className="font-semibold text-ocean-900 underline decoration-ocean-400 underline-offset-2 hover:text-ocean-950"
              onClick={() => {
                if (
                  window.confirm(
                    "Descartar todas as alterações do rascunho e voltar ao último guardado no site?",
                  )
                ) {
                  setData(baseline);
                }
              }}
            >
              reverter para o último guardado
            </button>
            .
          </p>
        ) : null}

        <div
          className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          role="tablist"
          aria-label="Secções do site"
        >
          {TABS.map((t: TabDef) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={`shrink-0 rounded-2xl border px-4 py-3 text-left text-sm transition ${
                tab === t.id
                  ? "border-ocean-900 bg-ocean-900 text-white shadow-md"
                  : "border-ocean-200 bg-white text-ocean-800 hover:border-ocean-300 hover:bg-ocean-50"
              }`}
            >
              <span className="block font-semibold">{t.label}</span>
              <span
                className={`mt-0.5 block text-xs ${
                  tab === t.id ? "text-white/80" : "text-ocean-500"
                }`}
              >
                {t.sub}
              </span>
            </button>
          ))}
        </div>

        <TabGuide
          tabDef={activeTabDef}
          onPreviewSection={() => openPreview(activeTabDef.previewHash)}
        />

        {message ? (
          <p
            className={`rounded-xl border px-4 py-3 text-sm ${
              message.startsWith("Erro")
                ? "border-terracotta/40 bg-terracotta/10 text-ocean-900"
                : "border-emerald-200 bg-emerald-50 text-emerald-900"
            }`}
          >
            {message}
          </p>
        ) : null}

        <div className="space-y-6">
          <SiteEditorFieldsForTab tab={tab} data={data} {...patchFns} />
        </div>
        </div>

        <aside className="mt-8 space-y-2 lg:sticky lg:top-4 lg:mt-0 lg:self-start">
          <p className="text-sm font-medium text-ocean-900">
            Pré-visualização ao vivo
          </p>
          <p className="text-xs leading-relaxed text-ocean-600">
            Actualiza quando mudas um campo. Isto é só rascunho — o visitante só
            vê o mesmo conteúdo depois de{" "}
            <strong className="font-medium text-ocean-800">Guardar no site</strong>
            . Cada caixa tem uma linha cinzenta de ajuda por baixo do rótulo
            quando existe.
          </p>
          <iframe
            title="Pré-visualização da página inicial"
            src="/crm/site/preview"
            className="h-64 w-full rounded-2xl border border-ocean-200 bg-white shadow-inner sm:h-80 lg:h-[min(78vh,900px)]"
          />
        </aside>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-ocean-200 bg-white/95 px-4 py-3 shadow-[0_-6px_24px_-8px_rgba(0,0,0,0.12)] backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <p className="order-3 text-center text-xs text-ocean-500 sm:order-1 sm:max-w-md sm:text-left">
            {activeTabDef.previewHash
              ? "O rascunho abre na zona que estás a editar (podes fazer scroll para ver o resto)."
              : "O rascunho mostra a página inicial; esta secção só aparece no registo."}
            {isDirty ? (
              <>
                {" "}
                <span className="font-medium text-amber-800">
                  Há alterações por guardar.
                </span>
              </>
            ) : null}
          </p>
          <div className="order-1 flex flex-wrap items-stretch justify-center gap-2 sm:order-2 sm:justify-end">
            {isDirty ? (
              <button
                type="button"
                onClick={() => {
                  if (
                    window.confirm(
                      "Descartar o rascunho e voltar ao último conteúdo guardado no site?",
                    )
                  ) {
                    setData(baseline);
                  }
                }}
                className="min-h-[3rem] flex-1 rounded-2xl border border-ocean-200 bg-white px-4 py-3 text-sm font-semibold text-ocean-800 shadow-sm transition hover:bg-ocean-50 sm:flex-none sm:px-4"
              >
                Descartar rascunho
                <span className="mt-0.5 block text-xs font-normal text-ocean-500">
                  Último guardado
                </span>
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => openPreview(activeTabDef.previewHash)}
              className="min-h-[3rem] flex-1 rounded-2xl border-2 border-ocean-200 bg-white px-4 py-3 text-sm font-semibold text-ocean-900 shadow-sm transition hover:border-ocean-300 hover:bg-ocean-50 sm:flex-none sm:px-5"
            >
              Abrir rascunho
              <span className="mt-0.5 block text-xs font-normal text-ocean-600">
                Nova aba · só tu vês
              </span>
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => submit()}
              className="min-h-[3rem] flex-1 rounded-2xl bg-ocean-900 px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-ocean-800 disabled:opacity-60 sm:flex-none sm:px-6"
            >
              {pending ? "A guardar…" : "Publicar no site"}
              <span className="mt-0.5 block text-xs font-normal text-white/85">
                Rascunho → visível para todos
              </span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
