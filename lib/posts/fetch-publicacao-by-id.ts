import { normalizeVibeSlugs } from "@/lib/posts/fetch-published";
import type {
  PostExtraTipo,
  PostFlightClass,
  PostHotelMediaKind,
  PublicacaoComVariantes,
} from "@/lib/posts/post-variants-types";
import { createPublicServerClient } from "@/lib/supabase/public-server";
import type { PostTipo } from "@/types/post";

function isPostTipo(v: string): v is PostTipo {
  return v === "promocao" || v === "video" || v === "inspiracao";
}

function parseNullableNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function isMissingPhase3Tables(message: string | undefined): boolean {
  const m = (message ?? "").toLowerCase();
  return (
    m.includes("post_hotel_seasons") ||
    m.includes("post_hotel_availability") ||
    m.includes("post_hotel_room_options") ||
    m.includes("column post_extras.pets_allowed does not exist") ||
    m.includes("column post_flight_options.pets_allowed does not exist")
  );
}

function isMissingDataFimPublicacaoColumn(message: string | undefined): boolean {
  const m = (message ?? "").toLowerCase();
  return m.includes("column posts.data_fim_publicacao does not exist");
}

export async function fetchPublicacaoById(
  postId: string,
): Promise<PublicacaoComVariantes | null> {
  const id = postId.trim();
  if (!id) return null;
  const nowIso = new Date().toISOString();

  const supabase = createPublicServerClient();
  const selectWithDataFimPublicacao = `
      id,
      tipo,
      slug,
      titulo,
      descricao,
      media_url,
      preco_desde,
      preco_base_eur,
      has_variants,
      link_cta,
      data_publicacao,
      data_fim_publicacao,
      ordem_site,
      feed_vibe_slugs,
      hover_line,
      pets_allowed,
      capacidade_min,
      capacidade_max,
      post_hotels (
        id,
        ordem,
        nome,
        descricao,
        regime,
        condicoes,
        preco_delta_eur,
        preco_label,
        capacidade_min,
        capacidade_max,
        pets_allowed,
        status,
        post_hotel_seasons (
          id,
          ordem,
          label,
          start_month_day,
          end_month_day,
          preco_delta_eur,
          preco_label,
          status
        ),
        post_hotel_availability (
          id,
          data_inicio,
          data_fim,
          disponivel,
          quartos_disponiveis
        ),
        post_hotel_room_options (
          id,
          ordem,
          nome,
          capacidade_adultos,
          capacidade_criancas,
          preco_delta_eur,
          preco_label,
          status
        ),
        post_hotel_media (
          id,
          ordem,
          kind,
          url,
          alt
        )
      ),
      post_extras (
        id,
        ordem,
        tipo,
        nome,
        descricao,
        preco_delta_eur,
        preco_label,
        default_selected,
        status
      ),
      post_flight_options (
        id,
        ordem,
        label,
        origem_iata,
        destino_iata,
        data_partida,
        data_regresso,
        cia,
        classe,
        bagagem_text,
        descricao,
        preco_delta_eur,
        preco_label,
        status
      )
    `;

  const selectWithoutDataFimPublicacao = `
      id,
      tipo,
      slug,
      titulo,
      descricao,
      media_url,
      preco_desde,
      preco_base_eur,
      has_variants,
      link_cta,
      data_publicacao,
      ordem_site,
      feed_vibe_slugs,
      hover_line,
      pets_allowed,
      capacidade_min,
      capacidade_max,
      post_hotels (
        id,
        ordem,
        nome,
        descricao,
        regime,
        condicoes,
        preco_delta_eur,
        preco_label,
        capacidade_min,
        capacidade_max,
        pets_allowed,
        status,
        post_hotel_seasons (
          id,
          ordem,
          label,
          start_month_day,
          end_month_day,
          preco_delta_eur,
          preco_label,
          status
        ),
        post_hotel_availability (
          id,
          data_inicio,
          data_fim,
          disponivel,
          quartos_disponiveis
        ),
        post_hotel_room_options (
          id,
          ordem,
          nome,
          capacidade_adultos,
          capacidade_criancas,
          preco_delta_eur,
          preco_label,
          status
        ),
        post_hotel_media (
          id,
          ordem,
          kind,
          url,
          alt
        )
      ),
      post_extras (
        id,
        ordem,
        tipo,
        nome,
        descricao,
        preco_delta_eur,
        preco_label,
        default_selected,
        status
      ),
      post_flight_options (
        id,
        ordem,
        label,
        origem_iata,
        destino_iata,
        data_partida,
        data_regresso,
        cia,
        classe,
        bagagem_text,
        descricao,
        preco_delta_eur,
        preco_label,
        status
      )
    `;

  let { data, error } = await supabase
    .from("posts")
    .select(selectWithDataFimPublicacao)
    .eq("id", id)
    .eq("status", true)
    .lte("data_publicacao", nowIso)
    .or(`data_fim_publicacao.is.null,data_fim_publicacao.gt.${nowIso}`)
    .maybeSingle();

  if (error && isMissingPhase3Tables(error.message)) {
    const fallback = await supabase
      .from("posts")
      .select(
        `
      id,
      tipo,
      slug,
      titulo,
      descricao,
      media_url,
      preco_desde,
      preco_base_eur,
      has_variants,
      link_cta,
      data_publicacao,
      data_fim_publicacao,
      ordem_site,
      feed_vibe_slugs,
      hover_line,
      pets_allowed,
      capacidade_min,
      capacidade_max,
      post_hotels (
        id,
        ordem,
        nome,
        descricao,
        regime,
        condicoes,
        preco_delta_eur,
        preco_label,
        capacidade_min,
        capacidade_max,
        pets_allowed,
        status,
        post_hotel_media (
          id,
          ordem,
          kind,
          url,
          alt
        )
      ),
      post_extras (
        id,
        ordem,
        tipo,
        nome,
        descricao,
        preco_delta_eur,
        preco_label,
        pets_allowed,
        default_selected,
        status
      ),
      post_flight_options (
        id,
        ordem,
        label,
        origem_iata,
        destino_iata,
        data_partida,
        data_regresso,
        cia,
        classe,
        bagagem_text,
        descricao,
        preco_delta_eur,
        preco_label,
        pets_allowed,
        status
      )
    `,
      )
      .eq("id", id)
      .eq("status", true)
      .lte("data_publicacao", nowIso)
      .or(`data_fim_publicacao.is.null,data_fim_publicacao.gt.${nowIso}`)
      .maybeSingle();
    data = fallback.data as typeof data;
    error = fallback.error;
  }

  if (error && isMissingDataFimPublicacaoColumn(error.message)) {
    const fallbackNoEndDate = await supabase
      .from("posts")
      .select(selectWithoutDataFimPublicacao)
      .eq("id", id)
      .eq("status", true)
      .lte("data_publicacao", nowIso)
      .maybeSingle();
    data = fallbackNoEndDate.data as typeof data;
    error = fallbackNoEndDate.error;
  }

  if (error) {
    console.error("[publicacao by id]", error.message);
    return null;
  }
  if (!data || typeof data.tipo !== "string" || !isPostTipo(data.tipo)) {
    return null;
  }

  const hotels = (Array.isArray(data.post_hotels) ? data.post_hotels : [])
    .filter((row) => row && row.status !== false)
    .map((row) => ({
      id: row.id,
      ordem: typeof row.ordem === "number" ? row.ordem : 0,
      nome: row.nome,
      descricao: row.descricao,
      regime: row.regime,
      condicoes: row.condicoes,
      preco_delta_eur: parseNullableNumber(row.preco_delta_eur),
      preco_label: row.preco_label,
      capacidade_min:
        typeof row.capacidade_min === "number" ? row.capacidade_min : null,
      capacidade_max:
        typeof row.capacidade_max === "number" ? row.capacidade_max : null,
      pets_allowed:
        typeof row.pets_allowed === "boolean" ? row.pets_allowed : null,
      status: row.status !== false,
      media: (Array.isArray(row.post_hotel_media) ? row.post_hotel_media : [])
        .map((item) => ({
          id: item.id,
          ordem: typeof item.ordem === "number" ? item.ordem : 0,
          kind:
            item.kind === "video"
              ? ("video" as PostHotelMediaKind)
              : ("image" as PostHotelMediaKind),
          url: item.url,
          alt: typeof item.alt === "string" && item.alt.trim() ? item.alt : null,
        }))
        .sort((a, b) => a.ordem - b.ordem),
      seasons: (Array.isArray(row.post_hotel_seasons) ? row.post_hotel_seasons : [])
        .filter((item) => item && item.status !== false)
        .map((item) => ({
          id: item.id,
          ordem: typeof item.ordem === "number" ? item.ordem : 0,
          label: typeof item.label === "string" ? item.label : "Época",
          start_month_day:
            typeof item.start_month_day === "string" ? item.start_month_day : "01-01",
          end_month_day:
            typeof item.end_month_day === "string" ? item.end_month_day : "12-31",
          preco_delta_eur: parseNullableNumber(item.preco_delta_eur),
          preco_label:
            typeof item.preco_label === "string" ? item.preco_label : null,
          status: item.status !== false,
        }))
        .sort((a, b) => a.ordem - b.ordem),
      availability: (Array.isArray(row.post_hotel_availability)
        ? row.post_hotel_availability
        : []
      )
        .map((item) => ({
          id: item.id,
          data_inicio:
            typeof item.data_inicio === "string" ? item.data_inicio : "",
          data_fim: typeof item.data_fim === "string" ? item.data_fim : "",
          disponivel: item.disponivel !== false,
          quartos_disponiveis:
            typeof item.quartos_disponiveis === "number" &&
            Number.isFinite(item.quartos_disponiveis)
              ? item.quartos_disponiveis
              : null,
        }))
        .filter((item) => item.data_inicio && item.data_fim),
      room_options: (Array.isArray(row.post_hotel_room_options)
        ? row.post_hotel_room_options
        : []
      )
        .filter((item) => item && item.status !== false)
        .map((item) => ({
          id: item.id,
          ordem: typeof item.ordem === "number" ? item.ordem : 0,
          nome: typeof item.nome === "string" ? item.nome : "Quarto",
          capacidade_adultos:
            typeof item.capacidade_adultos === "number"
              ? item.capacidade_adultos
              : null,
          capacidade_criancas:
            typeof item.capacidade_criancas === "number"
              ? item.capacidade_criancas
              : null,
          preco_delta_eur: parseNullableNumber(item.preco_delta_eur),
          preco_label:
            typeof item.preco_label === "string" ? item.preco_label : null,
          status: item.status !== false,
        }))
        .sort((a, b) => a.ordem - b.ordem),
    }))
    .sort((a, b) => a.ordem - b.ordem);

  const extras = (Array.isArray(data.post_extras) ? data.post_extras : [])
    .filter((row) => row && row.status !== false)
    .map((row) => ({
      id: row.id,
      ordem: typeof row.ordem === "number" ? row.ordem : 0,
      tipo: (row.tipo ?? "custom") as PostExtraTipo,
      nome: row.nome,
      descricao: row.descricao,
      preco_delta_eur: parseNullableNumber(row.preco_delta_eur),
      preco_label: row.preco_label,
      pets_allowed:
        typeof row.pets_allowed === "boolean" ? row.pets_allowed : null,
      default_selected: row.default_selected === true,
      status: row.status !== false,
    }))
    .sort((a, b) => a.ordem - b.ordem);

  const flightOptions = (
    Array.isArray(data.post_flight_options) ? data.post_flight_options : []
  )
    .filter((row) => row && row.status !== false)
    .map((row) => ({
      id: row.id,
      ordem: typeof row.ordem === "number" ? row.ordem : 0,
      label: row.label,
      origem_iata: row.origem_iata,
      destino_iata: row.destino_iata,
      data_partida: row.data_partida,
      data_regresso: row.data_regresso,
      cia: row.cia,
      classe: (row.classe ?? null) as PostFlightClass | null,
      bagagem_text: row.bagagem_text,
      descricao: row.descricao,
      preco_delta_eur: parseNullableNumber(row.preco_delta_eur),
      preco_label: row.preco_label,
      pets_allowed:
        typeof row.pets_allowed === "boolean" ? row.pets_allowed : null,
      status: row.status !== false,
    }))
    .sort((a, b) => a.ordem - b.ordem);

  return {
    id: data.id,
    tipo: data.tipo,
    slug: data.slug,
    titulo: data.titulo,
    descricao: data.descricao,
    media_url: data.media_url,
    preco_desde: data.preco_desde,
    preco_base_eur: parseNullableNumber(data.preco_base_eur),
    has_variants: data.has_variants === true,
    link_cta: data.link_cta,
    data_publicacao: data.data_publicacao,
    data_fim_publicacao:
      typeof data.data_fim_publicacao === "string" && data.data_fim_publicacao.trim()
        ? data.data_fim_publicacao
        : null,
    ordem_site:
      typeof data.ordem_site === "number" && Number.isFinite(data.ordem_site)
        ? data.ordem_site
        : 0,
    feed_vibe_slugs: normalizeVibeSlugs(data.feed_vibe_slugs),
    hover_line:
      typeof data.hover_line === "string" && data.hover_line.trim()
        ? data.hover_line.trim()
        : null,
    pets_allowed:
      typeof data.pets_allowed === "boolean" ? data.pets_allowed : null,
    capacidade_min:
      typeof data.capacidade_min === "number" ? data.capacidade_min : null,
    capacidade_max:
      typeof data.capacidade_max === "number" ? data.capacidade_max : null,
    hotels,
    extras,
    flight_options: flightOptions,
  };
}
