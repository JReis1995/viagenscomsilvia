import type { SiteContent } from "@/lib/site/site-content";

export const QUIZ_CLIMA_KEYS = ["neve", "praia", "cidade", "misto"] as const;
export type QuizClimaKey = (typeof QUIZ_CLIMA_KEYS)[number];

const KEY_SET = new Set<string>(QUIZ_CLIMA_KEYS);

export function isQuizClimaKey(v: string): v is QuizClimaKey {
  return KEY_SET.has(v);
}

/** Rótulos por omissão (alinhados a `DEFAULT_SITE_CONTENT.quiz`). */
export const CLIMA_FALLBACK_LABELS: Record<QuizClimaKey, string> = {
  neve: "Neve e montanha",
  praia: "Sol e praia",
  cidade: "Cidade e cultura",
  misto: "Quero misturar tudo",
};

/** Campo no CMS para editar o rótulo de cada opção de clima (inline no quiz). */
export const CLIMA_LABEL_QUIZ_FIELD: Record<
  QuizClimaKey,
  keyof SiteContent["quiz"]
> = {
  neve: "climaLabelNeve",
  praia: "climaLabelPraia",
  cidade: "climaLabelCidade",
  misto: "climaLabelMisto",
};

const FIELD_BY_KEY = CLIMA_LABEL_QUIZ_FIELD;

export function climaLabelForKey(key: string, copy: SiteContent["quiz"]): string {
  if (!isQuizClimaKey(key)) return key;
  const field = FIELD_BY_KEY[key];
  const fromCms = copy[field]?.trim();
  if (fromCms) return fromCms;
  return CLIMA_FALLBACK_LABELS[key];
}

export function climaOptionsFromCopy(copy: SiteContent["quiz"]): {
  key: QuizClimaKey;
  label: string;
}[] {
  return QUIZ_CLIMA_KEYS.map((key) => ({
    key,
    label: climaLabelForKey(key, copy),
  }));
}
