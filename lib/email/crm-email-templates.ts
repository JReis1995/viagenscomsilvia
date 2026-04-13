import { followUpEmailDraft } from "@/lib/crm/lead-email-draft";
import { buildFollowupReminderEmail } from "@/lib/email/followup-reminder-lead";
import type { LeadBoardRow } from "@/types/lead";

function firstName(nome: string): string {
  const t = nome.trim();
  if (!t) return "";
  return t.split(/\s+/)[0] ?? t;
}

export type CrmEmailTemplateId =
  | "blank"
  | "followup"
  | "initial_followup_reminder"
  | "receipt_confirm"
  | "missing_info"
  | "post_proposal_next_steps"
  | "farewell";

export type CrmEmailTemplateMeta = {
  id: CrmEmailTemplateId;
  /** Rótulo no selector do CRM */
  label: string;
};

/** Ordem do menu «Modelo de mensagem». */
export const CRM_EMAIL_TEMPLATE_OPTIONS: CrmEmailTemplateMeta[] = [
  { id: "blank", label: "Em branco" },
  { id: "initial_followup_reminder", label: "Lembrete inicial (igual ao automático)" },
  { id: "receipt_confirm", label: "Confirmação de receção" },
  { id: "missing_info", label: "Pedido de informação em falta" },
  { id: "post_proposal_next_steps", label: "Próximos passos (pós-proposta)" },
  { id: "followup", label: "Follow-up formal (proposta)" },
  { id: "farewell", label: "Despedida cordial" },
];

function replacePlaceholders(
  text: string,
  ctx: { nome: string; destino: string },
): string {
  return text
    .replace(/\{nome\}/g, ctx.nome)
    .replace(/\{destino\}/g, ctx.destino);
}

function templateContext(lead: { nome: string; destino_sonho?: string | null }): {
  nome: string;
  destino: string;
} {
  const fn = firstName(lead.nome);
  const dest = lead.destino_sonho?.trim();
  return {
    nome: fn || "cliente",
    destino: dest || "o destino que indicaste",
  };
}

/**
 * Rascunho (assunto + corpo em texto plano) para o modal de email da consultora.
 * A assinatura com site, redes e área de cliente é acrescentada automaticamente no envio.
 */
export function getCrmEmailDraftForLead(
  lead: Pick<LeadBoardRow, "nome" | "destino_sonho">,
  templateId: CrmEmailTemplateId,
): { subject: string; body: string } {
  if (templateId === "blank") {
    return { subject: "", body: "" };
  }

  if (templateId === "followup") {
    return followUpEmailDraft(lead);
  }

  if (templateId === "initial_followup_reminder") {
    const { subject, text } = buildFollowupReminderEmail({
      nome: lead.nome ?? "",
      destino_sonho: lead.destino_sonho ?? null,
    });
    return { subject, body: text };
  }

  const ctx = templateContext(lead);

  const templates: Record<
    Exclude<
      CrmEmailTemplateId,
      "blank" | "followup" | "initial_followup_reminder"
    >,
    { subject: string; body: string }
  > = {
    receipt_confirm: {
      subject: "Recebemos o teu pedido — Viagens com Sílvia",
      body: `Olá {nome},

Obrigada por teres entrado em contacto connosco relativamente a {destino}. Já registámos o teu pedido e vamos analisá-lo com calma.

Se tiveres mais algum pormenor que queiras acrescentar, podes responder a este email.

Com os melhores cumprimentos,
Sílvia`,
    },
    missing_info: {
      subject: "Informação em falta para avançarmos — Viagens com Sílvia",
      body: `Olá {nome},

Para podermos preparar a melhor proposta para {destino}, precisamos de alguns dados adicionais. Podes responder a este email com:

• datas ou período aproximado em que pensas viajar;
• número de adultos e crianças (e idades, se aplicável);
• orçamento orientador ou prioridades (ex.: alojamento, voos, experiências).

Assim que tivermos estes elementos, avançamos sem demora.

Com os melhores cumprimentos,
Sílvia`,
    },
    post_proposal_next_steps: {
      subject: "Próximos passos da tua proposta — Viagens com Sílvia",
      body: `Olá {nome},

Relativamente a {destino}, seguem os próximos passos que propomos:

1) Rever a proposta enviada (PDF e resumo por email).
2) Dizer-nos se queres ajustes — datas, alojamento, orçamento ou extras.
3) Quando estiveres confortável, confirmar por email para avançarmos com a reserva.

Se tiveres dúvidas em qualquer momento, estou disponível por aqui.

Com os melhores cumprimentos,
Sílvia`,
    },
    farewell: {
      subject: "Foi um gosto ajudar — Viagens com Sílvia",
      body: `Olá {nome},

Foi um gosto falar contigo sobre {destino}. Se no futuro quiseres retomar a conversa ou planear outra viagem, podes responder a este email — fico ao dispor.

Desejo-te boas viagens.

Com os melhores cumprimentos,
Sílvia`,
    },
  };

  const raw = templates[templateId];
  return {
    subject: replacePlaceholders(raw.subject, ctx),
    body: replacePlaceholders(raw.body, ctx),
  };
}

export function defaultCrmEmailTemplateFromPreset(
  preset: "free" | "followup" | "initial_followup_reminder",
): CrmEmailTemplateId {
  if (preset === "followup") return "followup";
  if (preset === "initial_followup_reminder") {
    return "initial_followup_reminder";
  }
  return "blank";
}
