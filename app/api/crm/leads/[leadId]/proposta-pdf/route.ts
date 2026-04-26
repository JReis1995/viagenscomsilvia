import { NextResponse } from "next/server";

import { isConsultoraEmailAsync } from "@/lib/auth/consultora";
import { parseDetalhesProposta } from "@/lib/crm/detalhes-proposta";
import {
  applyProposalPdfFallbacks,
  buildPropostaPdfBuffer,
} from "@/lib/pdf/proposta-pdf";
import { createClient } from "@/lib/supabase/server";
import { tryCreateServiceRoleClient } from "@/lib/supabase/service-role";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
type ServiceRoleClient = Extract<
  ReturnType<typeof tryCreateServiceRoleClient>,
  { ok: true }
>["client"];

function safePdfFilenamePart(raw: string): string {
  return raw.replace(/[^\dA-Za-z.-]+/g, "-").slice(0, 32) || "proposta";
}

async function enrichProposalGalleryFromPosts(
  db: ServiceRoleClient,
  leadId: string,
  details: NonNullable<ReturnType<typeof parseDetalhesProposta>>,
): Promise<NonNullable<ReturnType<typeof parseDetalhesProposta>>> {
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

  let detailsWithVariants = applyProposalPdfFallbacks(details, {
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
    const enriched = await enrichProposalGalleryFromPosts(db, leadId, detalhes);
    pdfBuffer = await buildPropostaPdfBuffer(nome, enriched);
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
