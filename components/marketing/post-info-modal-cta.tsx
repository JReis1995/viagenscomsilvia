"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { buildPublicacaoHrefFromPost } from "@/lib/marketing/publicacao-href";
import type { PublishedPost } from "@/types/post";

type Props = {
  post: PublishedPost;
  label?: string;
  className?: string;
};

export function PostInfoModalCta({
  post,
  label = "Mais informações",
  className = "",
}: Props) {
  const searchParams = useSearchParams();
  const href = buildPublicacaoHrefFromPost(post, searchParams);

  return (
    <Link href={href} className={className} aria-label={`${label} sobre ${post.titulo}`}>
      {label}
    </Link>
  );
}
