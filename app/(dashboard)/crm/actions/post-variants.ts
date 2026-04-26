"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { isConsultoraEmailAsync } from "@/lib/auth/consultora";
import { revalidatePublicHome } from "@/lib/next/revalidate-public-home";
import { createClient } from "@/lib/supabase/server";
import { tryCreateServiceRoleClient } from "@/lib/supabase/service-role";
import {
  postExtraSchema,
  postFlightOptionSchema,
  postHotelMediaSchema,
  postHotelRoomOptionSchema,
  postHotelSchema,
} from "@/lib/validations/post-variants";

async function requireConsultora() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email || !(await isConsultoraEmailAsync(user.email, supabase))) {
    return { ok: false as const, error: "Sem permissão.", db: null };
  }
  const sr = tryCreateServiceRoleClient();
  if (!sr.ok) {
    return { ok: false as const, error: sr.message, db: null };
  }
  return { ok: true as const, db: sr.client };
}

async function revalidatePostTargets(db: Awaited<ReturnType<typeof requireConsultora>>["db"], postId: string) {
  if (!db) return;
  const { data: post } = await db.from("posts").select("slug").eq("id", postId).maybeSingle();
  revalidatePublicHome();
  revalidatePath("/crm/publicacoes");
  if (post?.slug) revalidatePath(`/publicacoes/${post.slug}`);
}

const uuidSchema = z.string().uuid();
const reorderSchema = z.object({
  postId: z.string().uuid(),
  ids: z.array(z.string().uuid()).max(200),
});

export async function listPostVariantsAction(postId: string) {
  const parsed = uuidSchema.safeParse(postId);
  if (!parsed.success) return { ok: false as const, error: "Post inválido." };
  const auth = await requireConsultora();
  if (!auth.ok || !auth.db) return { ok: false as const, error: auth.error };

  const [hotelsRes, extrasRes, flightsRes] = await Promise.all([
    auth.db
      .from("post_hotels")
      .select("id, post_id, ordem, nome, descricao, regime, condicoes, site_url, preco_delta_eur, preco_label, capacidade_min, capacidade_max, pets_allowed, status")
      .eq("post_id", postId)
      .order("ordem", { ascending: true }),
    auth.db
      .from("post_extras")
      .select("id, post_id, ordem, tipo, nome, descricao, preco_delta_eur, preco_label, pets_allowed, default_selected, status")
      .eq("post_id", postId)
      .order("ordem", { ascending: true }),
    auth.db
      .from("post_flight_options")
      .select("id, post_id, ordem, label, origem_iata, destino_iata, data_partida, data_regresso, cia, classe, bagagem_text, descricao, preco_delta_eur, preco_label, pets_allowed, status")
      .eq("post_id", postId)
      .order("ordem", { ascending: true }),
  ]);

  if (hotelsRes.error || extrasRes.error || flightsRes.error) {
    return {
      ok: false as const,
      error: hotelsRes.error?.message ?? extrasRes.error?.message ?? flightsRes.error?.message ?? "Erro ao carregar variantes.",
    };
  }

  const hotelIds = (hotelsRes.data ?? []).map((h) => h.id);
  let mediaRows: Awaited<typeof auth.db.from> extends never ? never : Array<Record<string, unknown>> = [];
  let roomRows: Awaited<typeof auth.db.from> extends never ? never : Array<Record<string, unknown>> = [];
  if (hotelIds.length > 0) {
    const [mediaRes, roomRes] = await Promise.all([
      auth.db
        .from("post_hotel_media")
        .select("id, hotel_id, ordem, kind, url, alt")
        .in("hotel_id", hotelIds)
        .order("ordem", { ascending: true }),
      auth.db
        .from("post_hotel_room_options")
        .select("id, hotel_id, ordem, nome, capacidade_adultos, capacidade_criancas, preco_delta_eur, preco_label, status")
        .in("hotel_id", hotelIds)
        .order("ordem", { ascending: true }),
    ]);
    if (mediaRes.error) return { ok: false as const, error: mediaRes.error.message };
    if (roomRes.error) return { ok: false as const, error: roomRes.error.message };
    mediaRows = mediaRes.data ?? [];
    roomRows = roomRes.data ?? [];
  }

  const mediaByHotel = new Map<string, Array<Record<string, unknown>>>();
  const roomsByHotel = new Map<string, Array<Record<string, unknown>>>();
  for (const row of mediaRows) {
    const hid = String(row.hotel_id);
    const arr = mediaByHotel.get(hid) ?? [];
    arr.push(row);
    mediaByHotel.set(hid, arr);
  }
  for (const row of roomRows) {
    const hid = String(row.hotel_id);
    const arr = roomsByHotel.get(hid) ?? [];
    arr.push(row);
    roomsByHotel.set(hid, arr);
  }

  return {
    ok: true as const,
    data: {
      hotels: (hotelsRes.data ?? []).map((h) => ({
        ...h,
        media: mediaByHotel.get(h.id) ?? [],
        room_options: roomsByHotel.get(h.id) ?? [],
      })),
      extras: extrasRes.data ?? [],
      flights: flightsRes.data ?? [],
    },
  };
}

export async function createPostHotelAction(postId: string, input: unknown) {
  const postParsed = uuidSchema.safeParse(postId);
  const parsed = postHotelSchema.safeParse(input);
  if (!postParsed.success || !parsed.success) return { ok: false as const, error: "Dados inválidos." };
  const auth = await requireConsultora();
  if (!auth.ok || !auth.db) return { ok: false as const, error: auth.error };
  const {
    id: _ignoreId,
    post_id: _ignorePostId,
    media: _ignoreMedia,
    ...hotelData
  } = parsed.data;
  const { error } = await auth.db.from("post_hotels").insert({ ...hotelData, post_id: postId });
  if (error) return { ok: false as const, error: error.message };
  await revalidatePostTargets(auth.db, postId);
  return { ok: true as const };
}

export async function updatePostHotelAction(id: string, input: unknown) {
  const idParsed = uuidSchema.safeParse(id);
  const parsed = postHotelSchema.safeParse(input);
  if (!idParsed.success || !parsed.success) return { ok: false as const, error: "Dados inválidos." };
  const auth = await requireConsultora();
  if (!auth.ok || !auth.db) return { ok: false as const, error: auth.error };

  const {
    id: _ignoreId,
    post_id: _ignorePostId,
    media: _ignoreMedia,
    ...hotelData
  } = parsed.data;
  const { data: existing } = await auth.db.from("post_hotels").select("post_id").eq("id", id).maybeSingle();
  const { error } = await auth.db.from("post_hotels").update(hotelData).eq("id", id);
  if (error) return { ok: false as const, error: error.message };
  if (existing?.post_id) await revalidatePostTargets(auth.db, existing.post_id);
  return { ok: true as const };
}

export async function deletePostHotelAction(id: string) {
  const idParsed = uuidSchema.safeParse(id);
  if (!idParsed.success) return { ok: false as const, error: "ID inválido." };
  const auth = await requireConsultora();
  if (!auth.ok || !auth.db) return { ok: false as const, error: auth.error };
  const { data: existing } = await auth.db.from("post_hotels").select("post_id").eq("id", id).maybeSingle();
  const { error } = await auth.db.from("post_hotels").delete().eq("id", id);
  if (error) return { ok: false as const, error: error.message };
  if (existing?.post_id) await revalidatePostTargets(auth.db, existing.post_id);
  return { ok: true as const };
}

export async function reorderPostHotelsAction(postId: string, ids: string[]) {
  const parsed = reorderSchema.safeParse({ postId, ids });
  if (!parsed.success) return { ok: false as const, error: "Dados inválidos." };
  const auth = await requireConsultora();
  if (!auth.ok || !auth.db) return { ok: false as const, error: auth.error };
  for (let i = 0; i < parsed.data.ids.length; i += 1) {
    const id = parsed.data.ids[i];
    await auth.db.from("post_hotels").update({ ordem: i }).eq("id", id).eq("post_id", postId);
  }
  await revalidatePostTargets(auth.db, postId);
  return { ok: true as const };
}

export async function createPostHotelMediaAction(hotelId: string, input: unknown) {
  const hotelParsed = uuidSchema.safeParse(hotelId);
  const parsed = postHotelMediaSchema.omit({ id: true }).safeParse(input);
  if (!hotelParsed.success || !parsed.success) return { ok: false as const, error: "Dados inválidos." };
  const auth = await requireConsultora();
  if (!auth.ok || !auth.db) return { ok: false as const, error: auth.error };
  const { data: hotel } = await auth.db.from("post_hotels").select("post_id").eq("id", hotelId).maybeSingle();
  const { error } = await auth.db.from("post_hotel_media").insert({ ...parsed.data, hotel_id: hotelId });
  if (error) return { ok: false as const, error: error.message };
  if (hotel?.post_id) await revalidatePostTargets(auth.db, hotel.post_id);
  return { ok: true as const };
}

export async function deletePostHotelMediaAction(id: string) {
  const parsed = uuidSchema.safeParse(id);
  if (!parsed.success) return { ok: false as const, error: "ID inválido." };
  const auth = await requireConsultora();
  if (!auth.ok || !auth.db) return { ok: false as const, error: auth.error };
  const { data: media } = await auth.db.from("post_hotel_media").select("hotel_id").eq("id", id).maybeSingle();
  let postId: string | null = null;
  if (media?.hotel_id) {
    const { data: hotel } = await auth.db.from("post_hotels").select("post_id").eq("id", media.hotel_id).maybeSingle();
    postId = hotel?.post_id ?? null;
  }
  const { error } = await auth.db.from("post_hotel_media").delete().eq("id", id);
  if (error) return { ok: false as const, error: error.message };
  if (postId) await revalidatePostTargets(auth.db, postId);
  return { ok: true as const };
}

export async function createPostHotelRoomOptionAction(hotelId: string, input: unknown) {
  const hotelParsed = uuidSchema.safeParse(hotelId);
  const parsed = postHotelRoomOptionSchema.omit({ id: true, hotel_id: true }).safeParse(input);
  if (!hotelParsed.success || !parsed.success) return { ok: false as const, error: "Dados inválidos." };
  const auth = await requireConsultora();
  if (!auth.ok || !auth.db) return { ok: false as const, error: auth.error };
  const { data: hotel } = await auth.db.from("post_hotels").select("post_id").eq("id", hotelId).maybeSingle();
  const { error } = await auth.db.from("post_hotel_room_options").insert({ ...parsed.data, hotel_id: hotelId });
  if (error) return { ok: false as const, error: error.message };
  if (hotel?.post_id) await revalidatePostTargets(auth.db, hotel.post_id);
  return { ok: true as const };
}

export async function updatePostHotelRoomOptionAction(id: string, input: unknown) {
  const idParsed = uuidSchema.safeParse(id);
  const parsed = postHotelRoomOptionSchema.omit({ id: true, hotel_id: true }).safeParse(input);
  if (!idParsed.success || !parsed.success) return { ok: false as const, error: "Dados inválidos." };
  const auth = await requireConsultora();
  if (!auth.ok || !auth.db) return { ok: false as const, error: auth.error };
  const { data: room } = await auth.db.from("post_hotel_room_options").select("hotel_id").eq("id", id).maybeSingle();
  const { error } = await auth.db.from("post_hotel_room_options").update(parsed.data).eq("id", id);
  if (error) return { ok: false as const, error: error.message };
  if (room?.hotel_id) {
    const { data: hotel } = await auth.db.from("post_hotels").select("post_id").eq("id", room.hotel_id).maybeSingle();
    if (hotel?.post_id) await revalidatePostTargets(auth.db, hotel.post_id);
  }
  return { ok: true as const };
}

export async function deletePostHotelRoomOptionAction(id: string) {
  const parsed = uuidSchema.safeParse(id);
  if (!parsed.success) return { ok: false as const, error: "ID inválido." };
  const auth = await requireConsultora();
  if (!auth.ok || !auth.db) return { ok: false as const, error: auth.error };
  const { data: room } = await auth.db.from("post_hotel_room_options").select("hotel_id").eq("id", id).maybeSingle();
  const { error } = await auth.db.from("post_hotel_room_options").delete().eq("id", id);
  if (error) return { ok: false as const, error: error.message };
  if (room?.hotel_id) {
    const { data: hotel } = await auth.db.from("post_hotels").select("post_id").eq("id", room.hotel_id).maybeSingle();
    if (hotel?.post_id) await revalidatePostTargets(auth.db, hotel.post_id);
  }
  return { ok: true as const };
}

export async function createPostExtraAction(postId: string, input: unknown) {
  const postParsed = uuidSchema.safeParse(postId);
  const parsed = postExtraSchema.omit({ id: true, post_id: true }).safeParse(input);
  if (!postParsed.success || !parsed.success) return { ok: false as const, error: "Dados inválidos." };
  const auth = await requireConsultora();
  if (!auth.ok || !auth.db) return { ok: false as const, error: auth.error };
  const { error } = await auth.db.from("post_extras").insert({ ...parsed.data, post_id: postId });
  if (error) return { ok: false as const, error: error.message };
  await revalidatePostTargets(auth.db, postId);
  return { ok: true as const };
}

export async function updatePostExtraAction(id: string, input: unknown) {
  const idParsed = uuidSchema.safeParse(id);
  const parsed = postExtraSchema.omit({ id: true, post_id: true }).safeParse(input);
  if (!idParsed.success || !parsed.success) return { ok: false as const, error: "Dados inválidos." };
  const auth = await requireConsultora();
  if (!auth.ok || !auth.db) return { ok: false as const, error: auth.error };
  const { data: existing } = await auth.db.from("post_extras").select("post_id").eq("id", id).maybeSingle();
  const { error } = await auth.db.from("post_extras").update(parsed.data).eq("id", id);
  if (error) return { ok: false as const, error: error.message };
  if (existing?.post_id) await revalidatePostTargets(auth.db, existing.post_id);
  return { ok: true as const };
}

export async function deletePostExtraAction(id: string) {
  const parsed = uuidSchema.safeParse(id);
  if (!parsed.success) return { ok: false as const, error: "ID inválido." };
  const auth = await requireConsultora();
  if (!auth.ok || !auth.db) return { ok: false as const, error: auth.error };
  const { data: existing } = await auth.db.from("post_extras").select("post_id").eq("id", id).maybeSingle();
  const { error } = await auth.db.from("post_extras").delete().eq("id", id);
  if (error) return { ok: false as const, error: error.message };
  if (existing?.post_id) await revalidatePostTargets(auth.db, existing.post_id);
  return { ok: true as const };
}

export async function reorderPostExtrasAction(postId: string, ids: string[]) {
  const parsed = reorderSchema.safeParse({ postId, ids });
  if (!parsed.success) return { ok: false as const, error: "Dados inválidos." };
  const auth = await requireConsultora();
  if (!auth.ok || !auth.db) return { ok: false as const, error: auth.error };
  for (let i = 0; i < parsed.data.ids.length; i += 1) {
    const id = parsed.data.ids[i];
    await auth.db.from("post_extras").update({ ordem: i }).eq("id", id).eq("post_id", postId);
  }
  await revalidatePostTargets(auth.db, postId);
  return { ok: true as const };
}

export async function createPostFlightOptionAction(postId: string, input: unknown) {
  const postParsed = uuidSchema.safeParse(postId);
  const parsed = postFlightOptionSchema.omit({ id: true, post_id: true }).safeParse(input);
  if (!postParsed.success || !parsed.success) return { ok: false as const, error: "Dados inválidos." };
  const auth = await requireConsultora();
  if (!auth.ok || !auth.db) return { ok: false as const, error: auth.error };
  const { error } = await auth.db.from("post_flight_options").insert({ ...parsed.data, post_id: postId });
  if (error) return { ok: false as const, error: error.message };
  await revalidatePostTargets(auth.db, postId);
  return { ok: true as const };
}

export async function updatePostFlightOptionAction(id: string, input: unknown) {
  const idParsed = uuidSchema.safeParse(id);
  const parsed = postFlightOptionSchema.omit({ id: true, post_id: true }).safeParse(input);
  if (!idParsed.success || !parsed.success) return { ok: false as const, error: "Dados inválidos." };
  const auth = await requireConsultora();
  if (!auth.ok || !auth.db) return { ok: false as const, error: auth.error };
  const { data: existing } = await auth.db.from("post_flight_options").select("post_id").eq("id", id).maybeSingle();
  const { error } = await auth.db.from("post_flight_options").update(parsed.data).eq("id", id);
  if (error) return { ok: false as const, error: error.message };
  if (existing?.post_id) await revalidatePostTargets(auth.db, existing.post_id);
  return { ok: true as const };
}

export async function deletePostFlightOptionAction(id: string) {
  const parsed = uuidSchema.safeParse(id);
  if (!parsed.success) return { ok: false as const, error: "ID inválido." };
  const auth = await requireConsultora();
  if (!auth.ok || !auth.db) return { ok: false as const, error: auth.error };
  const { data: existing } = await auth.db.from("post_flight_options").select("post_id").eq("id", id).maybeSingle();
  const { error } = await auth.db.from("post_flight_options").delete().eq("id", id);
  if (error) return { ok: false as const, error: error.message };
  if (existing?.post_id) await revalidatePostTargets(auth.db, existing.post_id);
  return { ok: true as const };
}

export async function reorderPostFlightOptionsAction(postId: string, ids: string[]) {
  const parsed = reorderSchema.safeParse({ postId, ids });
  if (!parsed.success) return { ok: false as const, error: "Dados inválidos." };
  const auth = await requireConsultora();
  if (!auth.ok || !auth.db) return { ok: false as const, error: auth.error };
  for (let i = 0; i < parsed.data.ids.length; i += 1) {
    const id = parsed.data.ids[i];
    await auth.db
      .from("post_flight_options")
      .update({ ordem: i })
      .eq("id", id)
      .eq("post_id", postId);
  }
  await revalidatePostTargets(auth.db, postId);
  return { ok: true as const };
}
