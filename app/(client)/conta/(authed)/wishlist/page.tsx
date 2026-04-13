import type { Metadata } from "next";

import { WishlistAddDestino } from "@/components/conta/wishlist-add-destino";
import { WishlistRemoveButton } from "@/components/conta/wishlist-remove-button";
import {
  getYoutubeThumbnailUrl,
  getYoutubeVideoId,
} from "@/lib/marketing/media";
import { clientNeedsConsentScreen } from "@/lib/auth/consent";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Wishlist",
  description: "Destinos e publicações guardados.",
};

type PostEmbed = {
  id: string;
  titulo: string;
  media_url: string;
  tipo: string;
} | null;

function normalizePostEmbed(raw: unknown): PostEmbed {
  if (raw == null) return null;
  if (Array.isArray(raw)) {
    const first = raw[0] as PostEmbed | undefined;
    return first ?? null;
  }
  return raw as PostEmbed;
}

export default async function WishlistPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (clientNeedsConsentScreen(user)) {
    return null;
  }

  const { data: rows, error } = await supabase
    .from("wishlist_items")
    .select("id, post_id, destino_label, created_at, posts ( id, titulo, media_url, tipo )")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="rounded-2xl border border-terracotta/30 bg-terracotta/10 px-4 py-6 text-sm text-ocean-900">
        Não foi possível carregar a wishlist. Executa{" "}
        <code className="rounded bg-white px-1">sql/sprint3_plan_features.sql</code>{" "}
        no Supabase.
        <p className="mt-2 font-mono text-xs text-ocean-600">{error.message}</p>
      </div>
    );
  }

  const list = rows ?? [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-2xl font-normal text-ocean-900 md:text-3xl">
          Wishlist
        </h1>
        <p className="mt-2 text-sm text-ocean-600">
          Publicações que guardaste no feed e destinos que anotaste. Email:{" "}
          <span className="font-medium text-ocean-800">{user?.email}</span>
        </p>
      </div>

      <WishlistAddDestino />

      {list.length === 0 ? (
        <p className="rounded-2xl border border-ocean-100 bg-white px-6 py-10 text-center text-sm text-ocean-600 shadow-sm">
          Ainda está vazio. No feed da página inicial, clica no coração numa
          publicação (com sessão iniciada) ou adiciona um destino acima.
        </p>
      ) : (
        <ul className="space-y-4">
          {list.map((row) => {
            const post = normalizePostEmbed(row.posts);
            const yid =
              post?.tipo === "video"
                ? getYoutubeVideoId(post.media_url)
                : null;
            const thumb = yid
              ? getYoutubeThumbnailUrl(yid)
              : post?.media_url;
            return (
              <li
                key={row.id}
                className="flex flex-wrap items-center gap-4 rounded-2xl border border-ocean-100 bg-white p-4 shadow-sm"
              >
                {post && thumb ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={thumb || post.media_url}
                    alt=""
                    className="h-16 w-16 shrink-0 rounded-lg object-cover"
                  />
                ) : (
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-ocean-100 text-xl text-ocean-400">
                    ✦
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-ocean-900">
                    {post?.titulo ?? row.destino_label ?? "Item"}
                  </p>
                  <p className="text-xs text-ocean-500">
                    {new Date(row.created_at).toLocaleDateString("pt-PT")}
                  </p>
                </div>
                <WishlistRemoveButton itemId={row.id} />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
