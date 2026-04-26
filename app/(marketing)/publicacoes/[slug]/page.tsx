import { notFound } from "next/navigation";

import { PublicacaoDetalheExperience } from "@/components/marketing/publicacao-detalhe-experience";
import { fetchPublicacaoBySlug } from "@/lib/posts/fetch-publicacao-by-slug";
import { fetchSiteContent } from "@/lib/site/fetch-site-content";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function PublicacaoSlugPage({ params }: Props) {
  const { slug } = await params;
  const [post, site] = await Promise.all([fetchPublicacaoBySlug(slug), fetchSiteContent()]);
  if (!post) notFound();

  return <PublicacaoDetalheExperience post={post} quizCopy={site.quiz} />;
}
