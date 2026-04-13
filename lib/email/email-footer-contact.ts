import { escapeHtml } from "@/lib/email/html";
import {
  CONSULTORA_PUBLIC_EMAIL,
  getClientAreaAbsoluteUrl,
  getInstagramProfileUrl,
  getSiteOrigin,
  getTikTokProfileUrl,
} from "@/lib/site/social";

export type IconFooterItem = {
  href: string;
  title: string;
  symbol: string;
};

/**
 * Links do rodapé (HTML com ícones; `title` para hover e leitores de ecrã).
 * Seguro para usar em rotas de servidor (só env + helpers sem "use client").
 */
export function getCrmEmailFooterIconItems(): IconFooterItem[] {
  const items: IconFooterItem[] = [];

  items.push({ href: getSiteOrigin(), title: "Site", symbol: "🌐" });
  items.push({
    href: getClientAreaAbsoluteUrl(),
    title: "Área de cliente",
    symbol: "🔐",
  });

  const em = process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim();
  const emailAddr = em?.includes("@") ? em : CONSULTORA_PUBLIC_EMAIL;
  items.push({
    href: `mailto:${emailAddr}`,
    title: emailAddr,
    symbol: "✉️",
  });

  const wa = process.env.NEXT_PUBLIC_CONTACT_WHATSAPP_URL?.trim();
  if (wa) {
    const href = wa.startsWith("http") ? wa : `https://${wa}`;
    items.push({ href, title: "WhatsApp", symbol: "💬" });
  }

  const tel = process.env.NEXT_PUBLIC_CONSULTORA_TELEFONE_DISPLAY?.trim();
  if (tel) {
    const compact = tel.replace(/[^\d+]/g, "");
    const href =
      compact.length >= 3 ? `tel:${compact}` : `tel:${tel.replace(/\s/g, "")}`;
    items.push({ href, title: tel, symbol: "📞" });
  }

  items.push({
    href: getInstagramProfileUrl(),
    title: "Instagram",
    symbol: "📷",
  });
  items.push({
    href: getTikTokProfileUrl(),
    title: "TikTok",
    symbol: "🎵",
  });

  return items;
}

const ICON_LINK_STYLE =
  "display:inline-block;margin:0 5px;color:#1d7a72;font-size:19px;line-height:1;text-decoration:none;vertical-align:middle;";

export function buildIconFooterRowHtml(items: IconFooterItem[]): string {
  return items
    .map(
      (i) =>
        `<a href="${escapeHtml(i.href)}" title="${escapeHtml(i.title)}" style="${ICON_LINK_STYLE}">${i.symbol}</a>`,
    )
    .join("");
}

export function buildIconFooterPlainText(items: IconFooterItem[]): string {
  return items.map((i) => `${i.symbol} ${i.href}`).join("\n");
}
