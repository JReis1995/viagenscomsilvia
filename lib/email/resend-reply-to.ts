/**
 * Reply-To nos emails enviados à lead (CRM + orçamento PDF).
 * Se `RESEND_INBOUND_REPLY_TO` estiver definido, as respostas entram na Resend
 * (Inbound → webhook → histórico). Caso contrário usa o email da consultora.
 */
export function resolveCrmEmailReplyTo(
  consultoraEmail: string | null | undefined,
): string | undefined {
  const inbound = process.env.RESEND_INBOUND_REPLY_TO?.trim();
  if (inbound) return inbound;
  const u = consultoraEmail?.trim();
  return u || undefined;
}
