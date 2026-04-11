import type { Metadata } from "next";
import { redirect } from "next/navigation";

import {
  CrmPostsManager,
  type CrmPostRow,
} from "@/components/crm/crm-posts-manager";
import { isConsultoraEmail } from "@/lib/auth/consultora";
import { createClient } from "@/lib/supabase/server";
import { tryCreateServiceRoleClient } from "@/lib/supabase/service-role";

export const metadata: Metadata = {
  title: "Publicações",
  description: "Gerir cartões do feed da página inicial.",
};

export const dynamic = "force-dynamic";

export default async function CrmPublicacoesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email || !isConsultoraEmail(user.email)) {
    redirect("/login?next=/crm/publicacoes");
  }

  const sr = tryCreateServiceRoleClient();

  if (!sr.ok) {
    return (
      <div className="rounded-2xl border border-terracotta/30 bg-white p-8 shadow-lg">
        <h1 className="text-2xl font-semibold text-ocean-900">Publicações</h1>
        <p className="mt-4 text-ocean-700">
          Configura{" "}
          <code className="rounded bg-ocean-50 px-1">SUPABASE_SERVICE_ROLE_KEY</code>{" "}
          no servidor para carregar e guardar publicações.
        </p>
        <p className="mt-2 font-mono text-xs text-ocean-500">{sr.message}</p>
      </div>
    );
  }

  const { data, error } = await sr.client
    .from("posts")
    .select(
      "id, tipo, titulo, descricao, media_url, preco_desde, link_cta, status, data_publicacao, ordem_site, membros_apenas, slug_destino, latitude, longitude",
    )
    .order("ordem_site", { ascending: true })
    .order("data_publicacao", { ascending: false });

  if (error) {
    return (
      <div className="rounded-2xl border border-terracotta/30 bg-white p-8 shadow-lg">
        <h1 className="text-2xl font-semibold text-ocean-900">Publicações</h1>
        <p className="mt-4 text-ocean-700">
          Não foi possível carregar. Se a mensagem fala de{" "}
          <code className="rounded bg-ocean-50 px-1">ordem_site</code>, executa{" "}
          <code className="rounded bg-ocean-50 px-1">
            sql/sprint2_cms_and_consultora_rls.sql
          </code>{" "}
          e{" "}
          <code className="rounded bg-ocean-50 px-1">
            sql/sprint3_plan_features.sql
          </code>{" "}
          no Supabase.
        </p>
        <p className="mt-2 font-mono text-xs text-ocean-500">{error.message}</p>
      </div>
    );
  }

  const rows = (data ?? []) as CrmPostRow[];

  return (
    <div className="space-y-8 pb-24">
      <div>
        <h1 className="font-serif text-2xl font-normal tracking-tight text-ocean-900 md:text-3xl">
          Publicações no site
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-ocean-600 md:text-base">
          <strong className="font-medium text-ocean-800">1.</strong> Clica num
          cartão para editar, ou em «Nova publicação».{" "}
          <strong className="font-medium text-ocean-800">2.</strong> Preenche
          título e URL da imagem — vês o resultado à direita.{" "}
          <strong className="font-medium text-ocean-800">3.</strong> Guarda.
        </p>
      </div>
      <CrmPostsManager initialPosts={rows} />
    </div>
  );
}
