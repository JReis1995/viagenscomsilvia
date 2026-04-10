import { z } from "zod";

/** Estrutura gravada em `leads.detalhes_proposta` (JSONB). */
export const detalhesPropostaSchema = z.object({
  titulo: z.string(),
  destino: z.string(),
  datas: z.string(),
  inclui: z.array(z.string()),
  valor_total: z.string(),
  notas: z.string().optional(),
  enviado_em: z.string(),
});

export type DetalhesProposta = z.infer<typeof detalhesPropostaSchema>;

export function parseDetalhesProposta(
  raw: unknown,
): DetalhesProposta | null {
  const r = detalhesPropostaSchema.safeParse(raw);
  return r.success ? r.data : null;
}
