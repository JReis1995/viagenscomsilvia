"use client";

import { useState, useTransition } from "react";

import { saveSiteContentAction } from "@/app/(dashboard)/crm/actions";
import type { SiteContent } from "@/lib/site/site-content";
import { SITE_PREVIEW_STORAGE_KEY } from "@/lib/site/site-preview-storage";

type Props = {
  initial: SiteContent;
};

type TabId = "hero" | "feed" | "video" | "quiz" | "consultora" | "registo" | "social";

const TABS: {
  id: TabId;
  label: string;
  sub: string;
}[] = [
  {
    id: "hero",
    label: "Topo (hero)",
    sub: "Primeira imagem e frases principais",
  },
  {
    id: "feed",
    label: "Secção do feed",
    sub: "Título da zona de inspirações",
  },
  {
    id: "video",
    label: "Vídeo em destaque",
    sub: "Cartão grande com link Instagram",
  },
  {
    id: "quiz",
    label: "Pedido de proposta",
    sub: "Texto por cima do formulário de orçamento",
  },
  {
    id: "consultora",
    label: "A tua consultora",
    sub: "Texto e fotos desta secção",
  },
  {
    id: "registo",
    label: "Criar conta",
    sub: "Benefícios no ecrã de registo",
  },
  {
    id: "social",
    label: "Instagram na página",
    sub: "Links ou código embed na home",
  },
];

function Field({
  label,
  help,
  value,
  onChange,
  multiline,
}: {
  label: string;
  help?: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
}) {
  const base =
    "mt-1 w-full rounded-xl border border-ocean-200 bg-white px-3 py-2 text-sm text-ocean-900 shadow-sm focus:border-ocean-400 focus:outline-none focus:ring-2 focus:ring-ocean-200";
  return (
    <label className="block text-sm">
      <span className="font-medium text-ocean-800">{label}</span>
      {help ? (
        <span className="mt-0.5 block text-xs font-normal text-ocean-500">
          {help}
        </span>
      ) : null}
      {multiline ? (
        <textarea
          className={`${base} min-h-[88px] resize-y`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={4}
        />
      ) : (
        <input
          type="text"
          className={base}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </label>
  );
}

export function CrmSiteEditor({ initial }: Props) {
  const [data, setData] = useState<SiteContent>(initial);
  const [tab, setTab] = useState<TabId>("hero");
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

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

  function submit() {
    setMessage(null);
    startTransition(() => {
      void (async () => {
        const res = await saveSiteContentAction(data);
        if (res.ok) {
          setMessage(
            "Guardado. O site público actualiza em cerca de 1 minuto, ou recarrega a página inicial.",
          );
        } else {
          setMessage(`Erro: ${res.error}`);
        }
      })();
    });
  }

  function openPreview() {
    try {
      window.localStorage.setItem(
        SITE_PREVIEW_STORAGE_KEY,
        JSON.stringify(data),
      );
      window.open("/crm/site/preview", "_blank", "noopener,noreferrer");
    } catch {
      setMessage("Não foi possível abrir a pré-visualização neste browser.");
    }
  }

  return (
    <>
      <div className="space-y-6">
        <div className="rounded-2xl border border-ocean-100 bg-ocean-50/50 p-4 text-sm text-ocean-700">
          <p className="font-medium text-ocean-900">Como usar</p>
          <ol className="mt-2 list-decimal space-y-1 pl-5">
            <li>Escolhe um separador e altera os textos.</li>
            <li>
              Clica em <strong>Pré-visualizar rascunho</strong> para ver o site
              numa nova aba (sem guardar).
            </li>
            <li>
              Quando estiveres satisfeita, clica em <strong>Guardar no site</strong>.
            </li>
          </ol>
        </div>

        <div
          className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          role="tablist"
          aria-label="Secções do site"
        >
          {TABS.map((t) => (
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

        {tab === "hero" ? (
          <fieldset className="space-y-4 rounded-2xl border border-ocean-100 bg-white p-6 shadow-sm">
            <legend className="px-1 text-lg font-semibold text-ocean-900">
              Topo da página
            </legend>
            <Field
              label="Linha pequena no topo"
              help="Ex.: tipo de negócio"
              value={data.hero.eyebrow}
              onChange={(v) => patch("hero", "eyebrow", v)}
            />
            <Field
              label="Título — linha 1"
              value={data.hero.line1}
              onChange={(v) => patch("hero", "line1", v)}
            />
            <Field
              label="Título — linha em destaque (itálico)"
              value={data.hero.line2Italic}
              onChange={(v) => patch("hero", "line2Italic", v)}
            />
            <Field
              label="Título — linha final"
              value={data.hero.line3}
              onChange={(v) => patch("hero", "line3", v)}
            />
            <Field
              label="Parágrafo abaixo do título"
              value={data.hero.body}
              onChange={(v) => patch("hero", "body", v)}
              multiline
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Texto do botão principal"
                help="Leva ao formulário de pedido de orçamento"
                value={data.hero.ctaPrimary}
                onChange={(v) => patch("hero", "ctaPrimary", v)}
              />
              <Field
                label="Texto do botão secundário"
                help="Desce às publicações"
                value={data.hero.ctaSecondary}
                onChange={(v) => patch("hero", "ctaSecondary", v)}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Frase de confiança 1"
                value={data.hero.trust1}
                onChange={(v) => patch("hero", "trust1", v)}
              />
              <Field
                label="Frase de confiança 2"
                value={data.hero.trust2}
                onChange={(v) => patch("hero", "trust2", v)}
              />
            </div>
            <Field
              label="Texto do link para login (consultora)"
              value={data.hero.consultoraLinkLabel}
              onChange={(v) => patch("hero", "consultoraLinkLabel", v)}
            />
            <Field
              label="Texto «descer» (seta)"
              value={data.hero.scrollHint}
              onChange={(v) => patch("hero", "scrollHint", v)}
            />
            <Field
              label="URL da imagem de fundo (opcional)"
              help="Deixa vazio para usar a imagem por omissão"
              value={data.hero.heroImageUrl}
              onChange={(v) => patch("hero", "heroImageUrl", v)}
            />
          </fieldset>
        ) : null}

        {tab === "feed" ? (
          <fieldset className="space-y-4 rounded-2xl border border-ocean-100 bg-white p-6 shadow-sm">
            <legend className="px-1 text-lg font-semibold text-ocean-900">
              Secção do feed
            </legend>
            <Field
              label="Linha pequena"
              value={data.feed.eyebrow}
              onChange={(v) => patch("feed", "eyebrow", v)}
            />
            <Field
              label="Título da secção"
              value={data.feed.title}
              onChange={(v) => patch("feed", "title", v)}
            />
            <Field
              label="Texto de apoio"
              value={data.feed.subtitle}
              onChange={(v) => patch("feed", "subtitle", v)}
              multiline
            />
            <Field
              label="Texto por cima da grelha de cartões"
              help="Ex.: «Mais do feed»"
              value={data.feed.moreLabel}
              onChange={(v) => patch("feed", "moreLabel", v)}
            />
            <Field
              label="Mensagem quando não há publicações"
              value={data.feed.emptyMessage}
              onChange={(v) => patch("feed", "emptyMessage", v)}
              multiline
            />
          </fieldset>
        ) : null}

        {tab === "video" ? (
          <fieldset className="space-y-4 rounded-2xl border border-ocean-100 bg-white p-6 shadow-sm">
            <legend className="px-1 text-lg font-semibold text-ocean-900">
              Vídeo em destaque
            </legend>
            <Field
              label="Linha pequena"
              value={data.featuredVideo.eyebrow}
              onChange={(v) => patch("featuredVideo", "eyebrow", v)}
            />
            <Field
              label="Etiqueta (ex.: Vídeo em destaque)"
              value={data.featuredVideo.kicker}
              onChange={(v) => patch("featuredVideo", "kicker", v)}
            />
            <Field
              label="Título"
              value={data.featuredVideo.title}
              onChange={(v) => patch("featuredVideo", "title", v)}
              multiline
            />
            <Field
              label="Subtítulo"
              value={data.featuredVideo.subtitle}
              onChange={(v) => patch("featuredVideo", "subtitle", v)}
              multiline
            />
            <Field
              label="URL da imagem de capa (miniatura)"
              help="Opcional; senão usa a variável de ambiente"
              value={data.featuredVideo.posterUrl}
              onChange={(v) => patch("featuredVideo", "posterUrl", v)}
            />
            <Field
              label="Link para o Instagram"
              value={data.featuredVideo.instagramUrl}
              onChange={(v) => patch("featuredVideo", "instagramUrl", v)}
            />
          </fieldset>
        ) : null}

        {tab === "quiz" ? (
          <fieldset className="space-y-4 rounded-2xl border border-ocean-100 bg-white p-6 shadow-sm">
            <legend className="px-1 text-lg font-semibold text-ocean-900">
              Bloco do pedido de proposta
            </legend>
            <Field
              label="Linha pequena"
              value={data.quiz.eyebrow}
              onChange={(v) => patch("quiz", "eyebrow", v)}
            />
            <Field
              label="Título"
              value={data.quiz.title}
              onChange={(v) => patch("quiz", "title", v)}
            />
            <Field
              label="Texto explicativo"
              value={data.quiz.body}
              onChange={(v) => patch("quiz", "body", v)}
              multiline
            />
          </fieldset>
        ) : null}

        {tab === "consultora" ? (
          <fieldset className="space-y-4 rounded-2xl border border-ocean-100 bg-white p-6 shadow-sm">
            <legend className="px-1 text-lg font-semibold text-ocean-900">
              Secção da consultora
            </legend>
            <Field
              label="Linha pequena"
              value={data.consultora.eyebrow}
              onChange={(v) => patch("consultora", "eyebrow", v)}
            />
            <Field
              label="Título (saudação)"
              value={data.consultora.title}
              onChange={(v) => patch("consultora", "title", v)}
            />
            <Field
              label="Primeiro parágrafo"
              value={data.consultora.p1}
              onChange={(v) => patch("consultora", "p1", v)}
              multiline
            />
            <Field
              label="Segundo parágrafo"
              value={data.consultora.p2}
              onChange={(v) => patch("consultora", "p2", v)}
              multiline
            />
            <Field
              label="Citação em destaque"
              value={data.consultora.quote}
              onChange={(v) => patch("consultora", "quote", v)}
              multiline
            />
            <Field
              label="URL da foto de perfil"
              help="Opcional; senão usa a variável de ambiente"
              value={data.consultora.portraitUrl}
              onChange={(v) => patch("consultora", "portraitUrl", v)}
            />
            <Field
              label="Link Instagram — foto"
              help="Opcional"
              value={data.consultora.linkPhoto}
              onChange={(v) => patch("consultora", "linkPhoto", v)}
            />
            <Field
              label="Link Instagram — vídeo"
              help="Opcional"
              value={data.consultora.linkVideo}
              onChange={(v) => patch("consultora", "linkVideo", v)}
            />
            <Field
              label="Texto do botão para o pedido de proposta"
              value={data.consultora.ctaQuiz}
              onChange={(v) => patch("consultora", "ctaQuiz", v)}
            />
          </fieldset>
        ) : null}

        {tab === "registo" ? (
          <fieldset className="space-y-4 rounded-2xl border border-ocean-100 bg-white p-6 shadow-sm">
            <legend className="px-1 text-lg font-semibold text-ocean-900">
              Incentivo ao registo
            </legend>
            <Field
              label="Título / headline"
              value={data.registerIncentive.headline}
              onChange={(v) => patch("registerIncentive", "headline", v)}
            />
            <Field
              label="Benefício 1"
              value={data.registerIncentive.bullet1}
              onChange={(v) => patch("registerIncentive", "bullet1", v)}
            />
            <Field
              label="Benefício 2"
              value={data.registerIncentive.bullet2}
              onChange={(v) => patch("registerIncentive", "bullet2", v)}
            />
            <Field
              label="Benefício 3"
              value={data.registerIncentive.bullet3}
              onChange={(v) => patch("registerIncentive", "bullet3", v)}
            />
          </fieldset>
        ) : null}

        {tab === "social" ? (
          <fieldset className="space-y-4 rounded-2xl border border-ocean-100 bg-white p-6 shadow-sm">
            <legend className="px-1 text-lg font-semibold text-ocean-900">
              Secção Instagram / redes (home)
            </legend>
            <Field
              label="Linha pequena"
              value={data.socialFeed.eyebrow}
              onChange={(v) => patch("socialFeed", "eyebrow", v)}
            />
            <Field
              label="Título"
              value={data.socialFeed.title}
              onChange={(v) => patch("socialFeed", "title", v)}
            />
            <Field
              label="Subtítulo"
              value={data.socialFeed.subtitle}
              onChange={(v) => patch("socialFeed", "subtitle", v)}
              multiline
            />
            <Field
              label="URLs dos posts (uma por linha)"
              help="Alternativa ao embed: cada linha deve ser um link completo para um post ou reel."
              value={data.socialFeed.postUrls}
              onChange={(v) => patch("socialFeed", "postUrls", v)}
              multiline
            />
            <Field
              label="Código embed (opcional)"
              help="Se preencheres, tem prioridade sobre a lista de URLs. Cola o iframe/script que o Instagram fornece."
              value={data.socialFeed.embedHtml}
              onChange={(v) => patch("socialFeed", "embedHtml", v)}
              multiline
            />
          </fieldset>
        ) : null}
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-ocean-200 bg-white/95 px-4 py-3 shadow-[0_-6px_24px_-8px_rgba(0,0,0,0.12)] backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-3 sm:justify-end">
          <button
            type="button"
            onClick={() => openPreview()}
            className="order-2 w-full rounded-2xl border-2 border-ocean-200 bg-white px-5 py-3 text-sm font-semibold text-ocean-900 shadow-sm transition hover:border-ocean-300 hover:bg-ocean-50 sm:order-1 sm:w-auto"
          >
            Pré-visualizar rascunho
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => submit()}
            className="order-1 w-full rounded-2xl bg-ocean-900 px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-ocean-800 disabled:opacity-60 sm:order-2 sm:w-auto"
          >
            {pending ? "A guardar…" : "Guardar no site"}
          </button>
        </div>
      </div>
    </>
  );
}
