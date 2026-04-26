import { notFound } from "next/navigation";

import { PublicacaoDetalheExperience } from "@/components/marketing/publicacao-detalhe-experience";
import { fetchPublicacaoById } from "@/lib/posts/fetch-publicacao-by-id";
import { fetchSiteContent } from "@/lib/site/fetch-site-content";

type Props = {
  params: Promise<{ postId: string }>;
};

export default async function PublicacaoByIdPage({ params }: Props) {
  const { postId } = await params;
  const [post, site] = await Promise.all([
    fetchPublicacaoById(postId),
    fetchSiteContent(),
  ]);
  if (!post) notFound();

  return <PublicacaoDetalheExperience post={post} quizCopy={site.quiz} />;
}
