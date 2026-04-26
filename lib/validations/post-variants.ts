import { z } from "zod";

export const postHotelMediaSchema = z.object({
  id: z.string().uuid().optional(),
  ordem: z.number().int().min(0).max(9999).default(0),
  kind: z.enum(["image", "video"]).default("image"),
  url: z.string().trim().url().max(4000),
  alt: z.string().trim().max(500).optional().nullable(),
});

export const postHotelRoomOptionSchema = z.object({
  id: z.string().uuid().optional(),
  hotel_id: z.string().uuid().optional(),
  ordem: z.number().int().min(0).max(9999).default(0),
  nome: z.string().trim().min(2).max(180),
  capacidade_adultos: z.number().int().min(1).max(20).optional().nullable(),
  capacidade_criancas: z.number().int().min(0).max(20).optional().nullable(),
  preco_delta_eur: z.number().min(-1000000).max(1000000).optional().nullable(),
  preco_label: z.string().trim().max(120).optional().nullable(),
  status: z.boolean().default(true),
});

export const postHotelSchema = z
  .object({
    id: z.string().uuid().optional(),
    post_id: z.string().uuid().optional(),
    ordem: z.number().int().min(0).max(9999).default(0),
    nome: z.string().trim().min(2).max(180),
    descricao: z.string().trim().max(4000).optional().nullable(),
    regime: z.string().trim().max(120).optional().nullable(),
    condicoes: z.string().trim().max(4000).optional().nullable(),
    site_url: z.string().trim().url().max(2000).optional().nullable(),
    preco_delta_eur: z.number().min(-1000000).max(1000000).optional().nullable(),
    preco_label: z.string().trim().max(120).optional().nullable(),
    capacidade_min: z.number().int().min(1).max(20).optional().nullable(),
    capacidade_max: z.number().int().min(1).max(20).optional().nullable(),
    pets_allowed: z.boolean().optional().nullable(),
    status: z.boolean().default(true),
    media: z.array(postHotelMediaSchema).max(20).default([]),
  })
  .refine(
    (v) =>
      v.capacidade_min == null ||
      v.capacidade_max == null ||
      v.capacidade_max >= v.capacidade_min,
    {
      message: "A capacidade máxima não pode ser inferior à mínima.",
      path: ["capacidade_max"],
    },
  );

export const postExtraSchema = z.object({
  id: z.string().uuid().optional(),
  post_id: z.string().uuid().optional(),
  ordem: z.number().int().min(0).max(9999).default(0),
  tipo: z
    .enum([
      "transfer",
      "guia",
      "seguro",
      "experiencia",
      "viatura_aluguer",
      "custom",
    ])
    .default("custom"),
  nome: z.string().trim().min(2).max(180),
  descricao: z.string().trim().max(4000).optional().nullable(),
  preco_delta_eur: z.number().min(-1000000).max(1000000).optional().nullable(),
  preco_label: z.string().trim().max(120).optional().nullable(),
  pets_allowed: z.boolean().optional().nullable(),
  default_selected: z.boolean().default(false),
  status: z.boolean().default(true),
});

export const postFlightOptionSchema = z.object({
  id: z.string().uuid().optional(),
  post_id: z.string().uuid().optional(),
  ordem: z.number().int().min(0).max(9999).default(0),
  label: z.string().trim().min(2).max(200),
  origem_iata: z.string().trim().regex(/^[A-Z]{3}$/).optional().nullable(),
  destino_iata: z.string().trim().regex(/^[A-Z]{3}$/).optional().nullable(),
  data_partida: z.string().date().optional().nullable(),
  data_regresso: z.string().date().optional().nullable(),
  cia: z.string().trim().max(120).optional().nullable(),
  classe: z
    .enum(["economy", "premium_economy", "business", "first"])
    .optional()
    .nullable(),
  bagagem_text: z.string().trim().max(300).optional().nullable(),
  descricao: z.string().trim().max(4000).optional().nullable(),
  preco_delta_eur: z.number().min(-1000000).max(1000000).optional().nullable(),
  preco_label: z.string().trim().max(120).optional().nullable(),
  pets_allowed: z.boolean().optional().nullable(),
  status: z.boolean().default(true),
});

export type PostHotelInput = z.infer<typeof postHotelSchema>;
export type PostHotelRoomOptionInput = z.infer<typeof postHotelRoomOptionSchema>;
export type PostExtraInput = z.infer<typeof postExtraSchema>;
export type PostFlightOptionInput = z.infer<typeof postFlightOptionSchema>;
