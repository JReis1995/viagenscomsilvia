"use client";

import { useState } from "react";

import { VIBE_OPTIONS } from "@/components/marketing/quiz-options";
import { createClient } from "@/lib/supabase/client";
import type { SiteContent } from "@/lib/site/site-content";

export type TabId =
  | "layout"
  | "hero"
  | "feed"
  | "video"
  | "stories"
  | "social"
  | "consultora"
  | "alma"
  | "process"
  | "quiz"
  | "registo"
  | "crm";

export type TabDef = {
  id: TabId;
  label: string;
  sub: string;
  /** Âncora na pré-visualização (mesmos ids que a página pública). */
  previewHash: string | null;
  guideTitle: string;
  guideBody: string;
  /** Só quando não há hash na pré-visualização */
  guideExtra?: string;
};

/** Ordem = ordem em que as secções aparecem ao descer a página inicial. */
export const TABS: TabDef[] = [
  {
    id: "layout",
    label: "Ordem da home",
    sub: "Blocos da página (ou arrasta na vista clicável)",
    previewHash: null,
    guideTitle: "O que estás a editar",
    guideBody:
      "A sequência dos blocos da página inicial: topo, inspirações, histórias rápidas, Instagram, sobre + depoimentos, como trabalhamos, conta de cliente e pedido de proposta. Na vista clicável podes arrastar as barras âmbar; aqui escreves a ordem em código: hero, feed, stories, social, consultora, process, account, quiz — separados por vírgula.",
  },
  {
    id: "hero",
    label: "1 · Topo",
    sub: "Foto/vídeo, título e botões",
    previewHash: "topo-pagina-inicial",
    guideTitle: "O que estás a editar",
    guideBody:
      "É o primeiro ecrã do site: imagem ou vídeo de fundo, frase pequena no topo, título grande (a linha em itálico é a do meio) e os dois botões. Também podes acrescentar a pergunta com botões redondos, se quiseres.",
  },
  {
    id: "feed",
    label: "2 · Feed — título",
    sub: "Título da zona + filtros",
    previewHash: "inspiracoes",
    guideTitle: "O que estás a editar",
    guideBody:
      "O bloco «Inspirações e ofertas»: título, texto de apoio e os filtros redondos por cima das publicações. As próprias publicações vêm do separador Publicações — aqui só mudas textos e nomes dos filtros.",
  },
  {
    id: "video",
    label: "3 · Vídeo em destaque",
    sub: "Cartão com Instagram",
    previewHash: "inspiracoes",
    guideTitle: "O que estás a editar",
    guideBody:
      "O cartão grande com vídeo/imagem que aparece logo abaixo do título das inspirações, antes da grelha de publicações. É o destaque visual dessa zona.",
  },
  {
    id: "stories",
    label: "4 · Histórias rápidas",
    sub: "Ideias «3 noites em X · orçamento Y»",
    previewHash: "historias-curadoria",
    guideTitle: "O que estás a editar",
    guideBody:
      "Cartões depois do feed. Na vista clicável, desce até à secção e clica nos textos; o botão «Adicionar história» fica no fim do bloco. Aqui na lista podes gerir o mesmo conteúdo. Sem texto num cartão, o bloco pode ficar vazio no site público.",
  },
  {
    id: "social",
    label: "5 · Instagram",
    sub: "Bloco de redes na home",
    previewHash: "instagram-feed",
    guideTitle: "O que estás a editar",
    guideBody:
      "A secção branca com o Instagram (lista de links ou código que colas). Se estiver vazia, esta zona pode não aparecer no site.",
  },
  {
    id: "consultora",
    label: "6 · Sobre ti",
    sub: "Texto e retrato",
    previewHash: "secao-consultora",
    guideTitle: "O que estás a editar",
    guideBody:
      "A zona com o teu texto, citação, retrato e links para o Instagram. O botão leva o visitante ao formulário de pedido de proposta.",
  },
  {
    id: "alma",
    label: "7 · Depoimentos",
    sub: "Cartões estilo polaroid",
    previewHash: "secao-depoimentos",
    guideTitle: "O que estás a editar",
    guideBody:
      "Os depoimentos em cartões, logo abaixo da secção sobre ti. Só aparecem no site os que tiverem foto ou texto preenchidos.",
  },
  {
    id: "process",
    label: "8 · Como trabalhamos",
    sub: "Passos, prazos e primeiro contacto",
    previewHash: "como-trabalhamos",
    guideTitle: "O que estás a editar",
    guideBody:
      "Transparência: passos, primeiro contacto e prazos. Na vista clicável, edita tudo a clicar na secção; usa «Adicionar passo» no fim da lista. Se apagares o título principal, o bloco deixa de aparecer no site público.",
  },
  {
    id: "quiz",
    label: "9 · Pedido de proposta",
    sub: "Formulário e página Obrigado",
    previewHash: "pedido-orcamento",
    guideTitle: "O que estás a editar",
    guideBody:
      "O formulário grande no fim da página inicial e o passo do clima (neve, praia, etc.) depois do email. Os textos da página «Obrigado» estão mais abaixo neste separador: essa página só aparece depois de alguém enviar o pedido no site público, por isso não vês no rascunho da home.",
  },
  {
    id: "registo",
    label: "10 · Conta de cliente",
    sub: "Home, Obrigado e ecrã de registo",
    previewHash: "conta-cliente",
    guideTitle: "O que estás a editar",
    guideBody:
      "Na vista clicável do site, o bloco escuro da home e os textos partilhados com «Obrigado»/registo editam-se a clicar na pré-visualização. Aqui na lista tens o mesmo conteúdo em campos clássicos. O título da home vazio esconde o bloco no site público.",
    guideExtra:
      "A página «Obrigado» completa não aparece no rascunho da home — confere no site público ou após um pedido de teste.",
  },
  {
    id: "crm",
    label: "11 · Quadro de leads",
    sub: "SLA e exportação CSV",
    previewHash: null,
    guideTitle: "O que estás a editar",
    guideBody:
      "Limiares em horas para as bordas dos cartões no Kanban (tempo desde o pedido): até ao primeiro valor a borda fica neutra; entre o primeiro e o segundo fica amarela; acima do segundo fica vermelha. Estados finais (Ganho, Cancelado, Arquivado) e a coluna «Outros estados» ficam sempre neutros. Também defines o texto de ajuda junto ao «Exportar CSV». Não altera o site público — só o painel /crm.",
  },
];

const SITE_MEDIA_BUCKET = "post-media";
const MAX_PORTRAIT_IMAGE_BYTES = 20 * 1024 * 1024;
const ALLOWED_PORTRAIT_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

function sanitizeUploadBasename(name: string): string {
  const base = name.replace(/^.*[/\\]/, "").slice(0, 80);
  const cleaned = base
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return cleaned || "silvia.jpg";
}

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

function ImageUrlThumb({ src }: { src: string }) {
  const [imgError, setImgError] = useState(false);
  if (imgError) {
    return (
      <p className="mt-2 text-xs text-ocean-500">
        Não foi possível mostrar a imagem — confere se o link está certo e se
        abre quando colas no browser.
      </p>
    );
  }
  return (
    /* eslint-disable-next-line @next/next/no-img-element -- URL editável no CRM */
    <img
      src={src}
      alt=""
      className="mt-2 max-h-44 w-full max-w-lg rounded-lg border border-ocean-100/80 object-cover object-center shadow-sm"
      loading="lazy"
      decoding="async"
      onError={() => setImgError(true)}
    />
  );
}

function ImageUrlField({
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
  const trimmed = value.trim();
  const looksLikeUrl =
    trimmed.startsWith("https://") || trimmed.startsWith("http://");

  return (
    <label className="block text-sm">
      <span className="font-medium text-ocean-800">{label}</span>
      {help ? (
        <span className="mt-0.5 block text-xs font-normal text-ocean-500">
          {help}
        </span>
      ) : null}
      <input
        type="url"
        inputMode="url"
        autoComplete="url"
        placeholder="https://…"
        className={base}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {looksLikeUrl ? (
        <div className="mt-3 rounded-xl border border-ocean-100 bg-ocean-50/50 p-3">
          <p className="text-xs font-medium text-ocean-600">
            Pré-visualização (se o link for uma imagem)
          </p>
          <ImageUrlThumb key={trimmed} src={trimmed} />
        </div>
      ) : null}
    </label>
  );
}

export function TabGuide({
  tabDef,
  onPreviewSection,
}: {
  tabDef: TabDef;
  onPreviewSection: () => void;
}) {
  return (
    <div className="rounded-2xl border border-ocean-200/90 bg-gradient-to-br from-white to-ocean-50/40 p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-ocean-500">
        {tabDef.guideTitle}
      </p>
      <p className="mt-2 text-sm leading-relaxed text-ocean-800">
        {tabDef.guideBody}
      </p>
      {tabDef.guideExtra ? (
        <p className="mt-3 text-sm leading-relaxed text-ocean-600">
          {tabDef.guideExtra}
        </p>
      ) : null}
      {tabDef.previewHash ? (
        <button
          type="button"
          onClick={onPreviewSection}
          className="mt-4 inline-flex items-center justify-center rounded-xl bg-ocean-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-ocean-800"
        >
          Ver esta parte no rascunho
        </button>
      ) : null}
    </div>
  );
}

export type SiteContentPatchFns = {
  patch: <K extends keyof SiteContent>(
    section: K,
    field: keyof SiteContent[K],
    value: string,
  ) => void;
  patchQuizSuccess: (
    field: keyof SiteContent["quizSuccess"],
    value: string,
  ) => void;
  patchAlma: (field: "eyebrow" | "title", value: string) => void;
  patchAlmaItem: (
    index: number,
    field: "imageUrl" | "quote" | "attribution",
    value: string,
  ) => void;
  addAlmaItem: () => void;
  removeAlmaItem: (index: number) => void;
  moveAlmaItem: (index: number, dir: -1 | 1) => void;
  patchTravelStories: (
    field: "eyebrow" | "title" | "subtitle",
    value: string,
  ) => void;
  patchTravelStoryItem: (
    index: number,
    field:
      | "headline"
      | "nightsBudgetLine"
      | "blurb"
      | "linkUrl"
      | "linkLabel",
    value: string,
  ) => void;
  addTravelStoryItem: () => void;
  removeTravelStoryItem: (index: number) => void;
  moveTravelStoryItem: (index: number, dir: -1 | 1) => void;
  patchHowWeWork: (
    field:
      | "eyebrow"
      | "title"
      | "subtitle"
      | "firstContactTitle"
      | "firstContactBody"
      | "timingsTitle"
      | "timingsBody",
    value: string,
  ) => void;
  patchHowWeWorkStep: (
    index: number,
    field: "title" | "body",
    value: string,
  ) => void;
  addHowWeWorkStep: () => void;
  removeHowWeWorkStep: (index: number) => void;
  moveHowWeWorkStep: (index: number, dir: -1 | 1) => void;
};

export type VisualPanel =
  | "hero"
  | "inspiracoes"
  | "social"
  | "sobre"
  | "quiz"
  | "registo";

export const VISUAL_PANEL_LABEL: Record<VisualPanel, string> = {
  hero: "Topo do site",
  inspiracoes: "Inspirações e vídeo em destaque",
  social: "Instagram / redes",
  sobre: "Sobre ti e depoimentos",
  quiz: "Pedido de proposta",
  registo: "Textos de criar conta",
};

export function SiteEditorFieldsForVisualPanel({
  panel,
  data,
  ...fn
}: { panel: VisualPanel; data: SiteContent } & SiteContentPatchFns) {
  switch (panel) {
    case "hero":
      return <SiteEditorFieldsForTab tab="hero" data={data} {...fn} />;
    case "inspiracoes":
      return (
        <div className="space-y-8">
          <SiteEditorFieldsForTab tab="feed" data={data} {...fn} />
          <SiteEditorFieldsForTab tab="video" data={data} {...fn} />
          <SiteEditorFieldsForTab tab="stories" data={data} {...fn} />
        </div>
      );
    case "social":
      return <SiteEditorFieldsForTab tab="social" data={data} {...fn} />;
    case "sobre":
      return (
        <div className="space-y-8">
          <SiteEditorFieldsForTab tab="consultora" data={data} {...fn} />
          <SiteEditorFieldsForTab tab="alma" data={data} {...fn} />
          <SiteEditorFieldsForTab tab="process" data={data} {...fn} />
        </div>
      );
    case "quiz":
      return <SiteEditorFieldsForTab tab="quiz" data={data} {...fn} />;
    case "registo":
      return <SiteEditorFieldsForTab tab="registo" data={data} {...fn} />;
    default:
      return null;
  }
}

export function SiteEditorFieldsForTab({
  tab,
  data,
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
}: { tab: TabId; data: SiteContent } & SiteContentPatchFns) {
  const [portraitUploadBusy, setPortraitUploadBusy] = useState(false);
  const [portraitUploadHint, setPortraitUploadHint] = useState<string | null>(
    null,
  );

  async function uploadConsultoraPortrait(
    file: File | undefined | null,
  ): Promise<void> {
    if (!file) return;
    if (!ALLOWED_PORTRAIT_TYPES.has(file.type)) {
      setPortraitUploadHint(
        "Formato inválido. Usa JPEG, PNG, WebP ou GIF para a fotografia.",
      );
      return;
    }
    if (file.size > MAX_PORTRAIT_IMAGE_BYTES) {
      setPortraitUploadHint("A imagem é demasiado grande (máximo 20 MB).");
      return;
    }

    setPortraitUploadBusy(true);
    setPortraitUploadHint(null);
    try {
      const supabase = createClient();
      const path = `site/consultora/${crypto.randomUUID()}-${sanitizeUploadBasename(file.name)}`;
      const { data: uploaded, error } = await supabase.storage
        .from(SITE_MEDIA_BUCKET)
        .upload(path, file, { cacheControl: "3600", upsert: false });
      if (error) {
        setPortraitUploadHint(
          `Erro ao carregar fotografia: ${error.message}`,
        );
        return;
      }
      const { data: pub } = supabase.storage
        .from(SITE_MEDIA_BUCKET)
        .getPublicUrl(uploaded.path);
      patch("consultora", "portraitUrl", pub.publicUrl);
      setPortraitUploadHint(
        "Fotografia carregada. Guarda/Publica para aplicar no site.",
      );
    } finally {
      setPortraitUploadBusy(false);
    }
  }

  return (
    <>
        {tab === "layout" ? (
          <fieldset className="space-y-4 rounded-2xl border border-ocean-100 bg-white p-6 shadow-sm">
            <legend className="px-1 text-lg font-semibold text-ocean-900">
              Ordem dos blocos
            </legend>
            <p className="text-xs leading-relaxed text-ocean-600">
              Códigos:{" "}
              <code className="rounded bg-ocean-100/80 px-1 text-[11px]">hero</code>{" "}
              (topo),{" "}
              <code className="rounded bg-ocean-100/80 px-1 text-[11px]">feed</code>{" "}
              (inspirações),{" "}
              <code className="rounded bg-ocean-100/80 px-1 text-[11px]">stories</code>{" "}
              (histórias rápidas),{" "}
              <code className="rounded bg-ocean-100/80 px-1 text-[11px]">social</code>{" "}
              (Instagram),{" "}
              <code className="rounded bg-ocean-100/80 px-1 text-[11px]">consultora</code>{" "}
              (sobre + depoimentos),{" "}
              <code className="rounded bg-ocean-100/80 px-1 text-[11px]">process</code>{" "}
              (como trabalhamos),{" "}
              <code className="rounded bg-ocean-100/80 px-1 text-[11px]">account</code>{" "}
              (conta na home),{" "}
              <code className="rounded bg-ocean-100/80 px-1 text-[11px]">quiz</code>{" "}
              (pedido).
            </p>
            <Field
              label="Lista separada por vírgulas"
              help="Valores inválidos ou repetidos são ignorados; se faltar algum bloco, ele é acrescentado no fim ao guardar."
              value={data.layout.homeOrderCsv}
              onChange={(v) => patch("layout", "homeOrderCsv", v)}
            />
          </fieldset>
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
              help="Primeira linha grande, acima da frase em itálico. Vês o efeito na pré-visualização ao lado ou em baixo."
              value={data.hero.line1}
              onChange={(v) => patch("hero", "line1", v)}
            />
            <Field
              label="Título — linha em destaque (itálico)"
              help="Linha do meio em tipografia cursiva — costuma ser o nome ou o conceito principal."
              value={data.hero.line2Italic}
              onChange={(v) => patch("hero", "line2Italic", v)}
            />
            <Field
              label="Título — linha final"
              help="Terceira linha do bloco de título, abaixo do itálico."
              value={data.hero.line3}
              onChange={(v) => patch("hero", "line3", v)}
            />
            <Field
              label="Parágrafo abaixo do título"
              help="Texto de apoio curto; aparece logo por baixo dos três títulos."
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
                help="Pequena linha de credibilidade (ex.: anos de experiência)."
                value={data.hero.trust1}
                onChange={(v) => patch("hero", "trust1", v)}
              />
              <Field
                label="Frase de confiança 2"
                help="Segunda linha opcional ao lado da primeira."
                value={data.hero.trust2}
                onChange={(v) => patch("hero", "trust2", v)}
              />
            </div>
            <Field
              label="Texto do link para login (consultora)"
              help="Só visível para ti quando estás autenticada; convida a ir ao painel."
              value={data.hero.consultoraLinkLabel}
              onChange={(v) => patch("hero", "consultoraLinkLabel", v)}
            />
            <Field
              label="Texto «descer» (seta)"
              help="Pequena dica por baixo dos botões para scroll à secção seguinte."
              value={data.hero.scrollHint}
              onChange={(v) => patch("hero", "scrollHint", v)}
            />
            <ImageUrlField
              label="Imagem de fundo (opcional)"
              help="Cola o link da imagem ou deixa vazio para usar a fotografia por omissão. Se não usares vídeo, é esta imagem que se vê."
              value={data.hero.heroImageUrl}
              onChange={(v) => patch("hero", "heroImageUrl", v)}
            />
            <Field
              label="Vídeo de fundo (opcional)"
              help="Link directo para um ficheiro de vídeo (terminado em .mp4 ou similar), por exemplo no armazenamento do Supabase. Sem som, em repetição. Se ficar vazio, usa-se só a imagem."
              value={data.hero.heroVideoUrl}
              onChange={(v) => patch("hero", "heroVideoUrl", v)}
            />
            <ImageUrlField
              label="Imagem de capa do vídeo (opcional)"
              help="Uma imagem estática enquanto o vídeo carrega; também ajuda em telemóveis mais lentos."
              value={data.hero.heroVideoPosterUrl}
              onChange={(v) => patch("hero", "heroVideoPosterUrl", v)}
            />
            <p className="text-sm font-medium text-ocean-800">
              Pergunta interativa (opcional)
            </p>
            <p className="text-xs text-ocean-500">
              Se preencheres a pergunta e pelo menos um botão com texto e tipo de
              viagem, aparecem botões redondos por cima do título. Cada um abre
              o pedido de proposta já com esse estilo escolhido.
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
                label="Botão 1 — tipo de viagem (ligado ao formulário)"
                help="Tem de coincidir com as opções do pedido de proposta."
                value={data.hero.promptBtn1Vibe}
                onChange={(v) => patch("hero", "promptBtn1Vibe", v)}
              />
              <Field
                label="Botão 2 — texto"
                value={data.hero.promptBtn2Label}
                onChange={(v) => patch("hero", "promptBtn2Label", v)}
              />
              <VibeSelect
                label="Botão 2 — tipo de viagem"
                help="Tem de coincidir com as opções do formulário."
                value={data.hero.promptBtn2Vibe}
                onChange={(v) => patch("hero", "promptBtn2Vibe", v)}
              />
              <Field
                label="Botão 3 — texto"
                value={data.hero.promptBtn3Label}
                onChange={(v) => patch("hero", "promptBtn3Label", v)}
              />
              <VibeSelect
                label="Botão 3 — tipo de viagem"
                help="Tem de coincidir com as opções do formulário."
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
              label="Chip 1 — código do filtro"
              help="Palavra curta em minúsculas, sem espaços (ex.: romance). Nas publicações, usa exactamente este código nas etiquetas para o filtro funcionar."
              value={data.feed.filterChip1Slug}
              onChange={(v) => patch("feed", "filterChip1Slug", v)}
            />
            <Field
              label="Chip 2 — rótulo"
              value={data.feed.filterChip2Label}
              onChange={(v) => patch("feed", "filterChip2Label", v)}
            />
            <Field
              label="Chip 2 — código do filtro"
              help="Igual ao que pões nas publicações para este tema."
              value={data.feed.filterChip2Slug}
              onChange={(v) => patch("feed", "filterChip2Slug", v)}
            />
            <Field
              label="Chip 3 — rótulo"
              value={data.feed.filterChip3Label}
              onChange={(v) => patch("feed", "filterChip3Label", v)}
            />
            <Field
              label="Chip 3 — código do filtro"
              help="Igual ao que pões nas publicações para este tema."
              value={data.feed.filterChip3Slug}
              onChange={(v) => patch("feed", "filterChip3Slug", v)}
            />
            <Field
              label="Nota só para ti (não aparece no site)"
              help="Anotação privada, por exemplo os códigos que usas nas publicações."
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
            <ImageUrlField
              label="Imagem de capa do vídeo (miniatura)"
              help="Opcional. Se ficar vazio, o sistema pode usar uma imagem definida nas configurações técnicas."
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

        {tab === "stories" ? (
          <fieldset className="space-y-4 rounded-2xl border border-ocean-100 bg-white p-6 shadow-sm">
            <legend className="px-1 text-lg font-semibold text-ocean-900">
              Histórias rápidas (curadoria)
            </legend>
            <p className="text-xs text-ocean-600">
              Cartões após o feed. Preenche título ou texto em cada cartão para
              ele aparecer no site. Link opcional (mapa, publicação, etc.).
              Máximo 12.
            </p>
            <Field
              label="Linha pequena"
              value={data.travelStories.eyebrow}
              onChange={(v) => patchTravelStories("eyebrow", v)}
            />
            <Field
              label="Título da secção"
              value={data.travelStories.title}
              onChange={(v) => patchTravelStories("title", v)}
            />
            <Field
              label="Subtítulo"
              value={data.travelStories.subtitle}
              onChange={(v) => patchTravelStories("subtitle", v)}
              multiline
            />
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={addTravelStoryItem}
                disabled={data.travelStories.items.length >= 12}
                className="rounded-xl bg-ocean-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
              >
                Adicionar história
              </button>
            </div>
            <ul className="space-y-6">
              {data.travelStories.items.map((it, index) => (
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
                      onClick={() => moveTravelStoryItem(index, -1)}
                      disabled={index === 0}
                      className="text-xs text-ocean-600 underline disabled:opacity-30"
                    >
                      Subir
                    </button>
                    <button
                      type="button"
                      onClick={() => moveTravelStoryItem(index, 1)}
                      disabled={
                        index === data.travelStories.items.length - 1
                      }
                      className="text-xs text-ocean-600 underline disabled:opacity-30"
                    >
                      Descer
                    </button>
                    <button
                      type="button"
                      onClick={() => removeTravelStoryItem(index)}
                      className="text-xs font-medium text-terracotta underline"
                    >
                      Remover
                    </button>
                  </div>
                  <Field
                    label="Título (ex.: Três noites no Porto)"
                    value={it.headline}
                    onChange={(v) =>
                      patchTravelStoryItem(index, "headline", v)
                    }
                  />
                  <Field
                    label="Linha noites / orçamento (ex.: 3 noites · desde 800 €)"
                    value={it.nightsBudgetLine}
                    onChange={(v) =>
                      patchTravelStoryItem(index, "nightsBudgetLine", v)
                    }
                  />
                  <Field
                    label="Texto curto"
                    value={it.blurb}
                    onChange={(v) => patchTravelStoryItem(index, "blurb", v)}
                    multiline
                  />
                  <Field
                    label="Texto do link (opcional)"
                    help="Ex.: Ver no mapa, Abrir publicação"
                    value={it.linkLabel}
                    onChange={(v) =>
                      patchTravelStoryItem(index, "linkLabel", v)
                    }
                  />
                  <Field
                    label="URL do link (opcional)"
                    help="https://… (Google Maps, post, etc.)"
                    value={it.linkUrl}
                    onChange={(v) => patchTravelStoryItem(index, "linkUrl", v)}
                  />
                </li>
              ))}
            </ul>
          </fieldset>
        ) : null}

        {tab === "quiz" ? (
          <fieldset className="space-y-4 rounded-2xl border border-ocean-100 bg-white p-6 shadow-sm">
            <legend className="px-1 text-lg font-semibold text-ocean-900">
              Bloco do pedido de proposta
            </legend>
            <p className="text-sm font-medium text-ocean-800">
              Cartão branco antes de abrir o formulário
            </p>
            <p className="text-xs text-ocean-500">
              É o primeiro ecrã que o visitante vê dentro desta zona, antes de
              carregar em «Começar».
            </p>
            <Field
              label="Título do cartão"
              value={data.quiz.introCardTitle}
              onChange={(v) => patch("quiz", "introCardTitle", v)}
            />
            <Field
              label="Texto do cartão"
              value={data.quiz.introCardBody}
              onChange={(v) => patch("quiz", "introCardBody", v)}
              multiline
            />
            <Field
              label="Texto do botão (começar)"
              value={data.quiz.introCardCtaLabel}
              onChange={(v) => patch("quiz", "introCardCtaLabel", v)}
            />
            <p className="border-t border-ocean-100 pt-4 text-sm font-medium text-ocean-800">
              Título da secção (acima do cartão e do formulário)
            </p>
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
              Formulário imersivo — textos dos passos
            </p>
            <p className="text-xs text-ocean-500">
              Igual à vista clicável: depois de «Começar», cada pergunta e dica
              editam-se também na pré-visualização.
            </p>
            <Field
              label="Passo 1 — título"
              value={data.quiz.pedidoStep1Title}
              onChange={(v) => patch("quiz", "pedidoStep1Title", v)}
            />
            <Field
              label="Passo 1 — ajuda"
              value={data.quiz.pedidoStep1Hint}
              onChange={(v) => patch("quiz", "pedidoStep1Hint", v)}
              multiline
            />
            <Field
              label="Passo 1 — placeholder"
              value={data.quiz.pedidoStep1Placeholder}
              onChange={(v) => patch("quiz", "pedidoStep1Placeholder", v)}
            />
            <Field
              label="Passo 2 — título"
              value={data.quiz.pedidoStep2Title}
              onChange={(v) => patch("quiz", "pedidoStep2Title", v)}
            />
            <Field
              label="Passo 2 — ajuda"
              value={data.quiz.pedidoStep2Hint}
              onChange={(v) => patch("quiz", "pedidoStep2Hint", v)}
              multiline
            />
            <Field
              label="Passo 2 — placeholder"
              value={data.quiz.pedidoStep2Placeholder}
              onChange={(v) => patch("quiz", "pedidoStep2Placeholder", v)}
            />
            <Field
              label="Passo 3 — título"
              value={data.quiz.pedidoStep3Title}
              onChange={(v) => patch("quiz", "pedidoStep3Title", v)}
            />
            <Field
              label="Passo 3 — ajuda"
              value={data.quiz.pedidoStep3Hint}
              onChange={(v) => patch("quiz", "pedidoStep3Hint", v)}
              multiline
            />
            <Field
              label="Passo 3 — placeholder"
              value={data.quiz.pedidoStep3Placeholder}
              onChange={(v) => patch("quiz", "pedidoStep3Placeholder", v)}
            />
            <p className="pt-4 text-sm font-medium text-ocean-800">
              Pedido rápido (nos passos 3 e 4, ao lado do contacto / clima)
            </p>
            <Field
              label="Título do cartão"
              value={data.quiz.pedidoRapidoCardTitle}
              onChange={(v) => patch("quiz", "pedidoRapidoCardTitle", v)}
            />
            <Field
              label="Texto do cartão"
              value={data.quiz.pedidoRapidoCardBody}
              onChange={(v) => patch("quiz", "pedidoRapidoCardBody", v)}
              multiline
            />
            <Field
              label="Texto do botão do cartão"
              value={data.quiz.pedidoRapidoCardCta}
              onChange={(v) => patch("quiz", "pedidoRapidoCardCta", v)}
            />
            <Field
              label="Modal — título"
              value={data.quiz.pedidoRapidoModalTitle}
              onChange={(v) => patch("quiz", "pedidoRapidoModalTitle", v)}
            />
            <Field
              label="Modal — texto"
              value={data.quiz.pedidoRapidoModalBody}
              onChange={(v) => patch("quiz", "pedidoRapidoModalBody", v)}
              multiline
            />
            <Field
              label="Modal — placeholder"
              value={data.quiz.pedidoRapidoModalPlaceholder}
              onChange={(v) => patch("quiz", "pedidoRapidoModalPlaceholder", v)}
            />
            <Field
              label="Modal — botão enviar"
              value={data.quiz.pedidoRapidoModalSubmit}
              onChange={(v) => patch("quiz", "pedidoRapidoModalSubmit", v)}
            />
            <Field
              label="Modal — voltar ao pedido completo"
              value={data.quiz.pedidoRapidoModalBack}
              onChange={(v) => patch("quiz", "pedidoRapidoModalBack", v)}
            />
            <p className="pt-4 text-sm font-medium text-ocean-800">
              Passo «clima» (ecrã inteiro, após contacto)
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
              Depois do clima — experiência, companhia, destino e orçamento
            </p>
            <Field
              label="Passo 5 — título"
              value={data.quiz.pedidoStep5Title}
              onChange={(v) => patch("quiz", "pedidoStep5Title", v)}
            />
            <Field
              label="Passo 5 — ajuda"
              value={data.quiz.pedidoStep5Hint}
              onChange={(v) => patch("quiz", "pedidoStep5Hint", v)}
              multiline
            />
            <Field
              label="Passo 6 — título"
              value={data.quiz.pedidoStep6Title}
              onChange={(v) => patch("quiz", "pedidoStep6Title", v)}
            />
            <Field
              label="Passo 6 — ajuda"
              value={data.quiz.pedidoStep6Hint}
              onChange={(v) => patch("quiz", "pedidoStep6Hint", v)}
              multiline
            />
            <Field
              label="Passo 7 — título"
              value={data.quiz.pedidoStep7Title}
              onChange={(v) => patch("quiz", "pedidoStep7Title", v)}
            />
            <Field
              label="Passo 7 — ajuda"
              value={data.quiz.pedidoStep7Hint}
              onChange={(v) => patch("quiz", "pedidoStep7Hint", v)}
              multiline
            />
            <Field
              label="Passo 7 — placeholder"
              value={data.quiz.pedidoStep7Placeholder}
              onChange={(v) => patch("quiz", "pedidoStep7Placeholder", v)}
            />
            <Field
              label="Passo 8 — título"
              value={data.quiz.pedidoStep8Title}
              onChange={(v) => patch("quiz", "pedidoStep8Title", v)}
            />
            <Field
              label="Passo 8 — ajuda"
              value={data.quiz.pedidoStep8Hint}
              onChange={(v) => patch("quiz", "pedidoStep8Hint", v)}
              multiline
            />
            <p className="pt-4 text-sm font-medium text-ocean-800">
              Prova social junto ao pedido de orçamento
            </p>
            <Field
              label="Linha pequena (acima do texto, ex. Confiança)"
              value={data.quiz.socialProofEyebrow}
              onChange={(v) => patch("quiz", "socialProofEyebrow", v)}
            />
            <Field
              label="Texto principal da prova social"
              value={data.quiz.socialProofStat}
              onChange={(v) => patch("quiz", "socialProofStat", v)}
              multiline
            />
            <Field
              label="Título acima dos ícones (ex. Falar com a Sílvia)"
              value={data.quiz.falarComSilviaLabel}
              onChange={(v) => patch("quiz", "falarComSilviaLabel", v)}
            />
            <Field
              label="URL WhatsApp ou mailto (opcional)"
              help="wa.me/… ou mailto:… — ou vazio para usar variáveis de ambiente."
              value={data.quiz.falarComSilviaUrl}
              onChange={(v) => patch("quiz", "falarComSilviaUrl", v)}
            />
            <Field
              label="URL perfil Instagram (mensagens)"
              help="Ou define NEXT_PUBLIC_CONTACT_INSTAGRAM_URL no servidor."
              value={data.quiz.falarComSilviaInstagramUrl}
              onChange={(v) => patch("quiz", "falarComSilviaInstagramUrl", v)}
            />
            <p className="pt-4 text-sm font-medium text-ocean-800">
              Qualificação (datas e voos) — passos finais do pedido completo
            </p>
            <p className="text-xs text-ocean-500">
              Após o orçamento, o cliente indica janela de datas, flexibilidade
              e se já tem voos/hotel. Os textos abaixo aparecem no formulário
              imersivo.
            </p>
            <Field
              label="Mensagem — pedido duplicado em aberto"
              help="Quando o mesmo email ou telemóvel já tem lead em «Nova lead», «Em contacto» ou «Proposta enviada»."
              value={data.quiz.duplicateOpenLeadMessage}
              onChange={(v) => patch("quiz", "duplicateOpenLeadMessage", v)}
              multiline
            />
            <Field
              label="Pergunta — janela de datas"
              value={data.quiz.janelaDatasQuestion}
              onChange={(v) => patch("quiz", "janelaDatasQuestion", v)}
            />
            <Field
              label="Ajuda — janela de datas"
              value={data.quiz.janelaDatasHint}
              onChange={(v) => patch("quiz", "janelaDatasHint", v)}
              multiline
            />
            <Field
              label="Placeholder — janela de datas"
              value={data.quiz.janelaDatasPlaceholder}
              onChange={(v) => patch("quiz", "janelaDatasPlaceholder", v)}
            />
            <Field
              label="Pergunta — flexibilidade de datas"
              value={data.quiz.flexDatasQuestion}
              onChange={(v) => patch("quiz", "flexDatasQuestion", v)}
            />
            <Field
              label="Ajuda — flexibilidade"
              value={data.quiz.flexDatasHint}
              onChange={(v) => patch("quiz", "flexDatasHint", v)}
              multiline
            />
            <Field
              label="Opção — datas fixas"
              value={data.quiz.flexDatasLabelFixas}
              onChange={(v) => patch("quiz", "flexDatasLabelFixas", v)}
            />
            <Field
              label="Opção — ± cerca de uma semana"
              value={data.quiz.flexDatasLabelMaisMenosUmaSemana}
              onChange={(v) => patch("quiz", "flexDatasLabelMaisMenosUmaSemana", v)}
            />
            <Field
              label="Opção — totalmente flexível"
              value={data.quiz.flexDatasLabelTotalmenteFlex}
              onChange={(v) => patch("quiz", "flexDatasLabelTotalmenteFlex", v)}
            />
            <Field
              label="Pergunta — voos e hotel"
              value={data.quiz.voosHotelQuestion}
              onChange={(v) => patch("quiz", "voosHotelQuestion", v)}
            />
            <Field
              label="Ajuda — voos e hotel"
              value={data.quiz.voosHotelHint}
              onChange={(v) => patch("quiz", "voosHotelHint", v)}
              multiline
            />
            <Field
              label="Opção — ainda não tenho voos nem hotel"
              value={data.quiz.voosHotelLabelNada}
              onChange={(v) => patch("quiz", "voosHotelLabelNada", v)}
            />
            <Field
              label="Opção — já tenho voos"
              value={data.quiz.voosHotelLabelSoVoos}
              onChange={(v) => patch("quiz", "voosHotelLabelSoVoos", v)}
            />
            <Field
              label="Opção — já tenho hotel"
              value={data.quiz.voosHotelLabelSoHotel}
              onChange={(v) => patch("quiz", "voosHotelLabelSoHotel", v)}
            />
            <Field
              label="Opção — já tenho voos e hotel"
              value={data.quiz.voosHotelLabelAmbos}
              onChange={(v) => patch("quiz", "voosHotelLabelAmbos", v)}
            />
            <p className="pt-4 text-sm font-medium text-ocean-800">
              Revisão final (último passo antes de enviar)
            </p>
            <Field
              label="Passo 12 — título"
              value={data.quiz.pedidoStep12Title}
              onChange={(v) => patch("quiz", "pedidoStep12Title", v)}
            />
            <Field
              label="Passo 12 — ajuda"
              value={data.quiz.pedidoStep12Hint}
              onChange={(v) => patch("quiz", "pedidoStep12Hint", v)}
              multiline
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
              label="Título «próximos passos» (24–48h)"
              value={data.quizSuccess.nextStepsTitle}
              onChange={(v) => patchQuizSuccess("nextStepsTitle", v)}
            />
            <Field
              label="Texto dos próximos passos"
              value={data.quizSuccess.nextStepsBody}
              onChange={(v) => patchQuizSuccess("nextStepsBody", v)}
              multiline
            />
            <Field
              label="Rótulo botão WhatsApp"
              help="Só aparece com NEXT_PUBLIC_CONTACT_WHATSAPP_URL no servidor."
              value={data.quizSuccess.whatsappCtaLabel}
              onChange={(v) => patchQuizSuccess("whatsappCtaLabel", v)}
            />
            <Field
              label="Rótulo botão Calendly"
              help="Só aparece com NEXT_PUBLIC_CALENDLY_URL no servidor."
              value={data.quizSuccess.calendlyCtaLabel}
              onChange={(v) => patchQuizSuccess("calendlyCtaLabel", v)}
            />
            <Field
              label="Rótulo botão criar conta"
              value={data.quizSuccess.criarContaCtaLabel}
              onChange={(v) => patchQuizSuccess("criarContaCtaLabel", v)}
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
            <ImageUrlField
              label="Imagem de fundo do cartão «Obrigado»"
              help="Opcional. Deve ser um link https para uma imagem; cria um fundo suave por cima da cor por omissão."
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
            <ImageUrlField
              label="Foto de perfil (link da imagem)"
              help="Opcional. Se ficar vazio, usa-se a fotografia definida nas configurações técnicas."
              value={data.consultora.portraitUrl}
              onChange={(v) => patch("consultora", "portraitUrl", v)}
            />
            <label className="block text-sm">
              <span className="font-medium text-ocean-800">
                Upload de nova foto da Sílvia
              </span>
              <span className="mt-0.5 block text-xs font-normal text-ocean-500">
                Faz upload direto para preencher automaticamente o campo da foto.
              </span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                disabled={portraitUploadBusy}
                className="mt-2 w-full rounded-xl border border-ocean-200 bg-white px-3 py-2 text-sm text-ocean-900 shadow-sm file:mr-3 file:rounded-lg file:border-0 file:bg-ocean-900 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white disabled:opacity-60"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  void uploadConsultoraPortrait(file);
                  e.target.value = "";
                }}
              />
              {portraitUploadHint ? (
                <span className="mt-2 block text-xs text-ocean-600">
                  {portraitUploadHint}
                </span>
              ) : null}
            </label>
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
                  <ImageUrlField
                    label="Foto do depoimento (link)"
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

        {tab === "process" ? (
          <fieldset className="space-y-4 rounded-2xl border border-ocean-100 bg-white p-6 shadow-sm">
            <legend className="px-1 text-lg font-semibold text-ocean-900">
              Como trabalhamos
            </legend>
            <p className="text-xs text-ocean-600">
              Lista numerada no site + duas caixas (primeiro contacto e prazos).
              Máximo 8 passos.
            </p>
            <Field
              label="Linha pequena"
              value={data.howWeWork.eyebrow}
              onChange={(v) => patchHowWeWork("eyebrow", v)}
            />
            <Field
              label="Título principal"
              help="Se ficar vazio, o bloco não aparece no site público."
              value={data.howWeWork.title}
              onChange={(v) => patchHowWeWork("title", v)}
            />
            <Field
              label="Subtítulo"
              value={data.howWeWork.subtitle}
              onChange={(v) => patchHowWeWork("subtitle", v)}
              multiline
            />
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={addHowWeWorkStep}
                disabled={data.howWeWork.steps.length >= 8}
                className="rounded-xl bg-ocean-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
              >
                Adicionar passo
              </button>
            </div>
            <ul className="space-y-6">
              {data.howWeWork.steps.map((step, index) => (
                <li
                  key={index}
                  className="rounded-xl border border-ocean-100 bg-ocean-50/40 p-4"
                >
                  <div className="mb-3 flex flex-wrap gap-2">
                    <span className="text-sm font-medium text-ocean-800">
                      Passo {index + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => moveHowWeWorkStep(index, -1)}
                      disabled={index === 0}
                      className="text-xs text-ocean-600 underline disabled:opacity-30"
                    >
                      Subir
                    </button>
                    <button
                      type="button"
                      onClick={() => moveHowWeWorkStep(index, 1)}
                      disabled={index === data.howWeWork.steps.length - 1}
                      className="text-xs text-ocean-600 underline disabled:opacity-30"
                    >
                      Descer
                    </button>
                    <button
                      type="button"
                      onClick={() => removeHowWeWorkStep(index)}
                      className="text-xs font-medium text-terracotta underline"
                    >
                      Remover
                    </button>
                  </div>
                  <Field
                    label="Título do passo"
                    value={step.title}
                    onChange={(v) => patchHowWeWorkStep(index, "title", v)}
                  />
                  <Field
                    label="Descrição"
                    value={step.body}
                    onChange={(v) => patchHowWeWorkStep(index, "body", v)}
                    multiline
                  />
                </li>
              ))}
            </ul>
            <p className="border-t border-ocean-100 pt-4 text-sm font-medium text-ocean-800">
              Caixas em destaque
            </p>
            <Field
              label="Título — primeiro contacto"
              value={data.howWeWork.firstContactTitle}
              onChange={(v) => patchHowWeWork("firstContactTitle", v)}
            />
            <Field
              label="Texto — primeiro contacto"
              value={data.howWeWork.firstContactBody}
              onChange={(v) => patchHowWeWork("firstContactBody", v)}
              multiline
            />
            <Field
              label="Título — prazos"
              value={data.howWeWork.timingsTitle}
              onChange={(v) => patchHowWeWork("timingsTitle", v)}
            />
            <Field
              label="Texto — prazos"
              value={data.howWeWork.timingsBody}
              onChange={(v) => patchHowWeWork("timingsBody", v)}
              multiline
            />
          </fieldset>
        ) : null}

        {tab === "registo" ? (
          <>
            <fieldset className="space-y-4 rounded-2xl border border-ocean-100 bg-white p-6 shadow-sm">
              <legend className="px-1 text-lg font-semibold text-ocean-900">
                Bloco na página inicial (conta de cliente)
              </legend>
              <p className="text-xs text-ocean-600">
                Usa os mesmos três benefícios abaixo. O bloco escuro só aparece
                se o título da home estiver preenchido.
              </p>
              <Field
                label="Linha pequena (eyebrow)"
                value={data.registerIncentive.homeEyebrow}
                onChange={(v) => patch("registerIncentive", "homeEyebrow", v)}
              />
              <Field
                label="Título na home"
                help="Vazio = secção não aparece na página inicial."
                value={data.registerIncentive.homeTitle}
                onChange={(v) => patch("registerIncentive", "homeTitle", v)}
              />
              <Field
                label="Texto na home"
                value={data.registerIncentive.homeBody}
                onChange={(v) => patch("registerIncentive", "homeBody", v)}
                multiline
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Botão — criar conta"
                  value={data.registerIncentive.homeCtaLabel}
                  onChange={(v) =>
                    patch("registerIncentive", "homeCtaLabel", v)
                  }
                />
                <Field
                  label="Link — já tenho conta"
                  value={data.registerIncentive.homeLoginLabel}
                  onChange={(v) =>
                    patch("registerIncentive", "homeLoginLabel", v)
                  }
                />
              </div>
            </fieldset>
            <fieldset className="space-y-4 rounded-2xl border border-ocean-100 bg-white p-6 shadow-sm">
              <legend className="px-1 text-lg font-semibold text-ocean-900">
                Página «Obrigado» (após pedido)
              </legend>
              <Field
                label="Parágrafo acima da caixa de benefícios"
                help="Explicar que criar conta mantém o diálogo e wishlist/roteiros."
                value={data.registerIncentive.thankYouAccountIntro}
                onChange={(v) =>
                  patch("registerIncentive", "thankYouAccountIntro", v)
                }
                multiline
              />
            </fieldset>
            <fieldset className="space-y-4 rounded-2xl border border-ocean-100 bg-white p-6 shadow-sm">
              <legend className="px-1 text-lg font-semibold text-ocean-900">
                Ecrã de registo — caixa de benefícios
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
          </>
        ) : null}

        {tab === "crm" ? (
          <fieldset className="space-y-4 rounded-2xl border border-ocean-100 bg-white p-6 shadow-sm">
            <legend className="px-1 text-lg font-semibold text-ocean-900">
              Quadro de leads (/crm)
            </legend>
            <p className="text-xs text-ocean-500">
              Estes valores não aparecem no site público — só nas bordas dos
              cartões no Kanban, na legenda do quadro e na mensagem junto à
              exportação CSV.
            </p>
            <Field
              label="Primeiro limiar (horas) — borda neutra"
              help="Até este número de horas desde o pedido (inclusive) o cartão mantém borda neutra; acima disso entra na zona de alerta amarela."
              value={data.crm.slaGreenMaxHours}
              onChange={(v) => patch("crm", "slaGreenMaxHours", v)}
            />
            <Field
              label="Segundo limiar (horas) — até ao amarelo"
              help="Acima do primeiro limiar e até este valor (inclusive) a borda é amarela; acima deste valor fica vermelha. Se este valor for menor ou igual ao primeiro, o sistema usa automaticamente primeiro + 24h como limiar do vermelho."
              value={data.crm.slaYellowMaxHours}
              onChange={(v) => patch("crm", "slaYellowMaxHours", v)}
            />
            <Field
              label="Texto de ajuda — exportação CSV"
              value={data.crm.csvExportHint}
              onChange={(v) => patch("crm", "csvExportHint", v)}
              multiline
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
              label="Código avançado do Instagram (opcional)"
              help="Só se alguém te tiver dado um «código para colar no site». Se preencheres isto, passa à frente da lista de links. Se não souberes o que é, deixa vazio e usa só os links."
              value={data.socialFeed.embedHtml}
              onChange={(v) => patch("socialFeed", "embedHtml", v)}
              multiline
            />
          </fieldset>
        ) : null}
    </>
  );
}
