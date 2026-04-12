import type { SupabaseClient } from "@supabase/supabase-js";

/** Estados em que um segundo pedido pelo mesmo contacto deve ser bloqueado ou avisado. */
export const OPEN_LEAD_STATUSES = [
  "Nova Lead",
  "Em contacto",
  "Proposta enviada",
] as const;

export function normalizePhoneDigits(input: string): string {
  return input.replace(/\D/g, "");
}

/**
 * Verifica se já existe lead «em aberto» com o mesmo email (case-insensitive) ou telemóvel.
 */
export async function hasOpenDuplicateLead(
  db: SupabaseClient,
  email: string,
  telemovel: string | null | undefined,
): Promise<boolean> {
  const em = email.trim().toLowerCase();
  if (!em) return false;

  const { data: byEmail, error: e1 } = await db
    .from("leads")
    .select("id")
    .in("status", [...OPEN_LEAD_STATUSES])
    .ilike("email", em)
    .limit(1);

  if (e1) {
    console.error("[leads] duplicate check email:", e1.message);
    return false;
  }
  if (byEmail && byEmail.length > 0) return true;

  const tel = normalizePhoneDigits(telemovel?.trim() ?? "");
  if (tel.length < 9) return false;

  const { data: withPhone, error: e2 } = await db
    .from("leads")
    .select("id, telemovel")
    .in("status", [...OPEN_LEAD_STATUSES])
    .not("telemovel", "is", null);

  if (e2) {
    console.error("[leads] duplicate check phone:", e2.message);
    return false;
  }

  for (const row of withPhone ?? []) {
    const stored = normalizePhoneDigits(row.telemovel ?? "");
    if (stored.length >= 9 && stored === tel) {
      return true;
    }
  }

  return false;
}
