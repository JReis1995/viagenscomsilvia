"use client";

import { useState, useTransition } from "react";

import { saveSiteContentAction } from "@/app/(dashboard)/crm/actions";
import { VIBE_OPTIONS } from "@/components/marketing/quiz-options";
import type { SiteContent } from "@/lib/site/site-content";
import { SITE_PREVIEW_STORAGE_KEY } from "@/lib/site/site-preview-storage";

type Props = {
  initial: SiteContent;
};

type TabId =
  | "hero"
  | "feed"
  | "video"
  | "quiz"
  | "consultora"
  | "alma"
  | "registo"
  | "social";

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
    id: "alma",
    label: "Viagens com alma",
    sub: "Depoimentos (slider polaroid)",
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

function VibeSelect({
  label,
  help,
  value,
  onChange,
}: {
  label: string;
  help?: string;
  value: string;
  onChange: (v: string) => void;
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
      <select
        className={base}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">— Nenhum —</option>
        {VIBE_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
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
              help="Deixa vazio para usar a imagem por omissão. Usada como fallback sem vídeo ou com «reduzir movimento»."
              value={data.hero.heroImageUrl}
              onChange={(v) => patch("hero", "heroImageUrl", v)}
            />
            <Field
              label="URL do vídeo de fundo (opcional)"
              help="MP4/WebM directo (ex. Supabase Storage). Sem som; em loop. Vazio = só imagem."
              value={data.hero.heroVideoUrl}
              onChange={(v) => patch("hero", "heroVideoUrl", v)}
            />
            <Field
              label="Poster do vídeo (imagem, opcional)"
              help="Mostrada até o vídeo carregar e como capa em dispositivos lentos"
              value={data.hero.heroVideoPosterUrl}
              onChange={(v) => patch("hero", "heroVideoPosterUrl", v)}
            />
            <p className="text-sm font-medium text-ocean-800">
              Pergunta interativa (opcional)
            </p>
            <p className="text-xs text-ocean-500">
              Se preencheres a pergunta e pelo menos um botão com texto + estilo
              válido, aparecem chips no topo do hero. Cada botão abre o pedido de
              proposta com esse estilo já escolhido.
            </p>
            <Field
              label="Pergunta"
              help='Ex.: «O que o teu corpo pede agora?»'
              value={data.hero.promptQuestion}
              onChange={(v) => patch("hero", "promptQuestion", v)}
            />
            <div className="grid gap-4 rounded-xl border border-ocean-100/80 bg-ocean-50/40 p-4 sm:grid-cols-2">
              <Field
                label="Botão 1 — texto"
                value={data.hero.promptBtn1Label}
                onChange={(v) => patch("hero", "promptBtn1Label", v)}
              />
              <VibeSelect
                label="Botão 1 — estilo de viagem (valor do quiz)"
                value={data.hero.promptBtn1Vibe}
                onChange={(v) => patch("hero", "promptBtn1Vibe", v)}
              />
              <Field
                label="Botão 2 — texto"
                value={data.hero.promptBtn2Label}
                onChange={(v) => patch("hero", "promptBtn2Label", v)}
              />
              <VibeSelect
                label="Botão 2 — estilo de viagem"
                value={data.hero.promptBtn2Vibe}
                onChange={(v) => patch("hero", "promptBtn2Vibe", v)}
              />
              <Field
                label="Botão 3 — texto"
                value={data.hero.promptBtn3Label}
                onChange={(v) => patch("hero", "promptBtn3Label", v)}
              />
              <VibeSelect
                label="Botão 3 — estilo de viagem"
                value={data.hero.promptBtn3Vibe}
                onChange={(v) => patch("hero", "promptBtn3Vibe", v)}
              />
            </div>
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
            <p className="text-sm font-medium text-ocean-800">
              Filtros por vibe (opcional)
            </p>
            <Field
              label="Texto do chip «tudo»"
              value={data.feed.filterAllLabel}
              onChange={(v) => patch("feed", "filterAllLabel", v)}
            />
            <Field
              label="Chip 1 — rótulo"
              value={data.feed.filterChip1Label}
              onChange={(v) => patch("feed", "filterChip1Label", v)}
            />
            <Field
              label="Chip 1 — slug"
              help="Minúsculas, sem espaços — ex.: romance"
              value={data.feed.filterChip1Slug}
              onChange={(v) => patch("feed", "filterChip1Slug", v)}
            />
            <Field
              label="Chip 2 — rótulo"
              value={data.feed.filterChip2Label}
              onChange={(v) => patch("feed", "filterChip2Label", v)}
            />
            <Field
              label="Chip 2 — slug"
              value={data.feed.filterChip2Slug}
              onChange={(v) => patch("feed", "filterChip2Slug", v)}
            />
            <Field
              label="Chip 3 — rótulo"
              value={data.feed.filterChip3Label}
              onChange={(v) => patch("feed", "filterChip3Label", v)}
            />
            <Field
              label="Chip 3 — slug"
              value={data.feed.filterChip3Slug}
              onChange={(v) => patch("feed", "filterChip3Slug", v)}
            />
            <Field
              label="Nota para ti (slugs)"
              help="Lembrete ao configurar publicações; não aparece no site."
              value={data.feed.filterHint}
              onChange={(v) => patch("feed", "filterHint", v)}
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
            <p className="pt-4 text-sm font-medium text-ocean-800">
              Passo «clima» (no ecrã inteiro, após nome, email e telemóvel)
            </p>
            <p className="text-xs text-ocean-500">
              Após «Começar», o cliente escolhe neve, praia, cidade ou mistura —
              as chaves na base de dados são fixas; aqui editas só os textos.
            </p>
            <Field
              label="Pergunta do clima"
              value={data.quiz.climaQuestion}
              onChange={(v) => patch("quiz", "climaQuestion", v)}
            />
            <Field
              label="Subtítulo / ajuda"
              value={data.quiz.climaHint}
              onChange={(v) => patch("quiz", "climaHint", v)}
              multiline
            />
            <Field
              label="Opção — neve / montanha"
              value={data.quiz.climaLabelNeve}
              onChange={(v) => patch("quiz", "climaLabelNeve", v)}
            />
            <Field
              label="Opção — sol / praia"
              value={data.quiz.climaLabelPraia}
              onChange={(v) => patch("quiz", "climaLabelPraia", v)}
            />
            <Field
              label="Opção — cidade / cultura"
              value={data.quiz.climaLabelCidade}
              onChange={(v) => patch("quiz", "climaLabelCidade", v)}
            />
            <Field
              label="Opção — misturar"
              value={data.quiz.climaLabelMisto}
              onChange={(v) => patch("quiz", "climaLabelMisto", v)}
            />
            <p className="pt-4 text-sm font-medium text-ocean-800">
              Página «Obrigado» após enviar o pedido
            </p>
            <p className="text-xs text-ocean-500">
              Usa{" "}
              <code className="rounded bg-ocean-50 px-1">{"{nome}"}</code> na
              saudação para o primeiro nome (se disponível).
            </p>
            <Field
              label="Saudação (com {nome})"
              help='Ex.: «Olá, {nome}!»'
              value={data.quizSuccess.greetingLine}
              onChange={(v) => patchQuizSuccess("greetingLine", v)}
            />
            <Field
              label="Título principal"
              value={data.quizSuccess.headline}
              onChange={(v) => patchQuizSuccess("headline", v)}
            />
            <Field
              label="Texto do corpo"
              value={data.quizSuccess.body}
              onChange={(v) => patchQuizSuccess("body", v)}
              multiline
            />
            <Field
              label="Texto do link Spotify"
              value={data.quizSuccess.spotifyLabel}
              onChange={(v) => patchQuizSuccess("spotifyLabel", v)}
              multiline
            />
            <Field
              label="URL da playlist Spotify"
              help="Opcional — sem URL o cartão não mostra o link"
              value={data.quizSuccess.spotifyUrl}
              onChange={(v) => patchQuizSuccess("spotifyUrl", v)}
            />
            <Field
              label="Texto do botão para a página inicial"
              value={data.quizSuccess.backHomeLabel}
              onChange={(v) => patchQuizSuccess("backHomeLabel", v)}
            />
            <Field
              label="Nota sobre email de confirmação"
              help="Só aparece quando o envio automático de email correu bem"
              value={data.quizSuccess.emailConfirmLine}
              onChange={(v) => patchQuizSuccess("emailConfirmLine", v)}
              multiline
            />
            <Field
              label="Imagem de fundo do cartão (URL)"
              help="Opcional — https; sobrepõe o gradiente por omissão com um véu legível"
              value={data.quizSuccess.cardBackgroundUrl}
              onChange={(v) => patchQuizSuccess("cardBackgroundUrl", v)}
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

        {tab === "alma" ? (
          <fieldset className="space-y-4 rounded-2xl border border-ocean-100 bg-white p-6 shadow-sm">
            <legend className="px-1 text-lg font-semibold text-ocean-900">
              Depoimentos (Viagens com alma)
            </legend>
            <p className="text-xs text-ocean-600">
              Aparecem por baixo da secção da consultora. Só entram no site os
              cartões com texto ou imagem preenchidos. Máximo 12.
            </p>
            <Field
              label="Linha pequena"
              value={data.almaTestimonials.eyebrow}
              onChange={(v) => patchAlma("eyebrow", v)}
            />
            <Field
              label="Título da secção"
              value={data.almaTestimonials.title}
              onChange={(v) => patchAlma("title", v)}
            />
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={addAlmaItem}
                disabled={data.almaTestimonials.items.length >= 12}
                className="rounded-xl bg-ocean-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
              >
                Adicionar depoimento
              </button>
            </div>
            <ul className="space-y-6">
              {data.almaTestimonials.items.map((it, index) => (
                <li
                  key={index}
                  className="rounded-xl border border-ocean-100 bg-ocean-50/40 p-4"
                >
                  <div className="mb-3 flex flex-wrap gap-2">
                    <span className="text-sm font-medium text-ocean-800">
                      #{index + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => moveAlmaItem(index, -1)}
                      disabled={index === 0}
                      className="text-xs text-ocean-600 underline disabled:opacity-30"
                    >
                      Subir
                    </button>
                    <button
                      type="button"
                      onClick={() => moveAlmaItem(index, 1)}
                      disabled={
                        index === data.almaTestimonials.items.length - 1
                      }
                      className="text-xs text-ocean-600 underline disabled:opacity-30"
                    >
                      Descer
                    </button>
                    <button
                      type="button"
                      onClick={() => removeAlmaItem(index)}
                      className="text-xs font-medium text-terracotta underline"
                    >
                      Remover
                    </button>
                  </div>
                  <Field
                    label="URL da foto"
                    value={it.imageUrl}
                    onChange={(v) => patchAlmaItem(index, "imageUrl", v)}
                  />
                  <Field
                    label="Citação"
                    value={it.quote}
                    onChange={(v) => patchAlmaItem(index, "quote", v)}
                    multiline
                  />
                  <Field
                    label="Atribuição (opcional)"
                    help="Ex.: Maria & João, Lisboa"
                    value={it.attribution}
                    onChange={(v) => patchAlmaItem(index, "attribution", v)}
                  />
                </li>
              ))}
            </ul>
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
