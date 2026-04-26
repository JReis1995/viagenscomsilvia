"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

export type ToggleWishlistPostResult =
  | { ok: true; added: boolean }
  | { ok: false; error: string };

export async function toggleWishlistPost(
  postId: string,
  preferredHotel?: string,
): Promise<ToggleWishlistPostResult> {
  if (
    !postId ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      postId,
    )
  ) {
    return { ok: false, error: "Publicação inválida." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Inicia sessão para usar a wishlist." };
  }

  const { data: existing } = await supabase
    .from("wishlist_items")
    .select("id")
    .eq("user_id", user.id)
    .eq("post_id", postId)
    .maybeSingle();

  if (existing?.id) {
    const { error } = await supabase
      .from("wishlist_items")
      .delete()
      .eq("id", existing.id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/");
    revalidatePath("/conta/wishlist");
    return { ok: true, added: false };
  }

  const { error } = await supabase.from("wishlist_items").insert({
    user_id: user.id,
    post_id: postId,
    destino_label:
      typeof preferredHotel === "string" && preferredHotel.trim()
        ? `Hotel preferido: ${preferredHotel.trim().slice(0, 180)}`
        : null,
  });

  if (error) {
    return {
      ok: false,
      error:
        error.message.includes("wishlist")
          ? "Executa sql/sprint3_plan_features.sql no Supabase."
          : error.message,
    };
  }

  revalidatePath("/");
  revalidatePath("/conta/wishlist");
  return { ok: true, added: true };
}
