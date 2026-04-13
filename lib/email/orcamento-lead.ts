import type { DetalhesProposta } from "@/lib/crm/detalhes-proposta";
import {
  buildIconFooterPlainText,
  buildIconFooterRowHtml,
  getCrmEmailFooterIconItems,
} from "@/lib/email/email-footer-contact";
import { escapeHtml } from "@/lib/email/html";
import { resolveProposalImageUrls } from "@/lib/pdf/travel-assets";
import { BRAND_MARK } from "@/lib/site/brand";

function summaryIconRow(symbol: string, innerHtml: string): string {
  return `<tr>
    <td style="width:30px;vertical-align:top;padding:0 10px 16px 0;font-size:17px;line-height:1.35;">${symbol}</td>
    <td style="padding:0 0 16px 0;vertical-align:top;">${innerHtml}</td>
  </tr>`;
}

export function buildOrcamentoLeadEmail(
  nomeLead: string,
  p: DetalhesProposta,
): { subject: string; html: string; text: string } {
  const subject = `${p.titulo} · ${BRAND_MARK}`;

  const lista = p.inclui.length
    ? p.inclui.map((i) => `- ${i}`).join("\n")
    : "- (ver PDF em anexo)";

  const footerItems = getCrmEmailFooterIconItems();
  const footerTextBlock = buildIconFooterPlainText(footerItems);

  const text = `Olá ${nomeLead},

Em anexo tens a proposta em PDF com o resumo da viagem.

Resumo:
📍 Destino: ${p.destino}
🗓 Datas: ${p.datas}
📋 Inclui:
${lista}
💶 Total: ${p.valor_total}
${p.notas?.trim() ? `📝 Notas: ${p.notas}\n` : ""}
Qualquer dúvida ou ajuste, responde a esta mensagem.

${footerTextBlock}

${BRAND_MARK}`;

  const bannerSrc = escapeHtml(resolveProposalImageUrls(p).bannerUrl);
  const incluiHtml = p.inclui.length
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:4px 0 0 0;">${p.inclui
        .map(
          (i) =>
            `<tr><td style="width:18px;vertical-align:top;color:#d9785c;font-size:13px;">▸</td><td style="font-size:15px;line-height:1.5;color:#0f3d39;padding-bottom:6px;">${escapeHtml(i)}</td></tr>`,
        )
        .join("")}</table>`
    : `<p style="margin:8px 0 0 0;font-size:14px;color:#1d7a72;">Detalhes completos no PDF anexo.</p>`;

  const notasBlock = p.notas?.trim()
    ? summaryIconRow(
        "📝",
        `<p style="margin:0;font-size:14px;color:#1d7a72;line-height:1.55;">${escapeHtml(p.notas.trim())}</p>`,
      )
    : "";

  const summaryInner = `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
    ${summaryIconRow(
      "📍",
      `<p style="margin:0;font-size:15px;line-height:1.45;color:#0f3d39;">${escapeHtml(p.destino)}</p>`,
    )}
    ${summaryIconRow(
      "🗓",
      `<p style="margin:0;font-size:15px;line-height:1.45;color:#0f3d39;">${escapeHtml(p.datas)}</p>`,
    )}
    ${summaryIconRow("📋", `<div style="margin:0;">${incluiHtml}</div>`)}
    ${summaryIconRow(
      "💶",
      `<p style="margin:0;font-size:20px;font-weight:600;color:#0f3d39;">${escapeHtml(p.valor_total)}</p>`,
    )}
    ${notasBlock}
  </table>`;

  const iconFooterHtml = buildIconFooterRowHtml(footerItems);

  const html = `
<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(p.titulo)}</title>
</head>
<body style="margin:0;padding:0;background-color:#f5f3ef;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f3ef;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(15,61,57,0.08);">
          <tr>
            <td style="padding:0;line-height:0;">
              <img src="${bannerSrc}" alt="" width="600" style="display:block;width:100%;max-width:600px;height:auto;border:0;" />
            </td>
          </tr>
          <tr>
            <td style="height:4px;background-color:#d9785c;line-height:0;font-size:0;">&nbsp;</td>
          </tr>
          <tr>
            <td style="padding:28px 32px 8px 32px;">
              <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:22px;letter-spacing:0.02em;color:#0f3d39;">
                ${escapeHtml(BRAND_MARK)}
              </p>
              <p style="margin:6px 0 0 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:11px;text-transform:uppercase;letter-spacing:0.2em;color:#d9785c;">
                proposta de viagem
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 32px 24px 32px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:16px;line-height:1.65;color:#0f3d39;">
              <p style="margin:0 0 12px 0;">Olá <strong>${escapeHtml(nomeLead)}</strong>,</p>
              <p style="margin:0 0 18px 0;font-family:Georgia,'Times New Roman',serif;font-size:22px;line-height:1.35;letter-spacing:0.01em;color:#0f3d39;">
                ${escapeHtml(p.titulo)}
              </p>
              <p style="margin:0 0 20px 0;color:#1d7a72;">Enviamos em <strong>anexo o PDF</strong> com todos os detalhes. Segue um resumo para consulta rápida.</p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f3ef;border-radius:12px;border:1px solid #d4ebe7;">
                <tr>
                  <td style="padding:20px 22px;">
                    ${summaryInner}
                  </td>
                </tr>
              </table>
              <p style="margin:24px 0 0 0;font-size:14px;color:#1d7a72;">Para alterações ou dúvidas, responde a esta mensagem.</p>
              <p style="margin:20px 0 0 0;padding-top:14px;border-top:1px solid #d4ebe7;font-size:13px;line-height:1.5;color:#1d7a72;text-align:center;">
                ${iconFooterHtml}
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px 28px 32px;background-color:#eef7f5;border-top:1px solid #d4ebe7;text-align:center;">
              <p style="margin:0;font-family:Georgia,serif;font-size:13px;letter-spacing:0.04em;color:#0f3d39;">${escapeHtml(BRAND_MARK)}</p>
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
