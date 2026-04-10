/**
 * Evita open redirect: só caminhos relativos internos.
 */
export function safeRedirectPath(
  path: string | null,
  fallback = "/crm",
): string {
  if (
    !path ||
    !path.startsWith("/") ||
    path.startsWith("//") ||
    path.includes(":")
  ) {
    return fallback;
  }
  return path;
}

/**
 * Após login: consultora vai sobretudo para o CRM; cliente nunca para `/crm`.
 */
export function resolvePostLoginPath(
  next: string | null,
  isConsultora: boolean,
): string {
  const fallback = isConsultora ? "/crm" : "/conta";
  const p = safeRedirectPath(next, fallback);
  if (!isConsultora) {
    if (p.startsWith("/crm") || p === "/login") return "/conta";
  }
  return p;
}
