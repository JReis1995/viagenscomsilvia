/**
 * Abre o cliente de email do sistema. Em alguns browsers (ex.: Chrome como
 * handler de mailto no Windows), um <a href> dentro da página pode falhar em
 * silêncio; um clique programático num link temporário costuma funcionar melhor.
 */
export function triggerMailtoCompose(href: string): void {
  if (typeof window === "undefined" || !href.startsWith("mailto:")) return;
  const a = document.createElement("a");
  a.href = href;
  a.rel = "noopener noreferrer";
  a.style.cssText = "position:fixed;left:-9999px;top:0;";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/** mailto simples — endereço sem codificar o @ (alguns handlers falham com %40). */
export function simpleMailtoHref(email: string): string {
  const trimmed = email.trim();
  if (!trimmed) return "mailto:";
  return `mailto:${trimmed}`;
}

function firstName(nome: string): string {
  const t = nome.trim();
  if (!t) return "";
  return t.split(/\s+/)[0] ?? t;
}

/**
 * Rascunho de follow-up após orçamento enviado — abre no cliente de email local.
 */
export function proposalFollowUpMailtoHref(lead: {
  email: string;
  nome: string;
  destino_sonho?: string | null;
}): string {
  const to = lead.email.trim();
  const fn = firstName(lead.nome);
  const dest = lead.destino_sonho?.trim();
  const subject = encodeURIComponent(
    "Sobre a tua proposta — Viagens com Sílvia",
  );
  const greeting = fn ? `Olá ${fn},` : "Olá,";
  const destLine = dest
    ? `\n\nReferência: ${dest}`
    : "";
  const body = encodeURIComponent(
    `${greeting}\n\nEscrevo para saber se tiveste oportunidade de ver a proposta que enviei e se tens alguma dúvida ou ajuste que queiras fazer.${destLine}\n\nFico ao dispor.\n\nCom os melhores cumprimentos,\nSílvia`,
  );
  return `mailto:${to}?subject=${subject}&body=${body}`;
}
