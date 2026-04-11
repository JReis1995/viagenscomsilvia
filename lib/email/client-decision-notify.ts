import { Resend } from "resend";

function consultoraRecipientEmails(): string[] {
  const raw = process.env.CONSULTORA_EMAIL?.trim() ?? "";
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function sendLeadDecisionNotifyEmail(opts: {
  leadNome: string;
  leadEmail: string;
  decision: "approved" | "changes_requested";
  note?: string | null;
}): Promise<void> {
  const to = consultoraRecipientEmails();
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM?.trim();
  if (!to.length || !apiKey || !from) return;

  const label =
    opts.decision === "approved"
      ? "Aprovou o orçamento"
      : "Pediu alterações ao orçamento";

  const resend = new Resend(apiKey);
  const subject = `[Cliente] ${label} — ${opts.leadNome}`;
  const bodyNote =
    opts.decision === "changes_requested" && opts.note?.trim()
      ? `<p style="margin:16px 0 0;"><strong>Nota do cliente:</strong></p><p style="white-space:pre-wrap;">${escapeHtml(opts.note.trim())}</p>`
      : "";

  const html = `
    <p>O cliente <strong>${escapeHtml(opts.leadNome)}</strong> (${escapeHtml(opts.leadEmail)}) ${escapeHtml(label.toLowerCase())}.</p>
    ${bodyNote}
    <p style="margin-top:20px;font-size:14px;color:#555;">Abre o CRM para ver o histórico e responder.</p>
  `.trim();

  await resend.emails.send({
    from,
    to,
    subject,
    html,
    text: stripHtml(html),
  });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}
