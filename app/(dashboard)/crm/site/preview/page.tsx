import type { Metadata } from "next";

import { CrmSitePreviewGate } from "@/components/crm/crm-site-preview-gate";
import { fetchPublishedPosts } from "@/lib/posts/fetch-published";

export const metadata: Metadata = {
  title: "Pré-visualização do site",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function CrmSitePreviewPage() {
  const posts = await fetchPublishedPosts();

  return (
    <div className="pb-8">
      <CrmSitePreviewGate posts={posts} />
    </div>
  );
}
