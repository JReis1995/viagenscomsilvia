"use server";

import { revalidatePath } from "next/cache";

import { isConsultoraEmail } from "@/lib/auth/consultora";
import { notifyPromoSubscribers } from "@/lib/crm/notify-promo-subscribers";
import { revalidatePublicHome } from "@/lib/next/revalidate-public-home";
import { isCanonicalLeadStatus } from "@/lib/crm/lead-board";
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
  if (!user?.email || !isConsultoraEmail(user.email)) {
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
