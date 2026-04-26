import { normalizeVibeSlugs } from "@/lib/posts/fetch-published";
import { createPublicServerClient } from "@/lib/supabase/public-server";
import type { MapPinPost } from "@/types/post";

function isMissingOptionalPostsColumns(message: string | undefined): boolean {
  const m = (message ?? "").toLowerCase();
  return (
    m.includes("column posts.slug does not exist") ||
    m.includes("column posts.preco_base_eur does not exist") ||
    m.includes("column posts.has_variants does not exist") ||
    m.includes("column posts.pets_allowed does not exist") ||
    m.includes("column posts.capacidade_min does not exist") ||
    m.includes("column posts.capacidade_max does not exist") ||
    m.includes("column posts.data_fim_publicacao does not exist")
  );
}

/** Pins públicos com coordenadas (feed normal, não exclusivo de membros). */
export async function fetchMapPosts(): Promise<MapPinPost[]> {
  const supabase = createPublicServerClient();
  const nowIso = new Date().toISOString();
  let { data, error } = await supabase
    .from("posts")
    .select(
      "id, tipo, slug, titulo, descricao, media_url, preco_desde, preco_base_eur, has_variants, link_cta, data_publicacao, data_fim_publicacao, ordem_site, latitude, longitude, slug_destino, feed_vibe_slugs, hover_line, pets_allowed, capacidade_min, capacidade_max",
    )
    .eq("status", true)
    .lte("data_publicacao", nowIso)
    .or(`data_fim_publicacao.is.null,data_fim_publicacao.gt.${nowIso}`)
    .not("latitude", "is", null)
    .not("longitude", "is", null);

  if (error && isMissingOptionalPostsColumns(error.message)) {
    const fallback = await supabase
      .from("posts")
      .select(
        "id, tipo, titulo, descricao, media_url, preco_desde, link_cta, data_publicacao, ordem_site, latitude, longitude, slug_destino, feed_vibe_slugs, hover_line",
      )
      .eq("status", true)
      .lte("data_publicacao", nowIso)
      .not("latitude", "is", null)
      .not("longitude", "is", null);
    data = fallback.data as typeof data;
    error = fallback.error;
  }

  if (error) {
    console.error("[map posts]", error.message);
    return [];
  }

  if (!data?.length) return [];

  return data
    .filter(
      (row) =>
        typeof row.latitude === "number" &&
        typeof row.longitude === "number" &&
        !Number.isNaN(row.latitude) &&
        !Number.isNaN(row.longitude) &&
        (row.tipo === "promocao" ||
          row.tipo === "video" ||
          row.tipo === "inspiracao"),
    )
    .map((row) => ({
      id: row.id,
      tipo: row.tipo as MapPinPost["tipo"],
      slug: typeof row.slug === "string" && row.slug.trim() ? row.slug : null,
      titulo: row.titulo,
      descricao: row.descricao,
      media_url: row.media_url,
      preco_desde: row.preco_desde,
      preco_base_eur:
        typeof row.preco_base_eur === "number" && Number.isFinite(row.preco_base_eur)
          ? row.preco_base_eur
          : typeof row.preco_base_eur === "string" && row.preco_base_eur.trim()
            ? Number.isFinite(Number(row.preco_base_eur))
              ? Number(row.preco_base_eur)
              : null
            : null,
      has_variants: row.has_variants === true,
      link_cta: row.link_cta,
      data_publicacao: row.data_publicacao,
      data_fim_publicacao:
        typeof row.data_fim_publicacao === "string" &&
        row.data_fim_publicacao.trim()
          ? row.data_fim_publicacao
          : null,
      ordem_site:
        typeof row.ordem_site === "number" && !Number.isNaN(row.ordem_site)
          ? row.ordem_site
          : 0,
      latitude: row.latitude as number,
      longitude: row.longitude as number,
      slug_destino: row.slug_destino,
      feed_vibe_slugs: normalizeVibeSlugs(row.feed_vibe_slugs),
      hover_line:
        typeof row.hover_line === "string" && row.hover_line.trim()
          ? row.hover_line.trim()
          : null,
      pets_allowed:
        typeof row.pets_allowed === "boolean" ? row.pets_allowed : null,
      capacidade_min:
        typeof row.capacidade_min === "number" && Number.isFinite(row.capacidade_min)
          ? row.capacidade_min
          : null,
      capacidade_max:
        typeof row.capacidade_max === "number" && Number.isFinite(row.capacidade_max)
          ? row.capacidade_max
          : null,
      hotel_regimes: [],
      hotel_names: [],
    }));
}
