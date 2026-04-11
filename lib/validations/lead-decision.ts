import { z } from "zod";

export const leadClientDecisionSchema = z
  .object({
    leadId: z.string().uuid(),
    decision: z.enum(["approved", "changes_requested"]),
    note: z.string().trim().max(4000).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.decision === "changes_requested") {
      const n = data.note?.trim() ?? "";
      if (n.length < 3) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Explica em poucas palavras o que gostarias de alterar.",
          path: ["note"],
        });
      }
    }
  });

export type LeadClientDecisionInput = z.infer<typeof leadClientDecisionSchema>;
