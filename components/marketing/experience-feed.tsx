"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useMemo, useState } from "react";

import { CrmInlineText } from "@/components/crm/crm-inline-text";
import { FeedWishlistButton } from "@/components/marketing/feed-wishlist-button";
import { PostInfoModalCta } from "@/components/marketing/post-info-modal-cta";
import {
  getYoutubeThumbnailUrl,
  getYoutubeVideoId,
  isDirectVideoFileUrl,
  isLikelyVideoUrl,
} from "@/lib/marketing/media";
import type { SiteContent } from "@/lib/site/site-content";
import type { PublishedPost } from "@/types/post";

function resolveVisualUrl(post: PublishedPost): string {
  if (post.tipo === "video") {
    const id = getYoutubeVideoId(post.media_url);
    if (id) {
      return getYoutubeThumbnailUrl(id);
    }
  }
  return post.media_url;
}

function PlayIcon() {
  return (
    <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/95 text-ocean-900 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.35)] ring-1 ring-white/40 backdrop-blur-sm transition group-hover:scale-105">
      <svg
        className="ml-1 h-7 w-7"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden
      >
        <path d="M8 5v14l11-7z" />
      </svg>
    </span>
  );
}

function FeedCard({
  post,
  animIndex,
  viewerUserId,
  wishlistedPostIds,
  reduceMotion,
}: {
  post: PublishedPost;
  animIndex: number;
  viewerUserId: string | null;
  wishlistedPostIds: string[];
  reduceMotion: boolean | null;
}) {
  const src = resolveVisualUrl(post);
  const fileVideo = isDirectVideoFileUrl(post.media_url);
  const showVideoChrome =
    !fileVideo &&
    (post.tipo === "video" || isLikelyVideoUrl(post.media_url));
  const isPromo = post.tipo === "promocao";
  const hoverLine = post.hover_line?.trim();
  const kenBurns =
    !reduceMotion &&
    "transition-transform duration-[9000ms] ease-out will-change-transform group-hover:scale-[1.1] group-hover:translate-x-[-1%]";
  const imgMotion = reduceMotion ? "transition duration-700 group-hover:scale-[1.03]" : kenBurns;

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.55, delay: Math.min(animIndex * 0.06, 0.36) }}
      className="group relative min-h-[360px]"
    >
      {viewerUserId ? (
        <FeedWishlistButton
          postId={post.id}
          initialSaved={wishlistedPostIds.includes(post.id)}
          hotelOptions={post.hotel_names}
          compactTop={isPromo}
        />
      ) : null}
      <article
        className={`relative flex h-full min-h-[inherit] flex-col overflow-hidden rounded-3xl bg-white shadow-[0_24px_48px_-28px_rgba(12,74,110,0.45)] ring-1 transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_32px_56px_-24px_rgba(12,74,110,0.5)] ${
          isPromo
            ? "ring-2 ring-terracotta/85 ring-offset-2 ring-offset-sand"
            : "ring-ocean-900/8"
        }`}
      >
        {isPromo ? (
          <span className="absolute left-5 top-5 z-20 inline-flex items-center rounded-full bg-terracotta px-3.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-white shadow-md">
            Oferta
          </span>
        ) : null}

        <div className="relative min-h-[200px] flex-1 overflow-hidden">
          {fileVideo ? (
            <video
              src={post.media_url}
              className={`absolute inset-0 h-full w-full origin-center object-cover scale-100 ${imgMotion}`}
              muted
              playsInline
              loop
              autoPlay
              preload="metadata"
              aria-hidden
            />
          ) : (
            /* eslint-disable-next-line @next/next/no-img-element -- URLs dinâmicos do CMS / Supabase Storage */
            <img
              src={src}
              alt=""
              className={`absolute inset-0 h-full w-full origin-center object-cover scale-100 ${imgMotion}`}
              loading="lazy"
              decoding="async"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/15" aria-hidden />

          {hoverLine ? (
            <p
              className="pointer-events-none absolute inset-x-4 bottom-[36%] z-[15] text-center font-serif text-sm italic leading-snug text-white opacity-0 drop-shadow-md transition-opacity duration-500 group-hover:opacity-100 sm:bottom-[34%] md:text-[15px]"
              aria-hidden
            >
              {hoverLine}
            </p>
          ) : null}

          {showVideoChrome ? (
            <div className="absolute inset-0 z-10 flex items-center justify-center">
              <PlayIcon />
            </div>
          ) : null}
        </div>

        {isPromo ? (
          <div className="relative z-10 flex flex-1 flex-col gap-2 p-5 text-ocean-900 md:p-6">
            {post.descricao?.trim() ? (
              <p className="line-clamp-2 text-[11px] font-semibold uppercase leading-snug tracking-[0.18em] text-ocean-500 md:text-xs">
                {post.descricao}
              </p>
            ) : (
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-terracotta">
                Oferta
              </p>
            )}
            <h3 className="font-serif text-2xl font-semibold leading-[1.12] tracking-tight text-ocean-900 md:text-3xl xl:text-[2.1rem]">
              {post.titulo}
            </h3>
            {post.preco_desde?.trim() ? (
              <div className="mt-2 border-t border-ocean-100 pt-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-ocean-500">
                  a partir de
                </p>
                <p className="mt-1 font-serif text-xl leading-tight text-emerald-700 md:text-2xl">
                  {post.preco_desde}
                </p>
                <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wider text-ocean-500">
                  por pessoa
                </p>
              </div>
            ) : null}
            <div className="mt-3">
              <PostInfoModalCta
                post={post}
                className="inline-flex min-h-11 items-center justify-center rounded-xl bg-terracotta px-4 text-sm font-semibold text-white shadow-sm hover:bg-terracotta/90"
              />
            </div>
          </div>
        ) : (
          <div className="relative z-10 flex flex-1 flex-col gap-2 p-5 text-ocean-900 md:p-6">
            <h3 className="font-serif text-xl font-medium leading-snug tracking-tight text-ocean-900 md:text-2xl">
              {post.titulo}
            </h3>
            {post.descricao ? (
              <p className="line-clamp-3 text-sm leading-relaxed text-ocean-600 md:text-[15px]">
                {post.descricao}
              </p>
            ) : null}
            <div className="mt-3">
              <PostInfoModalCta
                post={post}
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-ocean-200 bg-white px-4 text-sm font-semibold text-ocean-800 hover:bg-ocean-50"
              />
            </div>
          </div>
        )}
      </article>
    </motion.article>
  );
}

type Props = {
  posts: PublishedPost[];
  feed: SiteContent["feed"];
  viewerUserId?: string | null;
  wishlistedPostIds?: string[];
  crm?: {
    patchFeed: (field: keyof SiteContent["feed"], value: string) => void;
  };
};

export function ExperienceFeed({
  posts,
  feed,
  viewerUserId = null,
  wishlistedPostIds = [],
  crm,
}: Props) {
  const reduceMotion = useReducedMotion();
  const orderedPosts = useMemo(() => posts, [posts]);
  const [priceRange, setPriceRange] = useState<
    "all" | "0-999" | "1000-1999" | "2000-2999" | "3000+"
  >("all");
  const [regimeFilter, setRegimeFilter] = useState<string>("all");

  const regimeOptions = useMemo(() => {
    const all = new Set<string>();
    for (const post of orderedPosts) {
      for (const regime of post.hotel_regimes) {
        if (regime.trim()) all.add(regime.trim());
      }
    }
    return Array.from(all).sort((a, b) => a.localeCompare(b, "pt-PT"));
  }, [orderedPosts]);

  const filteredPosts = useMemo(() => {
    return orderedPosts.filter((post) => {
      const price = post.preco_base_eur;
      const priceMatch =
        priceRange === "all" ||
        (priceRange === "0-999" && price != null && price <= 999) ||
        (priceRange === "1000-1999" && price != null && price >= 1000 && price <= 1999) ||
        (priceRange === "2000-2999" && price != null && price >= 2000 && price <= 2999) ||
        (priceRange === "3000+" && price != null && price >= 3000);
      if (!priceMatch) return false;
      if (regimeFilter === "all") return true;
      return post.hotel_regimes.some((regime) => regime === regimeFilter);
    });
  }, [orderedPosts, priceRange, regimeFilter]);

  const gridClass = "grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2 xl:grid-cols-3 xl:gap-6";

  return (
    <section
      id="publicacoes"
      className="scroll-mt-28 border-t border-ocean-100/70 bg-gradient-to-b from-sand via-white/40 to-sand px-5 py-20 sm:px-6 md:py-28"
    >
      <div className="mx-auto max-w-6xl">
        {posts.length === 0 ? (
          <motion.p
            className="mx-auto mt-10 max-w-md rounded-3xl border border-ocean-100/80 bg-white/70 px-8 py-12 text-center text-ocean-600 shadow-sm backdrop-blur-sm"
            initial={reduceMotion ? false : { opacity: 0 }}
            whileInView={reduceMotion ? undefined : { opacity: 1 }}
            viewport={{ once: true }}
          >
            {crm ? (
              <CrmInlineText
                label="Mensagem quando não há publicações"
                multiline
                value={feed.emptyMessage}
                onApply={(v) => crm.patchFeed("emptyMessage", v)}
              />
            ) : (
              feed.emptyMessage
            )}
          </motion.p>
        ) : (
          <>
            <div className="mt-8 rounded-3xl border border-ocean-100/70 bg-white/80 p-4 shadow-sm backdrop-blur-sm">
              <div className="grid gap-3 md:grid-cols-3">
                <label className="text-sm text-ocean-700">
                  Preço base
                  <select
                    value={priceRange}
                    onChange={(e) =>
                      setPriceRange(
                        e.target.value as "all" | "0-999" | "1000-1999" | "2000-2999" | "3000+",
                      )
                    }
                    className="mt-1 w-full rounded-xl border border-ocean-200 bg-white px-3 py-2 text-sm"
                  >
                    <option value="all">Todas as faixas</option>
                    <option value="0-999">Até 999 EUR</option>
                    <option value="1000-1999">1000 a 1999 EUR</option>
                    <option value="2000-2999">2000 a 2999 EUR</option>
                    <option value="3000+">3000+ EUR</option>
                  </select>
                </label>
                <label className="text-sm text-ocean-700">
                  Regime
                  <select
                    value={regimeFilter}
                    onChange={(e) => setRegimeFilter(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-ocean-200 bg-white px-3 py-2 text-sm"
                  >
                    <option value="all">Todos os regimes</option>
                    {regimeOptions.map((regime) => (
                      <option key={regime} value={regime}>
                        {regime}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => {
                      setPriceRange("all");
                      setRegimeFilter("all");
                    }}
                    className="w-full rounded-xl border border-ocean-200 px-3 py-2 text-sm font-semibold text-ocean-700 hover:bg-ocean-50"
                  >
                    Limpar filtros
                  </button>
                </div>
              </div>
              <p className="mt-3 text-sm text-ocean-600">
                {filteredPosts.length} publicação(ões) encontradas.
              </p>
            </div>
            {filteredPosts.length === 0 ? (
              <p className="mx-auto mt-10 max-w-md rounded-3xl border border-ocean-100/80 bg-white/70 px-8 py-12 text-center text-ocean-600 shadow-sm backdrop-blur-sm">
                Não encontrámos publicações para esses filtros.
              </p>
            ) : (
              <div className={`mt-10 ${gridClass}`}>
                {filteredPosts.map((post, index) => (
                  <FeedCard
                    key={post.id}
                    post={post}
                    animIndex={index}
                    viewerUserId={viewerUserId}
                    wishlistedPostIds={wishlistedPostIds}
                    reduceMotion={reduceMotion}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
