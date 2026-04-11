"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

import {
  createCrmPostAction,
  deleteCrmPostAction,
  updateCrmPostAction,
  type CrmPostInput,
} from "@/app/(dashboard)/crm/actions";
import { PostCardPreview } from "@/components/crm/post-card-preview";
import {
  getYoutubeThumbnailUrl,
  getYoutubeVideoId,
} from "@/lib/marketing/media";

export type CrmPostRow = {
  id: string;
  tipo: string;
  titulo: string;
  descricao: string | null;
  media_url: string;
  preco_desde: string | null;
  link_cta: string | null;
  status: boolean;
  data_publicacao: string;
  ordem_site: number | null;
  membros_apenas?: boolean | null;
  slug_destino?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  feed_vibe_slugs?: string[] | null;
  hover_line?: string | null;
};

type Props = {
  initialPosts: CrmPostRow[];
};

/** Estado do formulário: inclui CSV editável para slugs do filtro do feed. */
type PostFormState = CrmPostInput & { vibe_slugs_csv: string };

function parseFeedVibeSlugCsv(raw: string): string[] {
  const out: string[] = [];
  for (const part of raw.split(/[,;\n]+/)) {
    const s = part
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
    if (s.length > 0 && !out.includes(s)) out.push(s);
  }
  return out.slice(0, 12);
}

function localNowForInput(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function emptyForm(): PostFormState {
  return {
    tipo: "inspiracao",
    titulo: "",
    descricao: "",
    media_url: "",
    preco_desde: "",
    link_cta: "",
    status: true,
    data_publicacao: localNowForInput(),
    ordem_site: 0,
    membros_apenas: false,
    slug_destino: "",
    latitude: null,
    longitude: null,
    feed_vibe_slugs: [],
    hover_line: "",
    vibe_slugs_csv: "",
  };
}

function toCrmPayload(form: PostFormState): CrmPostInput {
  return {
    tipo: form.tipo,
    titulo: form.titulo,
    descricao: form.descricao,
    media_url: form.media_url,
    preco_desde: form.preco_desde,
    link_cta: form.link_cta,
    status: form.status,
    data_publicacao: form.data_publicacao,
    ordem_site: form.ordem_site,
    membros_apenas: form.membros_apenas,
    slug_destino: form.slug_destino,
    latitude: form.latitude,
    longitude: form.longitude,
    feed_vibe_slugs: parseFeedVibeSlugCsv(form.vibe_slugs_csv),
    hover_line: form.hover_line?.trim() || null,
  };
}

function toDatetimeLocalValue(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return localNowForInput();
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return localNowForInput();
  }
}

function thumbForRow(p: CrmPostRow): string {
  const u = p.media_url?.trim() ?? "";
  if (!u) return "";
  if (p.tipo === "video") {
    const id = getYoutubeVideoId(u);
    if (id) return getYoutubeThumbnailUrl(id);
  }
  return u;
}

export function CrmPostsManager({ initialPosts }: Props) {
  const router = useRouter();
  const [posts, setPosts] = useState(initialPosts);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PostFormState>(() => emptyForm());
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setPosts(initialPosts);
  }, [initialPosts]);

  function loadForEdit(p: CrmPostRow) {
    setEditingId(p.id);
    setForm({
      tipo: p.tipo as CrmPostInput["tipo"],
      titulo: p.titulo,
      descricao: p.descricao ?? "",
      media_url: p.media_url,
      preco_desde: p.preco_desde ?? "",
      link_cta: p.link_cta ?? "",
      status: p.status,
      data_publicacao: toDatetimeLocalValue(p.data_publicacao),
      ordem_site: p.ordem_site ?? 0,
      membros_apenas: p.membros_apenas === true,
      slug_destino: p.slug_destino ?? "",
      latitude: p.latitude ?? null,
      longitude: p.longitude ?? null,
      feed_vibe_slugs: Array.isArray(p.feed_vibe_slugs) ? p.feed_vibe_slugs : [],
      hover_line: p.hover_line ?? "",
      vibe_slugs_csv: (Array.isArray(p.feed_vibe_slugs) ? p.feed_vibe_slugs : []).join(
        ", ",
      ),
    });
    setMessage(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetNew() {
    setEditingId(null);
    setForm(emptyForm());
    setMessage(null);
  }

  function submit() {
    setMessage(null);
    const payload: CrmPostInput = {
      ...toCrmPayload(form),
      data_publicacao: new Date(form.data_publicacao).toISOString(),
    };

    startTransition(() => {
      void (async () => {
        if (editingId) {
          const res = await updateCrmPostAction(editingId, payload);
          if (res.ok) {
            setMessage("Alterações guardadas.");
            setPosts((prev) =>
              prev.map((p) =>
                p.id === editingId
                  ? {
                      ...p,
                      ...payload,
                      descricao: payload.descricao || null,
                      preco_desde: payload.preco_desde || null,
                      link_cta: payload.link_cta || null,
                      data_publicacao: payload.data_publicacao,
                      membros_apenas: payload.membros_apenas,
                      slug_destino: payload.slug_destino || null,
                      latitude: payload.latitude ?? null,
                      longitude: payload.longitude ?? null,
                      feed_vibe_slugs: payload.feed_vibe_slugs,
                      hover_line: payload.hover_line || null,
                    }
                  : p,
              ),
            );
          } else {
            setMessage(`Erro: ${res.error}`);
          }
        } else {
          const res = await createCrmPostAction(payload);
          if (res.ok) {
            setMessage("Publicação criada.");
            resetNew();
            router.refresh();
          } else {
            setMessage(`Erro: ${res.error}`);
          }
        }
      })();
    });
  }

  function remove(id: string) {
    if (!window.confirm("Eliminar esta publicação do site?")) return;
    setMessage(null);
    startTransition(() => {
      void (async () => {
        const res = await deleteCrmPostAction(id);
        if (res.ok) {
          setPosts((prev) => prev.filter((p) => p.id !== id));
          if (editingId === id) resetNew();
        } else {
          setMessage(`Erro: ${res.error}`);
        }
      })();
    });
  }

  const inputCls =
    "mt-1 w-full rounded-xl border border-ocean-200 px-3 py-2 text-sm focus:border-ocean-400 focus:outline-none focus:ring-2 focus:ring-ocean-100";

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <a
          href="/#inspiracoes"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-xl border border-ocean-200 bg-white px-4 py-2.5 text-sm font-medium text-ocean-800 shadow-sm transition hover:bg-ocean-50"
        >
          Ver secção de publicações no site
          <span aria-hidden>↗</span>
        </a>
        <Link
          href="/crm/site"
          className="text-sm font-medium text-ocean-600 underline-offset-2 hover:text-ocean-900 hover:underline"
        >
          Editar textos da página inicial
        </Link>
      </div>

      <div className="rounded-2xl border border-ocean-100 bg-gradient-to-br from-ocean-50/80 to-white p-5">
        <p className="text-sm font-medium text-ocean-900">Resumo rápido</p>
        <ul className="mt-2 space-y-1.5 text-sm text-ocean-700">
          <li>
            <span className="font-semibold text-ocean-800">Ordem:</span> número
            mais baixo aparece primeiro no site.
          </li>
          <li>
            <span className="font-semibold text-ocean-800">Data:</span> só
            aparece depois desta data e hora (e com «visível» ligado).
          </li>
          <li>
            <span className="font-semibold text-ocean-800">Imagem:</span> cola
            o link completo (Supabase Storage ou imagem pública).
          </li>
        </ul>
      </div>

      <div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-serif text-lg text-ocean-900 md:text-xl">
            As tuas publicações
          </h2>
          <button
            type="button"
            onClick={() => resetNew()}
            className="rounded-2xl bg-ocean-900 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-ocean-800"
          >
            + Nova publicação
          </button>
        </div>
        {posts.length === 0 ? (
          <p className="mt-4 rounded-xl border border-dashed border-ocean-200 bg-white px-6 py-10 text-center text-ocean-600">
            Ainda não tens cartões. Clica em «Nova publicação» e preenche o
            formulário abaixo.
          </p>
        ) : (
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((p) => {
              const thumb = thumbForRow(p);
              const active = editingId === p.id;
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => loadForEdit(p)}
                    className={`flex w-full overflow-hidden rounded-2xl border text-left shadow-sm transition ${
                      active
                        ? "border-ocean-500 ring-2 ring-ocean-200"
                        : "border-ocean-100 hover:border-ocean-300 hover:shadow-md"
                    }`}
                  >
                    <div className="relative h-24 w-24 shrink-0 bg-ocean-100">
                      {thumb ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={thumb}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-[10px] text-ocean-400">
                          sem img
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1 p-3">
                      <p className="line-clamp-2 font-medium text-ocean-900">
                        {p.titulo}
                      </p>
                      <p className="mt-1 text-xs text-ocean-500">
                        {p.tipo} · pos. {p.ordem_site ?? 0} ·{" "}
                        {p.status ? "visível" : "rascunho"}
                        {p.membros_apenas ? " · membros" : ""}
                        {p.latitude != null && p.longitude != null
                          ? " · mapa"
                          : ""}
                      </p>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,360px)] lg:items-start">
        <div className="space-y-6 rounded-2xl border border-ocean-100 bg-white p-6 shadow-sm">
          <div>
            <h2 className="font-serif text-xl text-ocean-900">
              {editingId ? "Editar esta publicação" : "Criar publicação"}
            </h2>
            {editingId ? (
              <button
                type="button"
                onClick={() => resetNew()}
                className="mt-2 text-sm text-ocean-600 underline-offset-2 hover:underline"
              >
                Cancelar edição e criar nova
              </button>
            ) : null}
          </div>

          {message ? (
            <p
              className={`rounded-xl border px-3 py-2 text-sm ${
                message.startsWith("Erro")
                  ? "border-terracotta/40 bg-terracotta/10 text-ocean-900"
                  : "border-emerald-200 bg-emerald-50 text-emerald-900"
              }`}
            >
              {message}
            </p>
          ) : null}

          <div className="space-y-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-ocean-400">
                Passo 1
              </p>
              <p className="text-sm font-medium text-ocean-800">
                Tipo e título
              </p>
              <label className="mt-3 block text-sm">
                <span className="text-ocean-700">Tipo de cartão</span>
                <select
                  className={inputCls}
                  value={form.tipo}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      tipo: e.target.value as CrmPostInput["tipo"],
                    }))
                  }
                >
                  <option value="promocao">Promoção (destaque laranja)</option>
                  <option value="video">Vídeo (podes usar link YouTube)</option>
                  <option value="inspiracao">Inspiração</option>
                </select>
              </label>
              <label className="mt-3 block text-sm">
                <span className="text-ocean-700">Título</span>
                <input
                  className={inputCls}
                  value={form.titulo}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, titulo: e.target.value }))
                  }
                  placeholder="Ex.: Maldivas em privado"
                />
              </label>
              <label className="mt-3 block text-sm">
                <span className="text-ocean-700">Descrição curta</span>
                <textarea
                  className={`${inputCls} min-h-[80px]`}
                  value={form.descricao ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, descricao: e.target.value }))
                  }
                  placeholder="Aparece por baixo do título no cartão"
                />
              </label>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-ocean-400">
                Passo 2
              </p>
              <p className="text-sm font-medium text-ocean-800">
                Imagem e preço
              </p>
              <label className="mt-3 block text-sm">
                <span className="text-ocean-700">URL da imagem</span>
                <span className="mt-0.5 block text-xs text-ocean-500">
                  Clica com o botão direito numa imagem no Storage → copiar URL
                  pública
                </span>
                <input
                  className={inputCls}
                  value={form.media_url}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, media_url: e.target.value }))
                  }
                  placeholder="https://..."
                />
              </label>
              <label className="mt-3 block text-sm">
                <span className="text-ocean-700">
                  Preço «desde» (só promoções)
                </span>
                <input
                  className={inputCls}
                  value={form.preco_desde ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, preco_desde: e.target.value }))
                  }
                  placeholder="Opcional"
                />
              </label>
              <label className="mt-3 block text-sm">
                <span className="text-ocean-700">Para onde leva o clique</span>
                <input
                  className={inputCls}
                  value={form.link_cta ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, link_cta: e.target.value }))
                  }
                  placeholder="Opcional — ver nota abaixo"
                />
                <p className="mt-1.5 text-xs leading-relaxed text-ocean-500">
                  Se deixares vazio, o clique abre o pedido de orçamento no site
                  com o título, a descrição e o preço «desde» (em promoções)
                  sugeridos no campo do destino. Podes também colar um link
                  externo (hotel, página de destino, etc.).
                </p>
              </label>
              <label className="mt-3 block text-sm">
                <span className="text-ocean-700">Filtro por vibe (slugs)</span>
                <span className="mt-0.5 block text-xs text-ocean-500">
                  Os mesmos slugs definidos no editor do site (secção do feed),
                  separados por vírgula — ex.: romance, retiro, adrenalina
                </span>
                <input
                  className={inputCls}
                  value={form.vibe_slugs_csv}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, vibe_slugs_csv: e.target.value }))
                  }
                  placeholder="romance, retiro"
                />
              </label>
              <label className="mt-3 block text-sm">
                <span className="text-ocean-700">Frase no hover (opcional)</span>
                <span className="mt-0.5 block text-xs text-ocean-500">
                  Uma linha poética que aparece quando o rato está sobre a
                  imagem no site
                </span>
                <textarea
                  className={`${inputCls} min-h-[72px]`}
                  value={form.hover_line ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, hover_line: e.target.value }))
                  }
                  placeholder="Ex.: Acorda com o som do Índico na tua varanda…"
                />
              </label>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-ocean-400">
                Passo 3
              </p>
              <p className="text-sm font-medium text-ocean-800">
                Ordem, data e visibilidade
              </p>
              <label className="mt-3 block text-sm">
                <span className="text-ocean-700">
                  Posição no site (0 = primeiro)
                </span>
                <input
                  type="number"
                  className={inputCls}
                  value={form.ordem_site}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      ordem_site: Number(e.target.value) || 0,
                    }))
                  }
                />
              </label>
              <label className="mt-3 block text-sm">
                <span className="text-ocean-700">Quando publicar</span>
                <input
                  type="datetime-local"
                  className={inputCls}
                  value={form.data_publicacao}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, data_publicacao: e.target.value }))
                  }
                />
              </label>
              <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl border border-ocean-100 bg-ocean-50/50 p-4 text-sm">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 rounded border-ocean-300"
                  checked={form.status}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, status: e.target.checked }))
                  }
                />
                <span>
                  <span className="font-medium text-ocean-900">
                    Visível no site
                  </span>
                  <span className="mt-1 block text-ocean-600">
                    Desliga para guardar como rascunho (ninguém vê no site
                    público).
                  </span>
                </span>
              </label>
              <label className="mt-3 flex cursor-pointer items-start gap-3 rounded-xl border border-ocean-200 bg-white p-4 text-sm">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 rounded border-ocean-300"
                  checked={form.membros_apenas}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      membros_apenas: e.target.checked,
                    }))
                  }
                />
                <span>
                  <span className="font-medium text-ocean-900">
                    Só para quem tem conta
                  </span>
                  <span className="mt-1 block text-xs text-ocean-600">
                    Não aparece no site público — só em «Roteiros secretos» na
                    área do cliente.
                  </span>
                </span>
              </label>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-ocean-400">
                Mapa (opcional)
              </p>
              <p className="text-sm font-medium text-ocean-800">
                Coordenadas e slug do destino
              </p>
              <label className="mt-3 block text-sm">
                <span className="text-ocean-700">Slug (ex.: maldivas)</span>
                <input
                  className={inputCls}
                  value={form.slug_destino ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, slug_destino: e.target.value }))
                  }
                  placeholder="Para cruzar com propostas no CRM"
                />
              </label>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className="block text-sm">
                  <span className="text-ocean-700">Latitude</span>
                  <input
                    className={inputCls}
                    value={form.latitude ?? ""}
                    onChange={(e) => {
                      const v = e.target.value.trim();
                      setForm((f) => ({
                        ...f,
                        latitude: v === "" ? null : Number(v),
                      }));
                    }}
                    placeholder="ex.: 3.2028"
                  />
                </label>
                <label className="block text-sm">
                  <span className="text-ocean-700">Longitude</span>
                  <input
                    className={inputCls}
                    value={form.longitude ?? ""}
                    onChange={(e) => {
                      const v = e.target.value.trim();
                      setForm((f) => ({
                        ...f,
                        longitude: v === "" ? null : Number(v),
                      }));
                    }}
                    placeholder="ex.: 73.2207"
                  />
                </label>
              </div>
              <p className="mt-2 text-xs text-ocean-500">
                Com latitude e longitude preenchidas, o pin aparece em{" "}
                <strong className="text-ocean-800">/mapa</strong> no site.
              </p>
            </div>

            <div className="flex flex-col gap-3 border-t border-ocean-100 pt-6 sm:flex-row sm:flex-wrap">
              <button
                type="button"
                disabled={pending}
                onClick={() => submit()}
                className="flex-1 rounded-2xl bg-ocean-900 py-3 text-sm font-semibold text-white shadow-md hover:bg-ocean-800 disabled:opacity-60"
              >
                {pending
                  ? "A guardar…"
                  : editingId
                    ? "Guardar alterações"
                    : "Criar publicação"}
              </button>
              {editingId ? (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => remove(editingId)}
                  className="rounded-2xl border border-terracotta/50 px-5 py-3 text-sm font-semibold text-terracotta hover:bg-terracotta/10 disabled:opacity-50"
                >
                  Apagar
                </button>
              ) : null}
            </div>
          </div>
        </div>

        <div className="lg:sticky lg:top-24">
          <p className="mb-3 text-center text-sm font-medium text-ocean-700">
            Pré-visualização ao vivo
          </p>
          <p className="mb-4 text-center text-xs text-ocean-500">
            Actualiza enquanto escreves — é assim que o cartão vai parecer no
            site.
          </p>
          <PostCardPreview form={form} />
        </div>
      </div>
    </div>
  );
}
