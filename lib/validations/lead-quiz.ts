import { z } from "zod";

import { QUIZ_CLIMA_KEYS } from "@/lib/marketing/quiz-clima";

const telemovelRefine = (s: string) => {
  const digits = s.replace(/\D/g, "");
  return digits.length >= 9 && digits.length <= 15;
};

export const leadQuizSchema = z.object({
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
  companhia: z.string().trim().min(1, "Indica com quem vais viajar.").max(200),
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
});

export type LeadQuizInput = z.infer<typeof leadQuizSchema>;
