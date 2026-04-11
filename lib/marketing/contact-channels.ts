"use client";

export type ContactChannelLinks = {
  email: string | null;
  whatsapp: string | null;
  instagram: string | null;
};

function isWhatsAppUrl(u: string): boolean {
  const s = u.toLowerCase();
  return (
    s.includes("wa.me") ||
    s.includes("whatsapp.com") ||
    s.includes("api.whatsapp.com")
  );
}

/**
 * Ligações para os ícones de contacto no pedido de orçamento.
 * Email: env ou URL mailto: no CMS.
 * WhatsApp: env ou URL wa.me / whatsapp no campo principal do CMS.
 * Instagram: campo próprio no CMS ou NEXT_PUBLIC_CONTACT_INSTAGRAM_URL.
 */
export function resolveContactChannels(
  cmsPrimaryUrl: string | undefined,
  cmsInstagramUrl: string | undefined,
): ContactChannelLinks {
  const primary = cmsPrimaryUrl?.trim() ?? "";
  const igCms = cmsInstagramUrl?.trim() ?? "";

  let email: string | null = null;
  if (primary.startsWith("mailto:")) {
    email = primary;
  } else {
    const em = process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim();
    if (em && em.includes("@")) {
      email = `mailto:${em}`;
    }
  }

  let whatsapp: string | null =
    process.env.NEXT_PUBLIC_CONTACT_WHATSAPP_URL?.trim() || null;
  if (primary && isWhatsAppUrl(primary)) {
    whatsapp = primary.startsWith("http") ? primary : `https://${primary}`;
  }

  let instagram: string | null = null;
  if (igCms) {
    instagram = igCms.startsWith("http") ? igCms : `https://${igCms}`;
  } else {
    const igEnv = process.env.NEXT_PUBLIC_CONTACT_INSTAGRAM_URL?.trim();
    if (igEnv) {
      instagram = igEnv.startsWith("http") ? igEnv : `https://${igEnv}`;
    }
  }

  return { email, whatsapp, instagram };
}

export function hasAnyContactChannel(c: ContactChannelLinks): boolean {
  return Boolean(c.email || c.whatsapp || c.instagram);
}
