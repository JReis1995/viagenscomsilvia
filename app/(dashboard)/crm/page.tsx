import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { LeadsKanban } from "@/components/crm/leads-kanban";
import { isConsultoraEmailAsync } from "@/lib/auth/consultora";
import { createClient } from "@/lib/supabase/server";
import { tryCreateServiceRoleClient } from "@/lib/supabase/service-role";
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

  const sr = tryCreateServiceRoleClient();
  let data: LeadBoardRow[] | null = null;
  let error: { message: string } | null = null;

  if (sr.ok) {
    const res = await sr.client
      .from("leads")
      .select(
        "id, nome, email, telemovel, status, data_pedido, data_envio_orcamento, detalhes_proposta, vibe, companhia, destino_sonho, orcamento_estimado, auto_followup",
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
          servidor para não depender das políticas RLS.
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

  return (
    <div className="space-y-8">
      <div className="rounded-2xl bg-white p-6 shadow-lg md:p-8">
        <h1 className="font-serif text-2xl font-normal tracking-tight text-ocean-900 md:text-3xl">
          Quadro de leads
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-ocean-600 md:text-base">
          Arrasta os cartões entre colunas ou altera o estado no menu. As novas
          pedidos de proposta da página inicial entram em{" "}
          <span className="font-medium text-ocean-800">Nova lead</span>.
        </p>
      </div>

      {leads.length === 0 ? (
        <div className="rounded-2xl border border-ocean-100 bg-white/80 px-8 py-14 text-center shadow-md">
          <p className="text-lg text-ocean-800">Ainda não há leads.</p>
          <p className="mt-2 text-sm text-ocean-600">
            Quando alguém enviar o pedido de orçamento no site, aparece aqui.
          </p>
        </div>
      ) : (
        <LeadsKanban
          initialLeads={leads}
          clientThreadsByLeadId={clientThreadsByLeadId}
          clientDecisionsByLeadId={clientDecisionsByLeadId}
        />
      )}
    </div>
  );
}
