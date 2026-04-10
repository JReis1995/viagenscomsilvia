/**
 * Imagens JPEG (Unsplash) para capa/rodapé do PDF e hero do email.
 * Opcional: sobrescrever com NEXT_PUBLIC_PROPOSAL_* no .env
 */
export const PROPOSAL_BANNER_JPG =
  process.env.NEXT_PUBLIC_PROPOSAL_PDF_BANNER_URL?.trim() ||
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1400&q=88&fm=jpg&fit=crop";

export const PROPOSAL_ACCENT_JPG =
  process.env.NEXT_PUBLIC_PROPOSAL_PDF_ACCENT_URL?.trim() ||
  "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=800&q=88&fm=jpg&fit=crop";

export async function fetchProposalJpeg(url: string): Promise<Uint8Array | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(12_000) });
    if (!res.ok) return null;
    return new Uint8Array(await res.arrayBuffer());
  } catch {
    return null;
  }
}
