import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { Resend } from "resend";

import { extractTaggedLeadIdFromResendReceived } from "@/lib/crm/extract-lead-id-from-inbound";
import { findLatestLeadIdByClientEmail } from "@/lib/crm/find-lead-by-client-email";
import { parseFromEmailHeader } from "@/lib/crm/parse-from-email";
import { tryCreateServiceRoleClient } from "@/lib/supabase/service-role";

export const dynamic = "force-dynamic";

/** Eventos de envio (API Resend) — o CRM só processa `email.received` (Inbound). */
const RESEND_SEND_PIPELINE_EVENTS = new Set([
  "email.sent",
  "email.scheduled",
  "email.delivered",
  "email.delivery_delayed",
  "email.complained",
  "email.bounced",
  "email.opened",
  "email.clicked",
  "email.failed",
  "email.suppressed",
]);

function stripHtmlToText(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function POST(request: Request) {
  const secret = process.env.RESEND_WEBHOOK_SECRET?.trim();
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!secret || !apiKey) {
    return NextResponse.json(
      { ok: false, error: "Webhook não configurado." },
      { status: 503 },
    );
  }

  const payload = await request.text();
  const resend = new Resend(apiKey);

  let event;
  try {
    event = resend.webhooks.verify({
      payload,
      headers: {
        id: request.headers.get("svix-id") ?? "",
        timestamp: request.headers.get("svix-timestamp") ?? "",
        signature: request.headers.get("svix-signature") ?? "",
      },
      webhookSecret: secret,
    });
  } catch {
    return new NextResponse("Invalid webhook", { status: 400 });
  }

  if (event.type !== "email.received") {
    if (!RESEND_SEND_PIPELINE_EVENTS.has(event.type)) {
      console.info(
        "[resend-webhook] evento ignorado (não é inbound):",
        event.type,
      );
    }
    return NextResponse.json({ ok: true, ignored: event.type });
  }

  const { email_id, from, subject, created_at, to, cc, bcc } = event.data as {
    email_id?: string;
    from?: string;
    subject?: string;
    created_at?: string;
    to?: string[];
    cc?: string[];
    bcc?: string[];
  };
  if (!email_id) {
    console.error("[resend-webhook] missing email_id in payload");
    return NextResponse.json({ ok: false, error: "missing email_id" }, { status: 400 });
  }

  const sr = tryCreateServiceRoleClient();
  if (!sr.ok) {
    console.error("[resend-webhook]", sr.message);
    return NextResponse.json({ ok: false }, { status: 503 });
  }

  const { data: existing } = await sr.client
    .from("lead_crm_emails")
    .select("id")
    .eq("resend_email_id", email_id)
    .eq("direction", "inbound")
    .maybeSingle();

  if (existing) {
    console.info("[resend-webhook] deduped email_id:", email_id);
    return NextResponse.json({ ok: true, deduped: true });
  }

  const received = await resend.emails.receiving.get(email_id);
  if (received.error || !received.data) {
    console.error("[resend-webhook] receiving.get:", received.error?.message);
    return NextResponse.json({ ok: false }, { status: 502 });
  }

  const textBody =
    received.data.text?.trim() ||
    (received.data.html
      ? stripHtmlToText(received.data.html)
      : "") ||
    "(sem texto)";

  const rd = received.data as {
    to?: string[];
    cc?: string[];
    bcc?: string[];
    reply_to?: string[];
    headers?: Record<string, unknown>;
  };

  const taggedLeadId = extractTaggedLeadIdFromResendReceived({
    webhookTo: to,
    webhookCc: cc,
    webhookBcc: bcc,
    received: {
      to: rd.to,
      cc: rd.cc,
      bcc: rd.bcc,
      reply_to: rd.reply_to,
      headers: rd.headers,
    },
  });

  const fromEmail = parseFromEmailHeader(from ?? "");

  let resolvedLeadId: string | null = null;
  if (taggedLeadId) {
    const { data: row } = await sr.client
      .from("leads")
      .select("id")
      .eq("id", taggedLeadId)
      .maybeSingle();
    if (row?.id) resolvedLeadId = row.id;
  }

  if (!resolvedLeadId && fromEmail) {
    resolvedLeadId = await findLatestLeadIdByClientEmail(sr.client, fromEmail);
  }

  if (!resolvedLeadId) {
    console.warn(
      "[resend-webhook] skip no_lead_match from=",
      fromEmail || "(vazio)",
      "to=",
      JSON.stringify(to ?? rd.to ?? []),
      "tagged=",
      taggedLeadId ?? "(nenhum)",
      "header_keys=",
      rd.headers && typeof rd.headers === "object"
        ? Object.keys(rd.headers).join(",")
        : "(n/a)",
      "— confirma Reply-To com +leadId ou email da lead no From.",
    );
    return NextResponse.json({ ok: true, skipped: "no_lead_match" });
  }

  const leadId = resolvedLeadId;

  const subj = subject?.trim() || "(sem assunto)";
  const insertRow: {
    lead_id: string;
    direction: "inbound";
    subject: string;
    body_text: string;
    resend_email_id: string;
    sent_by_user_id: null;
    created_at?: string;
  } = {
    lead_id: leadId,
    direction: "inbound",
    subject: subj.slice(0, 500),
    body_text: textBody.slice(0, 16000),
    resend_email_id: email_id,
    sent_by_user_id: null,
  };
  if (created_at?.trim()) {
    insertRow.created_at = created_at.trim();
  }

  const { error: insertError } = await sr.client
    .from("lead_crm_emails")
    .insert(insertRow);

  if (insertError) {
    if (
      insertError.message.includes("direction") ||
      insertError.message.includes("lead_crm_emails")
    ) {
      console.error(
        "[resend-webhook] Executa sql/add_lead_crm_emails_inbound.sql:",
        insertError.message,
      );
    } else {
      console.error("[resend-webhook] insert:", insertError.message);
    }
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  const { error: unreadError } = await sr.client
    .from("leads")
    .update({ has_unread_messages: true })
    .eq("id", leadId);

  if (unreadError) {
    console.error(
      "[resend-webhook] leads.has_unread_messages (executa sql/add_lead_has_unread_messages.sql se a coluna não existir):",
      unreadError.message,
    );
  }

  console.info("[resend-webhook] inbound saved leadId=", leadId, "from=", fromEmail);
  revalidatePath("/crm");
  return NextResponse.json({ ok: true, leadId });
}
