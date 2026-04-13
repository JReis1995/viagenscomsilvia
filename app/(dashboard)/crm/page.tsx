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
import type { LeadBoardRow } from "@/types/lead";

export const metadata: Metadata = {
  title: "Painel",
  description: "Gestão de leads e orçamentos.",
};

export const dynamic = "force-dynamic";

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
    const res = await sr.client
      .from("leads")
      .select(
        "id, nome, email, telemovel, status, data_pedido, data_ultimo_followup, data_envio_orcamento, notas_internas, detalhes_proposta, clima_preferido, vibe, companhia, destino_sonho, orcamento_estimado, janela_datas, flexibilidade_datas, ja_tem_voos_hotel, auto_followup, pedido_rapido, utm_source, utm_medium, utm_campaign, utm_content, utm_term, referrer, landing_path, has_unread_messages, promo_campaign_id, promo_campaigns!promo_campaign_id ( discount_percent, titulo_publicacao, expires_at, link_publicacao )",
      )
      .order("data_pedido", { ascending: false });
    data = res.data as LeadBoardRow[] | null;
    error = res.error;
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
        initialLeads={leads}
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
