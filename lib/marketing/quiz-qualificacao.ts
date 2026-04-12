import type { SiteContent } from "@/lib/site/site-content";

/** Valores gravados em `leads.flexibilidade_datas` — estáveis para CSV/API. */
export const FLEXIBILIDADE_VALUES = [
  "fixas",
  "mais_menos_semana",
  "totalmente_flexivel",
] as const;

export type FlexibilidadeKey = (typeof FLEXIBILIDADE_VALUES)[number];

/** Valores gravados em `leads.ja_tem_voos_hotel`. */
export const VOOS_HOTEL_VALUES = [
  "nada",
  "so_voos",
  "so_hotel",
  "ambos",
] as const;

export type VoosHotelKey = (typeof VOOS_HOTEL_VALUES)[number];

export function flexibilidadeLabel(
  key: string | null | undefined,
  copy: SiteContent["quiz"],
): string {
  const k = key?.trim();
  if (!k) return "—";
  switch (k as FlexibilidadeKey) {
    case "fixas":
      return copy.flexDatasLabelFixas.trim() || "Datas fixas (não mexo)";
    case "mais_menos_semana":
      return (
        copy.flexDatasLabelMaisMenosUmaSemana.trim() ||
        "± uma semana de margem"
      );
    case "totalmente_flexivel":
      return (
        copy.flexDatasLabelTotalmenteFlex.trim() || "Totalmente flexível"
      );
    default:
      return k;
  }
}

export function voosHotelLabel(
  key: string | null | undefined,
  copy: SiteContent["quiz"],
): string {
  const k = key?.trim();
  if (!k) return "—";
  switch (k as VoosHotelKey) {
    case "nada":
      return copy.voosHotelLabelNada.trim() || "Ainda não tenho voos nem hotel";
    case "so_voos":
      return copy.voosHotelLabelSoVoos.trim() || "Já tenho voos";
    case "so_hotel":
      return copy.voosHotelLabelSoHotel.trim() || "Já tenho hotel";
    case "ambos":
      return copy.voosHotelLabelAmbos.trim() || "Já tenho voos e hotel";
    default:
      return k;
  }
}
