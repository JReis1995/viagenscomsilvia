/**
 * Fundos do modo imersivo do pedido de orçamento, após o cliente escolher o vibe.
 * Valores de `vibe` coincidem com `VIBE_OPTIONS[].value`.
 */
export function quizImmersiveShellClass(
  vibe: string,
  reduceMotion: boolean,
): string {
  const motion = reduceMotion
    ? ""
    : "transition-[background] duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)]";

  if (!vibe.trim()) {
    return `${motion} bg-gradient-to-br from-sand via-ocean-50/95 to-ocean-100`;
  }

  const byVibe: Record<string, string> = {
    "Praia e descontrair":
      "bg-gradient-to-br from-sky-100 via-cyan-50 to-amber-50/90",
    "Cultura e história":
      "bg-gradient-to-br from-stone-200 via-amber-50 to-orange-100/80",
    "Natureza e aventura":
      "bg-gradient-to-br from-emerald-100 via-teal-50 to-ocean-100",
    "Gastronomia e cidade":
      "bg-gradient-to-br from-slate-200 via-violet-100/70 to-amber-100/80",
    "Romântica / lua de mel":
      "bg-gradient-to-br from-rose-100 via-fuchsia-50 to-amber-50/90",
    "Ainda estou a explorar ideias":
      "bg-gradient-to-br from-sand via-white to-ocean-50",
  };

  return `${motion} ${byVibe[vibe] ?? "bg-gradient-to-br from-sand via-white to-ocean-50"}`;
}
