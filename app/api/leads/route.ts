import { NextResponse } from "next/server";
import { Resend } from "resend";

import { resolveCrmEmailReplyTo } from "@/lib/email/resend-reply-to";
import { buildWelcomeQuickLeadEmail } from "@/lib/email/welcome-lead-quick";
import { buildWelcomeLeadEmail } from "@/lib/email/welcome-lead";
import { hasOpenDuplicateLead } from "@/lib/crm/lead-duplicate";
import { resolvePromoCampaignIdForLead } from "@/lib/crm/resolve-promo-campaign-on-lead";
import { computePostTotal } from "@/lib/posts/compute-post-total";
import { createPublicServerClient } from "@/lib/supabase/public-server";
import { tryCreateServiceRoleClient } from "@/lib/supabase/service-role";
import {
  leadQuickSchema,
  leadQuizSchema,
  type LeadMarketingAttribution,
} from "@/lib/validations/lead-quiz";

const DEFAULT_DUPLICATE_MSG =
  "Já tens um pedido em aberto connosco — vamos tratar disso por esse contacto. Se for mesmo um pedido novo ou urgente, envia um email ou mensagem a dizer que é uma segunda intenção.";

type PostChoiceResolved = {
  postId: string | null;
  postChoice:
    | {
        hotel_id?: string;
        extra_ids?: string[];
        flight_option_id?: string;
        notas_voo?: string;
          checkin_date?: string;
          checkout_date?: string;
          rooms?: Array<{ room_option_id: string; qty: number }>;
        rooms_required?: number;
        computed_total_eur: number | null;
        currency: "EUR";
        computed_at: string;
        snapshot: {
          hotel?: {
            id: string;
            label: string;
            preco_delta_eur: number | null;
            preco_label: string | null;
          };
          extras?: Array<{
            id: string;
            label: string;
            preco_delta_eur: number | null;
            preco_label: string | null;
          }>;
          flight?: {
            id: string;
            label: string;
            preco_delta_eur: number | null;
            preco_label: string | null;
          };
        };
      }
    | null;
  error?: string;
};

async function resolvePostChoiceServerSide(
  supabase: ReturnType<typeof createPublicServerClient>,
  input: {
    post_id?: string;
    post_choice?: LeadMarketingAttribution & Record<string, unknown>;
    pedido_animais_estimacao?: boolean;
  },
): Promise<PostChoiceResolved> {
  const needsPetFriendly = input.pedido_animais_estimacao === true;

  const postId = typeof input.post_id === "string" ? input.post_id : null;
  const postChoiceRaw = input.post_choice as Record<string, unknown> | undefined;

  if (!postId) {
    if (postChoiceRaw) {
      return { postId: null, postChoice: null, error: "post_choice exige post_id." };
    }
    return { postId: null, postChoice: null };
  }

  const { data: post, error: postErr } = await supabase
    .from("posts")
    .select("id, preco_base_eur")
    .eq("id", postId)
    .eq("status", true)
    .lte("data_publicacao", new Date().toISOString())
    .or(`data_fim_publicacao.is.null,data_fim_publicacao.gt.${new Date().toISOString()}`)
    .maybeSingle();
  if (postErr || !post) {
    return { postId: null, postChoice: null, error: "Publicação inválida ou indisponível." };
  }

  const hotelId = typeof postChoiceRaw?.hotel_id === "string" ? postChoiceRaw.hotel_id : null;
  const extraIdsRaw = Array.isArray(postChoiceRaw?.extra_ids)
    ? (postChoiceRaw?.extra_ids as unknown[]).filter((x): x is string => typeof x === "string")
    : [];
  const extraIds = [...new Set(extraIdsRaw)];
  const flightOptionId =
    typeof postChoiceRaw?.flight_option_id === "string"
      ? postChoiceRaw.flight_option_id
      : null;
  const notasVoo =
    typeof postChoiceRaw?.notas_voo === "string" && postChoiceRaw.notas_voo.trim()
      ? postChoiceRaw.notas_voo.trim().slice(0, 1000)
      : undefined;
  const checkinDate =
    typeof postChoiceRaw?.checkin_date === "string" && postChoiceRaw.checkin_date
      ? postChoiceRaw.checkin_date
      : undefined;
  const checkoutDate =
    typeof postChoiceRaw?.checkout_date === "string" && postChoiceRaw.checkout_date
      ? postChoiceRaw.checkout_date
      : undefined;
  const roomsRaw = Array.isArray(postChoiceRaw?.rooms) ? postChoiceRaw.rooms : [];
  const rooms = roomsRaw
    .map((item) =>
      item && typeof item === "object"
        ? {
            room_option_id:
              typeof (item as { room_option_id?: unknown }).room_option_id === "string"
                ? (item as { room_option_id: string }).room_option_id
                : "",
            qty:
              typeof (item as { qty?: unknown }).qty === "number" &&
              Number.isInteger((item as { qty: number }).qty)
                ? (item as { qty: number }).qty
                : 0,
          }
        : null,
    )
    .filter((item): item is { room_option_id: string; qty: number } => !!item)
    .filter((item) => item.room_option_id && item.qty > 0)
    .slice(0, 10);
  const roomsRequiredRaw =
    typeof postChoiceRaw?.rooms_required === "number" &&
    Number.isInteger(postChoiceRaw.rooms_required)
      ? postChoiceRaw.rooms_required
      : null;
  const roomsRequired =
    roomsRequiredRaw != null && roomsRequiredRaw >= 1 && roomsRequiredRaw <= 20
      ? roomsRequiredRaw
      : null;

  const hotelRow = hotelId
    ? await supabase
        .from("post_hotels")
        .select("id, nome, preco_delta_eur, preco_label, pets_allowed, status")
        .eq("id", hotelId)
        .eq("post_id", postId)
        .eq("status", true)
        .maybeSingle()
    : null;
  if (hotelId && (!hotelRow || hotelRow.error || !hotelRow.data)) {
    return { postId: null, postChoice: null, error: "Hotel selecionado inválido para esta publicação." };
  }
  if (needsPetFriendly && hotelRow?.data?.pets_allowed === false) {
    return {
      postId: null,
      postChoice: null,
      error: "O hotel selecionado não permite animais de estimação.",
    };
  }

  const extrasRows =
    extraIds.length > 0
      ? await supabase
          .from("post_extras")
          .select("id, nome, preco_delta_eur, preco_label, pets_allowed, status")
          .eq("post_id", postId)
          .eq("status", true)
          .in("id", extraIds)
      : null;
  if (extrasRows?.error) {
    return { postId: null, postChoice: null, error: "Não foi possível validar extras." };
  }
  const extrasData = extrasRows?.data ?? [];
  if (extraIds.length > 0 && extrasData.length !== extraIds.length) {
    return { postId: null, postChoice: null, error: "Existe pelo menos um extra inválido." };
  }
  if (needsPetFriendly && extrasData.some((extra) => extra.pets_allowed === false)) {
    return {
      postId: null,
      postChoice: null,
      error: "Existe pelo menos um extra selecionado que não permite animais.",
    };
  }

  const flightRow = flightOptionId
    ? await supabase
        .from("post_flight_options")
        .select("id, label, preco_delta_eur, preco_label, pets_allowed, status")
        .eq("id", flightOptionId)
        .eq("post_id", postId)
        .eq("status", true)
        .maybeSingle()
    : null;
  if (flightOptionId && (!flightRow || flightRow.error || !flightRow.data)) {
    return { postId: null, postChoice: null, error: "Opção de voo inválida para esta publicação." };
  }
  if (needsPetFriendly && flightRow?.data?.pets_allowed === false) {
    return {
      postId: null,
      postChoice: null,
      error: "A opção de voo selecionada não permite animais de estimação.",
    };
  }

  const total = computePostTotal({
    preco_base_eur:
      typeof post.preco_base_eur === "number" && Number.isFinite(post.preco_base_eur)
        ? post.preco_base_eur
        : null,
    hotels: hotelRow?.data
      ? [
          {
            id: hotelRow.data.id,
            ordem: 0,
            nome: hotelRow.data.nome,
            descricao: null,
            regime: null,
            condicoes: null,
            preco_delta_eur:
              typeof hotelRow.data.preco_delta_eur === "number"
                ? hotelRow.data.preco_delta_eur
                : null,
            preco_label: hotelRow.data.preco_label ?? null,
            capacidade_min: null,
            capacidade_max: null,
            pets_allowed: null,
            status: true,
            media: [],
            seasons: [],
            availability: [],
            room_options: [],
          },
        ]
      : [],
    extras: extrasData.map((e) => ({
      id: e.id,
      ordem: 0,
      tipo: "custom" as const,
      nome: e.nome,
      descricao: null,
      preco_delta_eur:
        typeof e.preco_delta_eur === "number" ? e.preco_delta_eur : null,
      preco_label: e.preco_label ?? null,
      pets_allowed: null,
      default_selected: false,
      status: true,
    })),
    flight_options: flightRow?.data
      ? [
          {
            id: flightRow.data.id,
            ordem: 0,
            label: flightRow.data.label,
            origem_iata: null,
            destino_iata: null,
            data_partida: null,
            data_regresso: null,
            cia: null,
            classe: null,
            bagagem_text: null,
            descricao: null,
            preco_delta_eur:
              typeof flightRow.data.preco_delta_eur === "number"
                ? flightRow.data.preco_delta_eur
                : null,
            preco_label: flightRow.data.preco_label ?? null,
            pets_allowed: null,
            status: true,
          },
        ]
      : [],
    hotel_id: hotelId,
    extra_ids: extraIds,
    flight_option_id: flightOptionId,
  });

  const computedAt = new Date().toISOString();
  return {
    postId: postId,
    postChoice: {
      ...(hotelId ? { hotel_id: hotelId } : {}),
      ...(extraIds.length > 0 ? { extra_ids: extraIds } : {}),
      ...(flightOptionId ? { flight_option_id: flightOptionId } : {}),
      ...(notasVoo ? { notas_voo: notasVoo } : {}),
      ...(checkinDate ? { checkin_date: checkinDate } : {}),
      ...(checkoutDate ? { checkout_date: checkoutDate } : {}),
      ...(rooms.length ? { rooms } : {}),
      ...(roomsRequired ? { rooms_required: roomsRequired } : {}),
      computed_total_eur: total.total_eur ?? null,
      currency: "EUR",
      computed_at: computedAt,
      snapshot: {
        ...(hotelRow?.data
          ? {
              hotel: {
                id: hotelRow.data.id,
                label: hotelRow.data.nome,
                preco_delta_eur:
                  typeof hotelRow.data.preco_delta_eur === "number"
                    ? hotelRow.data.preco_delta_eur
                    : null,
                preco_label: hotelRow.data.preco_label ?? null,
              },
            }
          : {}),
        ...(extrasData.length > 0
          ? {
              extras: extrasData.map((e) => ({
                id: e.id,
                label: e.nome,
                preco_delta_eur:
                  typeof e.preco_delta_eur === "number" ? e.preco_delta_eur : null,
                preco_label: e.preco_label ?? null,
              })),
            }
          : {}),
        ...(flightRow?.data
          ? {
              flight: {
                id: flightRow.data.id,
                label: flightRow.data.label,
                preco_delta_eur:
                  typeof flightRow.data.preco_delta_eur === "number"
                    ? flightRow.data.preco_delta_eur
                    : null,
                preco_label: flightRow.data.preco_label ?? null,
              },
            }
          : {}),
      },
    },
  };
}

function attrColumns(m: LeadMarketingAttribution) {
  return {
    utm_source: m.utm_source?.trim() || null,
    utm_medium: m.utm_medium?.trim() || null,
    utm_campaign: m.utm_campaign?.trim() || null,
    utm_content: m.utm_content?.trim() || null,
    utm_term: m.utm_term?.trim() || null,
    referrer: m.referrer?.trim() || null,
    landing_path: m.landing_path?.trim() || null,
  };
}

function validationError(parsed: {
  success: false;
  error: { flatten: () => { fieldErrors: Record<string, string[] | undefined> } };
}): NextResponse {
  const msg = parsed.error.flatten().fieldErrors;
  const first =
    Object.values(msg).flat()[0] ?? "Dados inválidos. Verifica o formulário.";
  return NextResponse.json({ error: first }, { status: 400 });
}

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
  }

  if (
    typeof json === "object" &&
    json !== null &&
    "website_url" in json &&
    typeof (json as { website_url?: unknown }).website_url === "string" &&
    (json as { website_url: string }).website_url.trim().length > 0
  ) {
    return NextResponse.json({ ok: true });
  }

  const isQuick =
    typeof json === "object" &&
    json !== null &&
    (json as { pedido_rapido?: unknown }).pedido_rapido === true;

  const supabase = createPublicServerClient();
  const srDup = tryCreateServiceRoleClient();

  if (isQuick) {
    const parsed = leadQuickSchema.safeParse(json);
    if (!parsed.success) {
      return validationError(parsed);
    }
    const row = parsed.data;
    const attr = attrColumns(row);
    const tel = row.telemovel.trim();
    const resolvedChoice = await resolvePostChoiceServerSide(supabase, {
      post_id: row.post_id,
      post_choice: row.post_choice as Record<string, unknown> | undefined,
      pedido_animais_estimacao: row.pedido_animais_estimacao,
    });
    if (resolvedChoice.error) {
      return NextResponse.json({ error: resolvedChoice.error }, { status: 400 });
    }

    if (srDup.ok) {
      const dup = await hasOpenDuplicateLead(
        srDup.client,
        row.email,
        tel.length > 0 ? tel : null,
      );
      if (dup) {
        return NextResponse.json(
          { error: DEFAULT_DUPLICATE_MSG, code: "duplicate_open_lead" },
          { status: 409 },
        );
      }
    }

    let promoCampaignId: string | null = null;
    if (srDup.ok) {
      promoCampaignId = await resolvePromoCampaignIdForLead({
        db: srDup.client,
        campanhaToken: row.campanha_token,
        submitEmail: row.email,
      });
    }

    const { data: insertedLead, error: dbError } = await supabase.from("leads").insert({
      nome: row.nome,
      email: row.email,
      telemovel: tel.length > 0 ? tel : null,
      clima_preferido: null,
      vibe: null,
      companhia: null,
      destino_sonho: row.destino_sonho,
      janela_datas: row.janela_datas?.trim() || null,
      pedido_adultos: row.pedido_adultos ?? null,
      pedido_criancas: row.pedido_criancas ?? null,
      pedido_idades_criancas:
        row.pedido_idades_criancas && row.pedido_idades_criancas.length > 0
          ? row.pedido_idades_criancas
          : null,
      pedido_quartos: row.pedido_quartos ?? null,
      pedido_animais_estimacao:
        typeof row.pedido_animais_estimacao === "boolean"
          ? row.pedido_animais_estimacao
          : null,
      post_id: resolvedChoice.postId,
      post_choice: resolvedChoice.postChoice,
      orcamento_estimado: null,
      pedido_rapido: true,
      ...attr,
      ...(promoCampaignId ? { promo_campaign_id: promoCampaignId } : {}),
    }).select("id").single();

    if (dbError) {
      console.error("[leads] Supabase insert (quick):", dbError.message);
      return NextResponse.json(
        { error: "Não foi possível guardar o pedido. Tenta mais tarde." },
        { status: 500 },
      );
    }

    if (insertedLead?.id && resolvedChoice.postId && resolvedChoice.postChoice) {
      void supabase.from("lead_post_choice_events").insert({
        lead_id: insertedLead.id,
        post_id: resolvedChoice.postId,
        event_name: "lead_submitted",
        hotel_id: resolvedChoice.postChoice.hotel_id ?? null,
        flight_option_id: resolvedChoice.postChoice.flight_option_id ?? null,
        session_key: null,
        event_payload: {
          extra_ids: resolvedChoice.postChoice.extra_ids ?? [],
          computed_total_eur: resolvedChoice.postChoice.computed_total_eur ?? null,
        },
      });
    }

    let emailSent = false;
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.RESEND_FROM;
    if (apiKey && from) {
      try {
        const resend = new Resend(apiKey);
        const { subject, html, text } = buildWelcomeQuickLeadEmail(row);
        const replyTo = resolveCrmEmailReplyTo(undefined);
        const { error: sendError } = await resend.emails.send({
          from,
          to: row.email,
          ...(replyTo ? { replyTo } : {}),
          subject,
          html,
          text,
        });
        if (sendError) {
          console.error("[leads] Resend (quick):", sendError.message);
        } else {
          emailSent = true;
        }
      } catch (e) {
        console.error("[leads] Resend exception (quick):", e);
      }
    } else {
      console.warn(
        "[leads] RESEND_API_KEY ou RESEND_FROM em falta — email não enviado.",
      );
    }

    return NextResponse.json({ ok: true, emailSent });
  }

  const parsed = leadQuizSchema.safeParse(json);
  if (!parsed.success) {
    return validationError(parsed);
  }

  const row = parsed.data;
  const attr = attrColumns(row);
  const resolvedChoice = await resolvePostChoiceServerSide(supabase, {
    post_id: row.post_id,
    post_choice: row.post_choice as Record<string, unknown> | undefined,
    pedido_animais_estimacao: row.pedido_animais_estimacao,
  });
  if (resolvedChoice.error) {
    return NextResponse.json({ error: resolvedChoice.error }, { status: 400 });
  }

  if (srDup.ok) {
    const dup = await hasOpenDuplicateLead(
      srDup.client,
      row.email,
      row.telemovel,
    );
    if (dup) {
      return NextResponse.json(
        { error: DEFAULT_DUPLICATE_MSG, code: "duplicate_open_lead" },
        { status: 409 },
      );
    }
  }

  let promoCampaignIdFull: string | null = null;
  if (srDup.ok) {
    promoCampaignIdFull = await resolvePromoCampaignIdForLead({
      db: srDup.client,
      campanhaToken: row.campanha_token,
      submitEmail: row.email,
    });
  }

  const { data: insertedLeadFull, error: dbError } = await supabase.from("leads").insert({
    nome: row.nome,
    email: row.email,
    telemovel: row.telemovel.trim(),
    clima_preferido: row.clima_preferido,
    vibe: row.vibe,
    companhia: row.companhia,
    destino_sonho: row.destino_sonho,
    orcamento_estimado: row.orcamento_estimado,
    janela_datas: row.janela_datas,
    flexibilidade_datas: row.flexibilidade_datas,
    ja_tem_voos_hotel: row.ja_tem_voos_hotel,
    pedido_adultos: row.pedido_adultos ?? null,
    pedido_criancas: row.pedido_criancas ?? null,
    pedido_idades_criancas:
      row.pedido_idades_criancas && row.pedido_idades_criancas.length > 0
        ? row.pedido_idades_criancas
        : null,
    pedido_quartos: row.pedido_quartos ?? null,
    pedido_animais_estimacao:
      typeof row.pedido_animais_estimacao === "boolean"
        ? row.pedido_animais_estimacao
        : null,
    post_id: resolvedChoice.postId,
    post_choice: resolvedChoice.postChoice,
    pedido_rapido: false,
    ...attr,
    ...(promoCampaignIdFull ? { promo_campaign_id: promoCampaignIdFull } : {}),
  }).select("id").single();

  if (dbError) {
    console.error("[leads] Supabase insert:", dbError.message);
    return NextResponse.json(
      { error: "Não foi possível guardar o pedido. Tenta mais tarde." },
      { status: 500 },
    );
  }

  if (insertedLeadFull?.id && resolvedChoice.postId && resolvedChoice.postChoice) {
    void supabase.from("lead_post_choice_events").insert({
      lead_id: insertedLeadFull.id,
      post_id: resolvedChoice.postId,
      event_name: "lead_submitted",
      hotel_id: resolvedChoice.postChoice.hotel_id ?? null,
      flight_option_id: resolvedChoice.postChoice.flight_option_id ?? null,
      session_key: null,
      event_payload: {
        extra_ids: resolvedChoice.postChoice.extra_ids ?? [],
        computed_total_eur: resolvedChoice.postChoice.computed_total_eur ?? null,
      },
    });
  }

  let emailSent = false;
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM;

  if (apiKey && from) {
    try {
      const resend = new Resend(apiKey);
      const { subject, html, text } = buildWelcomeLeadEmail(row);
      const replyTo = resolveCrmEmailReplyTo(undefined);
      const { error: sendError } = await resend.emails.send({
        from,
        to: row.email,
        ...(replyTo ? { replyTo } : {}),
        subject,
        html,
        text,
      });
      if (sendError) {
        console.error("[leads] Resend:", sendError.message);
      } else {
        emailSent = true;
      }
    } catch (e) {
      console.error("[leads] Resend exception:", e);
    }
  } else {
    console.warn(
      "[leads] RESEND_API_KEY ou RESEND_FROM em falta — email não enviado.",
    );
  }

  return NextResponse.json({ ok: true, emailSent });
}
