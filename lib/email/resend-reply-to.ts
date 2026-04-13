const LEAD_UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function bareEmailFromInboundEnv(raw: string): string | null {
  const t = raw.trim();
  if (!t) return null;
  const angled = t.match(/<([^>]+)>/);
  const candidate = (angled?.[1] ?? t).trim().toLowerCase();
  if (!/^[^\s<>"']+@[^\s<>"']+\.[^\s<>"']+$/.test(candidate)) return null;
  return candidate;
}

function replyToWithLeadTag(inboundRaw: string, leadId: string): string | null {
  const bare = bareEmailFromInboundEnv(inboundRaw);
  if (!bare) return null;
  const id = leadId.trim().toLowerCase();
  const at = bare.lastIndexOf("@");
  if (at < 1) return null;
  const local = bare.slice(0, at);
  const domain = bare.slice(at + 1);
  const tagged = `${local}+${id}@${domain}`;
  return `Respostas <${tagged}>`;
}

/**
 * Reply-To nos emails enviados à lead (Resend + histórico).
 * Se `RESEND_INBOUND_REPLY_TO` estiver definido, as respostas entram na Resend
 * (Inbound → webhook → histórico). Caso contrário usa o email da consultora.
 *
 * Com `leadId`, o endereço fica `local+<leadId>@domínio` para o webhook
 * identificar a lead mesmo quando o From é a consultora (resposta no tópico).
 *
 * Formato `Nome <email@dominio.com>` ajuda alguns clientes a usarem Reply-To em
 * vez do endereço From (noreply / marketing).
 */
export function resolveCrmEmailReplyTo(
  consultoraEmail: string | null | undefined,
  options?: { leadId?: string | null },
): string | undefined {
  const inbound = process.env.RESEND_INBOUND_REPLY_TO?.trim();
  if (inbound) {
    const lid = options?.leadId?.trim();
    if (lid && LEAD_UUID_RE.test(lid)) {
      const tagged = replyToWithLeadTag(inbound, lid);
      if (tagged) return tagged;
    }
    if (inbound.includes("<") && inbound.includes(">")) return inbound;
    if (/^[^\s<>"']+@[^\s<>"']+\.[^\s<>"']+$/.test(inbound)) {
      return `Respostas <${inbound}>`;
    }
    return inbound;
  }
  const u = consultoraEmail?.trim();
  return u || undefined;
}

/**
 * Remetente Resend para campanhas promo (CRM → Inscritos).
 * Usa `RESEND_PROMO_FROM` se existir (recomendado: domínio de envio em massa verificado),
 * senão `RESEND_FROM` (o mesmo dos orçamentos).
 */
export function resolvePromoCampaignResendFrom(): string | null {
  const promo = process.env.RESEND_PROMO_FROM?.trim();
  if (promo) return promo;
  return process.env.RESEND_FROM?.trim() || null;
}
