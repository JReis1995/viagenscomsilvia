"use server";

import { isConsultoraEmail } from "@/lib/auth/consultora";
import { resolvePostLoginPath } from "@/lib/auth/redirect";

/** Após `signInWithPassword` — decide destino com base em `CONSULTORA_EMAIL`. */
export async function resolvePostLoginRedirect(
  email: string,
  next: string | null,
): Promise<string> {
  return resolvePostLoginPath(next, isConsultoraEmail(email));
}
