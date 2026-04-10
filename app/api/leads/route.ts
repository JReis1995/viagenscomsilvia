import { NextResponse } from "next/server";
import { Resend } from "resend";

import { buildWelcomeLeadEmail } from "@/lib/email/welcome-lead";
import { createPublicServerClient } from "@/lib/supabase/public-server";
import { leadQuizSchema } from "@/lib/validations/lead-quiz";

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
  }

  if (
    typeof json === "object" &&
    json !== null &&
    "website_url" in json &&
    typeof (json as { website_url?: unknown }).website_url === "string" &&
    (json as { website_url: string }).website_url.trim().length > 0
  ) {
    return NextResponse.json({ ok: true });
  }

  const parsed = leadQuizSchema.safeParse(json);
  if (!parsed.success) {
    const msg = parsed.error.flatten().fieldErrors;
    const first =
      Object.values(msg).flat()[0] ?? "Dados inválidos. Verifica o formulário.";
    return NextResponse.json({ error: first }, { status: 400 });
  }

  const row = parsed.data;

  const supabase = createPublicServerClient();
  const { error: dbError } = await supabase.from("leads").insert({
    nome: row.nome,
    email: row.email,
    telemovel: row.telemovel.trim(),
    vibe: row.vibe,
    companhia: row.companhia,
    destino_sonho: row.destino_sonho,
    orcamento_estimado: row.orcamento_estimado,
  });

  if (dbError) {
    console.error("[leads] Supabase insert:", dbError.message);
    return NextResponse.json(
      { error: "Não foi possível guardar o pedido. Tenta mais tarde." },
      { status: 500 },
    );
  }

  let emailSent = false;
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM;

  if (apiKey && from) {
    try {
      const resend = new Resend(apiKey);
      const { subject, html, text } = buildWelcomeLeadEmail(row);
      const { error: sendError } = await resend.emails.send({
        from,
        to: row.email,
        subject,
        html,
        text,
      });
      if (sendError) {
        console.error("[leads] Resend:", sendError.message);
      } else {
        emailSent = true;
      }
    } catch (e) {
      console.error("[leads] Resend exception:", e);
    }
  } else {
    console.warn(
      "[leads] RESEND_API_KEY ou RESEND_FROM em falta — email não enviado.",
    );
  }

  return NextResponse.json({ ok: true, emailSent });
}
