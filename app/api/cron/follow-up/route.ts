import { NextResponse, type NextRequest } from "next/server";
import { Resend } from "resend";

import { buildFollowupReminderEmail } from "@/lib/email/followup-reminder-lead";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const MAX_LEADS_PER_RUN = 25;

type LeadRow = {
  id: string;
  nome: string;
  email: string;
  destino_sonho: string | null;
  data_pedido: string;
};

/**
 * Cron Vercel (GET diário) — lembrete por email a leads ainda em «Nova Lead»,
 * sem orçamento enviado, com `auto_followup` e `global_auto_followup` ativos.
 *
 * Env: `CRON_SECRET` (Authorization: Bearer), `SUPABASE_SERVICE_ROLE_KEY`,
 * `RESEND_API_KEY`, `RESEND_FROM`. Opcional: `FOLLOWUP_LEAD_MIN_DAYS` (default 3).
 *
 * SQL: `sql/add_lead_data_ultimo_followup.sql` na raiz do repo.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "CRON_SECRET não configurado." },
      { status: 503 },
    );
  }

  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY em falta." },
      { status: 503 },
    );
  }

  const resendKey = process.env.RESEND_API_KEY;
  const resendFrom = process.env.RESEND_FROM;
  if (!resendKey || !resendFrom) {
    return NextResponse.json(
      { error: "RESEND_API_KEY ou RESEND_FROM em falta." },
      { status: 503 },
    );
  }

  const rawDays = process.env.FOLLOWUP_LEAD_MIN_DAYS;
  const parsedDays = rawDays ? Number(rawDays) : 3;
  const minDays =
    Number.isFinite(parsedDays) && parsedDays >= 1 && parsedDays <= 90
      ? parsedDays
      : 3;

  const cutoff = new Date();
  cutoff.setUTCDate(cutoff.getUTCDate() - minDays);
  const cutoffIso = cutoff.toISOString();

  const { data: configRows, error: configError } = await admin
    .from("configuracoes_globais")
    .select("global_auto_followup")
    .limit(1);

  if (configError) {
    console.error("[cron/follow-up] config:", configError.message);
    return NextResponse.json(
      { error: "Não foi possível ler configurações globais." },
      { status: 500 },
    );
  }

  const globalAuto =
    configRows && configRows.length > 0
      ? Boolean(configRows[0].global_auto_followup)
      : true;

  if (!globalAuto) {
    return NextResponse.json({
      ok: true,
      skipped: true,
      reason: "global_auto_followup desativado",
    });
  }

  const { data: leads, error: leadsError } = await admin
    .from("leads")
    .select("id, nome, email, destino_sonho, data_pedido")
    .eq("status", "Nova Lead")
    .is("data_envio_orcamento", null)
    .eq("auto_followup", true)
    .is("data_ultimo_followup", null)
    .lt("data_pedido", cutoffIso)
    .order("data_pedido", { ascending: true })
    .limit(MAX_LEADS_PER_RUN);

  if (leadsError) {
    console.error("[cron/follow-up] leads:", leadsError.message);
    const msg = leadsError.message.toLowerCase();
    const hint =
      msg.includes("data_ultimo_followup") || msg.includes("does not exist")
        ? " Executa sql/add_lead_data_ultimo_followup.sql no Supabase."
        : "";
    return NextResponse.json(
      { error: `Consulta a leads falhou.${hint}`, detail: leadsError.message },
      { status: 500 },
    );
  }

  const list = (leads ?? []) as LeadRow[];
  const resend = new Resend(resendKey);
  let sent = 0;
  const failures: { id: string; message: string }[] = [];

  const nowIso = new Date().toISOString();

  for (const lead of list) {
    const { subject, html, text } = buildFollowupReminderEmail({
      nome: lead.nome,
      destino_sonho: lead.destino_sonho,
    });

    const { error: sendError } = await resend.emails.send({
      from: resendFrom,
      to: lead.email,
      subject,
      html,
      text,
    });

    if (sendError) {
      console.error("[cron/follow-up] Resend:", sendError.message, lead.id);
      failures.push({ id: lead.id, message: sendError.message });
      continue;
    }

    const { error: updateError } = await admin
      .from("leads")
      .update({ data_ultimo_followup: nowIso })
      .eq("id", lead.id);

    if (updateError) {
      console.error("[cron/follow-up] update:", updateError.message, lead.id);
      failures.push({ id: lead.id, message: updateError.message });
      continue;
    }

    sent += 1;
  }

  return NextResponse.json({
    ok: true,
    candidates: list.length,
    sent,
    failures,
  });
}
