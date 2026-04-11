import { normalizeVibeSlugs } from "@/lib/posts/fetch-published";
import { createClient } from "@/lib/supabase/server";
import type { PostTipo, PublishedPost } from "@/types/post";

function isPostTipo(v: string): v is PostTipo {
  return v === "promocao" || v === "video" || v === "inspiracao";
}

/** Publicações marcadas como exclusivas para utilizadores com sessão iniciada. */
export async function fetchMemberSecretPosts(): Promise<PublishedPost[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("posts")
    .select(
      "id, tipo, titulo, descricao, media_url, preco_desde, link_cta, data_publicacao, ordem_site, membros_apenas, feed_vibe_slugs, hover_line",
    )
    .eq("membros_apenas", true)
    .eq("status", true)
    .lte("data_publicacao", new Date().toISOString())
    .order("ordem_site", { ascending: true })
    .order("data_publicacao", { ascending: false });

  if (error) {
    console.error("[posts membros]", error.message);
    return [];
  }

  if (!data?.length) return [];

  return data
    .filter(
      (row): row is typeof row & { tipo: PostTipo } =>
        typeof row.tipo === "string" && isPostTipo(row.tipo),
    )
    .map((row) => ({
      id: row.id,
      tipo: row.tipo,
      titulo: row.titulo,
      descricao: row.descricao,
      media_url: row.media_url,
      preco_desde: row.preco_desde,
      link_cta: row.link_cta,
      data_publicacao: row.data_publicacao,
      ordem_site:
        typeof row.ordem_site === "number" && !Number.isNaN(row.ordem_site)
          ? row.ordem_site
          : 0,
      feed_vibe_slugs: normalizeVibeSlugs(row.feed_vibe_slugs),
      hover_line:
        typeof row.hover_line === "string" && row.hover_line.trim()
          ? row.hover_line.trim()
          : null,
    }));
}
