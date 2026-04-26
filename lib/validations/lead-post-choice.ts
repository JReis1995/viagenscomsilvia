import { z } from "zod";

const choiceSnapshotItemSchema = z.object({
  id: z.string().uuid(),
  label: z.string().trim().max(300),
  preco_delta_eur: z.number().finite().optional().nullable(),
  preco_label: z.string().trim().max(120).optional().nullable(),
});

const choiceRoomSchema = z.object({
  room_option_id: z.string().uuid(),
  qty: z.number().int().min(1).max(10),
});

const choiceSnapshotSchema = z
  .object({
    hotel: choiceSnapshotItemSchema.optional(),
    extras: z.array(choiceSnapshotItemSchema).max(20).optional(),
    flight: choiceSnapshotItemSchema.optional(),
  })
  .optional();

export const leadPostChoiceSchema = z.object({
  hotel_id: z.string().uuid().optional(),
  extra_ids: z.array(z.string().uuid()).max(20).optional(),
  flight_option_id: z.string().uuid().optional(),
  notas_voo: z.string().trim().max(1000).optional(),
  checkin_date: z.string().date().optional(),
  checkout_date: z.string().date().optional(),
  rooms: z.array(choiceRoomSchema).max(10).optional(),
  rooms_required: z.number().int().min(1).max(20).optional(),
  computed_total_eur: z.number().finite().optional().nullable(),
  currency: z.literal("EUR").optional(),
  computed_at: z.string().datetime().optional(),
  snapshot: choiceSnapshotSchema,
});

export type LeadPostChoiceInput = z.infer<typeof leadPostChoiceSchema>;
