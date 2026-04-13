import type { SupabaseClient, User } from "@supabase/supabase-js";

export type CrmSubscriberRow = {
  id: string;
  email: string;
  createdAt: string;
  /** `null` = sem linha em `promo_alert_prefs` (nunca definiu). */
  promoOptIn: boolean | null;
  displayName: string | null;
};

type PromoPrefRow = {
  user_id: string;
  opt_in: boolean;
  email: string;
};

/**
 * Lista utilizadores Auth + opt-in promo (`promo_alert_prefs`).
 * Requer cliente com service role (`auth.admin`).
 * O CRM pode alterar opt-in/nome e eliminar conta — ver `subscribers-actions.ts`.
 */
export async function fetchCrmSubscribers(
  db: SupabaseClient,
): Promise<{ rows: CrmSubscriberRow[]; error: string | null }> {
  const users: User[] = [];
  let page = 1;
  const perPage = 200;

  try {
    while (true) {
      const { data, error } = await db.auth.admin.listUsers({
        page,
        perPage,
      });
      if (error) {
        return { rows: [], error: error.message };
      }
      const batch = data.users ?? [];
      users.push(...batch);
      if (batch.length < perPage) break;
      page += 1;
      if (page > 500) {
        return {
          rows: [],
          error: "Limite de páginas de utilizadores excedido (contacta suporte técnico).",
        };
      }
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { rows: [], error: msg };
  }

  const { data: prefsData, error: prefError } = await db
    .from("promo_alert_prefs")
    .select("user_id, opt_in, email");

  if (prefError) {
    return { rows: [], error: prefError.message };
  }

  const prefMap = new Map<string, PromoPrefRow>();
  for (const p of (prefsData ?? []) as PromoPrefRow[]) {
    prefMap.set(p.user_id, p);
  }

  const rows: CrmSubscriberRow[] = users
    .filter((u) => typeof u.email === "string" && u.email.trim().length > 0)
    .map((u) => {
      const meta = u.user_metadata as Record<string, unknown> | undefined;
      const name =
        (typeof meta?.full_name === "string" && meta.full_name.trim()) ||
        (typeof meta?.name === "string" && meta.name.trim()) ||
        null;
      const pref = prefMap.get(u.id);
      return {
        id: u.id,
        email: u.email!.trim(),
        createdAt: u.created_at,
        promoOptIn: pref ? pref.opt_in : null,
        displayName: name,
      };
    })
    .sort((a, b) => a.email.localeCompare(b.email, "pt"));

  return { rows, error: null };
}

export async function fetchPostsForCampaignSelect(
  db: SupabaseClient,
): Promise<{ id: string; titulo: string }[]> {
  const { data, error } = await db
    .from("posts")
    .select("id, titulo")
    .order("titulo", { ascending: true });

  if (error || !data) return [];
  return data
    .filter(
      (r): r is { id: string; titulo: string } =>
        typeof r.id === "string" && typeof r.titulo === "string",
    )
    .map((r) => ({ id: r.id, titulo: r.titulo.trim() || "(sem título)" }));
}
