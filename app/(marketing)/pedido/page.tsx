import { PedidoDetalheExperience } from "@/components/marketing/pedido-detalhe-experience";
import { parsePedidoPrefillFromSearchParams } from "@/lib/marketing/pedido-orcamento";
import { fetchPublishedPosts } from "@/lib/posts/fetch-published";
import { fetchSiteContent } from "@/lib/site/fetch-site-content";
import { permanentRedirect } from "next/navigation";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstParam(v: string | string[] | undefined): string {
  if (typeof v === "string") return v.trim();
  if (Array.isArray(v)) return (v[0] ?? "").trim();
  return "";
}

function buildSearchFromRecord(sp: Record<string, string | string[] | undefined>): string {
  const params = new URLSearchParams();
  for (const [key, raw] of Object.entries(sp)) {
    if (typeof raw === "string") {
      if (raw.trim()) params.set(key, raw.trim());
      continue;
    }
    if (Array.isArray(raw) && raw.length > 0) {
      for (const item of raw) {
        const value = item.trim();
        if (value) params.append(key, value);
      }
    }
  }
  return params.toString();
}

export default async function PedidoPage({ searchParams }: Props) {
  const sp = await searchParams;
  const prefill = parsePedidoPrefillFromSearchParams(sp);
  const [posts, site] = await Promise.all([fetchPublishedPosts(), fetchSiteContent()]);
  const selectedPostId = firstParam(sp.pedido_post);
  const selectedById =
    selectedPostId.length > 0 ? posts.find((p) => p.id === selectedPostId) ?? null : null;
  if (selectedById?.slug) {
    const qs = buildSearchFromRecord(sp);
    permanentRedirect(`/publicacoes/${encodeURIComponent(selectedById.slug)}${qs ? `?${qs}` : ""}`);
  }
  if (selectedById?.has_variants) {
    const qs = buildSearchFromRecord(sp);
    permanentRedirect(
      `/publicacoes/id/${encodeURIComponent(selectedById.id)}${qs ? `?${qs}` : ""}`,
    );
  }

  const selectedPost =
    selectedById ??
    posts.find((p) => p.titulo.toLowerCase().includes(firstParam(sp.pedido_destino).toLowerCase())) ??
    null;

  return (
    <PedidoDetalheExperience
      selectedPost={selectedPost}
      quizCopy={site.quiz}
      prefill={prefill}
    />
  );
}
