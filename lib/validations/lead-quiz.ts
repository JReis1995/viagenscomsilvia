import { z } from "zod";

import { QUIZ_CLIMA_KEYS } from "@/lib/marketing/quiz-clima";

const telemovelRefine = (s: string) => {
  const digits = s.replace(/\D/g, "");
  return digits.length >= 9 && digits.length <= 15;
};

/** Campos opcionais enviados pelo browser (sessão / URL). */
export const leadMarketingAttributionSchema = z.object({
  utm_source: z.string().trim().max(200).optional(),
  utm_medium: z.string().trim().max(200).optional(),
  utm_campaign: z.string().trim().max(200).optional(),
  utm_content: z.string().trim().max(200).optional(),
  utm_term: z.string().trim().max(200).optional(),
  referrer: z.string().trim().max(2000).optional(),
  landing_path: z.string().trim().max(2000).optional(),
});

export type LeadMarketingAttribution = z.infer<
  typeof leadMarketingAttributionSchema
>;

export const leadQuizSchema = z
  .object({
    nome: z.string().trim().min(2, "Indica o teu nome.").max(120),
    email: z.string().trim().email("Email inválido.").max(255),
    clima_preferido: z.enum(QUIZ_CLIMA_KEYS, {
      message: "Escolhe o clima que mais te atrai neste momento.",
    }),
    telemovel: z
      .string()
      .trim()
      .min(1, "Indica o teu telemóvel.")
      .max(30)
      .refine(telemovelRefine, "Telemóvel inválido — usa pelo menos 9 dígitos."),
    vibe: z.string().trim().min(1, "Escolhe um estilo de viagem.").max(200),
    companhia: z
      .string()
      .trim()
      .min(1, "Indica com quem vais viajar.")
      .max(200),
    destino_sonho: z
      .string()
      .trim()
      .min(2, "Descreve um destino ou região.")
      .max(300),
    orcamento_estimado: z
      .string()
      .trim()
      .min(1, "Indica uma faixa de orçamento.")
      .max(100),
    janela_datas: z
      .string()
      .trim()
      .min(2, "Indica uma janela de datas (mesmo aproximada).")
      .max(400),
    flexibilidade_datas: z.enum(
      ["fixas", "mais_menos_semana", "totalmente_flexivel"],
      {
        message: "Escolhe o quanto podes flexibilizar as datas.",
      },
    ),
    ja_tem_voos_hotel: z.enum(["nada", "so_voos", "so_hotel", "ambos"], {
      message: "Indica se já tens voos ou hotel.",
    }),
  })
  .merge(leadMarketingAttributionSchema);

export type LeadQuizInput = z.infer<typeof leadQuizSchema>;

/** Pedido rápido a meio do quiz (passos 3–4): contacto já recolhido + uma linha de destino. */
export const leadQuickSchema = leadMarketingAttributionSchema
  .extend({
    pedido_rapido: z.literal(true),
    nome: z.string().trim().min(2, "Indica o teu nome.").max(120),
    email: z.string().trim().email("Email inválido.").max(255),
    telemovel: z.string().trim().max(30),
    destino_sonho: z
      .string()
      .trim()
      .min(2, "Escreve uma linha sobre o destino ou a tua ideia.")
      .max(300),
  })
  .refine(
    (d) => {
      const t = d.telemovel.trim();
      if (!t) return true;
      return telemovelRefine(t);
    },
    {
      message: "Telemóvel inválido — usa pelo menos 9 dígitos.",
      path: ["telemovel"],
    },
  );

export type LeadQuickInput = z.infer<typeof leadQuickSchema>;
