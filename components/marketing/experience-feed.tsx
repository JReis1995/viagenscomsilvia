"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useMemo, useState } from "react";

import { CrmInlineText } from "@/components/crm/crm-inline-text";
import { FeaturedPublicationVideo } from "@/components/marketing/featured-publication-video";
import { FeedWishlistButton } from "@/components/marketing/feed-wishlist-button";
import { buildPedidoOrcamentoHrefFromPost } from "@/lib/marketing/pedido-orcamento";
import {
  getYoutubeThumbnailUrl,
  getYoutubeVideoId,
  isLikelyVideoUrl,
} from "@/lib/marketing/media";
import type { SiteContent } from "@/lib/site/site-content";
import type { PostTipo, PublishedPost } from "@/types/post";

function bentoClass(tipo: PostTipo, index: number): string {
  const tall = "min-h-[min(320px,72vw)] sm:min-h-[300px]";
  const mid = "min-h-[min(280px,65vw)] sm:min-h-[260px]";

  if (tipo === "promocao") {
    return `${tall} md:col-span-2 xl:col-span-8 xl:row-span-2 xl:min-h-[420px]`;
  }
  if (tipo === "video") {
    return `${mid} md:col-span-2 xl:col-span-4`;
  }
  /* inspiracao — variação leve */
  if (index % 2 === 0) {
    return `${mid} xl:col-span-4`;
  }
  return `${mid} xl:col-span-4 xl:row-span-1`;
}

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
  index,
  viewerUserId,
  wishlistedPostIds,
  reduceMotion,
}: {
  post: PublishedPost;
  index: number;
  viewerUserId: string | null;
  wishlistedPostIds: string[];
  reduceMotion: boolean | null;
}) {
  const href =
    post.link_cta?.trim() || buildPedidoOrcamentoHrefFromPost(post);
  const src = resolveVisualUrl(post);
  const showVideoChrome =
    post.tipo === "video" || isLikelyVideoUrl(post.media_url);
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
      transition={{ duration: 0.55, delay: Math.min(index * 0.06, 0.36) }}
      className={`group relative ${bentoClass(post.tipo, index)}`}
    >
      {viewerUserId ? (
        <FeedWishlistButton
          postId={post.id}
          initialSaved={wishlistedPostIds.includes(post.id)}
          compactTop={isPromo}
        />
      ) : null}
      <Link
        href={href}
        className={`relative flex h-full min-h-[inherit] flex-col overflow-hidden rounded-3xl bg-ocean-900 shadow-[0_24px_48px_-28px_rgba(12,74,110,0.45)] ring-1 transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_32px_56px_-24px_rgba(12,74,110,0.5)] ${
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
          {/* eslint-disable-next-line @next/next/no-img-element -- URLs dinâmicos do CMS / Supabase Storage */}
          <img
            src={src}
            alt=""
            className={`absolute inset-0 h-full w-full origin-center object-cover scale-100 ${imgMotion}`}
            loading="lazy"
            decoding="async"
          />
          <div
            className="absolute inset-0 bg-gradient-to-t from-ocean-950/95 via-ocean-950/35 to-ocean-950/10"
            aria-hidden
          />

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

        <div className="relative z-10 flex flex-col gap-2 p-6 pt-5 text-white md:p-7">
          <h3 className="font-serif text-xl font-medium leading-snug tracking-tight md:text-2xl">
            {post.titulo}
          </h3>
          {post.descricao ? (
            <p className="line-clamp-3 text-sm leading-relaxed text-white/80 md:text-[15px]">
              {post.descricao}
            </p>
          ) : null}
          {isPromo && post.preco_desde ? (
            <p className="mt-2 text-sm font-semibold tracking-wide text-amber-100/95">
              {post.preco_desde}
            </p>
          ) : null}
          <span className="mt-3 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
            {post.tipo === "promocao"
              ? "Quero esta experiência"
              : post.tipo === "video"
                ? "Ver vídeo"
                : "Seguir esta ideia"}
            <span aria-hidden className="transition group-hover:translate-x-1">
              →
            </span>
          </span>
        </div>
      </Link>
    </motion.article>
  );
}

type Props = {
  posts: PublishedPost[];
  feed: SiteContent["feed"];
  featuredVideo: SiteContent["featuredVideo"];
  viewerUserId?: string | null;
  wishlistedPostIds?: string[];
  crm?: {
    patchFeed: (field: keyof SiteContent["feed"], value: string) => void;
    patchFeatured: (
      field: keyof SiteContent["featuredVideo"],
      value: string,
    ) => void;
  };
};

function buildVibeChips(feed: SiteContent["feed"]) {
  const raw = [
    { label: feed.filterChip1Label, slug: feed.filterChip1Slug },
    { label: feed.filterChip2Label, slug: feed.filterChip2Slug },
    { label: feed.filterChip3Label, slug: feed.filterChip3Slug },
  ];
  return raw.filter((c) => {
    const slug = c.slug.trim().toLowerCase();
    return c.label.trim().length > 0 && slug.length > 0;
  }) as { label: string; slug: string }[];
}

export function ExperienceFeed({
  posts,
  feed,
  featuredVideo,
  viewerUserId = null,
  wishlistedPostIds = [],
  crm,
}: Props) {
  const reduceMotion = useReducedMotion();
  const [activeVibeSlug, setActiveVibeSlug] = useState<string | null>(null);

  const vibeChips = useMemo(() => buildVibeChips(feed), [feed]);

  const filteredPosts = useMemo(() => {
    if (!activeVibeSlug) return posts;
    return posts.filter((p) => p.feed_vibe_slugs.includes(activeVibeSlug));
  }, [posts, activeVibeSlug]);

  const chipLock = crm
    ? "pointer-events-none [&_.crm-feed-chip]:pointer-events-auto"
    : "";

  return (
    <section
      id="inspiracoes"
      className="scroll-mt-28 border-t border-ocean-100/70 bg-gradient-to-b from-sand via-white/40 to-sand px-5 py-20 sm:px-6 md:py-28"
      aria-labelledby="feed-heading"
    >
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 20 }}
          whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] as const }}
          className="mx-auto max-w-2xl text-center"
        >
          <p className="text-[11px] font-medium uppercase tracking-[0.35em] text-ocean-500">
            {crm ? (
              <CrmInlineText
                label="Linha pequena das inspirações"
                value={feed.eyebrow}
                onApply={(v) => crm.patchFeed("eyebrow", v)}
              />
            ) : (
              feed.eyebrow
            )}
          </p>
          <h2
            id="feed-heading"
            className="mt-4 font-serif text-3xl font-normal tracking-tight text-ocean-900 md:text-4xl"
          >
            {crm ? (
              <CrmInlineText
                label="Título das inspirações"
                value={feed.title}
                onApply={(v) => crm.patchFeed("title", v)}
              />
            ) : (
              feed.title
            )}
          </h2>
          <p className="mt-5 text-base leading-relaxed text-ocean-600 md:text-lg">
            {crm ? (
              <CrmInlineText
                label="Subtítulo das inspirações"
                multiline
                value={feed.subtitle}
                onApply={(v) => crm.patchFeed("subtitle", v)}
              />
            ) : (
              feed.subtitle
            )}
          </p>
        </motion.div>

        <FeaturedPublicationVideo
          copy={featuredVideo}
          crm={
            crm
              ? { patch: (f, v) => crm.patchFeatured(f, v) }
              : undefined
          }
        />

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
          <div>
            {vibeChips.length > 0 ? (
              <div
                className={`mt-12 flex flex-wrap items-center justify-center gap-2 ${chipLock}`}
                role="group"
                aria-label="Filtrar inspirações por vibe"
              >
                <button
                  type="button"
                  onClick={() => setActiveVibeSlug(null)}
                  className={`rounded-full px-5 py-2.5 text-sm font-medium transition ${
                    activeVibeSlug === null
                      ? "bg-ocean-900 text-white shadow-md"
                      : "border border-ocean-200/90 bg-white/80 text-ocean-800 hover:border-ocean-300"
                  }`}
                >
                  {crm ? (
                    <CrmInlineText
                      label="Texto do filtro «tudo»"
                      value={feed.filterAllLabel}
                      onApply={(v) => crm.patchFeed("filterAllLabel", v)}
                      className={
                        activeVibeSlug === null
                          ? "crm-feed-chip text-white"
                          : "crm-feed-chip"
                      }
                    />
                  ) : (
                    feed.filterAllLabel
                  )}
                </button>
                {vibeChips.map((c, chipIdx) => {
                  const slug = c.slug.trim().toLowerCase();
                  const active = activeVibeSlug === slug;
                  const labelField =
                    chipIdx === 0
                      ? ("filterChip1Label" as const)
                      : chipIdx === 1
                        ? ("filterChip2Label" as const)
                        : ("filterChip3Label" as const);
                  const slugField =
                    chipIdx === 0
                      ? ("filterChip1Slug" as const)
                      : chipIdx === 1
                        ? ("filterChip2Slug" as const)
                        : ("filterChip3Slug" as const);
                  return (
                    <button
                      key={slug}
                      type="button"
                      onClick={() =>
                        setActiveVibeSlug(active ? null : slug)
                      }
                      className={`rounded-full px-5 py-2.5 text-sm font-medium transition ${
                        active
                          ? "bg-ocean-900 text-white shadow-md"
                          : "border border-ocean-200/90 bg-white/80 text-ocean-800 hover:border-ocean-300"
                      }`}
                    >
                      {crm ? (
                        <span className="flex flex-col items-center gap-1">
                          <CrmInlineText
                            label={`Rótulo do filtro ${chipIdx + 1}`}
                            value={c.label.trim()}
                            onApply={(v) => crm.patchFeed(labelField, v)}
                            className={
                              active
                                ? "crm-feed-chip text-white"
                                : "crm-feed-chip"
                            }
                          />
                          <CrmInlineText
                            label={`Código do filtro ${chipIdx + 1}`}
                            value={c.slug.trim()}
                            onApply={(v) => crm.patchFeed(slugField, v)}
                            className={`crm-feed-chip text-[10px] font-normal normal-case tracking-normal opacity-80 ${
                              active ? "text-white" : "text-ocean-600"
                            }`}
                          />
                        </span>
                      ) : (
                        c.label.trim()
                      )}
                    </button>
                  );
                })}
              </div>
            ) : null}

            <p className="mt-14 text-center text-[11px] font-medium uppercase tracking-[0.3em] text-ocean-400">
              {crm ? (
                <CrmInlineText
                  label="Texto por cima da grelha"
                  value={feed.moreLabel}
                  onApply={(v) => crm.patchFeed("moreLabel", v)}
                />
              ) : (
                feed.moreLabel
              )}
            </p>

            {filteredPosts.length === 0 ? (
              <p className="mx-auto mt-8 max-w-md text-center text-ocean-600">
                Nenhuma publicação neste filtro. Experimenta «
                {feed.filterAllLabel}» ou outro chip.
              </p>
            ) : (
              <div className="mt-6 grid auto-rows-[minmax(0,auto)] grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2 xl:grid-cols-12 xl:gap-6">
                {filteredPosts.map((post, index) => (
                  <FeedCard
                    key={post.id}
                    post={post}
                    index={index}
                    viewerUserId={viewerUserId}
                    wishlistedPostIds={wishlistedPostIds}
                    reduceMotion={reduceMotion}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
