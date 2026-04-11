"use server";

import { isConsultoraEmailAsync } from "@/lib/auth/consultora";
import { resolvePostLoginPath } from "@/lib/auth/redirect";
import { createClient } from "@/lib/supabase/server";

/** Após `signInWithPassword` — destino conforme env `CONSULTORA_EMAIL` ou `configuracoes_globais`. */
export async function resolvePostLoginRedirect(
  email: string,
  next: string | null,
): Promise<string> {
  const supabase = await createClient();
  const isConsultora = await isConsultoraEmailAsync(email, supabase);
  return resolvePostLoginPath(next, isConsultora);
}
