import { resolvePostLoginPath } from "@/lib/auth/redirect";

function normalizedConsultoraEmails(raw: string): string[] {
  return raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Mesma lista que `CONSULTORA_EMAIL` no servidor, exposta como
 * `NEXT_PUBLIC_CONSULTORA_EMAIL` para fallback do login se o pedido à API falhar.
 */
export function resolvePostLoginPathUsingPublicEnv(
  email: string,
  next: string | null,
): string | null {
  const raw = process.env.NEXT_PUBLIC_CONSULTORA_EMAIL?.trim() ?? "";
  if (!raw) return null;
  const list = normalizedConsultoraEmails(raw);
  if (list.length === 0) return null;
  const isConsultora = list.includes(email.trim().toLowerCase());
  return resolvePostLoginPath(next, isConsultora);
}
