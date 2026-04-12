import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { Resend } from "resend";

import { findLatestLeadIdByClientEmail } from "@/lib/crm/find-lead-by-client-email";
import { parseFromEmailHeader } from "@/lib/crm/parse-from-email";
import { tryCreateServiceRoleClient } from "@/lib/supabase/service-role";

export const dynamic = "force-dynamic";

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
    console.info("[resend-webhook] ignored event type:", event.type);
    return NextResponse.json({ ok: true, ignored: event.type });
  }

  const { email_id, from, subject, created_at } = event.data;
  if (!email_id) {
    console.error("[resend-webhook] missing email_id in payload");
    return NextResponse.json({ ok: false, error: "missing email_id" }, { status: 400 });
  }

  const fromEmail = parseFromEmailHeader(from);
  if (!fromEmail) {
    console.warn("[resend-webhook] skip no_from; raw from:", from?.slice(0, 120));
    return NextResponse.json({ ok: true, skipped: "no_from" });
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

  const leadId = await findLatestLeadIdByClientEmail(sr.client, fromEmail);
  if (!leadId) {
    console.warn(
      "[resend-webhook] skip no_lead_match for fromEmail=",
      fromEmail,
      "— confirma que existe lead com este email na BD (ou alias Gmail +).",
    );
    return NextResponse.json({ ok: true, skipped: "no_lead_match" });
  }

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

  console.info("[resend-webhook] inbound saved leadId=", leadId, "from=", fromEmail);
  revalidatePath("/crm");
  return NextResponse.json({ ok: true, leadId });
}
