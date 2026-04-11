import {
  DEFAULT_SITE_CONTENT,
  mergeSiteContentFromDb,
  type SiteContent,
} from "@/lib/site/site-content";
import { createPublicServerClient } from "@/lib/supabase/public-server";
import { tryCreateServiceRoleClient } from "@/lib/supabase/service-role";

/**
 * Lê o singleton `site_content` na BD.
 * Preferimos service role no servidor: o CRM grava com a mesma chave e ignora RLS.
 * Com só a chave anónima, um `SELECT` sem política RLS correcta devolve zero linhas
 * *sem* erro — e o merge cai nos defaults, como se o guardar não tivesse efeito.
 */
export async function fetchSiteContent(): Promise<SiteContent> {
  try {
    const sr = tryCreateServiceRoleClient();
    const supabase = sr.ok
      ? sr.client
      : createPublicServerClient();
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
