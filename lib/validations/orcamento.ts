import { z } from "zod";

const linkUtilIn = z.object({
  label: z.string().trim().min(1).max(200),
  url: z.string().trim().min(1).max(2048),
});

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
  data_inicio: z.string().trim().max(40).optional().nullable(),
  data_fim: z.string().trim().max(40).optional().nullable(),
  links_uteis: z.array(linkUtilIn).max(24).optional(),
  galeria_urls: z.array(z.string().trim().min(1).max(2048)).max(40).optional(),
  slug_destino: z.string().trim().max(120).optional().nullable(),
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),
});

export type EnviarOrcamentoInput = z.infer<typeof enviarOrcamentoSchema>;

export function parseIncluiLines(raw: string): string[] {
  return raw
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}
