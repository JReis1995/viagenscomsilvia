"use server";

import { revalidatePath } from "next/cache";

import { sendLeadDecisionNotifyEmail } from "@/lib/email/client-decision-notify";
import { clientNeedsConsentScreen, CONSENT_POLICY_VERSION } from "@/lib/auth/consent";
import { createClient } from "@/lib/supabase/server";
import { clientNoteSchema } from "@/lib/validations/client-note";
import {
  leadClientDecisionSchema,
  type LeadClientDecisionInput,
} from "@/lib/validations/lead-decision";

export type AddNoteResult = { ok: true } | { ok: false; error: string };

export async function addLeadClientNote(
  _prev: AddNoteResult | null,
  formData: FormData,
): Promise<AddNoteResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Sessão expirada. Entra de novo." };
  }

  if (clientNeedsConsentScreen(user)) {
    return {
      ok: false,
      error: "Completa primeiro o ecrã de consentimentos que aparece ao entrar na Conta.",
    };
  }

  const parsed = clientNoteSchema.safeParse({
    leadId: formData.get("leadId"),
    message: formData.get("message"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.flatten().fieldErrors.message?.[0] ?? "Dados inválidos.",
    };
  }

  const { error } = await supabase.from("lead_client_updates").insert({
    lead_id: parsed.data.leadId,
    user_id: user.id,
    message: parsed.data.message,
  });

  if (error) {
    console.error("[conta] insert lead_client_updates:", error.message);
    return {
      ok: false,
      error:
        "Não foi possível guardar. Confirma que o pedido é teu e que a base de dados já tem a tabela de notas (SQL Sprint 1).",
    };
  }

  revalidatePath("/conta");
  revalidatePath("/crm");
  return { ok: true };
}

export type LeadDecisionResult = { ok: true } | { ok: false; error: string };

export async function submitLeadClientDecision(
  raw: LeadClientDecisionInput | unknown,
): Promise<LeadDecisionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Sessão expirada. Entra de novo." };
  }

  if (clientNeedsConsentScreen(user)) {
    return {
      ok: false,
      error: "Completa primeiro o ecrã de consentimentos que aparece ao entrar na Conta.",
    };
  }

  const parsed = leadClientDecisionSchema.safeParse(raw);
  if (!parsed.success) {
    const msg =
      parsed.error.flatten().fieldErrors.note?.[0] ??
      "Dados inválidos. Verifica o formulário.";
    return { ok: false, error: msg };
  }

  const { error } = await supabase.from("lead_client_decisions").insert({
    lead_id: parsed.data.leadId,
    user_id: user.id,
    decision: parsed.data.decision,
    note: parsed.data.note?.trim() || null,
  });

  if (error) {
    console.error("[conta] lead_client_decisions:", error.message);
    return {
      ok: false,
      error:
        "Não foi possível registar. Confirma que executaste sql/sprint3_plan_features.sql no Supabase.",
    };
  }

  const { data: lead } = await supabase
    .from("leads")
    .select("nome, email")
    .eq("id", parsed.data.leadId)
    .maybeSingle();

  if (lead?.nome && lead.email && user.email) {
    try {
      await sendLeadDecisionNotifyEmail({
        leadNome: lead.nome,
        leadEmail: lead.email,
        decision: parsed.data.decision,
        note: parsed.data.note,
      });
    } catch (e) {
      console.error("[conta] notify consultora:", e);
    }
  }

  revalidatePath("/conta");
  revalidatePath("/crm");
  revalidatePath(`/conta/pedidos/${parsed.data.leadId}`);
  return { ok: true };
}

export type ConsentCompleteResult = { ok: true } | { ok: false; error: string };

/**
 * Primeiro acesso à Conta: grava metadata de consentimento e alinha `promo_alert_prefs`
 * com o opt-in de marketing escolhido (mesma fonte que campanhas em massa).
 */
export async function completeFirstLoginConsent(input: {
  marketingOptIn: boolean;
}): Promise<ConsentCompleteResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return { ok: false, error: "Sessão expirada. Entra de novo." };
  }

  const { error: userError } = await supabase.auth.updateUser({
    data: {
      consent_completed: true,
      consent_policy_version: CONSENT_POLICY_VERSION,
      consent_marketing_opt_in: input.marketingOptIn,
      consent_completed_at: new Date().toISOString(),
    },
  });

  if (userError) {
    console.error("[conta] consent updateUser:", userError.message);
    return {
      ok: false,
      error: "Não foi possível guardar o consentimento. Tenta de novo.",
    };
  }

  const { error: promoError } = await supabase.from("promo_alert_prefs").upsert(
    {
      user_id: user.id,
      email: user.email.trim(),
      opt_in: input.marketingOptIn,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  if (promoError) {
    console.error("[conta] consent promo_alert_prefs:", promoError.message);
    return {
      ok: false,
      error:
        "Consentimento guardado parcialmente. Confirma sql/sprint3_plan_features.sql no Supabase.",
    };
  }

  revalidatePath("/conta", "layout");
  return { ok: true };
}

export type PromoPrefsResult = { ok: true } | { ok: false; error: string };

export async function savePromoAlertPrefs(
  optIn: boolean,
): Promise<PromoPrefsResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return { ok: false, error: "Sessão expirada." };
  }

  if (clientNeedsConsentScreen(user)) {
    return {
      ok: false,
      error: "Usa o ecrã de consentimentos para definir alertas de promoções na primeira visita.",
    };
  }

  const { error } = await supabase.from("promo_alert_prefs").upsert(
    {
      user_id: user.id,
      email: user.email.trim(),
      opt_in: optIn,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  if (error) {
    console.error("[conta] promo_alert_prefs:", error.message);
    return {
      ok: false,
      error:
        "Não foi possível guardar. Executa sql/sprint3_plan_features.sql no Supabase.",
    };
  }

  revalidatePath("/conta");
  return { ok: true };
}

export type WishlistResult = { ok: true } | { ok: false; error: string };

export async function removeWishlistItem(id: string): Promise<WishlistResult> {
  if (
    !id ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      id,
    )
  ) {
    return { ok: false, error: "Item inválido." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sessão expirada." };

  if (clientNeedsConsentScreen(user)) {
    return {
      ok: false,
      error: "Completa primeiro o ecrã de consentimentos na Conta.",
    };
  }

  const { error } = await supabase.from("wishlist_items").delete().eq("id", id);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/conta/wishlist");
  revalidatePath("/");
  return { ok: true };
}

export async function addWishlistDestinoLabel(
  destinoLabel: string,
): Promise<WishlistResult> {
  const label = destinoLabel.trim();
  if (label.length < 2 || label.length > 500) {
    return { ok: false, error: "Indica um destino (2–500 caracteres)." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Inicia sessão para guardar." };

  if (clientNeedsConsentScreen(user)) {
    return {
      ok: false,
      error: "Completa primeiro o ecrã de consentimentos na Conta.",
    };
  }

  const { error } = await supabase.from("wishlist_items").insert({
    user_id: user.id,
    destino_label: label,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/conta/wishlist");
  return { ok: true };
}
