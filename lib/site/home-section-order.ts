/** Identificadores dos blocos grandes da página inicial (ordem configurável). */
export const HOME_SECTION_IDS = [
  "hero",
  "feed",
  "stories",
  "social",
  "consultora",
  "process",
  "account",
  "quiz",
] as const;

export type HomeSectionId = (typeof HOME_SECTION_IDS)[number];

const ID_SET = new Set<string>(HOME_SECTION_IDS);

export function isHomeSectionId(s: string): s is HomeSectionId {
  return ID_SET.has(s);
}

/** Valor por omissão guardado no CMS — pedido de proposta no fim (conteúdo concreto primeiro). */
export const DEFAULT_HOME_ORDER_CSV =
  "hero,feed,stories,social,consultora,process,account,quiz";

/**
 * Lê CSV da BD, remove duplicados e secções desconhecidas, acrescenta as em falta.
 */
export function parseHomeSectionOrder(
  csv: string | undefined | null,
): HomeSectionId[] {
  const seen = new Set<HomeSectionId>();
  const out: HomeSectionId[] = [];
  if (csv?.trim()) {
    for (const part of csv.split(",")) {
      const id = part.trim();
      if (isHomeSectionId(id) && !seen.has(id)) {
        seen.add(id);
        out.push(id);
      }
    }
  }
  for (const id of HOME_SECTION_IDS) {
    if (!seen.has(id)) out.push(id);
  }
  return out;
}

export function serializeHomeSectionOrder(order: HomeSectionId[]): string {
  return order.join(",");
}

export const HOME_SECTION_LABEL: Record<HomeSectionId, string> = {
  hero: "Topo",
  feed: "Inspirações",
  stories: "Histórias rápidas",
  social: "Instagram",
  consultora: "Sobre + depoimentos",
  process: "Como trabalhamos",
  account: "Conta de cliente",
  quiz: "Pedido de proposta",
};
