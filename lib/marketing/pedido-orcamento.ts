import type { PublishedPost } from "@/types/post";

/** Limite do campo `destino_sonho` no formulário / API. */
const FORM_DESTINO_MAX = 300;

const DESTINO_QUERY_MAX = 220;
const CONTEXTO_QUERY_MAX = 200;

function firstParam(v: string | string[] | undefined): string | undefined {
  if (v === undefined) return undefined;
  const s = Array.isArray(v) ? v[0] : v;
  const t = typeof s === "string" ? s.trim() : "";
  return t.length > 0 ? t : undefined;
}

function clip(s: string, max: number): string {
  const t = s.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, Math.max(0, max - 1))}…`;
}

export type PedidoOrcamentoPrefill = {
  /** Texto inicial do campo destino / ideia (respeita o máx. do formulário). */
  destinoSonho: string;
  /** Título ou primeira linha (para mensagem de boas-vindas no passo 0). */
  temaDestaque?: string;
  postId?: string;
};

/**
 * Link por omissão ao clicar num cartão do feed: abre o formulário com título,
 * descrição e (em promoções) preço já sugeridos no campo de destino.
 */
export function buildPedidoOrcamentoHrefFromPost(post: PublishedPost): string {
  const destino = clip(post.titulo, DESTINO_QUERY_MAX);
  const partes: string[] = [];
  if (post.descricao?.trim()) partes.push(post.descricao.trim());
  if (post.tipo === "promocao" && post.preco_desde?.trim()) {
    partes.push(`Valor indicativo: ${post.preco_desde.trim()}`);
  }
  const contexto = clip(partes.join(" · "), CONTEXTO_QUERY_MAX);
  const params = new URLSearchParams();
  params.set("pedido_destino", destino);
  if (contexto) params.set("pedido_contexto", contexto);
  params.set("pedido_post", post.id);
  return `/?${params.toString()}#pedido-orcamento`;
}

type SearchParamsLike = Record<string, string | string[] | undefined>;

export function parsePedidoPrefillFromSearchParams(
  sp: SearchParamsLike,
): PedidoOrcamentoPrefill | null {
  const destino = firstParam(sp.pedido_destino);
  const contexto = firstParam(sp.pedido_contexto);
  const postId = firstParam(sp.pedido_post);
  if (!destino && !contexto && !postId) return null;

  const lines: string[] = [];
  if (destino) lines.push(destino);
  if (contexto) lines.push(contexto);
  let destinoSonho = lines.join("\n\n");
  if (destinoSonho.length > FORM_DESTINO_MAX) {
    destinoSonho = clip(destinoSonho, FORM_DESTINO_MAX);
  }
  if (!destinoSonho.trim()) return null;
  return {
    destinoSonho,
    temaDestaque: destino,
    postId,
  };
}
