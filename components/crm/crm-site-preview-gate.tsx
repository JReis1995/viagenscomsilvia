"use client";

import nextDynamic from "next/dynamic";

import type { PublishedPost } from "@/types/post";

const SitePreviewShell = nextDynamic(
  () =>
    import("@/components/crm/site-preview-shell").then((m) => ({
      default: m.SitePreviewShell,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[40vh] items-center justify-center text-ocean-600">
        A carregar pré-visualização…
      </div>
    ),
  },
);

export function CrmSitePreviewGate({ posts }: { posts: PublishedPost[] }) {
  return <SitePreviewShell posts={posts} />;
}
