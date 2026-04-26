import { escapeHtml } from "@/lib/email/html";
import type { LeadQuickInput } from "@/lib/validations/lead-quiz";

function buildPostChoiceSummary(choice: LeadQuickInput["post_choice"]) {
  if (!choice) return null;

  const hotelLabel = choice.snapshot?.hotel?.label?.trim() || choice.hotel_id?.trim() || null;
  const extrasLabels =
    choice.snapshot?.extras
      ?.map((item) => item.label.trim())
      .filter(Boolean)
      .join(", ") || (choice.extra_ids?.length ? choice.extra_ids.join(", ") : null);
  const vooLabel = choice.snapshot?.flight?.label?.trim() || choice.flight_option_id?.trim() || null;

  if (!hotelLabel && !extrasLabels && !vooLabel) return null;

  return {
    hotelLabel,
    extrasLabels,
    vooLabel,
  };
}

export function buildWelcomeQuickLeadEmail(data: LeadQuickInput): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = "Recebemos o teu contacto — Viagens com Sílvia";
  const tel = data.telemovel.trim();
  const janela = data.janela_datas?.trim();
  const postChoiceSummary = buildPostChoiceSummary(data.post_choice);
  const quartos = data.pedido_quartos;
  const quartosChoice = data.post_choice?.rooms_required;
  const postChoiceText = postChoiceSummary
    ? `
Resumo da tua escolha:
${postChoiceSummary.hotelLabel ? `- Hotel: ${postChoiceSummary.hotelLabel}\n` : ""}${postChoiceSummary.extrasLabels ? `- Extras: ${postChoiceSummary.extrasLabels}\n` : ""}${postChoiceSummary.vooLabel ? `- Voo: ${postChoiceSummary.vooLabel}\n` : ""}`
    : "";

  const text = `Olá ${data.nome},

Obrigado por deixares o teu contacto e uma primeira ideia de destino.

Resumo:
- Email: ${data.email}
${tel ? `- Telemóvel: ${tel}\n` : ""}- Destino / ideia: ${data.destino_sonho}
${janela ? `- Datas: ${janela}\n` : ""}${typeof quartos === "number" ? `- Quartos necessários: ${quartos}\n` : ""}
${postChoiceText}
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
    ${
      janela
        ? `<li>Datas: ${escapeHtml(janela)}</li>`
        : ""
    }
    ${typeof quartos === "number" ? `<li>Quartos necessários: ${quartos}</li>` : ""}
    ${typeof quartosChoice === "number" ? `<li>Quartos necessários (escolha da publicação): ${quartosChoice}</li>` : ""}
  </ul>
  ${
    postChoiceSummary
      ? `
  <p style="margin-top: 1rem;"><strong>Resumo da tua escolha</strong></p>
  <ul style="padding-left: 1.25rem; margin: 0.5rem 0;">
    ${postChoiceSummary.hotelLabel ? `<li>Hotel: ${escapeHtml(postChoiceSummary.hotelLabel)}</li>` : ""}
    ${postChoiceSummary.extrasLabels ? `<li>Extras: ${escapeHtml(postChoiceSummary.extrasLabels)}</li>` : ""}
    ${postChoiceSummary.vooLabel ? `<li>Voo: ${escapeHtml(postChoiceSummary.vooLabel)}</li>` : ""}
  </ul>`
      : ""
  }
  <p style="margin-top: 1rem; font-size: 0.95rem;">Isto foi um <strong>pedido rápido</strong> — a Sílvia pode pedir mais pormenores para preparar a proposta.</p>
  <p style="margin-top: 2rem; color: #0369a1;">Com os melhores cumprimentos,<br/>Viagens com Sílvia</p>
</body>
</html>`.trim();

  return { subject, html, text };
}
