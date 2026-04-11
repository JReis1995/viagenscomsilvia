"use client";

import {
  hasAnyContactChannel,
  resolveContactChannels,
} from "@/lib/marketing/contact-channels";

/** Primeiro link útil (WhatsApp → email → Instagram) — legado / atalhos. */
export function resolveFalarComSilviaHref(
  cmsUrl: string | undefined,
  cmsInstagramUrl?: string | undefined,
): string | null {
  const c = resolveContactChannels(cmsUrl, cmsInstagramUrl);
  return c.whatsapp ?? c.email ?? c.instagram;
}

export { hasAnyContactChannel, resolveContactChannels };
