import type { PublishedPost } from "@/types/post";

/**
 * Usa rota nova por slug quando disponível.
 * Sem slug, usa fallback por ID na rota nova (`/publicacoes/id/[postId]`),
 * evitando regressão para o fluxo antigo em `/pedido`.
 */
export function buildPublicacaoHrefFromPost(
  post: PublishedPost,
  currentSearch?: URLSearchParams | string,
): string {
  const params =
    typeof currentSearch === "string"
      ? new URLSearchParams(currentSearch)
      : currentSearch
        ? new URLSearchParams(currentSearch.toString())
        : new URLSearchParams();

  params.set("pedido_post", post.id);
  params.set("pedido_destino", post.titulo.trim());
  if (post.descricao?.trim()) params.set("pedido_contexto", post.descricao.trim());

  if (!post.slug?.trim()) {
    return `/publicacoes/id/${encodeURIComponent(post.id)}?${params.toString()}`;
  }

  return `/publicacoes/${encodeURIComponent(post.slug)}?${params.toString()}`;
}
