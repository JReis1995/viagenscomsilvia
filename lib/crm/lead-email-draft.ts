function firstName(nome: string): string {
  const t = nome.trim();
  if (!t) return "";
  return t.split(/\s+/)[0] ?? t;
}

export type EmailDraft = { subject: string; body: string };

/** Rascunho sugerido para follow-up após orçamento enviado. */
export function followUpEmailDraft(lead: {
  nome: string;
  destino_sonho?: string | null;
}): EmailDraft {
  const fn = firstName(lead.nome);
  const dest = lead.destino_sonho?.trim();
  const subject = "Sobre a tua proposta — Viagens com Sílvia";
  const greeting = fn ? `Olá ${fn},` : "Olá,";
  const destLine = dest ? `\n\nReferência: ${dest}` : "";
  const body = `${greeting}\n\nEscrevo para saber se tiveste oportunidade de ver a proposta que enviei e se tens alguma dúvida ou ajuste que queiras fazer.${destLine}\n\nFico ao dispor.\n\nCom os melhores cumprimentos,\nSílvia`;
  return { subject, body };
}
