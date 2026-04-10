import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { CrmSiteEditor } from "@/components/crm/crm-site-editor";
import { isConsultoraEmail } from "@/lib/auth/consultora";
import { mergeSiteContentFromDb } from "@/lib/site/site-content";
import { createClient } from "@/lib/supabase/server";
import { tryCreateServiceRoleClient } from "@/lib/supabase/service-role";

export const metadata: Metadata = {
  title: "Conteúdo do site",
  description: "Editar textos e imagens da página inicial.",
};

export const dynamic = "force-dynamic";

export default async function CrmSiteContentPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email || !isConsultoraEmail(user.email)) {
    redirect("/login?next=/crm/site");
  }

  const sr = tryCreateServiceRoleClient();
  let loadError: string | null = null;
  let initial = mergeSiteContentFromDb(undefined);

  if (sr.ok) {
    const { data, error } = await sr.client
      .from("site_content")
      .select("payload")
      .eq("id", "default")
      .maybeSingle();
    if (error) {
      loadError = error.message;
    } else {
      initial = mergeSiteContentFromDb(data?.payload);
    }
  } else {
    loadError = sr.message;
  }

  return (
    <div className="space-y-6 pb-28">
      <div>
        <h1 className="font-serif text-2xl font-normal tracking-tight text-ocean-900 md:text-3xl">
          Editar página inicial
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-ocean-600 md:text-base">
          Usa os separadores abaixo.{" "}
          <strong className="font-medium text-ocean-800">
            Pré-visualizar rascunho
          </strong>{" "}
          mostra o site com as tuas alterações <em>antes</em> de guardar. As
          caixas do feed vêm de{" "}
          <Link href="/crm/publicacoes" className="font-medium underline">
            Publicações
          </Link>
          .
        </p>
        {loadError ? (
          <p className="mt-3 rounded-lg border border-terracotta/30 bg-terracotta/10 px-4 py-2 text-sm text-ocean-900">
            Aviso ao ler a base de dados: {loadError}. Confirma{" "}
            <code className="rounded bg-white/80 px-1">
              SUPABASE_SERVICE_ROLE_KEY
            </code>{" "}
            e, se for o caso, executa{" "}
            <code className="rounded bg-white/80 px-1">
              sql/sprint2_cms_and_consultora_rls.sql
            </code>
            .
          </p>
        ) : null}
      </div>
      <CrmSiteEditor initial={initial} />
    </div>
  );
}
