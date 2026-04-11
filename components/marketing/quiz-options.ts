export const VIBE_OPTIONS = [
  { value: "Praia e descontrair", label: "Praia e descontrair" },
  { value: "Cultura e história", label: "Cultura e história" },
  { value: "Natureza e aventura", label: "Natureza e aventura" },
  { value: "Gastronomia e cidade", label: "Gastronomia e cidade" },
  { value: "Romântica / lua de mel", label: "Romântica / lua de mel" },
  { value: "Ainda estou a explorar ideias", label: "Ainda estou a explorar" },
] as const;

export type QuizVibeValue = (typeof VIBE_OPTIONS)[number]["value"];

const VIBE_VALUE_SET = new Set<string>(VIBE_OPTIONS.map((o) => o.value));

export function isAllowedQuizVibe(v: string): v is QuizVibeValue {
  return VIBE_VALUE_SET.has(v);
}

export const COMPANHIA_OPTIONS = [
  { value: "Sozinho/a", label: "Sozinho/a" },
  { value: "Casal", label: "Casal" },
  { value: "Família com crianças", label: "Família com crianças" },
  { value: "Amigos", label: "Amigos" },
  { value: "Grupo / evento", label: "Grupo / evento" },
] as const;

export const ORCAMENTO_OPTIONS = [
  { value: "Até 1.500 €", label: "Até 1.500 €" },
  { value: "1.500 € – 3.000 €", label: "1.500 € – 3.000 €" },
  { value: "3.000 € – 5.000 €", label: "3.000 € – 5.000 €" },
  { value: "5.000 € – 8.000 €", label: "5.000 € – 8.000 €" },
  { value: "Mais de 8.000 €", label: "Mais de 8.000 €" },
  { value: "Ainda estou a definir", label: "Ainda estou a definir" },
] as const;
