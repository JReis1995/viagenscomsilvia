import { createPublicServerClient } from "@/lib/supabase/public-server";
import type { PostTipo, PublishedPost } from "@/types/post";

function isPostTipo(v: string): v is PostTipo {
  return v === "promocao" || v === "video" || v === "inspiracao";
}

export async function fetchPublishedPosts(): Promise<PublishedPost[]> {
  try {
    const supabase = createPublicServerClient();
    const { data, error } = await supabase
      .from("posts")
      .select(
        "id, tipo, titulo, descricao, media_url, preco_desde, link_cta, data_publicacao, ordem_site",
      )
      .order("ordem_site", { ascending: true })
      .order("data_publicacao", { ascending: false });

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
      }));
  } catch (e) {
    console.error("[posts]", e);
    return [];
  }
}
