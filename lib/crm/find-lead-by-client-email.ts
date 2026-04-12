import type { SupabaseClient } from "@supabase/supabase-js";

import { stripGmailPlusAddressing } from "@/lib/crm/normalize-client-email";

async function leadIdByEmailIlike(
  db: SupabaseClient,
  address: string,
): Promise<string | null> {
  const normalized = address.trim().toLowerCase();
  if (!normalized || !normalized.includes("@")) return null;

  const { data, error } = await db
    .from("leads")
    .select("id")
    .ilike("email", normalized)
    .order("data_pedido", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data?.id) return null;
  return data.id;
}

/** Lead mais recente com este email (pedidos repetidos do mesmo cliente). */
export async function findLatestLeadIdByClientEmail(
  db: SupabaseClient,
  email: string,
): Promise<string | null> {
  const normalized = email.trim().toLowerCase();
  const stripped = stripGmailPlusAddressing(normalized);

  const first = await leadIdByEmailIlike(db, normalized);
  if (first) return first;
  if (stripped !== normalized) {
    return leadIdByEmailIlike(db, stripped);
  }
  return null;
}
