import { escapeHtml } from "@/lib/email/html";
import type { LeadQuizInput } from "@/lib/validations/lead-quiz";

export function buildWelcomeLeadEmail(data: LeadQuizInput): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = "Recebemos o teu pedido — Viagens com Sílvia";

  const text = `Olá ${data.nome},

Obrigado por partilhares a tua visão de viagem connosco.

Resumo do que nos enviaste:
- Telemóvel: ${data.telemovel}
- Estilo: ${data.vibe}
- Companhia: ${data.companhia}
- Destino / sonho: ${data.destino_sonho}
- Orçamento indicado: ${data.orcamento_estimado}

A Sílvia vai analisar o teu pedido e entrar em contacto em breve com ideias e próximos passos.

Com os melhores cumprimentos,
Viagens com Sílvia`;

  const html = `
<!DOCTYPE html>
<html>
<body style="font-family: system-ui, sans-serif; line-height: 1.6; color: #0c4a6e; max-width: 560px;">
  <p>Olá <strong>${escapeHtml(data.nome)}</strong>,</p>
  <p>Obrigado por partilhares a tua visão de viagem connosco.</p>
  <p style="margin-top: 1.5rem;"><strong>Resumo do pedido</strong></p>
  <ul style="padding-left: 1.25rem; margin: 0.5rem 0;">
    <li>Telemóvel: ${escapeHtml(data.telemovel)}</li>
    <li>Estilo: ${escapeHtml(data.vibe)}</li>
    <li>Companhia: ${escapeHtml(data.companhia)}</li>
    <li>Destino / sonho: ${escapeHtml(data.destino_sonho)}</li>
    <li>Orçamento indicado: ${escapeHtml(data.orcamento_estimado)}</li>
  </ul>
  <p style="margin-top: 1.5rem;">A Sílvia vai analisar o teu pedido e entrar em contacto em breve com ideias e próximos passos.</p>
  <p style="margin-top: 2rem; color: #0369a1;">Com os melhores cumprimentos,<br/>Viagens com Sílvia</p>
</body>
</html>`.trim();

  return { subject, html, text };
}
