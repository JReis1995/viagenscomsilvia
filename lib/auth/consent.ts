import type { User } from "@supabase/supabase-js";

/** Versão da política aceite no ecrã de consentimento (incrementar quando o texto legal mudar). */
export const CONSENT_POLICY_VERSION = "2026-04-12";

export function userMetadataRecord(user: User | null): Record<string, unknown> {
  const m = user?.user_metadata;
  return m && typeof m === "object" && !Array.isArray(m)
    ? (m as Record<string, unknown>)
    : {};
}

/** Utilizadores sem `consent_completed` devem ver o intersticial antes de usar a Conta. */
export function clientNeedsConsentScreen(user: User | null): boolean {
  if (!user) return false;
  return userMetadataRecord(user).consent_completed !== true;
}
