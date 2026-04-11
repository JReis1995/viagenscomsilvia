import type { SiteContent } from "@/lib/site/site-content";

/** localStorage — rascunho da página inicial para /crm/site/preview (partilhado entre abas) */
export const SITE_PREVIEW_STORAGE_KEY = "vcs-site-preview-draft-v1";

/** Disparado na mesma aba após gravar o rascunho (o evento `storage` só chega a outras abas). */
export const SITE_PREVIEW_UPDATED_EVENT = "vcs-site-preview-updated";

export function pushSitePreviewDraftToStorage(site: SiteContent): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      SITE_PREVIEW_STORAGE_KEY,
      JSON.stringify(site),
    );
    window.dispatchEvent(new Event(SITE_PREVIEW_UPDATED_EVENT));
  } catch {
    /* ignore quota / private mode */
  }
}
