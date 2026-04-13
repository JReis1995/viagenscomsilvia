import { createHmac, timingSafeEqual } from "node:crypto";

/** Corpo assinado no parâmetro `campanha_token` (URL + POST /api/leads). */
export type CampaignTokenPayload = {
  /** UUID da campanha (`promo_campaigns.id`). */
  c: string;
  /** Email do destinatário (minúsculas, trim). */
  e: string;
  /** Expiração Unix (segundos), alinhada com `promo_campaigns.expires_at`. */
  x: number;
};

function isUuid(v: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    v,
  );
}

export function normalizeCampaignEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Token = base64url(JSON).base64url(HMAC-SHA256(secret, base64url(JSON))).
 * Usar `CAMPAIGN_LINK_SECRET` no servidor (nunca expor ao cliente).
 */
export function signCampaignRecipientToken(
  payload: CampaignTokenPayload,
  secret: string,
): string {
  const encoded = Buffer.from(JSON.stringify(payload), "utf8").toString(
    "base64url",
  );
  const sig = createHmac("sha256", secret)
    .update(encoded)
    .digest("base64url");
  return `${encoded}.${sig}`;
}

export function verifyCampaignRecipientToken(
  token: string,
  secret: string,
): CampaignTokenPayload | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [encoded, sig] = parts;
  if (!encoded || !sig || encoded.length > 6000) return null;
  const expected = createHmac("sha256", secret)
    .update(encoded)
    .digest("base64url");
  try {
    const a = Buffer.from(sig, "utf8");
    const b = Buffer.from(expected, "utf8");
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
  } catch {
    return null;
  }
  if (
    !parsed ||
    typeof parsed !== "object" ||
    typeof (parsed as CampaignTokenPayload).c !== "string" ||
    typeof (parsed as CampaignTokenPayload).e !== "string" ||
    typeof (parsed as CampaignTokenPayload).x !== "number"
  ) {
    return null;
  }
  const o = parsed as CampaignTokenPayload;
  if (!isUuid(o.c)) return null;
  if (Math.floor(Date.now() / 1000) > o.x) return null;
  return o;
}
