import { NextResponse } from "next/server";
import { Resend } from "resend";

import { isConsultoraEmailAsync } from "@/lib/auth/consultora";
import type { DetalhesProposta } from "@/lib/crm/detalhes-proposta";
import { buildOrcamentoLeadEmail } from "@/lib/email/orcamento-lead";
import { resolveCrmEmailReplyTo } from "@/lib/email/resend-reply-to";
import {
  applyProposalPdfFallbacks,
  buildPropostaPdfBuffer,
} from "@/lib/pdf/proposta-pdf";
import { createClient } from "@/lib/supabase/server";
import { tryCreateServiceRoleClient } from "@/lib/supabase/service-role";
import {
  enviarOrcamentoSchema,
  parseIncluiLines,
} from "@/lib/validations/orcamento";

const PROPOSTA_STATUS = "Proposta enviada";
type ServiceRoleClient = Extract<
  ReturnType<typeof tryCreateServiceRoleClient>,
  { ok: true }
>["client"];

async function enrichGalleryForPdf(
  db: ServiceRoleClient,
  leadId: string,
  details: DetalhesProposta,
): Promise<DetalhesProposta> {
  const { data: leadRow } = await db
    .from("leads")
    .select("post_choice, promo_campaigns!promo_campaign_id ( link_publicacao )")
    .eq("id", leadId)
    .maybeSingle();

  const postChoice = (leadRow?.post_choice as {
    hotel_id?: string;
    flight_option_id?: string;
  } | null) ?? null;
  const hotelId = typeof postChoice?.hotel_id === "string"
    ? postChoice.hotel_id
    : "";
  const flightOptionId = typeof postChoice?.flight_option_id === "string"
    ? postChoice.flight_option_id
    : "";

  let hotelGalleryUrls: string[] = [];
  if ((!details.galeria_urls || details.galeria_urls.length === 0) && hotelId) {
    const { data: mediaRows } = await db
      .from("post_hotel_media")
      .select("kind, url, ordem")
      .eq("hotel_id", hotelId)
      .order("ordem", { ascending: true })
      .limit(10);
    hotelGalleryUrls = (mediaRows ?? [])
      .filter((row) => row.kind === "image")
      .map((row) => (typeof row.url === "string" ? row.url.trim() : ""))
      .filter((url) => url.length > 0);
  }

  let flightOption: {
    label: string | null;
    origem_iata: string | null;
    destino_iata: string | null;
    data_partida: string | null;
    data_regresso: string | null;
    cia: string | null;
    classe: string | null;
    bagagem_text: string | null;
    descricao: string | null;
  } | null = null;
  if (flightOptionId) {
    const { data: flightRow } = await db
      .from("post_flight_options")
      .select(
        "label, origem_iata, destino_iata, data_partida, data_regresso, cia, classe, bagagem_text, descricao",
      )
      .eq("id", flightOptionId)
      .maybeSingle();
    if (flightRow) {
      flightOption = flightRow;
    }
  }

  const detailsWithVariants = applyProposalPdfFallbacks(details, {
    hotelGalleryUrls,
    flightOption,
  });

  if (detailsWithVariants.galeria_urls && detailsWithVariants.galeria_urls.length > 0) {
    return detailsWithVariants;
  }

  let slug = detailsWithVariants.slug_destino?.trim().toLowerCase() ?? "";
  if (!slug) {
    const url = (leadRow?.promo_campaigns as { link_publicacao?: string } | null)?.link_publicacao;
    if (typeof url === "string" && url.includes("/")) {
      const parts = url.split("/").filter(Boolean);
      slug = (parts[parts.length - 1] ?? "").toLowerCase();
    }
  }
  if (!slug) return detailsWithVariants;

  const { data: posts } = await db
    .from("posts")
    .select("media_url")
    .eq("slug_destino", slug)
    .eq("status", true)
    .order("data_publicacao", { ascending: false })
    .limit(6);
  const gallery = (posts ?? [])
    .map((p) => (typeof p.media_url === "string" ? p.media_url.trim() : ""))
    .filter((u) => u.length > 0);
  if (gallery.length === 0) return detailsWithVariants;
  return { ...detailsWithVariants, galeria_urls: gallery };
}

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
    const fe = parsed.error.flatten().fieldErrors;
    const msg =
      fe.titulo?.[0] ??
      fe.destino?.[0] ??
      fe.datas?.[0] ??
      fe.valor_total?.[0] ??
      fe.capa_banner_url?.[0] ??
      fe.capa_accent_url?.[0] ??
      fe.pdf_texto_capa?.[0] ??
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
    ...(body.capa_preset ? { capa_preset: body.capa_preset } : {}),
    ...(body.capa_banner_url?.trim()
      ? { capa_banner_url: body.capa_banner_url.trim() }
      : {}),
    ...(body.capa_accent_url?.trim()
      ? { capa_accent_url: body.capa_accent_url.trim() }
      : {}),
    ...(body.pdf_texto_capa?.trim()
      ? { pdf_texto_capa: body.pdf_texto_capa.trim() }
      : {}),
    ...(body.contacto_telefone?.trim()
      ? { contacto_telefone: body.contacto_telefone.trim() }
      : {}),
    ...(body.pdf_voos &&
    (body.pdf_voos.titulo_rota?.trim() ||
      body.pdf_voos.bagagem?.trim() ||
      body.pdf_voos.ida ||
      body.pdf_voos.volta)
      ? { pdf_voos: body.pdf_voos }
      : {}),
    ...(body.pdf_destaques?.length ? { pdf_destaques: body.pdf_destaques } : {}),
    ...(body.pdf_precos &&
    (body.pdf_precos.linha_resumo?.trim() ||
      body.pdf_precos.preco_base?.trim() ||
      body.pdf_precos.preco_final?.trim() ||
      body.pdf_precos.nota_desconto?.trim())
      ? { pdf_precos: body.pdf_precos }
      : {}),
    ...(body.pdf_exclusoes?.length
      ? { pdf_exclusoes: body.pdf_exclusoes }
      : {}),
    ...(body.pdf_cancelamento &&
    (body.pdf_cancelamento.aviso?.trim() ||
      (body.pdf_cancelamento.linhas &&
        body.pdf_cancelamento.linhas.length > 0))
      ? { pdf_cancelamento: body.pdf_cancelamento }
      : {}),
  };

  let pdfBuffer: Buffer;
  try {
    const enriched = await enrichGalleryForPdf(db, leadId, detalhes);
    pdfBuffer = await buildPropostaPdfBuffer(lead.nome, enriched);
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
  const replyTo = resolveCrmEmailReplyTo(user.email ?? undefined, {
    leadId: lead.id,
  });

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

  const { error: histError } = await db.from("lead_proposta_envios").insert({
    lead_id: leadId,
    created_at: enviadoEm,
    valor_total: detalhes.valor_total,
    titulo: detalhes.titulo,
    destino: detalhes.destino,
    datas: detalhes.datas,
    snapshot: detalhes,
  });
  if (histError) {
    console.error(
      "[orcamento] lead_proposta_envios (opcional — executa sql/add_lead_proposta_envios.sql):",
      histError.message,
    );
  }

  return NextResponse.json({ ok: true });
}
