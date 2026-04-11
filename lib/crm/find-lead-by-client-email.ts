import type { SupabaseClient } from "@supabase/supabase-js";

/** Lead mais recente com este email (pedidos repetidos do mesmo cliente). */
export async function findLatestLeadIdByClientEmail(
  db: SupabaseClient,
  email: string,
): Promise<string | null> {
  const normalized = email.trim().toLowerCase();
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
