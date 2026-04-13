"use client";

const STORAGE_KEY = "vs_campanha_token_v1";

/** Guarda o token da URL na sessão do browser para o POST do quiz. */
export function stashCampaignTokenFromSearchParams(
  searchParams: URLSearchParams,
): void {
  const t = searchParams.get("campanha_token");
  if (!t || t.length < 8 || t.length > 4000) return;
  try {
    sessionStorage.setItem(STORAGE_KEY, t);
  } catch {
    /* quota / private mode */
  }
}

export function campaignTokenPayloadForLead(): { campanha_token?: string } {
  try {
    const t = sessionStorage.getItem(STORAGE_KEY);
    if (!t) return {};
    return { campanha_token: t };
  } catch {
    return {};
  }
}
