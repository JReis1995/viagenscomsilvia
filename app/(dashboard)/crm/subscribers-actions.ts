"use server";

import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { z } from "zod";

import { isConsultoraEmailAsync } from "@/lib/auth/consultora";
import {
  normalizeCampaignEmail,
  signCampaignRecipientToken,
} from "@/lib/crm/campaign-link";
import {
  applyPromoCampaignTemplate,
  defaultPromoCampaignBody,
  defaultPromoCampaignSubject,
} from "@/lib/crm/promo-campaign-templates";
import { buildPromoCampaignEmailHtml } from "@/lib/email/promo-campaign-mail";
import {
  resolveCrmEmailReplyTo,
  resolvePromoCampaignResendFrom,
} from "@/lib/email/resend-reply-to";
import { createClient } from "@/lib/supabase/server";
import { tryCreateServiceRoleClient } from "@/lib/supabase/service-role";

async function requireConsultoraDb() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email || !(await isConsultoraEmailAsync(user.email, supabase))) {
    return {
      ok: false as const,
      error: "Sem permissão.",
      user: null,
      db: null,
    };
  }
  const sr = tryCreateServiceRoleClient();
  if (!sr.ok) {
    return {
      ok: false as const,
      error: `Servidor: ${sr.message}`,
      user: null,
      db: null,
    };
  }
  return { ok: true as const, user, db: sr.client };
}

async function assertTargetIsNotConsultora(
  db: SupabaseClient,
  targetEmail: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (await isConsultoraEmailAsync(targetEmail, db)) {
    return {
      ok: false,
      error: "Esta conta pertence a uma consultora — não podes alterá-la ou eliminá-la daqui.",
    };
  }
  return { ok: true };
}

async function deletePublicRowsForSubscriberUser(
  db: SupabaseClient,
  userId: string,
): Promise<string | null> {
  const steps = [
    () => db.from("wishlist_items").delete().eq("user_id", userId),
    () => db.from("promo_alert_prefs").delete().eq("user_id", userId),
    () => db.from("lead_client_updates").delete().eq("user_id", userId),
    () => db.from("lead_client_decisions").delete().eq("user_id", userId),
  ] as const;
  for (const run of steps) {
    const { error } = await run();
    if (error) return error.message;
  }
  return null;
}

const impersonateSchema = z.object({
  targetUserId: z.string().uuid(),
});

export async function generateImpersonateMagicLinkAction(
  raw: unknown,
): Promise<
  { ok: true; url: string } | { ok: false; error: string }
> {
  const parsed = impersonateSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "Dados inválidos." };
  }

  const auth = await requireConsultoraDb();
  if (!auth.ok) {
    return { ok: false, error: auth.error };
  }
  if (!auth.db || !auth.user?.email) {
    return { ok: false, error: "Sessão inválida." };
  }

  const { data: userData, error: guErr } = await auth.db.auth.admin.getUserById(
    parsed.data.targetUserId,
  );
  if (guErr || !userData.user?.email) {
    return { ok: false, error: "Utilizador não encontrado." };
  }

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "").trim() ||
    "http://localhost:3000";

  const nextPath = "/conta";
  const { data: linkData, error: glErr } = await auth.db.auth.admin.generateLink({
    type: "magiclink",
    email: userData.user.email,
    options: {
      redirectTo: `${siteUrl}/auth/callback?next=${encodeURIComponent(nextPath)}`,
    },
  });

  if (glErr || !linkData?.properties?.action_link) {
    return {
      ok: false,
      error: glErr?.message ?? "Não foi possível gerar o link.",
    };
  }

  const { error: insErr } = await auth.db.from("crm_impersonation_audit").insert({
    consultora_user_id: auth.user.id,
    consultora_email: auth.user.email.trim(),
    target_user_id: parsed.data.targetUserId,
  });

  if (insErr) {
    console.error("[crm impersonate audit]", insErr.message);
  }

  return { ok: true, url: linkData.properties.action_link };
}

const updateSubscriberSchema = z.object({
  targetUserId: z.string().uuid(),
  promoOptIn: z.enum(["unset", "true", "false"]),
  displayName: z.string().max(200),
});

export type UpdateCrmSubscriberResult =
  | { ok: true }
  | { ok: false; error: string };

export async function updateCrmSubscriberAction(
  raw: unknown,
): Promise<UpdateCrmSubscriberResult> {
  const parsed = updateSubscriberSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "Dados inválidos." };
  }

  const auth = await requireConsultoraDb();
  if (!auth.ok || !auth.db || !auth.user) {
    return { ok: false, error: auth.ok ? "Sessão inválida." : auth.error };
  }

  const { data: uData, error: guErr } = await auth.db.auth.admin.getUserById(
    parsed.data.targetUserId,
  );
  if (guErr || !uData.user?.email) {
    return { ok: false, error: "Utilizador não encontrado." };
  }

  const targetEmail = uData.user.email.trim();
  const guard = await assertTargetIsNotConsultora(auth.db, targetEmail);
  if (!guard.ok) return guard;

  const { promoOptIn, displayName } = parsed.data;
  const nameTrim = displayName.trim();

  const meta = {
    ...(typeof uData.user.user_metadata === "object" &&
    uData.user.user_metadata !== null
      ? (uData.user.user_metadata as Record<string, unknown>)
      : {}),
  };
  meta.full_name = nameTrim.length > 0 ? nameTrim : "";
  meta.name = nameTrim.length > 0 ? nameTrim : "";

  const { error: updErr } = await auth.db.auth.admin.updateUserById(
    parsed.data.targetUserId,
    { user_metadata: meta },
  );
  if (updErr) {
    return { ok: false, error: updErr.message };
  }

  if (promoOptIn === "unset") {
    const { error: delErr } = await auth.db
      .from("promo_alert_prefs")
      .delete()
      .eq("user_id", parsed.data.targetUserId);
    if (delErr) {
      return { ok: false, error: delErr.message };
    }
  } else {
    const { error: upPref } = await auth.db.from("promo_alert_prefs").upsert(
      {
        user_id: parsed.data.targetUserId,
        email: targetEmail,
        opt_in: promoOptIn === "true",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );
    if (upPref) {
      return { ok: false, error: upPref.message };
    }
  }

  revalidatePath("/crm/inscritos");
  return { ok: true };
}

const deleteSubscriberSchema = z.object({
  targetUserId: z.string().uuid(),
  confirmation: z.string().trim().min(1).max(500),
});

export type DeleteCrmSubscriberResult =
  | { ok: true }
  | { ok: false; error: string };

export async function deleteCrmSubscriberAction(
  raw: unknown,
): Promise<DeleteCrmSubscriberResult> {
  const parsed = deleteSubscriberSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "Dados inválidos." };
  }

  const auth = await requireConsultoraDb();
  if (!auth.ok || !auth.db || !auth.user?.email) {
    return { ok: false, error: auth.ok ? "Sessão inválida." : auth.error };
  }

  const { data: uData, error: guErr } = await auth.db.auth.admin.getUserById(
    parsed.data.targetUserId,
  );
  if (guErr || !uData.user?.email) {
    return { ok: false, error: "Utilizador não encontrado." };
  }

  if (uData.user.id === auth.user.id) {
    return { ok: false, error: "Não podes eliminar a tua própria sessão daqui." };
  }

  const targetEmail = uData.user.email.trim();
  const guard = await assertTargetIsNotConsultora(auth.db, targetEmail);
  if (!guard.ok) return guard;

  const conf = parsed.data.confirmation.trim();
  const confOk =
    conf.toLowerCase() === targetEmail.toLowerCase() || conf === "ELIMINAR";
  if (!confOk) {
    return {
      ok: false,
      error: "Confirmação incorrecta: escreve o email completo da pessoa ou a palavra ELIMINAR.",
    };
  }

  const cleanErr = await deletePublicRowsForSubscriberUser(
    auth.db,
    parsed.data.targetUserId,
  );
  if (cleanErr) {
    return {
      ok: false,
      error: `Não foi possível limpar dados associados: ${cleanErr}`,
    };
  }

  const { error: delAuth } = await auth.db.auth.admin.deleteUser(
    parsed.data.targetUserId,
  );
  if (delAuth) {
    return { ok: false, error: delAuth.message };
  }

  const { error: audErr } = await auth.db
    .from("crm_subscriber_delete_audit")
    .insert({
      consultora_user_id: auth.user.id,
      consultora_email: auth.user.email.trim(),
      target_user_id: parsed.data.targetUserId,
      target_email: targetEmail,
    });

  if (audErr) {
    console.error("[crm subscriber delete audit]", audErr.message);
    if (
      audErr.message.includes("crm_subscriber_delete_audit") ||
      audErr.message.includes("schema cache")
    ) {
      console.error(
        "Executa sql/sprint6_subscriber_delete_audit.sql no Supabase para registar eliminações.",
      );
    }
  }

  revalidatePath("/crm/inscritos");
  return { ok: true };
}

/** Aceita URLs com ou sem protocolo (ex.: instagram.com/... → https://…). */
function campaignHttpUrl(emptyMessage: string) {
  return z
    .string()
    .trim()
    .min(1, emptyMessage)
    .transform((s) => (/^https?:\/\//i.test(s) ? s : `https://${s}`))
    .pipe(
      z
        .string()
        .url("O texto não é uma URL válida.")
        .max(2000, "Link demasiado longo."),
    );
}

const sendCampaignSchema = z.object({
  recipientUserIds: z
    .array(z.string().uuid("ID de inscrito inválido."))
    .min(1, "Selecciona pelo menos um inscrito.")
    .max(400),
  titulo_publicacao: z
    .string()
    .trim()
    .min(2, "Título da publicação: mínimo 2 caracteres.")
    .max(400),
  link_publicacao: campaignHttpUrl(
    "Link da publicação em falta: cola aqui o URL do post (Instagram, site, etc.). Isto não tem a ver com CAMPAIGN_LINK_SECRET.",
  ),
  link_formulario_base: campaignHttpUrl(
    "Base do formulário em falta: indica o URL da página onde está o pedido de orçamento (ex.: https://teusite.com/).",
  ),
  discount_percent: z.coerce.number().int().min(0).max(100),
  expires_at: z.string().min(10, "Data de expiração em falta."),
  post_id: z.union([z.string().uuid(), z.literal("")]).optional(),
  subject: z.string().trim().max(200).optional(),
  body: z.string().trim().max(12000).optional(),
});

export type SendPromoCampaignResult =
  | { ok: true; sent: number; skipped: number; campaignId: string }
  | { ok: false; error: string };

function firstZodCampaignErrorMessage(err: z.ZodError): string {
  const i = err.issues[0];
  if (!i) return "Dados inválidos.";
  const path = i.path.length ? `${i.path.join(".")}: ` : "";
  return `${path}${i.message}`;
}

export async function sendPromoCampaignAction(
  raw: unknown,
): Promise<SendPromoCampaignResult> {
  console.log("[campanha] 1. Entrada — a validar payload", {
    tipo: typeof raw,
    chaves:
      raw && typeof raw === "object"
        ? Object.keys(raw as object).sort()
        : null,
  });

  const parsed = sendCampaignSchema.safeParse(raw);
  if (!parsed.success) {
    console.error(
      "[campanha] 2. Validação Zod falhou — flatten:",
      JSON.stringify(parsed.error.flatten(), null, 2),
    );
    console.error("[campanha] 2b. Issues:", parsed.error.issues);
    return {
      ok: false,
      error: firstZodCampaignErrorMessage(parsed.error),
    };
  }

  console.log("[campanha] 3. Payload válido", {
    destinatarios: parsed.data.recipientUserIds.length,
    tituloLen: parsed.data.titulo_publicacao.length,
    desconto: parsed.data.discount_percent,
    expires_at: parsed.data.expires_at,
  });

  const secret = process.env.CAMPAIGN_LINK_SECRET?.trim();
  if (!secret) {
    console.error("[campanha] CAMPAIGN_LINK_SECRET em falta");
    return {
      ok: false,
      error:
        "CAMPAIGN_LINK_SECRET não está definido no servidor — necessário para links seguros.",
    };
  }

  try {
    console.log("[campanha] 4. Antes de requireConsultoraDb()");
    const auth = await requireConsultoraDb();
    if (!auth.ok) {
      console.error("[campanha] 5. Auth falhou:", auth.error);
      return { ok: false, error: auth.error };
    }
    if (!auth.db || !auth.user?.email) {
      console.error("[campanha] 5b. Sessão sem db ou email");
      return { ok: false, error: "Sessão inválida." };
    }
    console.log("[campanha] 5. Consultora OK", {
      email: auth.user.email.trim(),
    });

    const expDate = new Date(parsed.data.expires_at);
    if (Number.isNaN(expDate.getTime()) || expDate.getTime() < Date.now()) {
      console.error("[campanha] 6. Data expiração inválida", {
        raw: parsed.data.expires_at,
        parsedMs: expDate.getTime(),
      });
      return { ok: false, error: "Data de expiração inválida ou já passou." };
    }
    const expSec = Math.floor(expDate.getTime() / 1000);

    const postId =
      parsed.data.post_id && parsed.data.post_id.length > 0
        ? parsed.data.post_id
        : null;

    console.log("[campanha] 7. Antes de insert promo_campaigns", { postId });
    const { data: campRow, error: campErr } = await auth.db
      .from("promo_campaigns")
      .insert({
        post_id: postId,
        discount_percent: parsed.data.discount_percent,
        titulo_publicacao: parsed.data.titulo_publicacao.trim(),
        link_publicacao: parsed.data.link_publicacao.trim(),
        link_formulario_base: parsed.data.link_formulario_base.trim(),
        expires_at: expDate.toISOString(),
        created_by: auth.user.email.trim(),
      })
      .select("id")
      .single();

    if (campErr || !campRow?.id) {
      console.error("[campanha] 8. Erro ao criar campanha na BD:", campErr);
      if (
        campErr?.message.includes("promo_campaigns") ||
        campErr?.message.includes("schema cache")
      ) {
        return {
          ok: false,
          error: `${campErr.message} Executa sql/sprint4_promo_campaigns.sql no Supabase.`,
        };
      }
      return {
        ok: false,
        error: campErr?.message ?? "Não foi possível criar a campanha.",
      };
    }

    const campaignId = campRow.id as string;
    console.log("[campanha] 8. Campanha criada", { campaignId });

    const apiKey = process.env.RESEND_API_KEY;
    const from = resolvePromoCampaignResendFrom();
    console.log("[campanha] 9. Resend", {
      temApiKey: Boolean(apiKey),
      from,
      usaResendPromoFrom: Boolean(process.env.RESEND_PROMO_FROM?.trim()),
    });
    if (!apiKey || !from) {
      console.error(
        "[campanha] RESEND_API_KEY ou remetente (RESEND_PROMO_FROM / RESEND_FROM) em falta",
      );
      return {
        ok: false,
        error:
          "RESEND_API_KEY ou remetente em falta (define RESEND_PROMO_FROM ou RESEND_FROM no servidor).",
      };
    }

    const subjectTpl =
      parsed.data.subject?.trim() || defaultPromoCampaignSubject;
    const bodyTpl = parsed.data.body?.trim() || defaultPromoCampaignBody;
    const pct = String(parsed.data.discount_percent);
    const resend = new Resend(apiKey);
    const replyTo = resolveCrmEmailReplyTo(undefined);

    let sent = 0;
    let skipped = 0;
    const baseForm = parsed.data.link_formulario_base.trim().replace(/\/$/, "");

    console.log(
      "[campanha] 10. Início loop destinatários",
      parsed.data.recipientUserIds.length,
    );

    for (const uid of parsed.data.recipientUserIds) {
      const { data: uData, error: uErr } =
        await auth.db.auth.admin.getUserById(uid);
      if (uErr || !uData.user?.email) {
        console.log("[campanha] skip — utilizador sem email", { uid, uErr });
        skipped += 1;
        continue;
      }
      const email = uData.user.email.trim();
      const emailNorm = normalizeCampaignEmail(email);

      const { data: pref, error: pErr } = await auth.db
        .from("promo_alert_prefs")
        .select("opt_in")
        .eq("user_id", uid)
        .maybeSingle();

      if (pErr || !pref || pref.opt_in !== true) {
        console.log("[campanha] skip — sem opt-in", {
          uid,
          email,
          pErr,
          opt_in: pref?.opt_in,
        });
        skipped += 1;
        continue;
      }

      console.log("[campanha] 11. A enviar Resend para", email);

      const token = signCampaignRecipientToken(
        { c: campaignId, e: emailNorm, x: expSec },
        secret,
      );
      const linkFormulario = `${baseForm}/?campanha_token=${encodeURIComponent(token)}`;

      const meta = uData.user.user_metadata as
        | Record<string, unknown>
        | undefined;
      const nomeRaw =
        (typeof meta?.full_name === "string" && meta.full_name.trim()) ||
        (typeof meta?.name === "string" && meta.name.trim()) ||
        email.split("@")[0] ||
        "Olá";
      const nome = nomeRaw.split(/\s+/)[0] ?? nomeRaw;

      const vars = {
        nome,
        titulo_publicacao: parsed.data.titulo_publicacao.trim(),
        link_publicacao: parsed.data.link_publicacao.trim(),
        percentagem: pct,
        link_formulario: linkFormulario,
      };

      const subject = applyPromoCampaignTemplate(subjectTpl, vars);
      const textBody = applyPromoCampaignTemplate(bodyTpl, vars);
      const { html, text } = buildPromoCampaignEmailHtml({
        textBody,
        ctaUrl: linkFormulario,
      });

      try {
        const { error: sendErr } = await resend.emails.send({
          from,
          to: email,
          ...(replyTo ? { replyTo } : {}),
          subject,
          html,
          text,
        });
        if (sendErr) {
          console.error("[campanha] Resend API erro:", sendErr.message, {
            to: email,
          });
          skipped += 1;
        } else {
          sent += 1;
          console.log("[campanha] 12. Enviado OK", email);
        }
      } catch (e) {
        console.error("ERRO FATAL NA CAMPANHA (envio individual):", e);
        skipped += 1;
      }
    }

    console.log("[campanha] 13. Fim", { sent, skipped, campaignId });
    return { ok: true, sent, skipped, campaignId };
  } catch (error) {
    console.error("ERRO FATAL NA CAMPANHA:", error);
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Erro inesperado ao processar a campanha.",
    };
  }
}
