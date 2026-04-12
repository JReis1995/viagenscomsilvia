import { NextResponse } from "next/server";

import { isConsultoraEmailAsync } from "@/lib/auth/consultora";
import { parseDetalhesProposta } from "@/lib/crm/detalhes-proposta";
import { buildPropostaPdfBuffer } from "@/lib/pdf/proposta-pdf";
import { createClient } from "@/lib/supabase/server";
import { tryCreateServiceRoleClient } from "@/lib/supabase/service-role";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function safePdfFilenamePart(raw: string): string {
  return raw.replace(/[^\dA-Za-z.-]+/g, "-").slice(0, 32) || "proposta";
}

export async function GET(
  request: Request,
  ctx: { params: Promise<{ leadId: string }> },
) {
  const { leadId } = await ctx.params;
  if (!leadId || !UUID_RE.test(leadId)) {
    return NextResponse.json({ error: "Lead inválida." }, { status: 400 });
  }

  const url = new URL(request.url);
  const envioId = url.searchParams.get("envioId");
  const legacy = url.searchParams.get("legacy") === "1";

  if (!envioId && !legacy) {
    return NextResponse.json(
      { error: "Indica envioId=uuid ou legacy=1." },
      { status: 400 },
    );
  }

  if (envioId && !UUID_RE.test(envioId)) {
    return NextResponse.json({ error: "envioId inválido." }, { status: 400 });
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
  let nome = "";
  let detalhes = null as ReturnType<typeof parseDetalhesProposta>;

  if (envioId) {
    const { data: row, error } = await db
      .from("lead_proposta_envios")
      .select("snapshot, lead_id")
      .eq("id", envioId)
      .eq("lead_id", leadId)
      .maybeSingle();

    if (error || !row) {
      return NextResponse.json(
        { error: "Envio de orçamento não encontrado." },
        { status: 404 },
      );
    }

    detalhes = parseDetalhesProposta(row.snapshot);
    const { data: leadRow } = await db
      .from("leads")
      .select("nome")
      .eq("id", leadId)
      .maybeSingle();
    nome = (leadRow?.nome as string)?.trim() || "Cliente";
  } else {
    const { data: leadRow, error } = await db
      .from("leads")
      .select("nome, detalhes_proposta")
      .eq("id", leadId)
      .maybeSingle();

    if (error || !leadRow) {
      return NextResponse.json({ error: "Lead não encontrada." }, {
        status: 404,
      });
    }

    nome = (leadRow.nome as string)?.trim() || "Cliente";
    detalhes = parseDetalhesProposta(leadRow.detalhes_proposta);
  }

  if (!detalhes) {
    return NextResponse.json(
      { error: "Não há dados de proposta guardados para gerar o PDF." },
      { status: 404 },
    );
  }

  let pdfBuffer: Buffer;
  try {
    pdfBuffer = await buildPropostaPdfBuffer(nome, detalhes);
  } catch (e) {
    console.error("[proposta-pdf]", e);
    return NextResponse.json(
      { error: "Não foi possível gerar o PDF." },
      { status: 500 },
    );
  }

  const stamp = safePdfFilenamePart(
    detalhes.enviado_em?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
  );
  const suffix = envioId ? safePdfFilenamePart(envioId.slice(0, 8)) : "legacy";

  return new NextResponse(new Uint8Array(pdfBuffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="proposta-${stamp}-${suffix}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
