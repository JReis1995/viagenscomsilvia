"use server";

import { revalidatePath } from "next/cache";
import { Resend } from "resend";

import { isConsultoraEmailAsync } from "@/lib/auth/consultora";
import { notifyPromoSubscribers } from "@/lib/crm/notify-promo-subscribers";
import { revalidatePublicHome } from "@/lib/next/revalidate-public-home";
import { isCanonicalLeadStatus } from "@/lib/crm/lead-board";
import { buildCrmConsultoraToLeadEmail } from "@/lib/email/crm-consultora-to-lead";
import { resolveCrmEmailReplyTo } from "@/lib/email/resend-reply-to";
import {
  parseSiteContentForSave,
  type SiteContent,
} from "@/lib/site/site-content";
import { createClient } from "@/lib/supabase/server";
import { tryCreateServiceRoleClient } from "@/lib/supabase/service-role";
import { z } from "zod";

async function requireConsultora() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email || !(await isConsultoraEmailAsync(user.email, supabase))) {
    return {
      ok: false as const,
      error: "Sem permissão.",
      db: null,
    };
  }
  const sr = tryCreateServiceRoleClient();
  if (!sr.ok) {
    return {
      ok: false as const,
      error: `Servidor sem chave interna: ${sr.message}. Confirma SUPABASE_SERVICE_ROLE_KEY no .env.local.`,
      db: null,
    };
  }
  return { ok: true as const, user, db: sr.client };
}

const leadStatusActionSchema = z.object({
  leadId: z.string().uuid(),
  status: z.string().refine(isCanonicalLeadStatus, "Estado inválido."),
});

export async function updateLeadStatusAction(
  leadId: string,
  status: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = leadStatusActionSchema.safeParse({ leadId, status });
  if (!parsed.success) {
    return { ok: false, error: "Dados inválidos." };
  }

  const auth = await requireConsultora();
  if (!auth.ok || !auth.db) {
    return { ok: false, error: auth.error };
  }

  const { error } = await auth.db
    .from("leads")
    .update({ status: parsed.data.status })
    .eq("id", parsed.data.leadId);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/crm");
  return { ok: true };
}

const leadNotasSchema = z.object({
  leadId: z.string().uuid(),
  notas: z.string().max(8000),
});

export async function updateLeadNotasInternasAction(
  leadId: string,
  notas: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = leadNotasSchema.safeParse({ leadId, notas });
  if (!parsed.success) {
    return { ok: false, error: "Dados inválidos." };
  }

  const auth = await requireConsultora();
  if (!auth.ok || !auth.db) {
    return { ok: false, error: auth.error };
  }

  const { error } = await auth.db
    .from("leads")
    .update({ notas_internas: parsed.data.notas.trim() || null })
    .eq("id", parsed.data.leadId);

  if (error) {
    if (
      error.message.includes("notas_internas") ||
      error.message.includes("schema cache")
    ) {
      return {
        ok: false,
        error:
          `${error.message} Executa sql/add_lead_notas_internas.sql no Supabase.`,
      };
    }
    return { ok: false, error: error.message };
  }

  revalidatePath("/crm");
  return { ok: true };
}

const sendLeadCrmEmailSchema = z.object({
  leadId: z.string().uuid(),
  subject: z.string().trim().min(1).max(400),
  body: z.string().trim().min(1).max(12000),
});

export async function sendLeadCrmEmailAction(
  leadId: string,
  subject: string,
  body: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = sendLeadCrmEmailSchema.safeParse({ leadId, subject, body });
  if (!parsed.success) {
    return { ok: false, error: "Assunto ou mensagem inválidos." };
  }

  const auth = await requireConsultora();
  if (!auth.ok || !auth.db) {
    return { ok: false, error: auth.error };
  }

  const { data: lead, error: leadErr } = await auth.db
    .from("leads")
    .select("id, nome, email")
    .eq("id", parsed.data.leadId)
    .maybeSingle();

  if (leadErr || !lead?.email?.trim()) {
    return { ok: false, error: "Lead não encontrada ou sem email." };
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM?.trim();
  if (!apiKey || !from) {
    return {
      ok: false,
      error:
        "Email não configurado no servidor (RESEND_API_KEY / RESEND_FROM).",
    };
  }

  const { subject: resendSubject, html, text } = buildCrmConsultoraToLeadEmail(
    lead.nome ?? "",
    parsed.data.subject,
    parsed.data.body,
  );

  const replyTo = resolveCrmEmailReplyTo(auth.user.email ?? undefined);

  try {
    const resend = new Resend(apiKey);
    const { data: sent, error: sendError } = await resend.emails.send({
      from,
      to: lead.email.trim(),
      ...(replyTo ? { replyTo } : {}),
      subject: resendSubject,
      html,
      text,
    });

    if (sendError) {
      console.error("[crm-email] Resend:", sendError.message);
      return {
        ok: false,
        error: "O envio falhou. Tenta de novo dentro de momentos.",
      };
    }

    const { error: insertError } = await auth.db.from("lead_crm_emails").insert({
      lead_id: parsed.data.leadId,
      direction: "outbound",
      subject: parsed.data.subject.trim(),
      body_text: parsed.data.body.trim(),
      resend_email_id: sent?.id ?? null,
      sent_by_user_id: auth.user.id,
    });

    if (insertError) {
      console.error("[crm-email] insert:", insertError.message);
      if (
        insertError.message.includes("lead_crm_emails") ||
        insertError.message.includes("schema cache")
      ) {
        return {
          ok: false,
          error:
            `${insertError.message} Executa sql/add_lead_crm_emails.sql no Supabase. (O email pode ter sido enviado — confirma na caixa da lead.)`,
        };
      }
      return {
        ok: false,
        error:
          "Email enviado mas não foi possível registar no histórico. Anota manualmente.",
      };
    }
  } catch (e) {
    console.error("[crm-email]", e);
    return { ok: false, error: "Erro inesperado ao enviar." };
  }

  revalidatePath("/crm");
  return { ok: true };
}

const registerInboundEmailSchema = z.object({
  leadId: z.string().uuid(),
  subject: z.string().trim().min(1).max(400),
  body: z.string().trim().min(1).max(12000),
});

/** Regista no histórico uma resposta que a lead enviou por email (ex.: Gmail). */
export async function registerLeadInboundEmailAction(
  leadId: string,
  subject: string,
  body: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = registerInboundEmailSchema.safeParse({ leadId, subject, body });
  if (!parsed.success) {
    return { ok: false, error: "Assunto ou mensagem inválidos." };
  }

  const auth = await requireConsultora();
  if (!auth.ok || !auth.db) {
    return { ok: false, error: auth.error };
  }

  const { data: lead, error: leadErr } = await auth.db
    .from("leads")
    .select("id")
    .eq("id", parsed.data.leadId)
    .maybeSingle();

  if (leadErr || !lead) {
    return { ok: false, error: "Lead não encontrada." };
  }

  const { error: insertError } = await auth.db.from("lead_crm_emails").insert({
    lead_id: parsed.data.leadId,
    direction: "inbound",
    subject: parsed.data.subject.trim(),
    body_text: parsed.data.body.trim(),
    resend_email_id: null,
    sent_by_user_id: null,
  });

  if (insertError) {
    console.error("[crm-email-inbound] insert:", insertError.message);
    if (
      insertError.message.includes("lead_crm_emails") ||
      insertError.message.includes("direction") ||
      insertError.message.includes("schema cache")
    ) {
      return {
        ok: false,
        error:
          `${insertError.message} Executa sql/add_lead_crm_emails_inbound.sql no Supabase (valor inbound em direction).`,
      };
    }
    return { ok: false, error: insertError.message };
  }

  revalidatePath("/crm");
  return { ok: true };
}

export async function saveSiteContentAction(
  payload: SiteContent,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = parseSiteContentForSave(payload);
  if (!parsed) {
    return { ok: false, error: "Dados inválidos." };
  }

  const auth = await requireConsultora();
  if (!auth.ok || !auth.db) {
    return { ok: false, error: auth.error };
  }

  const { error } = await auth.db.from("site_content").upsert(
    { id: "default", payload: parsed },
    { onConflict: "id" },
  );

  if (error) {
    return {
      ok: false,
      error:
        error.message +
        (error.message.includes("site_content")
          ? " Executa sql/sprint2_cms_and_consultora_rls.sql no Supabase."
          : ""),
    };
  }

  revalidatePublicHome();
  revalidatePath("/crm/site");
  return { ok: true };
}

function parseOptionalCoord(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : Number(v);
  if (Number.isNaN(n)) return null;
  return n;
}

const crmPostBase = z.object({
  tipo: z.enum(["promocao", "video", "inspiracao"]),
  titulo: z.string().min(1).max(500),
  descricao: z.string().max(4000).optional().nullable(),
  media_url: z.string().min(1).max(2048),
  preco_desde: z.string().max(200).optional().nullable(),
  link_cta: z.string().max(2048).optional().nullable(),
  status: z.boolean(),
  data_publicacao: z.string().min(1).max(40),
  ordem_site: z.coerce.number().int().min(-999999).max(999999),
  membros_apenas: z.boolean().optional().default(false),
  slug_destino: z.string().max(200).optional().nullable(),
  latitude: z.preprocess(
    parseOptionalCoord,
    z.union([z.number().min(-90).max(90), z.null()]).optional(),
  ),
  longitude: z.preprocess(
    parseOptionalCoord,
    z.union([z.number().min(-180).max(180), z.null()]).optional(),
  ),
  feed_vibe_slugs: z.array(z.string().max(48)).max(12).optional().default([]),
  hover_line: z.string().max(400).optional().nullable(),
});

export type CrmPostInput = z.infer<typeof crmPostBase>;

export async function createCrmPostAction(
  input: CrmPostInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const row = crmPostBase.safeParse(input);
  if (!row.success) {
    return { ok: false, error: "Campos inválidos." };
  }

  const auth = await requireConsultora();
  if (!auth.ok || !auth.db) {
    return { ok: false, error: auth.error };
  }

  const lat = row.data.latitude ?? null;
  const lng = row.data.longitude ?? null;
  const slug = row.data.slug_destino?.trim().toLowerCase() || null;

  const { error } = await auth.db.from("posts").insert({
    tipo: row.data.tipo,
    titulo: row.data.titulo,
    descricao: row.data.descricao?.trim() || null,
    media_url: row.data.media_url.trim(),
    preco_desde: row.data.preco_desde?.trim() || null,
    link_cta: row.data.link_cta?.trim() || null,
    status: row.data.status,
    data_publicacao: row.data.data_publicacao,
    ordem_site: row.data.ordem_site,
    membros_apenas: row.data.membros_apenas,
    slug_destino: slug,
    latitude: lat,
    longitude: lng,
    feed_vibe_slugs: row.data.feed_vibe_slugs ?? [],
    hover_line: row.data.hover_line?.trim() || null,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  const pubAt = new Date(row.data.data_publicacao);
  const isLive = row.data.status && pubAt <= new Date();
  if (row.data.tipo === "promocao" && isLive) {
    const origin =
      process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
      (process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000");
    try {
      await notifyPromoSubscribers({
        titulo: row.data.titulo,
        siteOrigin: origin,
      });
    } catch (e) {
      console.error("[crm] notify promo subscribers:", e);
    }
  }

  revalidatePublicHome();
  revalidatePath("/crm/publicacoes");
  revalidatePath("/mapa");
  return { ok: true };
}

export async function updateCrmPostAction(
  id: string,
  input: CrmPostInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (
    !id ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      id,
    )
  ) {
    return { ok: false, error: "ID inválido." };
  }

  const row = crmPostBase.safeParse(input);
  if (!row.success) {
    return { ok: false, error: "Campos inválidos." };
  }

  const auth = await requireConsultora();
  if (!auth.ok || !auth.db) {
    return { ok: false, error: auth.error };
  }

  const lat = row.data.latitude ?? null;
  const lng = row.data.longitude ?? null;
  const slug = row.data.slug_destino?.trim().toLowerCase() || null;

  const { error } = await auth.db
    .from("posts")
    .update({
      tipo: row.data.tipo,
      titulo: row.data.titulo,
      descricao: row.data.descricao?.trim() || null,
      media_url: row.data.media_url.trim(),
      preco_desde: row.data.preco_desde?.trim() || null,
      link_cta: row.data.link_cta?.trim() || null,
      status: row.data.status,
      data_publicacao: row.data.data_publicacao,
      ordem_site: row.data.ordem_site,
      membros_apenas: row.data.membros_apenas,
      slug_destino: slug,
      latitude: lat,
      longitude: lng,
      feed_vibe_slugs: row.data.feed_vibe_slugs ?? [],
      hover_line: row.data.hover_line?.trim() || null,
    })
    .eq("id", id);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePublicHome();
  revalidatePath("/crm/publicacoes");
  revalidatePath("/mapa");
  return { ok: true };
}

export async function deleteCrmPostAction(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (
    !id ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      id,
    )
  ) {
    return { ok: false, error: "ID inválido." };
  }

  const auth = await requireConsultora();
  if (!auth.ok || !auth.db) {
    return { ok: false, error: auth.error };
  }

  const { error } = await auth.db.from("posts").delete().eq("id", id);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePublicHome();
  revalidatePath("/crm/publicacoes");
  revalidatePath("/mapa");
  return { ok: true };
}
