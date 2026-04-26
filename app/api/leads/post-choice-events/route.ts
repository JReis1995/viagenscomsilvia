import { NextResponse } from "next/server";
import { z } from "zod";

import { createPublicServerClient } from "@/lib/supabase/public-server";

const eventSchema = z.object({
  post_id: z.string().uuid(),
  lead_id: z.string().uuid().optional(),
  event_name: z.string().trim().min(1).max(80),
  hotel_id: z.string().uuid().optional().nullable(),
  flight_option_id: z.string().uuid().optional().nullable(),
  extra_id: z.string().uuid().optional().nullable(),
  session_key: z.string().trim().max(120).optional(),
  event_payload: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
  }

  const parsed = eventSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Evento inválido." }, { status: 400 });
  }

  const supabase = createPublicServerClient();
  const row = parsed.data;
  const { error } = await supabase.from("lead_post_choice_events").insert({
    post_id: row.post_id,
    lead_id: row.lead_id ?? null,
    event_name: row.event_name,
    hotel_id: row.hotel_id ?? null,
    flight_option_id: row.flight_option_id ?? null,
    extra_id: row.extra_id ?? null,
    session_key: row.session_key ?? null,
    event_payload: row.event_payload ?? null,
  });

  if (error) {
    return NextResponse.json({ error: "Não foi possível registar evento." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
