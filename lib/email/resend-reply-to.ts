/**
 * Reply-To nos emails enviados à lead (Resend + histórico).
 * Se `RESEND_INBOUND_REPLY_TO` estiver definido, as respostas entram na Resend
 * (Inbound → webhook → histórico). Caso contrário usa o email da consultora.
 *
 * Formato `Nome <email@dominio.com>` ajuda alguns clientes a usarem Reply-To em
 * vez do endereço From (noreply / marketing).
 */
export function resolveCrmEmailReplyTo(
  consultoraEmail: string | null | undefined,
): string | undefined {
  const inbound = process.env.RESEND_INBOUND_REPLY_TO?.trim();
  if (inbound) {
    if (inbound.includes("<") && inbound.includes(">")) return inbound;
    if (/^[^\s<>"']+@[^\s<>"']+\.[^\s<>"']+$/.test(inbound)) {
      return `Respostas <${inbound}>`;
    }
    return inbound;
  }
  const u = consultoraEmail?.trim();
  return u || undefined;
}
