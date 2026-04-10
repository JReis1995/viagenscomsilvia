import { ConsultoraSection } from "@/components/marketing/consultora-section";
import { ExperienceFeed } from "@/components/marketing/experience-feed";
import { LuxuryHero } from "@/components/marketing/luxury-hero";
import { QuizSection } from "@/components/marketing/quiz-section";
import { parsePedidoPrefillFromSearchParams } from "@/lib/marketing/pedido-orcamento";
import { fetchPublishedPosts } from "@/lib/posts/fetch-published";
import { fetchSiteContent } from "@/lib/site/fetch-site-content";

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
  ].join("|");

  const [posts, site] = await Promise.all([
    fetchPublishedPosts(),
    fetchSiteContent(),
  ]);

  return (
    <>
      <LuxuryHero copy={site.hero} />
      <ExperienceFeed
        posts={posts}
        feed={site.feed}
        featuredVideo={site.featuredVideo}
      />
      <ConsultoraSection copy={site.consultora} />
      <QuizSection copy={site.quiz} prefill={prefill} quizKey={quizKey} />
    </>
  );
}
