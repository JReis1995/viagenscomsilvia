import { createPublicServerClient } from "@/lib/supabase/public-server";
import type { MapPinPost } from "@/types/post";

/** Pins públicos com coordenadas (feed normal, não exclusivo de membros). */
export async function fetchMapPosts(): Promise<MapPinPost[]> {
  const supabase = createPublicServerClient();
  const { data, error } = await supabase
    .from("posts")
    .select(
      "id, tipo, titulo, descricao, media_url, preco_desde, link_cta, data_publicacao, ordem_site, latitude, longitude, slug_destino",
    )
    .eq("status", true)
    .lte("data_publicacao", new Date().toISOString())
    .not("latitude", "is", null)
    .not("longitude", "is", null);

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
      latitude: row.latitude as number,
      longitude: row.longitude as number,
      slug_destino: row.slug_destino,
    }));
}
