/** Extrai o endereço de email de um cabeçalho From típico (`Nome <a@b.pt>`). */
export function parseFromEmailHeader(from: string): string | null {
  const t = from.trim();
  if (!t) return null;
  const angled = t.match(/<([^>]+)>/);
  if (angled?.[1]) {
    const inner = angled[1].trim().toLowerCase();
    if (inner.includes("@")) return inner;
  }
  const bare = t.match(/([\w.+-]+@[\w.-]+\.[a-z]{2,})/i);
  return bare ? bare[1].trim().toLowerCase() : null;
}
