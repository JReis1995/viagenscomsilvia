import { escapeHtml } from "@/lib/email/html";
import { climaLabelForKey } from "@/lib/marketing/quiz-clima";
import { DEFAULT_SITE_CONTENT } from "@/lib/site/site-content";
import {
  flexibilidadeLabel,
  voosHotelLabel,
} from "@/lib/marketing/quiz-qualificacao";
import type { LeadQuizInput } from "@/lib/validations/lead-quiz";

export function buildWelcomeLeadEmail(data: LeadQuizInput): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = "Recebemos o teu pedido — Viagens com Sílvia";
  const q = DEFAULT_SITE_CONTENT.quiz;
  const climaHuman = climaLabelForKey(data.clima_preferido, q);
  const flexHuman = flexibilidadeLabel(data.flexibilidade_datas, q);
  const voosHuman = voosHotelLabel(data.ja_tem_voos_hotel, q);

  const text = `Olá ${data.nome},

Obrigado por partilhares a tua visão de viagem connosco.

Resumo do que nos enviaste:
- Clima / ambiente: ${climaHuman}
- Telemóvel: ${data.telemovel}
- Estilo: ${data.vibe}
- Companhia: ${data.companhia}
- Destino / sonho: ${data.destino_sonho}
- Orçamento indicado: ${data.orcamento_estimado}
- Janela de datas: ${data.janela_datas}
- Flexibilidade de datas: ${flexHuman}
- Voos / hotel: ${voosHuman}

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
    <li>Clima / ambiente: ${escapeHtml(climaHuman)}</li>
    <li>Telemóvel: ${escapeHtml(data.telemovel)}</li>
    <li>Estilo: ${escapeHtml(data.vibe)}</li>
    <li>Companhia: ${escapeHtml(data.companhia)}</li>
    <li>Destino / sonho: ${escapeHtml(data.destino_sonho)}</li>
    <li>Orçamento indicado: ${escapeHtml(data.orcamento_estimado)}</li>
    <li>Janela de datas: ${escapeHtml(data.janela_datas)}</li>
    <li>Flexibilidade de datas: ${escapeHtml(flexHuman)}</li>
    <li>Voos / hotel: ${escapeHtml(voosHuman)}</li>
  </ul>
  <p style="margin-top: 1.5rem;">A Sílvia vai analisar o teu pedido e entrar em contacto em breve com ideias e próximos passos.</p>
  <p style="margin-top: 2rem; color: #0369a1;">Com os melhores cumprimentos,<br/>Viagens com Sílvia</p>
</body>
</html>`.trim();

  return { subject, html, text };
}
