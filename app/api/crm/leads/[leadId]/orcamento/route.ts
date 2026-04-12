import { NextResponse } from "next/server";
import { Resend } from "resend";

import { isConsultoraEmailAsync } from "@/lib/auth/consultora";
import type { DetalhesProposta } from "@/lib/crm/detalhes-proposta";
import { buildOrcamentoLeadEmail } from "@/lib/email/orcamento-lead";
import { resolveCrmEmailReplyTo } from "@/lib/email/resend-reply-to";
import { buildPropostaPdfBuffer } from "@/lib/pdf/proposta-pdf";
import { createClient } from "@/lib/supabase/server";
import { tryCreateServiceRoleClient } from "@/lib/supabase/service-role";
import {
  enviarOrcamentoSchema,
  parseIncluiLines,
} from "@/lib/validations/orcamento";

const PROPOSTA_STATUS = "Proposta enviada";

export async function POST(
  request: Request,
  ctx: { params: Promise<{ leadId: string }> },
) {
  const { leadId } = await ctx.params;

  if (
    !leadId ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      leadId,
    )
  ) {
    return NextResponse.json({ error: "Lead inválida." }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  if (!(await isConsultoraEmailAsync(user.email, supabase))) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  }

  const sr = tryCreateServiceRoleClient();
  if (!sr.ok) {
    return NextResponse.json(
      { error: "Servidor sem SUPABASE_SERVICE_ROLE_KEY configurada." },
      { status: 503 },
    );
  }
  const db = sr.client;

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
  }

  const parsed = enviarOrcamentoSchema.safeParse(json);
  if (!parsed.success) {
    const msg =
      parsed.error.flatten().fieldErrors.titulo?.[0] ??
      parsed.error.flatten().fieldErrors.destino?.[0] ??
      parsed.error.flatten().fieldErrors.datas?.[0] ??
      parsed.error.flatten().fieldErrors.valor_total?.[0] ??
      "Dados inválidos.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const body = parsed.data;
  const inclui = parseIncluiLines(body.inclui);

  const { data: lead, error: fetchError } = await db
    .from("leads")
    .select("id, nome, email")
    .eq("id", leadId)
    .maybeSingle();

  if (fetchError || !lead) {
    return NextResponse.json(
      { error: "Lead não encontrada." },
      { status: 404 },
    );
  }

  const enviadoEm = new Date().toISOString();
  const detalhes: DetalhesProposta = {
    titulo: body.titulo,
    destino: body.destino,
    datas: body.datas,
    inclui,
    valor_total: body.valor_total,
    notas: body.notas?.trim() ? body.notas.trim() : undefined,
    enviado_em: enviadoEm,
    ...(body.data_inicio?.trim()
      ? { data_inicio: body.data_inicio.trim() }
      : {}),
    ...(body.data_fim?.trim() ? { data_fim: body.data_fim.trim() } : {}),
    ...(body.links_uteis?.length ? { links_uteis: body.links_uteis } : {}),
    ...(body.galeria_urls?.length ? { galeria_urls: body.galeria_urls } : {}),
    ...(body.slug_destino?.trim()
      ? { slug_destino: body.slug_destino.trim().toLowerCase() }
      : {}),
    ...(body.latitude != null && !Number.isNaN(body.latitude)
      ? { latitude: body.latitude }
      : {}),
    ...(body.longitude != null && !Number.isNaN(body.longitude)
      ? { longitude: body.longitude }
      : {}),
  };

  let pdfBuffer: Buffer;
  try {
    pdfBuffer = await buildPropostaPdfBuffer(lead.nome, detalhes);
  } catch (e) {
    console.error("[orcamento] PDF:", e);
    return NextResponse.json(
      { error: "Não foi possível gerar o PDF." },
      { status: 500 },
    );
  }

  if (body.apenas_previzualizar) {
    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'inline; filename="proposta-previa.pdf"',
        "Cache-Control": "no-store",
      },
    });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM?.trim();

  if (!apiKey || !from) {
    console.warn("[orcamento] RESEND_API_KEY ou RESEND_FROM em falta.");
    return NextResponse.json(
      {
        error:
          "Email não configurado (RESEND_API_KEY / RESEND_FROM no servidor).",
      },
      { status: 503 },
    );
  }

  const { subject, html, text } = buildOrcamentoLeadEmail(lead.nome, detalhes);
  const replyTo = resolveCrmEmailReplyTo(user.email ?? undefined);

  try {
    const resend = new Resend(apiKey);
    const { error: sendError } = await resend.emails.send({
      from,
      to: lead.email,
      ...(replyTo ? { replyTo } : {}),
      subject,
      html,
      text,
      attachments: [
        {
          filename: "proposta-viagem.pdf",
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ],
    });

    if (sendError) {
      console.error("[orcamento] Resend:", sendError.message);
      return NextResponse.json(
        { error: "O envio do email falhou. Tenta de novo." },
        { status: 502 },
      );
    }
  } catch (e) {
    console.error("[orcamento] Resend exception:", e);
    return NextResponse.json(
      { error: "O envio do email falhou. Tenta de novo." },
      { status: 502 },
    );
  }

  const updatePayload: {
    detalhes_proposta: DetalhesProposta;
    data_envio_orcamento: string;
    status?: string;
  } = {
    detalhes_proposta: detalhes,
    data_envio_orcamento: enviadoEm,
  };

  if (body.atualizar_estado) {
    updatePayload.status = PROPOSTA_STATUS;
  }

  const { error: updateError } = await db
    .from("leads")
    .update(updatePayload)
    .eq("id", leadId);

  if (updateError) {
    console.error("[orcamento] Supabase update:", updateError.message);
    return NextResponse.json(
      {
        error:
          "O email foi enviado mas não foi possível guardar na base de dados. Atualiza manualmente.",
      },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
