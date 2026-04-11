import { z } from "zod";

const linkUtil = z.object({
  label: z.string(),
  url: z.string(),
});

/** Estrutura gravada em `leads.detalhes_proposta` (JSONB). */
export const detalhesPropostaSchema = z.object({
  titulo: z.string(),
  destino: z.string(),
  datas: z.string(),
  inclui: z.array(z.string()),
  valor_total: z.string(),
  notas: z.string().optional(),
  enviado_em: z.string(),
  /** ISO date (yyyy-mm-dd) — início da viagem para contador / meteo */
  data_inicio: z.string().optional(),
  data_fim: z.string().optional(),
  links_uteis: z.array(linkUtil).optional(),
  galeria_urls: z.array(z.string()).optional(),
  /** Cruzar com `posts.slug_destino` na área do cliente */
  slug_destino: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

export type DetalhesProposta = z.infer<typeof detalhesPropostaSchema>;

export function parseDetalhesProposta(
  raw: unknown,
): DetalhesProposta | null {
  const r = detalhesPropostaSchema.safeParse(raw);
  return r.success ? r.data : null;
}
