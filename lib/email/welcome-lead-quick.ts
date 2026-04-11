import { escapeHtml } from "@/lib/email/html";
import type { LeadQuickInput } from "@/lib/validations/lead-quiz";

export function buildWelcomeQuickLeadEmail(data: LeadQuickInput): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = "Recebemos o teu contacto — Viagens com Sílvia";
  const tel = data.telemovel.trim();

  const text = `Olá ${data.nome},

Obrigado por deixares o teu contacto e uma primeira ideia de destino.

Resumo:
- Email: ${data.email}
${tel ? `- Telemóvel: ${tel}\n` : ""}- Destino / ideia: ${data.destino_sonho}

Isto foi um pedido rápido — a Sílvia pode pedir mais pormenores para preparar a proposta.

Com os melhores cumprimentos,
Viagens com Sílvia`;

  const html = `
<!DOCTYPE html>
<html>
<body style="font-family: system-ui, sans-serif; line-height: 1.6; color: #0c4a6e; max-width: 560px;">
  <p>Olá <strong>${escapeHtml(data.nome)}</strong>,</p>
  <p>Obrigado por deixares o teu contacto e uma primeira ideia de destino.</p>
  <p style="margin-top: 1.5rem;"><strong>Resumo</strong></p>
  <ul style="padding-left: 1.25rem; margin: 0.5rem 0;">
    <li>Email: ${escapeHtml(data.email)}</li>
    ${tel ? `<li>Telemóvel: ${escapeHtml(tel)}</li>` : ""}
    <li>Destino / ideia: ${escapeHtml(data.destino_sonho)}</li>
  </ul>
  <p style="margin-top: 1rem; font-size: 0.95rem;">Isto foi um <strong>pedido rápido</strong> — a Sílvia pode pedir mais pormenores para preparar a proposta.</p>
  <p style="margin-top: 2rem; color: #0369a1;">Com os melhores cumprimentos,<br/>Viagens com Sílvia</p>
</body>
</html>`.trim();

  return { subject, html, text };
}
