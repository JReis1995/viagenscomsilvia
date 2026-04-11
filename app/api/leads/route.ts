import { NextResponse } from "next/server";
import { Resend } from "resend";

import { buildWelcomeQuickLeadEmail } from "@/lib/email/welcome-lead-quick";
import { buildWelcomeLeadEmail } from "@/lib/email/welcome-lead";
import { createPublicServerClient } from "@/lib/supabase/public-server";
import {
  leadQuickSchema,
  leadQuizSchema,
  type LeadMarketingAttribution,
} from "@/lib/validations/lead-quiz";

function attrColumns(m: LeadMarketingAttribution) {
  return {
    utm_source: m.utm_source?.trim() || null,
    utm_medium: m.utm_medium?.trim() || null,
    utm_campaign: m.utm_campaign?.trim() || null,
    utm_content: m.utm_content?.trim() || null,
    utm_term: m.utm_term?.trim() || null,
    referrer: m.referrer?.trim() || null,
    landing_path: m.landing_path?.trim() || null,
  };
}

function validationError(parsed: {
  success: false;
  error: { flatten: () => { fieldErrors: Record<string, string[] | undefined> } };
}): NextResponse {
  const msg = parsed.error.flatten().fieldErrors;
  const first =
    Object.values(msg).flat()[0] ?? "Dados inválidos. Verifica o formulário.";
  return NextResponse.json({ error: first }, { status: 400 });
}

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

  const isQuick =
    typeof json === "object" &&
    json !== null &&
    (json as { pedido_rapido?: unknown }).pedido_rapido === true;

  const supabase = createPublicServerClient();

  if (isQuick) {
    const parsed = leadQuickSchema.safeParse(json);
    if (!parsed.success) {
      return validationError(parsed);
    }
    const row = parsed.data;
    const attr = attrColumns(row);
    const tel = row.telemovel.trim();

    const { error: dbError } = await supabase.from("leads").insert({
      nome: row.nome,
      email: row.email,
      telemovel: tel.length > 0 ? tel : null,
      clima_preferido: null,
      vibe: null,
      companhia: null,
      destino_sonho: row.destino_sonho,
      orcamento_estimado: null,
      pedido_rapido: true,
      ...attr,
    });

    if (dbError) {
      console.error("[leads] Supabase insert (quick):", dbError.message);
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
        const { subject, html, text } = buildWelcomeQuickLeadEmail(row);
        const { error: sendError } = await resend.emails.send({
          from,
          to: row.email,
          subject,
          html,
          text,
        });
        if (sendError) {
          console.error("[leads] Resend (quick):", sendError.message);
        } else {
          emailSent = true;
        }
      } catch (e) {
        console.error("[leads] Resend exception (quick):", e);
      }
    } else {
      console.warn(
        "[leads] RESEND_API_KEY ou RESEND_FROM em falta — email não enviado.",
      );
    }

    return NextResponse.json({ ok: true, emailSent });
  }

  const parsed = leadQuizSchema.safeParse(json);
  if (!parsed.success) {
    return validationError(parsed);
  }

  const row = parsed.data;
  const attr = attrColumns(row);

  const { error: dbError } = await supabase.from("leads").insert({
    nome: row.nome,
    email: row.email,
    telemovel: row.telemovel.trim(),
    clima_preferido: row.clima_preferido,
    vibe: row.vibe,
    companhia: row.companhia,
    destino_sonho: row.destino_sonho,
    orcamento_estimado: row.orcamento_estimado,
    pedido_rapido: false,
    ...attr,
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
