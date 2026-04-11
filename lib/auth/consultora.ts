import type { SupabaseClient } from "@supabase/supabase-js";

function normalizedConsultoraEmails(raw: string): string[] {
  return raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

function emailMatchesConsultoraList(
  email: string | null | undefined,
  allowed: string[],
): boolean {
  if (!email || typeof email !== "string" || allowed.length === 0) return false;
  return allowed.includes(email.trim().toLowerCase());
}

/**
 * Emails da(s) consultora(s) com acesso ao CRM (`/crm`, API de orçamentos).
 * Lê só `CONSULTORA_EMAIL` no ambiente — várias entradas separadas por vírgula.
 *
 * Em Server Components / handlers, prefere `isConsultoraEmailAsync` para também
 * usar `configuracoes_globais.consultora_email` quando a env não está definida
 * (ex.: deploy na Vercel só com variáveis públicas).
 */
export function isConsultoraEmail(email: string | null | undefined): boolean {
  const raw = process.env.CONSULTORA_EMAIL?.trim() ?? "";
  return emailMatchesConsultoraList(
    email,
    normalizedConsultoraEmails(raw),
  );
}

/**
 * Se `CONSULTORA_EMAIL` estiver definida, usa-a; senão junta `consultora_email` de
 * **todas** as linhas de `configuracoes_globais` (igual à função SQL
 * `auth_email_matches_consultora_list()` nas policies). Não usar só a primeira
 * linha: com várias linhas na tabela, `.maybeSingle()` falhava e o painel CRM
 * deixava de reconhecer a consultora enquanto a RLS ainda a tratava como tal.
 */
export async function isConsultoraEmailAsync(
  email: string | null | undefined,
  supabase: SupabaseClient,
): Promise<boolean> {
  if (!email) return false;
  if (isConsultoraEmail(email)) return true;

  const { data: rows, error } = await supabase
    .from("configuracoes_globais")
    .select("consultora_email");

  if (error) {
    console.error("[consultora]", error.message);
    return false;
  }

  for (const row of rows ?? []) {
    const raw =
      typeof row.consultora_email === "string" ? row.consultora_email : "";
    if (emailMatchesConsultoraList(email, normalizedConsultoraEmails(raw))) {
      return true;
    }
  }
  return false;
}
