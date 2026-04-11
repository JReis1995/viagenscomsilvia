import type { Metadata } from "next";
import Link from "next/link";

import { buildPedidoOrcamentoHrefFromPost } from "@/lib/marketing/pedido-orcamento";
import {
  getYoutubeThumbnailUrl,
  getYoutubeVideoId,
  isLikelyVideoUrl,
} from "@/lib/marketing/media";
import { fetchMemberSecretPosts } from "@/lib/posts/fetch-member-secret-posts";

export const metadata: Metadata = {
  title: "Roteiros secretos",
  description: "Conteúdos exclusivos para clientes registados.",
};

export default async function RoteirosSecretosPage() {
  const posts = await fetchMemberSecretPosts();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-2xl font-normal text-ocean-900 md:text-3xl">
          Roteiros secretos
        </h1>
        <p className="mt-2 text-sm text-ocean-600">
          Estas publicações só aparecem para quem tem conta — não estão no site
          público. A Sílvia marca-as como «só para membros» no CRM.
        </p>
      </div>

      {posts.length === 0 ? (
        <div className="rounded-2xl border border-ocean-100 bg-ocean-50/50 px-6 py-10 text-center text-sm text-ocean-700">
          <p>Em breve haverá roteiros exclusivos aqui.</p>
          <p className="mt-2 text-xs text-ocean-500">
            Se ainda vês isto depois de a consultora publicar, confirma que
            activou «Só para quem tem conta» na publicação e que executaste{" "}
            <code className="rounded bg-white px-1">sql/sprint3_plan_features.sql</code>.
          </p>
        </div>
      ) : (
        <ul className="grid gap-6 sm:grid-cols-2">
          {posts.map((post) => {
            const href =
              post.link_cta?.trim() || buildPedidoOrcamentoHrefFromPost(post);
            let src = post.media_url;
            if (post.tipo === "video") {
              const id = getYoutubeVideoId(post.media_url);
              if (id) src = getYoutubeThumbnailUrl(id);
            }
            const video = post.tipo === "video" || isLikelyVideoUrl(post.media_url);
            return (
              <li
                key={post.id}
                className="overflow-hidden rounded-2xl border border-ocean-100 bg-white shadow-md"
              >
                <Link href={href} className="group block">
                  <div className="relative aspect-[16/10] bg-ocean-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={src}
                      alt=""
                      className="h-full w-full object-cover transition group-hover:opacity-95"
                    />
                    {video ? (
                      <span className="absolute bottom-3 left-3 rounded-full bg-ocean-900/80 px-2 py-0.5 text-[10px] font-semibold text-white">
                        Vídeo
                      </span>
                    ) : null}
                  </div>
                  <div className="p-4">
                    <p className="font-medium text-ocean-900">{post.titulo}</p>
                    {post.descricao ? (
                      <p className="mt-1 line-clamp-2 text-sm text-ocean-600">
                        {post.descricao}
                      </p>
                    ) : null}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
