import type { SupabaseClient } from "@supabase/supabase-js";

import { isConsultoraEmailAsync } from "@/lib/auth/consultora";
import { resolvePostLoginPath } from "@/lib/auth/redirect";

export async function computePostLoginPath(
  supabase: SupabaseClient,
  next: string | null,
): Promise<{ path: string } | { error: "no_user" }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) {
    return { error: "no_user" };
  }
  const isConsultora = await isConsultoraEmailAsync(user.email, supabase);
  return { path: resolvePostLoginPath(next, isConsultora) };
}
