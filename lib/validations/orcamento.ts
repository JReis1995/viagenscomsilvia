import { z } from "zod";

/** Corpo do POST ao enviar orçamento por email (CRM). */
export const enviarOrcamentoSchema = z.object({
  titulo: z.string().trim().min(1, "Indica um título.").max(200),
  destino: z.string().trim().min(1, "Indica o destino.").max(500),
  datas: z.string().trim().min(1, "Indica as datas ou período.").max(500),
  inclui: z.string().trim().max(4000),
  valor_total: z.string().trim().min(1, "Indica o valor total.").max(200),
  notas: z.string().trim().max(4000).optional(),
  atualizar_estado: z.boolean().optional().default(true),
  /** Só gera PDF para pré-visualização — sem email nem gravação na BD */
  apenas_previzualizar: z.boolean().optional().default(false),
});

export type EnviarOrcamentoInput = z.infer<typeof enviarOrcamentoSchema>;

export function parseIncluiLines(raw: string): string[] {
  return raw
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}
