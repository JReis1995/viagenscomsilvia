import { parseFromEmailHeader } from "@/lib/crm/parse-from-email";

/** UUID na parte local: `conta+<uuid>@domínio` (Reply-To por lead). */
const LEAD_UUID_IN_LOCAL = /\+([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})@/i;

function tagFromRawAddress(raw: string): string | null {
  const email = parseFromEmailHeader(raw) ?? raw.trim().toLowerCase();
  const m = email.match(LEAD_UUID_IN_LOCAL);
  return m ? m[1].toLowerCase() : null;
}

function tagFromFreeText(s: string): string | null {
  const m = s.match(LEAD_UUID_IN_LOCAL);
  return m ? m[1].toLowerCase() : null;
}

/**
 * Extrai o id da lead dos destinatários de um email recebido na caixa inbound Resend.
 * Usado pelo webhook quando o Reply-To inclui `+{leadId}` antes do @.
 */
export function extractLeadIdFromRecipientLists(
  lists: ReadonlyArray<string[] | undefined | null>,
): string | null {
  for (const list of lists) {
    if (!list?.length) continue;
    for (const raw of list) {
      if (typeof raw !== "string") continue;
      const id = tagFromRawAddress(raw);
      if (id) return id;
    }
  }
  return null;
}

/**
 * Alguns MTAs não expõem o `+uuid` no campo `to` da API; ficam em Delivered-To,
 * X-Original-To, envelope, etc. Percorremos todos os cabeçalhos em texto.
 */
export function extractLeadIdFromEmailHeaders(
  headers: Record<string, unknown> | null | undefined,
): string | null {
  if (!headers || typeof headers !== "object") return null;
  for (const v of Object.values(headers)) {
    if (typeof v === "string") {
      const id = tagFromFreeText(v);
      if (id) return id;
    } else if (Array.isArray(v)) {
      for (const item of v) {
        if (typeof item !== "string") continue;
        const id = tagFromFreeText(item);
        if (id) return id;
      }
    }
  }
  return null;
}

/**
 * Ordem: destinatários explícitos → reply_to da mensagem recebida → cabeçalhos brutos.
 */
export function extractTaggedLeadIdFromResendReceived(payload: {
  webhookTo?: string[] | null;
  webhookCc?: string[] | null;
  webhookBcc?: string[] | null;
  received: {
    to?: string[] | null;
    cc?: string[] | null;
    bcc?: string[] | null;
    reply_to?: string[] | null;
    headers?: Record<string, unknown> | null;
  };
}): string | null {
  const w = payload.webhookTo;
  const wc = payload.webhookCc;
  const wb = payload.webhookBcc;
  const r = payload.received;

  const fromLists = extractLeadIdFromRecipientLists([
    w,
    wc,
    wb,
    r.to,
    r.cc,
    r.bcc,
    r.reply_to,
  ]);
  if (fromLists) return fromLists;

  return extractLeadIdFromEmailHeaders(r.headers ?? null);
}
