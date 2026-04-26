import type { PublishedPost } from "@/types/post";

export type PostHotelMediaKind = "image" | "video";

export type PostHotelMediaItem = {
  id: string;
  ordem: number;
  kind: PostHotelMediaKind;
  url: string;
  alt: string | null;
};

export type PostHotelVariant = {
  id: string;
  ordem: number;
  nome: string;
  descricao: string | null;
  regime: string | null;
  condicoes: string | null;
  preco_delta_eur: number | null;
  preco_label: string | null;
  capacidade_min: number | null;
  capacidade_max: number | null;
  pets_allowed: boolean | null;
  status: boolean;
  media: PostHotelMediaItem[];
  seasons: PostHotelSeasonVariant[];
  availability: PostHotelAvailabilityVariant[];
  room_options: PostHotelRoomOptionVariant[];
};

export type PostHotelSeasonVariant = {
  id: string;
  ordem: number;
  label: string;
  start_month_day: string;
  end_month_day: string;
  preco_delta_eur: number | null;
  preco_label: string | null;
  status: boolean;
};

export type PostHotelAvailabilityVariant = {
  id: string;
  data_inicio: string;
  data_fim: string;
  disponivel: boolean;
  quartos_disponiveis: number | null;
};

export type PostHotelRoomOptionVariant = {
  id: string;
  ordem: number;
  nome: string;
  capacidade_adultos: number | null;
  capacidade_criancas: number | null;
  preco_delta_eur: number | null;
  preco_label: string | null;
  status: boolean;
};

export type PostExtraTipo =
  | "transfer"
  | "guia"
  | "seguro"
  | "experiencia"
  | "viatura_aluguer"
  | "custom";

export type PostExtraVariant = {
  id: string;
  ordem: number;
  tipo: PostExtraTipo;
  nome: string;
  descricao: string | null;
  preco_delta_eur: number | null;
  preco_label: string | null;
  pets_allowed: boolean | null;
  default_selected: boolean;
  status: boolean;
};

export type PostFlightClass =
  | "economy"
  | "premium_economy"
  | "business"
  | "first";

export type PostFlightOptionVariant = {
  id: string;
  ordem: number;
  label: string;
  origem_iata: string | null;
  destino_iata: string | null;
  data_partida: string | null;
  data_regresso: string | null;
  cia: string | null;
  classe: PostFlightClass | null;
  bagagem_text: string | null;
  descricao: string | null;
  preco_delta_eur: number | null;
  preco_label: string | null;
  pets_allowed: boolean | null;
  status: boolean;
};

export type PublicacaoComVariantes = PublishedPost & {
  slug: string;
  hotels: PostHotelVariant[];
  extras: PostExtraVariant[];
  flight_options: PostFlightOptionVariant[];
};
