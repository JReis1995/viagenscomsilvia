import { escapeHtml } from "@/lib/email/html";
import { BRAND_MARK } from "@/lib/site/brand";

function bodyTextToHtmlParagraphs(text: string): string {
  const blocks = text.trim().split(/\n{2,}/);
  return blocks
    .map((block) => {
      const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
      const inner = lines.map((l) => escapeHtml(l)).join("<br />");
      return `<p style="margin:0 0 14px 0;font-size:16px;line-height:1.65;color:#0f3d39;">${inner}</p>`;
    })
    .join("");
}

/**
 * Email minimalista alinhado com propostas (cores oceano / terracotta).
 */
export function buildCrmConsultoraToLeadEmail(
  nomeLead: string,
  subjectLine: string,
  bodyText: string,
): { subject: string; html: string; text: string } {
  const subj = subjectLine.trim();
  const subject = `${subj} · ${BRAND_MARK}`;
  const greeting = nomeLead.trim()
    ? `Olá <strong>${escapeHtml(nomeLead.trim())}</strong>,`
    : "Olá,";
  const bodyHtml = bodyTextToHtmlParagraphs(bodyText.trim());

  const text = `${subj}\n\nOlá ${nomeLead.trim() || "cliente"},\n\n${bodyText.trim()}\n\n—\n${BRAND_MARK}`;

  const html = `
<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(subj)}</title>
</head>
<body style="margin:0;padding:0;background-color:#f5f3ef;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f3ef;padding:28px 14px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 4px 28px rgba(15,61,57,0.07);">
          <tr>
            <td style="height:3px;background-color:#d9785c;line-height:0;font-size:0;">&nbsp;</td>
          </tr>
          <tr>
            <td style="padding:26px 28px 6px 28px;">
              <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:20px;letter-spacing:0.03em;color:#0f3d39;">
                ${escapeHtml(BRAND_MARK)}
              </p>
              <p style="margin:8px 0 0 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:10px;text-transform:uppercase;letter-spacing:0.18em;color:#d9785c;">
                mensagem da tua consultora
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 28px 8px 28px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
              <p style="margin:0 0 18px 0;font-size:16px;line-height:1.6;color:#1d7a72;">${greeting}</p>
              ${bodyHtml}
              <p style="margin:22px 0 0 0;font-size:14px;line-height:1.55;color:#1d7a72;">Podes responder a este email com dúvidas ou pedidos de ajuste.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:18px 28px 24px 28px;background-color:#eef7f5;border-top:1px solid #d4ebe7;">
              <p style="margin:0;font-family:Georgia,serif;font-size:12px;letter-spacing:0.06em;color:#0f3d39;text-align:center;">
                ${escapeHtml(BRAND_MARK)}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();

  return { subject, html, text };
}
