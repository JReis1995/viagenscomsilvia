import { createPublicServerClient } from "@/lib/supabase/public-server";
import type { PostTipo, PublishedPost } from "@/types/post";

function isPostTipo(v: string): v is PostTipo {
  return v === "promocao" || v === "video" || v === "inspiracao";
}

export function normalizeVibeSlugs(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const x of raw) {
    if (typeof x !== "string") continue;
    const s = x.trim().toLowerCase();
    if (s.length > 0 && !out.includes(s)) out.push(s);
  }
  return out;
}

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

export async function fetchPublishedPosts(): Promise<PublishedPost[]> {
  try {
    const supabase = createPublicServerClient();
    const nowIso = new Date().toISOString();
    let { data, error } = await supabase
      .from("posts")
      .select(
        "id, tipo, slug, titulo, descricao, media_url, preco_desde, preco_base_eur, has_variants, link_cta, data_publicacao, data_fim_publicacao, ordem_site, feed_vibe_slugs, hover_line, pets_allowed, capacidade_min, capacidade_max, post_hotels(nome, regime, status)",
      )
      .eq("status", true)
      .lte("data_publicacao", nowIso)
      .or(`data_fim_publicacao.is.null,data_fim_publicacao.gt.${nowIso}`)
      .order("ordem_site", { ascending: true })
      .order("data_publicacao", { ascending: false });

    if (error && isMissingOptionalPostsColumns(error.message)) {
      const fallback = await supabase
        .from("posts")
        .select(
          "id, tipo, titulo, descricao, media_url, preco_desde, link_cta, data_publicacao, ordem_site, feed_vibe_slugs, hover_line",
        )
        .eq("status", true)
        .lte("data_publicacao", nowIso)
        .order("ordem_site", { ascending: true })
        .order("data_publicacao", { ascending: false });
      data = fallback.data as typeof data;
      error = fallback.error;
    }

    if (error) {
      console.error("[posts]", error.message);
      return [];
    }

    if (!data?.length) return [];

    return data
      .filter(
        (row): row is typeof row & { tipo: PostTipo } =>
          typeof row.tipo === "string" && isPostTipo(row.tipo),
      )
      .map((row) => {
        const hotelsRaw = Array.isArray(row.post_hotels) ? row.post_hotels : [];
        const hotels = hotelsRaw.filter((hotel) => hotel && hotel.status !== false);
        const hotelRegimes = Array.from(
          new Set(
            hotels
              .map((hotel) =>
                typeof hotel.regime === "string" ? hotel.regime.trim() : "",
              )
              .filter((regime) => regime.length > 0),
          ),
        );
        const hotelNames = Array.from(
          new Set(
            hotels
              .map((hotel) =>
                typeof hotel.nome === "string" ? hotel.nome.trim() : "",
              )
              .filter((name) => name.length > 0),
          ),
        );

        return {
          id: row.id,
          tipo: row.tipo,
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
          feed_vibe_slugs: normalizeVibeSlugs(row.feed_vibe_slugs),
          hover_line:
            typeof row.hover_line === "string" && row.hover_line.trim()
              ? row.hover_line.trim()
              : null,
          pets_allowed:
            typeof row.pets_allowed === "boolean" ? row.pets_allowed : null,
          capacidade_min:
            typeof row.capacidade_min === "number" &&
            Number.isFinite(row.capacidade_min)
              ? row.capacidade_min
              : null,
          capacidade_max:
            typeof row.capacidade_max === "number" &&
            Number.isFinite(row.capacidade_max)
              ? row.capacidade_max
              : null,
          hotel_regimes: hotelRegimes,
          hotel_names: hotelNames,
        };
      });
  } catch (e) {
    console.error("[posts]", e);
    return [];
  }
}
