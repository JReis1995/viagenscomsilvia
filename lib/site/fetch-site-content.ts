import { createPublicServerClient } from "@/lib/supabase/public-server";

import {
  DEFAULT_SITE_CONTENT,
  mergeSiteContentFromDb,
  type SiteContent,
} from "@/lib/site/site-content";

export async function fetchSiteContent(): Promise<SiteContent> {
  try {
    const supabase = createPublicServerClient();
    const { data, error } = await supabase
      .from("site_content")
      .select("payload")
      .eq("id", "default")
      .maybeSingle();

    if (error) {
      console.error("[site_content]", error.message);
      return DEFAULT_SITE_CONTENT;
    }

    return mergeSiteContentFromDb(data?.payload);
  } catch (e) {
    console.error("[site_content]", e);
    return DEFAULT_SITE_CONTENT;
  }
}
