"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { buildPublicacaoHrefFromPost } from "@/lib/marketing/publicacao-href";
import { heroPostBackdrop } from "@/lib/marketing/hero-post-media";
import type { PublishedPost } from "@/types/post";

function thumbSrc(post: PublishedPost): string {
  const vis = heroPostBackdrop(post);
  if (!vis) return "";
  if (vis.kind === "file-video") return "";
  return vis.src;
}

type Props = {
  posts: PublishedPost[];
  /** Máximo de cartões no rail (performance). */
  max?: number;
  lockNavigation?: boolean;
};

export function HeroPostsRail({
  posts,
  max = 12,
  lockNavigation = false,
}: Props) {
  const searchParams = useSearchParams();
  const slice = posts.filter((p) => p.media_url?.trim()).slice(0, max);
  if (slice.length === 0) return null;

  const wrap = lockNavigation
    ? "pointer-events-none opacity-90"
    : "";

  return (
    <div className={wrap}>
      <p className="mb-4 text-center text-[11px] font-semibold uppercase tracking-[0.28em] text-white/70 [text-shadow:0_1px_3px_rgba(0,0,0,0.85)]">
        Ideias e ofertas em destaque
      </p>
      <div
        className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 pt-0.5 [-ms-overflow-style:none] [scrollbar-width:none] sm:gap-4 [&::-webkit-scrollbar]:hidden"
        role="list"
        aria-label="Publicações em destaque — desliza para ver mais"
      >
        {slice.map((post) => {
          const src = thumbSrc(post);
          const backdrop = heroPostBackdrop(post);
          const fileVid = backdrop?.kind === "file-video";
          const href = buildPublicacaoHrefFromPost(post, searchParams);
          return (
            <Link
              key={post.id}
              href={href}
              role="listitem"
              className="group relative w-[min(260px,78vw)] shrink-0 snap-start overflow-hidden rounded-2xl bg-ocean-950/60 shadow-[0_16px_40px_-16px_rgba(0,0,0,0.5)] ring-1 ring-white/15 transition hover:-translate-y-0.5 hover:ring-white/35"
            >
              <div className="relative aspect-[4/3] w-full">
                {fileVid ? (
                  <video
                    src={post.media_url}
                    className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
                    muted
                    playsInline
                    loop
                    autoPlay
                    preload="metadata"
                    aria-hidden
                  />
                ) : src ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={src}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <div className="absolute inset-0 bg-ocean-900/80" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-3.5">
                  <p className="line-clamp-2 text-left font-serif text-base font-medium leading-snug text-white drop-shadow-md">
                    {post.titulo}
                  </p>
                  {post.tipo === "promocao" && post.preco_desde?.trim() ? (
                    <p className="mt-1 line-clamp-1 text-left text-xs font-semibold text-amber-100/95">
                      {post.preco_desde}
                    </p>
                  ) : null}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
