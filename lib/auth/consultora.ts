/**
 * Emails da(s) consultora(s) com acesso ao CRM (`/crm`, API de orçamentos).
 * Várias entradas separadas por vírgula. Em Supabase, `configuracoes_globais.consultora_email`
 * pode listar os mesmos emails separados por vírgula (ver sql/sprint2_cms_and_consultora_rls.sql).
 */
export function isConsultoraEmail(email: string | null | undefined): boolean {
  if (!email || typeof email !== "string") return false;
  const raw = process.env.CONSULTORA_EMAIL?.trim() ?? "";
  if (!raw) return false;
  const allowed = raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return allowed.includes(email.trim().toLowerCase());
}
