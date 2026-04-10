import { escapeHtml } from "@/lib/email/html";

export function buildFollowupReminderEmail(lead: {
  nome: string;
  destino_sonho: string | null;
}): { subject: string; html: string; text: string } {
  const subject = "Ainda estamos a tratar do teu pedido — Viagens com Sílvia";
  const destino =
    lead.destino_sonho?.trim() && lead.destino_sonho.trim().length > 0
      ? lead.destino_sonho.trim()
      : "a tua viagem";

  const text = `Olá ${lead.nome},

Há uns dias recebemos o teu pedido (${destino}) e queríamos confirmar que continuamos a trabalhar nele.

Se tiveres mais detalhes ou preferências, responde a este email — a Sílvia lê tudo com calma.

Com os melhores cumprimentos,
Viagens com Sílvia`;

  const destinoHtml = escapeHtml(destino);

  const html = `
<!DOCTYPE html>
<html>
<body style="font-family: system-ui, sans-serif; line-height: 1.6; color: #0c4a6e; max-width: 560px;">
  <p>Olá <strong>${escapeHtml(lead.nome)}</strong>,</p>
  <p>Há uns dias recebemos o teu pedido (<strong>${destinoHtml}</strong>) e queríamos confirmar que continuamos a trabalhar nele.</p>
  <p style="margin-top: 1.25rem;">Se tiveres mais detalhes ou preferências, responde a este email — a Sílvia lê tudo com calma.</p>
  <p style="margin-top: 2rem; color: #0369a1;">Com os melhores cumprimentos,<br/>Viagens com Sílvia</p>
</body>
</html>`.trim();

  return { subject, html, text };
}
