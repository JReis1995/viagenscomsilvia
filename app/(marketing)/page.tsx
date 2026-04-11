import { Suspense } from "react";

import { ConsultoraSection } from "@/components/marketing/consultora-section";
import { ExperienceFeed } from "@/components/marketing/experience-feed";
import { InstagramSocialSection } from "@/components/marketing/instagram-social-section";
import { LuxuryHero } from "@/components/marketing/luxury-hero";
import { QuizSection } from "@/components/marketing/quiz-section";
import { parsePedidoPrefillFromSearchParams } from "@/lib/marketing/pedido-orcamento";
import { fetchPublishedPosts } from "@/lib/posts/fetch-published";
import { fetchSiteContent } from "@/lib/site/fetch-site-content";
import { createClient } from "@/lib/supabase/server";

/** Feed e dados públicos — revalidar para refletir novos posts sem rebuild completo. */
export const revalidate = 60;

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function HomePage({ searchParams }: Props) {
  const sp = await searchParams;
  const prefill = parsePedidoPrefillFromSearchParams(sp);
  const quizKey = [
    prefill?.postId ?? "",
    prefill?.destinoSonho ?? "",
    prefill?.vibe ?? "",
    prefill?.clima ?? "",
  ].join("|");

  const [posts, site] = await Promise.all([
    fetchPublishedPosts(),
    fetchSiteContent(),
  ]);

  let viewerUserId: string | null = null;
  let wishlistedPostIds: string[] = [];

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (supabaseUrl && supabaseAnon) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    viewerUserId = user?.id ?? null;
    if (user) {
      const { data: wl, error: wlError } = await supabase
        .from("wishlist_items")
        .select("post_id")
        .eq("user_id", user.id);
      if (!wlError && wl) {
        wishlistedPostIds = wl
          .map((r) => r.post_id)
          .filter((id): id is string => !!id);
      }
    }
  }

  return (
    <>
      <Suspense
        fallback={
          <div
            className="min-h-[min(92svh,900px)] bg-gradient-to-br from-ocean-950 via-ocean-900 to-ocean-950"
            aria-hidden
          />
        }
      >
        <LuxuryHero copy={site.hero} quizCopy={site.quiz} />
      </Suspense>
      <ExperienceFeed
        posts={posts}
        feed={site.feed}
        featuredVideo={site.featuredVideo}
        viewerUserId={viewerUserId}
        wishlistedPostIds={wishlistedPostIds}
      />
      <InstagramSocialSection copy={site.socialFeed} />
      <ConsultoraSection copy={site.consultora} alma={site.almaTestimonials} />
      <QuizSection copy={site.quiz} prefill={prefill} quizKey={quizKey} />
    </>
  );
}
