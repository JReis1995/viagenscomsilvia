"use server";

import { revalidatePath } from "next/cache";
import { Resend } from "resend";

import { isConsultoraEmailAsync } from "@/lib/auth/consultora";
import { notifyPromoSubscribers } from "@/lib/crm/notify-promo-subscribers";
import { revalidatePublicHome } from "@/lib/next/revalidate-public-home";
import { climaLabelForKey } from "@/lib/marketing/quiz-clima";
import {
  flexibilidadeLabel,
  voosHotelLabel,
} from "@/lib/marketing/quiz-qualificacao";
import { hasOpenDuplicateLead } from "@/lib/crm/lead-duplicate";
import { isCanonicalLeadStatus } from "@/lib/crm/lead-board";
import { parseDetalhesProposta } from "@/lib/crm/detalhes-proposta";
import { fetchSiteContent } from "@/lib/site/fetch-site-content";
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

const deleteLeadSchema = z.object({
  leadId: z.string().uuid(),
});

/** Remove a ficha da base de dados (emails CRM e envios de orçamento apagam em cascata). */
export async function deleteLeadAction(
  leadId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = deleteLeadSchema.safeParse({ leadId });
  if (!parsed.success) {
    return { ok: false, error: "Dados inválidos." };
  }

  const auth = await requireConsultora();
  if (!auth.ok || !auth.db) {
    return { ok: false, error: auth.error };
  }

  const { error } = await auth.db
    .from("leads")
    .delete()
    .eq("id", parsed.data.leadId);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/crm");
  return { ok: true };
}

const createManualLeadSchema = z.object({
  nome: z.string().trim().min(2, "Indica o nome (mínimo 2 caracteres).").max(120),
  email: z.string().trim().email("Email inválido.").max(255),
  telemovel: z.string().trim().max(30).optional().default(""),
  destino_sonho: z.string().trim().max(300).optional().default(""),
  notas_internas: z.string().trim().max(8000).optional().default(""),
  auto_followup: z.boolean(),
});

/** Lead criada pela consultora (ex.: pedido por telefone ou WhatsApp, sem passar pelo site). Não envia email de boas-vindas. */
export async function createManualLeadAction(
  raw: unknown,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = createManualLeadSchema.safeParse(raw);
  if (!parsed.success) {
    const fe = parsed.error.flatten().fieldErrors;
    const first =
      Object.values(fe).flat()[0] ?? "Dados inválidos.";
    return { ok: false, error: first };
  }

  const {
    nome,
    email,
    telemovel: teleRaw,
    destino_sonho: destinoRaw,
    notas_internas: notasRaw,
    auto_followup,
  } = parsed.data;

  const telDigits = teleRaw.replace(/\D/g, "");
  let telemovel: string | null = null;
  if (telDigits.length > 0) {
    if (telDigits.length < 9 || telDigits.length > 15) {
      return {
        ok: false,
        error: "Telemóvel inválido — usa entre 9 e 15 dígitos ou deixa vazio.",
      };
    }
    telemovel = teleRaw.trim();
  }

  const auth = await requireConsultora();
  if (!auth.ok || !auth.db) {
    return { ok: false, error: auth.error };
  }

  const dup = await hasOpenDuplicateLead(auth.db, email, telemovel);
  if (dup) {
    return {
      ok: false,
      error:
        "Já existe uma lead em aberto com este email ou telemóvel. Abre a ficha no quadro ou move a lead anterior para um estado final antes de criar outra.",
    };
  }

  const destino =
    destinoRaw.trim() || "Pedido manual (registado no CRM)";
  const notas = notasRaw.trim() || null;

  const { error } = await auth.db.from("leads").insert({
    nome: nome.trim(),
    email: email.trim(),
    telemovel,
    status: "Nova Lead",
    pedido_rapido: true,
    destino_sonho: destino,
    clima_preferido: null,
    vibe: null,
    companhia: null,
    orcamento_estimado: null,
    notas_internas: notas,
    auto_followup,
    utm_source: "crm",
    utm_medium: "manual",
    utm_campaign: null,
    utm_content: null,
    utm_term: null,
    referrer: "Registo manual no painel CRM.",
    landing_path: "/crm",
  });

  if (error) {
    if (
      error.message.includes("notas_internas") ||
      error.message.includes("schema cache")
    ) {
      return {
        ok: false,
        error: `${error.message} Executa sql/add_lead_notas_internas.sql no Supabase.`,
      };
    }
    return { ok: false, error: error.message };
  }

  revalidatePath("/crm");
  return { ok: true };
}

const markLeadMessagesReadSchema = z.object({
  leadId: z.string().uuid(),
});

/** Marca emails inbound como vistos (remove o ponto vermelho no Kanban). */
export async function markLeadCrmMessagesReadAction(
  leadId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = markLeadMessagesReadSchema.safeParse({ leadId });
  if (!parsed.success) {
    return { ok: false, error: "Dados inválidos." };
  }

  const auth = await requireConsultora();
  if (!auth.ok || !auth.db) {
    return { ok: false, error: auth.error };
  }

  const { error } = await auth.db
    .from("leads")
    .update({ has_unread_messages: false })
    .eq("id", parsed.data.leadId);

  if (error) {
    if (error.message.includes("has_unread_messages")) {
      return {
        ok: false,
        error: `${error.message} Executa sql/add_lead_has_unread_messages.sql no Supabase.`,
      };
    }
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

const updateLeadAutoFollowupSchema = z.object({
  leadId: z.string().uuid(),
  autoFollowup: z.boolean(),
});

/** Liga ou desliga o lembrete automático (cron) só nesta ficha. */
export async function updateLeadAutoFollowupAction(
  leadId: string,
  autoFollowup: boolean,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = updateLeadAutoFollowupSchema.safeParse({
    leadId,
    autoFollowup,
  });
  if (!parsed.success) {
    return { ok: false, error: "Dados inválidos." };
  }

  const auth = await requireConsultora();
  if (!auth.ok || !auth.db) {
    return { ok: false, error: auth.error };
  }

  const { error } = await auth.db
    .from("leads")
    .update({ auto_followup: parsed.data.autoFollowup })
    .eq("id", parsed.data.leadId);

  if (error) {
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

export type SendLeadCrmEmailOptions = {
  /**
   * Quando o envio usa o modelo «Lembrete inicial (igual ao automático)»:
   * grava `data_ultimo_followup` como o cron, para não repetir no dia seguinte.
   */
  markFollowupReminderSent?: boolean;
};

export async function sendLeadCrmEmailAction(
  leadId: string,
  subject: string,
  body: string,
  options?: SendLeadCrmEmailOptions,
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
    parsed.data.subject,
    parsed.data.body,
  );

  const replyTo = resolveCrmEmailReplyTo(auth.user.email ?? undefined, {
    leadId: parsed.data.leadId,
  });

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

    if (options?.markFollowupReminderSent) {
      const nowIso = new Date().toISOString();
      const { error: fuErr } = await auth.db
        .from("leads")
        .update({ data_ultimo_followup: nowIso })
        .eq("id", parsed.data.leadId);
      if (fuErr) {
        console.error("[crm-email] data_ultimo_followup:", fuErr.message);
      }
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
  slug: z.string().max(220).optional().nullable(),
  descricao: z.string().max(4000).optional().nullable(),
  media_url: z.string().min(1).max(2048),
  preco_desde: z.string().max(200).optional().nullable(),
  preco_base_eur: z.union([z.number().min(0).max(1000000), z.null()]).optional(),
  has_variants: z.boolean().optional().default(false),
  link_cta: z.string().max(2048).optional().nullable(),
  status: z.boolean(),
  data_publicacao: z.string().min(1).max(40),
  data_fim_publicacao: z.string().max(40).optional().nullable(),
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
  pets_allowed: z.union([z.boolean(), z.null()]).optional(),
  capacidade_min: z.union([z.number().int().min(1).max(40), z.null()]).optional(),
  capacidade_max: z.union([z.number().int().min(1).max(40), z.null()]).optional(),
  variants_publish_confirmed: z.boolean().optional(),
}).refine(
  (d) =>
    d.capacidade_min == null ||
    d.capacidade_max == null ||
    d.capacidade_max >= d.capacidade_min,
  {
    message: "A capacidade máxima deve ser igual ou superior à mínima.",
    path: ["capacidade_max"],
  },
).refine(
  (d) => {
    if (!d.data_fim_publicacao || !d.data_fim_publicacao.trim()) return true;
    const start = new Date(d.data_publicacao);
    const end = new Date(d.data_fim_publicacao);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return false;
    return end > start;
  },
  {
    message: "A data de fim deve ser posterior à data de publicação.",
    path: ["data_fim_publicacao"],
  },
);

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
  const postSlug = row.data.slug?.trim().toLowerCase() || null;

  const { error } = await auth.db.from("posts").insert({
    tipo: row.data.tipo,
    titulo: row.data.titulo,
    slug: postSlug,
    descricao: row.data.descricao?.trim() || null,
    media_url: row.data.media_url.trim(),
    preco_desde: row.data.preco_desde?.trim() || null,
    preco_base_eur: row.data.preco_base_eur ?? null,
    has_variants: row.data.has_variants ?? false,
    link_cta: row.data.link_cta?.trim() || null,
    status: row.data.status,
    data_publicacao: row.data.data_publicacao,
    data_fim_publicacao: row.data.data_fim_publicacao?.trim() || null,
    ordem_site: row.data.ordem_site,
    membros_apenas: row.data.membros_apenas,
    slug_destino: slug,
    latitude: lat,
    longitude: lng,
    feed_vibe_slugs: row.data.feed_vibe_slugs ?? [],
    hover_line: row.data.hover_line?.trim() || null,
    pets_allowed:
      typeof row.data.pets_allowed === "boolean" ? row.data.pets_allowed : null,
    capacidade_min: row.data.capacidade_min ?? null,
    capacidade_max: row.data.capacidade_max ?? null,
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
  const postSlug = row.data.slug?.trim().toLowerCase() || null;

  if (row.data.status && row.data.has_variants) {
    const [hotelsCount, extrasCount, flightsCount] = await Promise.all([
      auth.db
        .from("post_hotels")
        .select("id", { count: "exact", head: true })
        .eq("post_id", id),
      auth.db
        .from("post_extras")
        .select("id", { count: "exact", head: true })
        .eq("post_id", id),
      auth.db
        .from("post_flight_options")
        .select("id", { count: "exact", head: true })
        .eq("post_id", id),
    ]);
    const variantsCount =
      (hotelsCount.count ?? 0) + (extrasCount.count ?? 0) + (flightsCount.count ?? 0);
    if (variantsCount > 0 && row.data.variants_publish_confirmed !== true) {
      return {
        ok: false,
        error:
          "Confirma a validação das variantes antes de publicar esta publicação.",
      };
    }
  }

  const { error } = await auth.db
    .from("posts")
    .update({
      tipo: row.data.tipo,
      titulo: row.data.titulo,
      slug: postSlug,
      descricao: row.data.descricao?.trim() || null,
      media_url: row.data.media_url.trim(),
      preco_desde: row.data.preco_desde?.trim() || null,
      preco_base_eur: row.data.preco_base_eur ?? null,
      has_variants: row.data.has_variants ?? false,
      link_cta: row.data.link_cta?.trim() || null,
      status: row.data.status,
      data_publicacao: row.data.data_publicacao,
      data_fim_publicacao: row.data.data_fim_publicacao?.trim() || null,
      ordem_site: row.data.ordem_site,
      membros_apenas: row.data.membros_apenas,
      slug_destino: slug,
      latitude: lat,
      longitude: lng,
      feed_vibe_slugs: row.data.feed_vibe_slugs ?? [],
      hover_line: row.data.hover_line?.trim() || null,
      pets_allowed:
        typeof row.data.pets_allowed === "boolean"
          ? row.data.pets_allowed
          : null,
      capacidade_min: row.data.capacidade_min ?? null,
      capacidade_max: row.data.capacidade_max ?? null,
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

export async function createCrmPostDraftAction(): Promise<
  { ok: true; id: string } | { ok: false; error: string }
> {
  const auth = await requireConsultora();
  if (!auth.ok || !auth.db) {
    return { ok: false, error: auth.error };
  }
  const nowIso = new Date().toISOString();
  const { data, error } = await auth.db
    .from("posts")
    .insert({
      tipo: "inspiracao",
      titulo: "Rascunho de publicação",
      slug: null,
      descricao: null,
      media_url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e",
      preco_desde: null,
      preco_base_eur: null,
      has_variants: true,
      link_cta: null,
      status: false,
      data_publicacao: nowIso,
      data_fim_publicacao: null,
      ordem_site: 0,
      membros_apenas: false,
      slug_destino: null,
      latitude: null,
      longitude: null,
      feed_vibe_slugs: [],
      hover_line: null,
      pets_allowed: null,
      capacidade_min: null,
      capacidade_max: null,
    })
    .select("id")
    .single();

  if (error || !data?.id) {
    return { ok: false, error: error?.message ?? "Não foi possível criar rascunho." };
  }

  revalidatePath("/crm/publicacoes");
  return { ok: true, id: data.id as string };
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

function csvEscapeCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const s = String(value).replace(/\r?\n/g, " ").trim();
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

/** Exportação CSV para folhas ou integrações (Zapier/Make) — UTF-8 com BOM. */
export async function exportLeadsCsvAction(): Promise<
  { ok: true; csv: string; filename: string } | { ok: false; error: string }
> {
  const auth = await requireConsultora();
  if (!auth.ok || !auth.db) {
    return { ok: false, error: auth.error };
  }

  const site = await fetchSiteContent();
  const { data, error } = await auth.db
    .from("leads")
    .select(
      "id, nome, email, telemovel, status, data_pedido, data_envio_orcamento, detalhes_proposta, notas_internas, clima_preferido, vibe, companhia, destino_sonho, orcamento_estimado, janela_datas, flexibilidade_datas, ja_tem_voos_hotel, pedido_adultos, pedido_criancas, pedido_idades_criancas, pedido_quartos, pedido_animais_estimacao, post_choice, auto_followup, pedido_rapido, utm_source, utm_medium, utm_campaign, utm_content, utm_term, referrer, landing_path",
    )
    .order("data_pedido", { ascending: false });

  if (error) {
    return { ok: false, error: error.message };
  }

  const { data: envioRows, error: envioErr } = await auth.db
    .from("lead_proposta_envios")
    .select("lead_id");
  if (envioErr) {
    console.error("[export csv] lead_proposta_envios:", envioErr.message);
  }
  const envioCountByLead = new Map<string, number>();
  for (const row of envioRows ?? []) {
    const id = row.lead_id as string;
    envioCountByLead.set(id, (envioCountByLead.get(id) ?? 0) + 1);
  }

  const rows = data ?? [];
  const header = [
    "id",
    "nome",
    "email",
    "telemovel",
    "status",
    "data_pedido",
    "data_envio_orcamento",
    "orcamento_valor_ultimo_envio",
    "envios_orcamento_count",
    "clima",
    "vibe",
    "companhia",
    "destino_sonho",
    "orcamento_estimado",
    "janela_datas",
    "flexibilidade_datas",
    "flexibilidade_rotulo",
    "ja_tem_voos_hotel",
    "voos_hotel_rotulo",
    "hotel_escolhido",
    "extras_count",
    "voo_label",
    "total_eur",
    "pedido_adultos",
    "pedido_criancas",
    "pedido_idades_criancas",
    "pedido_animais_estimacao",
    "pedido_quartos",
    "pedido_rapido",
    "auto_followup",
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_content",
    "utm_term",
    "referrer",
    "landing_path",
    "notas_internas",
  ];

  const lines = [header.join(",")];
  for (const r of rows as Record<string, unknown>[]) {
    const flexKey = r.flexibilidade_datas as string | null | undefined;
    const voosKey = r.ja_tem_voos_hotel as string | null | undefined;
    const climaKey = r.clima_preferido as string | null | undefined;
    const postChoice = (r.post_choice ?? null) as
      | {
          computed_total_eur?: unknown;
          snapshot?: {
            hotel?: { label?: unknown };
            extras?: Array<unknown>;
            flight?: { label?: unknown };
          };
        }
      | null;
    const hotelLabel =
      typeof postChoice?.snapshot?.hotel?.label === "string"
        ? postChoice.snapshot.hotel.label.trim()
        : "";
    const extrasCount = Array.isArray(postChoice?.snapshot?.extras)
      ? postChoice.snapshot.extras.length
      : 0;
    const vooLabel =
      typeof postChoice?.snapshot?.flight?.label === "string"
        ? postChoice.snapshot.flight.label.trim()
        : "";
    const totalEur =
      typeof postChoice?.computed_total_eur === "number" &&
      Number.isFinite(postChoice.computed_total_eur)
        ? postChoice.computed_total_eur
        : "";
    const det = parseDetalhesProposta(r.detalhes_proposta);
    const valorUltimoEnvio = det?.valor_total?.trim() ?? "";
    const leadId = r.id as string;
    let nOrcamentos = envioCountByLead.get(leadId) ?? 0;
    if (nOrcamentos === 0 && r.data_envio_orcamento) {
      nOrcamentos = 1;
    }
    lines.push(
      [
        csvEscapeCell(r.id),
        csvEscapeCell(r.nome),
        csvEscapeCell(r.email),
        csvEscapeCell(r.telemovel),
        csvEscapeCell(r.status),
        csvEscapeCell(r.data_pedido),
        csvEscapeCell(r.data_envio_orcamento),
        csvEscapeCell(valorUltimoEnvio),
        csvEscapeCell(nOrcamentos),
        csvEscapeCell(
          climaKey?.trim()
            ? climaLabelForKey(climaKey.trim(), site.quiz)
            : "",
        ),
        csvEscapeCell(r.vibe),
        csvEscapeCell(r.companhia),
        csvEscapeCell(r.destino_sonho),
        csvEscapeCell(r.orcamento_estimado),
        csvEscapeCell(r.janela_datas),
        csvEscapeCell(flexKey),
        csvEscapeCell(flexibilidadeLabel(flexKey, site.quiz)),
        csvEscapeCell(voosKey),
        csvEscapeCell(voosHotelLabel(voosKey, site.quiz)),
        csvEscapeCell(hotelLabel),
        csvEscapeCell(extrasCount),
        csvEscapeCell(vooLabel),
        csvEscapeCell(totalEur),
        csvEscapeCell(r.pedido_adultos),
        csvEscapeCell(r.pedido_criancas),
        csvEscapeCell(
          Array.isArray(r.pedido_idades_criancas)
            ? r.pedido_idades_criancas.join("|")
            : "",
        ),
        csvEscapeCell(
          r.pedido_animais_estimacao === true
            ? "sim"
            : r.pedido_animais_estimacao === false
              ? "nao"
              : "",
        ),
        csvEscapeCell(r.pedido_quartos),
        csvEscapeCell(r.pedido_rapido === true ? "sim" : "nao"),
        csvEscapeCell(r.auto_followup === true ? "sim" : "nao"),
        csvEscapeCell(r.utm_source),
        csvEscapeCell(r.utm_medium),
        csvEscapeCell(r.utm_campaign),
        csvEscapeCell(r.utm_content),
        csvEscapeCell(r.utm_term),
        csvEscapeCell(r.referrer),
        csvEscapeCell(r.landing_path),
        csvEscapeCell(r.notas_internas),
      ].join(","),
    );
  }

  const stamp = new Date().toISOString().slice(0, 10);
  const filename = `leads-export-${stamp}.csv`;
  const csv = `\uFEFF${lines.join("\r\n")}`;
  return { ok: true, csv, filename };
}
