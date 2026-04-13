function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Corpo HTML simples a partir de texto com quebras de linha + um link destacado. */
export function buildPromoCampaignEmailHtml(opts: {
  textBody: string;
  /** URL principal da campanha (CTA). */
  ctaUrl: string;
}): { html: string; text: string } {
  const safeLines = opts.textBody
    .split(/\r?\n/)
    .map((line) => escapeHtml(line.trimEnd()))
    .join("<br />\n");
  const safeCta = escapeHtml(opts.ctaUrl);
  const html = `
<div style="font-family:system-ui,-apple-system,sans-serif;font-size:15px;line-height:1.5;color:#1a1a1a;">
${safeLines}
<p style="margin-top:20px;"><a href="${safeCta}" style="color:#0c4a6e;font-weight:600;">Abrir formulário de pedido</a></p>
<p style="margin-top:24px;font-size:12px;color:#666;">Recebeste este email porque autorizaste alertas de promoções na tua conta. Podes desativar em «A minha conta».</p>
</div>`.trim();
  return {
    html,
    text: `${opts.textBody}\n\n${opts.ctaUrl}\n`,
  };
}
