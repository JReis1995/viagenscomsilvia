export type PostTipo = "promocao" | "video" | "inspiracao";

export type PublishedPost = {
  id: string;
  tipo: PostTipo;
  titulo: string;
  descricao: string | null;
  media_url: string;
  preco_desde: string | null;
  link_cta: string | null;
  data_publicacao: string;
  /** Ordem no site: valores mais baixos aparecem primeiro no feed. */
  ordem_site: number;
};

export type MapPinPost = PublishedPost & {
  latitude: number;
  longitude: number;
  slug_destino: string | null;
};
