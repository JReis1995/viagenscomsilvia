import type { LeadBoardStatus } from "@/lib/crm/lead-board";

/**
 * Textos para a área do cliente — alinhados com `leads.status` do CRM,
 * sem jargão interno («Nova Lead», «Ganho», etc.).
 */
const CLIENT_LABELS: Record<LeadBoardStatus, string> = {
  "Nova Lead": "Pedido recebido",
  "Em contacto": "A preparar a tua proposta",
  "Proposta enviada": "Proposta enviada",
  Ganho: "Viagem confirmada",
  Cancelado: "Pedido cancelado",
  Arquivado: "Sem seguimento activo",
};

const FALLBACK = "Estado a atualizar";

const NORMALIZED_KEYS = new Map<string, LeadBoardStatus>();
for (const key of Object.keys(CLIENT_LABELS) as LeadBoardStatus[]) {
  NORMALIZED_KEYS.set(normalizeStatusKey(key), key);
}

function normalizeStatusKey(status: string): string {
  return status
    .replace(/\u00a0/g, " ")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function resolveCanonicalStatus(raw: string): LeadBoardStatus | null {
  const n = normalizeStatusKey(raw);
  if (!n) return null;
  return NORMALIZED_KEYS.get(n) ?? null;
}

export function leadStatusLabelForClient(status: string): string {
  const canonical = resolveCanonicalStatus(status);
  if (canonical) return CLIENT_LABELS[canonical];
  return FALLBACK;
}
