import { z } from "zod";

export const clientNoteSchema = z.object({
  leadId: z.string().uuid(),
  message: z
    .string()
    .trim()
    .min(1, "Escreve uma mensagem.")
    .max(4000, "Texto demasiado longo."),
});
