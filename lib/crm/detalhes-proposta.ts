import { z } from "zod";

const linkUtil = z.object({
  label: z.string(),
  url: z.string(),
});

/** Tema visual da capa (PDF + email). `neutral` = imagem genérica de viagem, sem praia. */
export const capaPresetSchema = z.enum([
  "neutral",
  "praia",
  "cidade",
  "montanha",
  "natureza",
  "cultura",
  "familia",
]);

export type CapaPreset = z.infer<typeof capaPresetSchema>;

/** Segmento de voo (ida ou volta) no PDF. */
export const pdfVooLegSchema = z.object({
  titulo: z.string().max(80).optional(),
  meta: z.string().max(500).optional(),
  partida: z.string().max(220).optional(),
  chegada: z.string().max(220).optional(),
});

export const pdfVoosSchema = z.object({
  titulo_rota: z.string().max(200).optional(),
  ida: pdfVooLegSchema.optional(),
  volta: pdfVooLegSchema.optional(),
  bagagem: z.string().max(600).optional(),
});

export type PdfVoos = z.infer<typeof pdfVoosSchema>;

export const pdfDestaqueSchema = z.object({
  titulo: z.string().max(140),
  texto: z.string().max(1400),
  estilo: z.enum(["normal", "ouro"]).optional(),
});

export type PdfDestaque = z.infer<typeof pdfDestaqueSchema>;

export const pdfPrecosSchema = z.object({
  linha_resumo: z.string().max(600).optional(),
  preco_base: z.string().max(120).optional(),
  preco_final: z.string().max(120).optional(),
  nota_desconto: z.string().max(600).optional(),
});

export type PdfPrecos = z.infer<typeof pdfPrecosSchema>;

export const pdfCancelLinhaSchema = z.object({
  periodo: z.string().max(140),
  condicao: z.string().max(450),
});

export const pdfCancelamentoSchema = z.object({
  aviso: z.string().max(700).optional(),
  linhas: z.array(pdfCancelLinhaSchema).max(14),
});

export type PdfCancelamento = z.infer<typeof pdfCancelamentoSchema>;

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
  /** Preset de imagens de capa; omissão trata-se como `neutral`. */
  capa_preset: capaPresetSchema.optional(),
  /** Sobrescreve só a imagem larga da capa (PDF + email). Preferir `https`. */
  capa_banner_url: z.string().max(2048).optional(),
  /** Sobrescreve só o detalhe / rodapé do PDF. */
  capa_accent_url: z.string().max(2048).optional(),
  /**
   * Parágrafos de abertura na 1.ª página do PDF (estilo lookbook).
   * Se vazio, usa texto padrão com o destino e o nome do cliente.
   */
  pdf_texto_capa: z.string().max(3500).optional(),
  /** Telefone na última página do PDF; senão usa NEXT_PUBLIC_CONSULTORA_TELEFONE_DISPLAY. */
  contacto_telefone: z.string().max(80).optional(),
  pdf_voos: pdfVoosSchema.optional(),
  pdf_destaques: z.array(pdfDestaqueSchema).max(6).optional(),
  pdf_precos: pdfPrecosSchema.optional(),
  /** Itens «não incluído» (coluna esquerda da página de transparência). */
  pdf_exclusoes: z.array(z.string().max(550)).max(24).optional(),
  pdf_cancelamento: pdfCancelamentoSchema.optional(),
});

export type DetalhesProposta = z.infer<typeof detalhesPropostaSchema>;

export function parseDetalhesProposta(
  raw: unknown,
): DetalhesProposta | null {
  const r = detalhesPropostaSchema.safeParse(raw);
  return r.success ? r.data : null;
}

/**
 * Interpreta `valor_total` livre (ex.: "2 450 €", "1.234,56") para número em euros.
 * Devolve `null` se não for possível extrair um valor.
 */
export function parseValorTotalEUR(raw: string): number | null {
  const t = raw.trim();
  if (!t) return null;
  const noSpaces = t.replace(/\s/g, "");
  const lastComma = noSpaces.lastIndexOf(",");
  const lastDot = noSpaces.lastIndexOf(".");
  let normalized: string;
  if (lastComma > lastDot) {
    normalized = noSpaces.replace(/\./g, "").replace(",", ".");
  } else if (lastDot > lastComma) {
    normalized = noSpaces.replace(/,/g, "");
  } else if (lastComma !== -1) {
    normalized = noSpaces.replace(",", ".");
  } else {
    normalized = noSpaces.replace(/[^\d.-]/g, "");
  }
  normalized = normalized.replace(/[^\d.-]/g, "");
  const n = Number.parseFloat(normalized);
  return Number.isFinite(n) ? n : null;
}
