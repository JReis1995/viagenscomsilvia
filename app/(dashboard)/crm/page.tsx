import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { CrmHomeTabs } from "@/components/crm/crm-home-tabs";
import { CrmLeadsExportButton } from "@/components/crm/crm-leads-export-button";
import { LeadsKanban } from "@/components/crm/leads-kanban";
import { isConsultoraEmailAsync } from "@/lib/auth/consultora";
import { parseDetalhesProposta } from "@/lib/crm/detalhes-proposta";
import type { LeadPropostaEnvioRow } from "@/lib/crm/lead-timeline";
import { fetchSiteContent } from "@/lib/site/fetch-site-content";
import { parseSlaHours } from "@/lib/crm/lead-sla";
import { createClient } from "@/lib/supabase/server";
import { tryCreateServiceRoleClient } from "@/lib/supabase/service-role";
import { DEFAULT_SITE_CONTENT } from "@/lib/site/site-content";
import type { LeadBoardRow, LeadPostChoiceFlightPrefill } from "@/types/lead";

export const metadata: Metadata = {
  title: "Painel",
  description: "Gestão de leads e orçamentos.",
};

export const dynamic = "force-dynamic";

function isMissingOptionalLeadColumns(message: string | undefined): boolean {
  const m = (message ?? "").toLowerCase();
  return (
    m.includes("column leads.pedido_adultos does not exist") ||
    m.includes("column leads.pedido_criancas does not exist") ||
    m.includes("column leads.pedido_idades_criancas does not exist") ||
    m.includes("column leads.pedido_quartos does not exist") ||
    m.includes("could not find the 'pedido_quartos' column") ||
    m.includes("column leads.pedido_animais_estimacao does not exist") ||
    m.includes("column leads.post_id does not exist") ||
    m.includes("column leads.post_choice does not exist")
  );
}

export default async function CrmHomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email || !(await isConsultoraEmailAsync(user.email, supabase))) {
    redirect("/login?next=/crm");
  }

  const siteContent = await fetchSiteContent();
  const slaGreenH = parseSlaHours(
    siteContent.crm.slaGreenMaxHours,
    Number.parseInt(DEFAULT_SITE_CONTENT.crm.slaGreenMaxHours, 10) || 24,
  );
  const slaYellowH = parseSlaHours(
    siteContent.crm.slaYellowMaxHours,
    Number.parseInt(DEFAULT_SITE_CONTENT.crm.slaYellowMaxHours, 10) || 48,
  );

  const sr = tryCreateServiceRoleClient();
  let data: LeadBoardRow[] | null = null;
  let error: { message: string } | null = null;

  if (sr.ok) {
    const primary = await sr.client
      .from("leads")
      .select(
        "id, nome, email, telemovel, status, data_pedido, data_ultimo_followup, data_envio_orcamento, notas_internas, detalhes_proposta, clima_preferido, vibe, companhia, destino_sonho, orcamento_estimado, janela_datas, flexibilidade_datas, ja_tem_voos_hotel, pedido_adultos, pedido_criancas, pedido_idades_criancas, pedido_quartos, pedido_animais_estimacao, post_id, post_choice, auto_followup, pedido_rapido, utm_source, utm_medium, utm_campaign, utm_content, utm_term, referrer, landing_path, has_unread_messages, promo_campaign_id, promo_campaigns!promo_campaign_id ( discount_percent, titulo_publicacao, expires_at, link_publicacao )",
      )
      .order("data_pedido", { ascending: false });
    if (primary.error && isMissingOptionalLeadColumns(primary.error.message)) {
      const fallback = await sr.client
        .from("leads")
        .select(
          "id, nome, email, telemovel, status, data_pedido, data_ultimo_followup, data_envio_orcamento, notas_internas, detalhes_proposta, clima_preferido, vibe, companhia, destino_sonho, orcamento_estimado, janela_datas, flexibilidade_datas, ja_tem_voos_hotel, auto_followup, pedido_rapido, utm_source, utm_medium, utm_campaign, utm_content, utm_term, referrer, landing_path, has_unread_messages, promo_campaign_id, promo_campaigns!promo_campaign_id ( discount_percent, titulo_publicacao, expires_at, link_publicacao )",
        )
        .order("data_pedido", { ascending: false });
      data = fallback.data as LeadBoardRow[] | null;
      error = fallback.error;
    } else {
      data = primary.data as LeadBoardRow[] | null;
      error = primary.error;
    }
  } else {
    error = { message: sr.message };
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-terracotta/30 bg-white p-8 shadow-lg md:p-10">
        <h1 className="text-2xl font-semibold tracking-tight text-ocean-900">
          Leads
        </h1>
        <p className="mt-4 text-ocean-700">
          Não foi possível carregar as leads. Confirma{" "}
          <code className="rounded bg-ocean-50 px-1 text-sm">
            SUPABASE_SERVICE_ROLE_KEY
          </code>{" "}
          no servidor (já usada pelo cron) — o CRM usa esta chave só no
          servidor para não depender das políticas RLS. A longo prazo, RLS
          bem desenhadas para o papel consultora podem reduzir esta
          dependência e simplificar deploy para equipas não técnicas.
        </p>
        <p className="mt-2 font-mono text-xs text-ocean-500">{error.message}</p>
      </div>
    );
  }

  const leads = data ?? [];
  const hotelIds = Array.from(
    new Set(
      leads
        .map((lead) => {
          const postChoice = lead.post_choice as
            | { hotel_id?: unknown; snapshot?: { hotel?: { id?: unknown } } }
            | null
            | undefined;
          if (typeof postChoice?.hotel_id === "string") return postChoice.hotel_id;
          if (typeof postChoice?.snapshot?.hotel?.id === "string") {
            return postChoice.snapshot.hotel.id;
          }
          return null;
        })
        .filter((id): id is string => Boolean(id)),
    ),
  );
  const thumbByHotelId = new Map<string, string>();
  const galleryByHotelId = new Map<string, string[]>();
  if (sr.ok && hotelIds.length > 0) {
    const res = await sr.client
      .from("post_hotel_media")
      .select("hotel_id, url, kind, ordem")
      .in("hotel_id", hotelIds)
      .order("hotel_id", { ascending: true })
      .order("ordem", { ascending: true });
    if (res.error) {
      console.error("[crm] post_hotel_media:", res.error.message);
    } else {
      const rows = res.data ?? [];
      for (const row of rows) {
        const hotelId = row.hotel_id as string;
        const url = typeof row.url === "string" ? row.url.trim() : "";
        if (!url) continue;
        if (row.kind === "image") {
          const existingGallery = galleryByHotelId.get(hotelId) ?? [];
          existingGallery.push(url);
          galleryByHotelId.set(hotelId, existingGallery);
        }
        if (thumbByHotelId.has(hotelId)) continue;
        if (row.kind === "image") {
          thumbByHotelId.set(hotelId, url);
        } else if (!thumbByHotelId.has(hotelId)) {
          thumbByHotelId.set(hotelId, url);
        }
      }
    }
  }

  const postIds = Array.from(
    new Set(leads.map((lead) => lead.post_id).filter((id): id is string => Boolean(id))),
  );
  const postMetaById = new Map<string, { titulo: string; slug_destino: string | null }>();
  if (sr.ok && postIds.length > 0) {
    const res = await sr.client
      .from("posts")
      .select("id, titulo, slug_destino")
      .in("id", postIds);
    if (res.error) {
      console.error("[crm] posts(meta):", res.error.message);
    } else {
      for (const row of res.data ?? []) {
        const id = typeof row.id === "string" ? row.id : "";
        if (!id) continue;
        postMetaById.set(id, {
          titulo: typeof row.titulo === "string" ? row.titulo : "",
          slug_destino:
            typeof row.slug_destino === "string" && row.slug_destino.trim()
              ? row.slug_destino.trim().toLowerCase()
              : null,
        });
      }
    }
  }

  const flightOptionIds = Array.from(
    new Set(
      leads
        .map((lead) => {
          const postChoice = lead.post_choice as
            | { flight_option_id?: unknown; snapshot?: { flight?: { id?: unknown } } }
            | null
            | undefined;
          if (typeof postChoice?.flight_option_id === "string") {
            return postChoice.flight_option_id;
          }
          if (typeof postChoice?.snapshot?.flight?.id === "string") {
            return postChoice.snapshot.flight.id;
          }
          return null;
        })
        .filter((id): id is string => Boolean(id)),
    ),
  );
  const flightById = new Map<string, LeadPostChoiceFlightPrefill>();
  if (sr.ok && flightOptionIds.length > 0) {
    const res = await sr.client
      .from("post_flight_options")
      .select(
        "id, label, origem_iata, destino_iata, data_partida, data_regresso, cia, classe, bagagem_text, descricao",
      )
      .in("id", flightOptionIds);
    if (res.error) {
      console.error("[crm] post_flight_options:", res.error.message);
    } else {
      for (const row of res.data ?? []) {
        const id = typeof row.id === "string" ? row.id : "";
        if (!id) continue;
        flightById.set(id, {
          id,
          label: typeof row.label === "string" ? row.label : "",
          origem_iata: typeof row.origem_iata === "string" ? row.origem_iata : null,
          destino_iata: typeof row.destino_iata === "string" ? row.destino_iata : null,
          data_partida: typeof row.data_partida === "string" ? row.data_partida : null,
          data_regresso: typeof row.data_regresso === "string" ? row.data_regresso : null,
          cia: typeof row.cia === "string" ? row.cia : null,
          classe: typeof row.classe === "string" ? row.classe : null,
          bagagem_text: typeof row.bagagem_text === "string" ? row.bagagem_text : null,
          descricao: typeof row.descricao === "string" ? row.descricao : null,
        });
      }
    }
  }
  const leadsWithChoiceThumb = leads.map((lead) => {
    const postChoice = lead.post_choice as
      | { hotel_id?: unknown; snapshot?: { hotel?: { id?: unknown } } }
      | null
      | undefined;
    const hotelId =
      typeof postChoice?.hotel_id === "string"
        ? postChoice.hotel_id
        : typeof postChoice?.snapshot?.hotel?.id === "string"
          ? postChoice.snapshot.hotel.id
          : null;
    const flightId =
      typeof postChoice?.flight_option_id === "string"
        ? postChoice.flight_option_id
        : typeof postChoice?.snapshot?.flight?.id === "string"
          ? postChoice.snapshot.flight.id
          : null;
    const postMeta =
      typeof lead.post_id === "string" ? postMetaById.get(lead.post_id) : undefined;
    return {
      ...lead,
      post_choice_hotel_thumb_url: hotelId ? thumbByHotelId.get(hotelId) ?? null : null,
      post_choice_hotel_gallery_urls: hotelId
        ? (galleryByHotelId.get(hotelId) ?? []).slice(0, 12)
        : null,
      post_choice_flight_prefill: flightId ? flightById.get(flightId) ?? null : null,
      post_titulo: postMeta?.titulo ?? null,
      post_slug_destino: postMeta?.slug_destino ?? null,
    };
  });

  let clientUpd: { lead_id: string; message: string; created_at: string }[] =
    [];
  if (sr.ok) {
    const res = await sr.client
      .from("lead_client_updates")
      .select("lead_id, message, created_at")
      .order("created_at", { ascending: true });
    if (res.error) {
      console.error("[crm] lead_client_updates:", res.error.message);
    } else {
      clientUpd = res.data ?? [];
    }
  }

  let clientDecisions: {
    lead_id: string;
    decision: string;
    note: string | null;
    created_at: string;
  }[] = [];
  if (sr.ok) {
    const res = await sr.client
      .from("lead_client_decisions")
      .select("lead_id, decision, note, created_at")
      .order("created_at", { ascending: true });
    if (res.error) {
      console.error("[crm] lead_client_decisions:", res.error.message);
    } else {
      clientDecisions = res.data ?? [];
    }
  }

  const clientThreadsByLeadId: Record<
    string,
    { message: string; created_at: string }[]
  > = {};

  for (const row of clientUpd) {
    const k = row.lead_id;
    if (!clientThreadsByLeadId[k]) clientThreadsByLeadId[k] = [];
    clientThreadsByLeadId[k].push({
      message: row.message,
      created_at: row.created_at,
    });
  }

  const clientDecisionsByLeadId: Record<
    string,
    { decision: string; note: string | null; created_at: string }[]
  > = {};
  for (const row of clientDecisions) {
    const k = row.lead_id;
    if (!clientDecisionsByLeadId[k]) clientDecisionsByLeadId[k] = [];
    clientDecisionsByLeadId[k].push({
      decision: row.decision,
      note: row.note,
      created_at: row.created_at,
    });
  }

  let crmEmailRows: {
    lead_id: string;
    direction: string;
    subject: string;
    body_text: string;
    created_at: string;
  }[] = [];
  if (sr.ok) {
    const res = await sr.client
      .from("lead_crm_emails")
      .select("lead_id, direction, subject, body_text, created_at")
      .order("created_at", { ascending: true });
    if (res.error) {
      console.error("[crm] lead_crm_emails:", res.error.message);
    } else {
      crmEmailRows = res.data ?? [];
    }
  }

  const crmOutboundByLeadId: Record<
    string,
    {
      direction: "outbound" | "inbound";
      subject: string;
      body_text: string;
      created_at: string;
    }[]
  > = {};
  for (const row of crmEmailRows) {
    const k = row.lead_id;
    if (!crmOutboundByLeadId[k]) crmOutboundByLeadId[k] = [];
    const dir =
      row.direction === "inbound"
        ? ("inbound" as const)
        : ("outbound" as const);
    crmOutboundByLeadId[k].push({
      direction: dir,
      subject: row.subject,
      body_text: row.body_text,
      created_at: row.created_at,
    });
  }

  let propostaEnviosRows: {
    id: string;
    lead_id: string;
    created_at: string;
    valor_total: string;
    titulo: string;
    destino: string | null;
    datas: string | null;
    snapshot: unknown;
  }[] = [];
  if (sr.ok) {
    const res = await sr.client
      .from("lead_proposta_envios")
      .select(
        "id, lead_id, created_at, valor_total, titulo, destino, datas, snapshot",
      )
      .order("created_at", { ascending: true });
    if (res.error) {
      console.error("[crm] lead_proposta_envios:", res.error.message);
    } else {
      propostaEnviosRows = res.data ?? [];
    }
  }

  const propostaEnviosByLeadId: Record<string, LeadPropostaEnvioRow[]> = {};
  for (const row of propostaEnviosRows) {
    const k = row.lead_id;
    if (!propostaEnviosByLeadId[k]) propostaEnviosByLeadId[k] = [];
    const snap = parseDetalhesProposta(row.snapshot);
    propostaEnviosByLeadId[k].push({
      id: row.id,
      created_at: row.created_at,
      valor_total: row.valor_total,
      titulo: row.titulo,
      destino: row.destino,
      datas: row.datas,
      inclui: snap?.inclui,
    });
  }

  const quadroPainel = (
    <div className="space-y-4">
      {leads.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ocean-200 bg-ocean-50/40 px-6 py-5 text-center md:px-8">
          <p className="text-sm font-medium text-ocean-900">
            Ainda não há leads no quadro.
          </p>
          <p className="mt-1 text-sm text-ocean-600">
            Usa <span className="font-semibold text-ocean-800">Nova lead manual</span>{" "}
            abaixo para criar a primeira ficha, ou espera por pedidos do site.
          </p>
        </div>
      ) : null}
      <LeadsKanban
        initialLeads={leadsWithChoiceThumb}
        clientThreadsByLeadId={clientThreadsByLeadId}
        clientDecisionsByLeadId={clientDecisionsByLeadId}
        crmOutboundByLeadId={crmOutboundByLeadId}
        propostaEnviosByLeadId={propostaEnviosByLeadId}
        slaGreenMaxHours={slaGreenH}
        slaYellowMaxHours={slaYellowH}
        quizCopy={siteContent.quiz}
      />
    </div>
  );

  const arquivoPainel = (
    <div className="rounded-2xl border border-ocean-100 bg-white p-6 shadow-lg md:p-8">
      <h2 className="font-serif text-xl font-normal tracking-tight text-ocean-900 md:text-2xl">
        Exportar CSV
      </h2>
      <p className="mt-3 max-w-2xl text-sm text-ocean-600 md:text-base">
        {siteContent.crm.csvExportHint}
      </p>
      <div className="mt-5">
        <CrmLeadsExportButton />
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white p-6 shadow-lg md:p-8">
        <h1 className="font-serif text-2xl font-normal tracking-tight text-ocean-900 md:text-3xl">
          Leads
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-ocean-600 md:text-base">
          No separador <span className="font-medium text-ocean-800">Quadro</span>{" "}
          trabalhas as leads (com secções <span className="font-medium text-ocean-800">Trabalho</span>{" "}
          e <span className="font-medium text-ocean-800">Arquivo</span> dentro do
          painel). O separador{" "}
          <span className="font-medium text-ocean-800">Exportar CSV</span> é só para
          descarregar uma folha de cálculo.
        </p>
      </div>

      <CrmHomeTabs
        quadro={
          <>
            <div className="rounded-2xl border border-ocean-100 bg-white/90 p-4 shadow-sm md:p-5">
              <p className="text-sm text-ocean-600">
                Usa <span className="font-medium text-ocean-800">Nova lead manual</span>{" "}
                para registar pedidos que não vieram do site. Em{" "}
                <span className="font-medium text-ocean-800">Trabalho</span>, o quadro
                mostra só o pipeline (Nova lead → Em contacto → Proposta enviada):
                arrasta entre colunas; para{" "}
                <span className="font-medium text-ocean-800">Ganho</span> ou{" "}
                <span className="font-medium text-ocean-800">Cancelado</span> usa as
                ligações no cartão. «Arquivar» envia a ficha para o arquivo geral. No
                separador <span className="font-medium text-ocean-800">Arquivo</span>{" "}
                vês três grupos — Ganhas, Canceladas e Arquivo geral — com contagens
                separadas. Pedidos novos entram em{" "}
                <span className="font-medium text-ocean-800">Nova lead</span>. A cor da
                borda segue os tempos em Conteúdo do site → Quadro de leads (
                <span className="font-medium text-ocean-800">{slaGreenH}h</span> /{" "}
                <span className="font-medium text-ocean-800">{slaYellowH}h</span>
                ). Na vista <span className="font-medium text-ocean-800">Hoje</span> só
                entram leads activas no pipeline.
              </p>
            </div>
            {quadroPainel}
          </>
        }
        arquivo={arquivoPainel}
      />
    </div>
  );
}
