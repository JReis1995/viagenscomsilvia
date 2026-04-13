import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { CrmDashboard } from "@/components/crm/crm-dashboard";
import { isConsultoraEmailAsync } from "@/lib/auth/consultora";
import {
  aggregateDashboardStats,
  buildDashboardDateFilterFromSearchParams,
  fetchCrmDashboardRows,
  parseDashboardStatusAllowlist,
} from "@/lib/crm/dashboard-stats";
import { createClient } from "@/lib/supabase/server";
import { tryCreateServiceRoleClient } from "@/lib/supabase/service-role";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Indicadores e widgets do CRM.",
};

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{
    janela?: string;
    desde?: string;
    ate?: string;
    estados?: string;
  }>;
};

export default async function CrmDashboardPage({ searchParams }: PageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email || !(await isConsultoraEmailAsync(user.email, supabase))) {
    redirect("/login?next=/crm/dashboard");
  }

  const sp = await searchParams;
  const dateFilter = buildDashboardDateFilterFromSearchParams({
    janela: typeof sp.janela === "string" ? sp.janela : undefined,
    desde: typeof sp.desde === "string" ? sp.desde : undefined,
    ate: typeof sp.ate === "string" ? sp.ate : undefined,
  });
  const statusAllowlist = parseDashboardStatusAllowlist(
    typeof sp.estados === "string" ? sp.estados : undefined,
  );

  const sr = tryCreateServiceRoleClient();
  if (!sr.ok) {
    return (
      <div className="rounded-2xl border border-terracotta/30 bg-white p-8 shadow-lg md:p-10">
        <h1 className="text-2xl font-semibold tracking-tight text-ocean-900">
          Dashboard
        </h1>
        <p className="mt-4 text-ocean-700">
          Não foi possível carregar dados. Confirma{" "}
          <code className="rounded bg-ocean-50 px-1 text-sm">
            SUPABASE_SERVICE_ROLE_KEY
          </code>{" "}
          no servidor.
        </p>
        <p className="mt-2 font-mono text-xs text-ocean-500">{sr.message}</p>
      </div>
    );
  }

  const { rows, error } = await fetchCrmDashboardRows(sr.client, dateFilter);
  if (error) {
    return (
      <div className="rounded-2xl border border-terracotta/30 bg-white p-8 shadow-lg md:p-10">
        <h1 className="text-2xl font-semibold tracking-tight text-ocean-900">
          Dashboard
        </h1>
        <p className="mt-4 text-ocean-700">Erro ao ler leads.</p>
        <p className="mt-2 font-mono text-xs text-ocean-500">{error}</p>
      </div>
    );
  }

  const stats = aggregateDashboardStats(rows, dateFilter, statusAllowlist);

  return <CrmDashboard stats={stats} userEmail={user.email} />;
}
