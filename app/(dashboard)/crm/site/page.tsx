import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { CrmSiteEditor } from "@/components/crm/crm-site-editor";
import { CrmSiteVisualEditor } from "@/components/crm/crm-site-visual-editor";
import { isConsultoraEmailAsync } from "@/lib/auth/consultora";
import { fetchPublishedPosts } from "@/lib/posts/fetch-published";
import { mergeSiteContentFromDb } from "@/lib/site/site-content";
import { createClient } from "@/lib/supabase/server";
import { tryCreateServiceRoleClient } from "@/lib/supabase/service-role";

export const metadata: Metadata = {
  title: "Conteúdo do site",
  description: "Editar textos e imagens da página inicial.",
};

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ lista?: string }>;
};

export default async function CrmSiteContentPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const listMode = sp.lista === "1";
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email || !(await isConsultoraEmailAsync(user.email, supabase))) {
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

  const posts = await fetchPublishedPosts();

  return (
    <div className={`space-y-6 ${listMode ? "pb-28" : "pb-36"}`}>
      <div>
        <h1 className="font-serif text-2xl font-normal tracking-tight text-ocean-900 md:text-3xl">
          {listMode
            ? "Editar o site (vista em lista)"
            : "Editar o site (clica no rascunho)"}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ocean-600 md:text-base">
          {listMode ? (
            <>
              Modo em separadores (inclui «Histórias rápidas» e «Como
              trabalhamos»), útil para rever tudo em sequência. À direita (ou em
              baixo no telemóvel) tens a pré-visualização ao vivo; cada campo
              inclui texto de ajuda quando está disponível. A vista recomendada
              para edição fina é{" "}
              <Link href="/crm/site" className="font-medium underline">
                clicar no rascunho
              </Link>
              . As publicações do feed editam-se em{" "}
              <Link href="/crm/publicacoes" className="font-medium underline">
                Publicações
              </Link>
              .
            </>
          ) : (
            <>
              Clica nas frases do rascunho para editar (abre uma caixa por
              cima), incluindo histórias rápidas, como trabalhamos e o bloco da
              conta — faz scroll na pré-visualização. O mesmo conteúdo está na{" "}
              <Link
                href="/crm/site?lista=1"
                className="font-medium text-ocean-700 underline"
              >
                vista em lista
              </Link>
              . A pré-visualização fica sempre visível em baixo; até publicares,
              é só rascunho. Quando estiveres pronta,{" "}
              <strong className="font-medium text-ocean-800">
                Publicar no site
              </strong>{" "}
              envia tudo para o visitante. O feed de cartões vem de{" "}
              <Link href="/crm/publicacoes" className="font-medium underline">
                Publicações
              </Link>
              .
            </>
          )}
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
      {listMode ? (
        <CrmSiteEditor initial={initial} />
      ) : (
        <CrmSiteVisualEditor initial={initial} posts={posts} />
      )}
    </div>
  );
}
