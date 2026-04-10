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
