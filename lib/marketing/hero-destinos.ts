import type { PublishedPost } from "@/types/post";

/** Remove prefixo de seed interno para apresentação ao visitante. */
export function displayPostTitle(titulo: string): string {
  return titulo
    .replace(/^\s*EXEMPLO\s*[—\-]\s*apagar\s*\|\s*/i, "")
    .trim() || titulo.trim();
}

/** Destinos únicos derivados das publicações visíveis (ordenados). */
export function destinoLabelsFromPosts(posts: PublishedPost[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const p of posts) {
    const label = displayPostTitle(p.titulo);
    if (!label) continue;
    const key = label.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(label);
  }
  out.sort((a, b) => a.localeCompare(b, "pt"));
  return out;
}
