import type { SupabaseClient } from "@supabase/supabase-js";

import {
  normalizeCampaignEmail,
  verifyCampaignRecipientToken,
} from "@/lib/crm/campaign-link";

/**
 * Se o token for válido, a campanha existir, não estiver expirada e o email
 * coincidir com o do formulário, devolve `promo_campaigns.id` para gravar na lead.
 */
export async function resolvePromoCampaignIdForLead(opts: {
  db: SupabaseClient;
  campanhaToken: string | undefined | null;
  submitEmail: string;
}): Promise<string | null> {
  const secret = process.env.CAMPAIGN_LINK_SECRET?.trim();
  const raw = typeof opts.campanhaToken === "string" ? opts.campanhaToken.trim() : "";
  if (!secret || !raw) return null;

  const payload = verifyCampaignRecipientToken(raw, secret);
  if (!payload) return null;

  const emailNorm = normalizeCampaignEmail(opts.submitEmail);
  if (payload.e !== emailNorm) return null;

  const { data: camp, error } = await opts.db
    .from("promo_campaigns")
    .select("id, expires_at")
    .eq("id", payload.c)
    .maybeSingle();

  if (error || !camp?.id || !camp.expires_at) return null;

  const now = Date.now();
  if (new Date(camp.expires_at).getTime() < now) return null;
  if (payload.x * 1000 < now) return null;

  return camp.id;
}
