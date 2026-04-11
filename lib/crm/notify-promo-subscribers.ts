import { Resend } from "resend";

import { tryCreateServiceRoleClient } from "@/lib/supabase/service-role";

/**
 * Envia um aviso simples a quem tem opt-in de promoções (nova publicação promo).
 * Falha silenciosamente se Resend ou service role não estiverem configurados.
 */
export async function notifyPromoSubscribers(opts: {
  titulo: string;
  siteOrigin: string;
}): Promise<void> {
  const sr = tryCreateServiceRoleClient();
  if (!sr.ok) return;

  const { data: rows, error } = await sr.client
    .from("promo_alert_prefs")
    .select("email")
    .eq("opt_in", true);

  if (error || !rows?.length) return;

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM?.trim();
  if (!apiKey || !from) return;

  const resend = new Resend(apiKey);
  const link = `${opts.siteOrigin.replace(/\/$/, "")}/#inspiracoes`;
  const subject = `Nova inspiração no site: ${opts.titulo}`;
  const safeTitle = escapeHtml(opts.titulo);
  const html = `
    <p>Há uma nova publicação no site da Viagens com Sílvia.</p>
    <p><strong>${safeTitle}</strong></p>
    <p><a href="${escapeHtml(link)}">Ver inspirações</a></p>
    <p style="margin-top:24px;font-size:12px;color:#666;">Recebeste este email porque ativaste alertas de promoções na tua conta. Podes desativar em «A minha conta».</p>
  `.trim();

  for (const row of rows) {
    const email = typeof row.email === "string" ? row.email.trim() : "";
    if (!email) continue;
    try {
      await resend.emails.send({
        from,
        to: email,
        subject,
        html,
        text: `Nova publicação: ${opts.titulo}\n${link}`,
      });
    } catch (e) {
      console.error("[promo-notify]", e);
    }
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
