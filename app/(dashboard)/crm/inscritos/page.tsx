import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { CrmSubscribersPanel } from "@/components/crm/crm-subscribers-panel";
import { isConsultoraEmailAsync } from "@/lib/auth/consultora";
import {
  fetchCrmSubscribers,
  fetchPostsForCampaignSelect,
} from "@/lib/crm/fetch-crm-subscribers";
import { createClient } from "@/lib/supabase/server";
import { tryCreateServiceRoleClient } from "@/lib/supabase/service-role";

export const metadata: Metadata = {
  title: "Inscritos",
  description: "Utilizadores da área de cliente e campanhas promo.",
};

export const dynamic = "force-dynamic";

export default async function CrmInscritosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email || !(await isConsultoraEmailAsync(user.email, supabase))) {
    redirect("/login?next=/crm/inscritos");
  }

  const sr = tryCreateServiceRoleClient();
  if (!sr.ok) {
    return (
      <div className="rounded-2xl border border-terracotta/30 bg-white p-8 shadow-lg">
        <h1 className="text-2xl font-semibold text-ocean-900">Inscritos</h1>
        <p className="mt-4 text-ocean-700">
          Confirma{" "}
          <code className="rounded bg-ocean-50 px-1 text-sm">
            SUPABASE_SERVICE_ROLE_KEY
          </code>{" "}
          no servidor.
        </p>
        <p className="mt-2 font-mono text-xs text-ocean-500">{sr.message}</p>
      </div>
    );
  }

  const [subRes, posts] = await Promise.all([
    fetchCrmSubscribers(sr.client),
    fetchPostsForCampaignSelect(sr.client),
  ]);

  if (subRes.error) {
    return (
      <div className="rounded-2xl border border-terracotta/30 bg-white p-8 shadow-lg">
        <h1 className="text-2xl font-semibold text-ocean-900">Inscritos</h1>
        <p className="mt-4 text-ocean-700">Não foi possível listar utilizadores.</p>
        <p className="mt-2 font-mono text-xs text-ocean-500">{subRes.error}</p>
      </div>
    );
  }

  const defaultFormBase = `${(
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "").trim() ||
    "http://localhost:3000"
  )}/`;

  const canSendCampaigns = !!process.env.CAMPAIGN_LINK_SECRET?.trim();

  return (
    <CrmSubscribersPanel
      rows={subRes.rows}
      posts={posts}
      defaultFormBase={defaultFormBase}
      canSendCampaigns={canSendCampaigns}
    />
  );
}
