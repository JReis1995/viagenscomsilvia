/**
 * Modelos de campanha (CRM → Inscritos).
 * Variáveis: {nome}, {titulo_publicacao}, {link_publicacao}, {percentagem}, {link_formulario}
 */
export const defaultPromoCampaignSubject =
  "Novidade: {titulo_publicacao} — {percentagem}% para ti";

export const defaultPromoCampaignBody = `Olá {nome},

Temos uma novidade que pode interessar-te: {titulo_publicacao}.

Lê mais aqui: {link_publicacao}

Se quiseres pedir orçamento com a oferta associada a este email, usa este link (é pessoal e temporário):
{link_formulario}

Desconto indicado: {percentagem}%

Com os melhores cumprimentos,
Viagens com Sílvia
`;

export const promoCampaignVariableKeys = [
  "nome",
  "titulo_publicacao",
  "link_publicacao",
  "percentagem",
  "link_formulario",
] as const;

export function applyPromoCampaignTemplate(
  template: string,
  vars: Record<(typeof promoCampaignVariableKeys)[number], string>,
): string {
  let out = template;
  for (const key of promoCampaignVariableKeys) {
    const v = vars[key] ?? "";
    out = out.split(`{${key}}`).join(v);
  }
  return out;
}
