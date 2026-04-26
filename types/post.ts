export type PostTipo = "promocao" | "video" | "inspiracao";

export type PublishedPost = {
  id: string;
  tipo: PostTipo;
  slug: string | null;
  titulo: string;
  descricao: string | null;
  media_url: string;
  preco_desde: string | null;
  preco_base_eur: number | null;
  has_variants: boolean;
  link_cta: string | null;
  data_publicacao: string;
  data_fim_publicacao: string | null;
  /** Ordem no site: valores mais baixos aparecem primeiro no feed. */
  ordem_site: number;
  /** Slugs alinhados com os chips do CMS (ex.: romance, retiro). */
  feed_vibe_slugs: string[];
  /** Frase curta no hover do cartão (opcional). */
  hover_line: string | null;
  /** Regras opcionais para enquadrar pedidos do hero/quiz. */
  pets_allowed: boolean | null;
  capacidade_min: number | null;
  capacidade_max: number | null;
  /** Regimes disponíveis nos hotéis desta publicação (quando configurados). */
  hotel_regimes: string[];
  /** Lista de nomes de hotéis para seleção rápida noutros fluxos (wishlist, etc.). */
  hotel_names: string[];
};

export type MapPinPost = PublishedPost & {
  latitude: number;
  longitude: number;
  slug_destino: string | null;
};
