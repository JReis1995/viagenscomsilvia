import type { Metadata } from "next";

import { ExperiencesMapDynamic } from "@/components/marketing/experiences-map-dynamic";
import { fetchMapPosts } from "@/lib/posts/fetch-map-posts";

export const metadata: Metadata = {
  title: "Mapa de experiências",
  description:
    "Explora destinos no mapa — vídeos, dicas e promoções da consultora.",
};

/** Supabase no servidor é dinâmico (evita tentativa de estático no build). */
export const dynamic = "force-dynamic";

export default async function MapaPage() {
  const pins = await fetchMapPosts();

  return (
    <div className="mx-auto max-w-5xl px-6 py-12 md:py-16">
      <h1 className="font-serif text-2xl font-normal text-ocean-900 md:text-3xl">
        Mapa de experiências
      </h1>
      <p className="mt-3 max-w-2xl text-sm text-ocean-600 md:text-base">
        Cada pin é uma publicação da Sílvia com foto ou vídeo. Clica no mapa
        para veres o resumo e abrires o pedido de orçamento ou o link que ela
        definiu.
      </p>
      {pins.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-dashed border-ocean-200 bg-ocean-50/40 px-6 py-10 text-center text-sm text-ocean-700">
          Ainda não há pins no mapa. Na área{" "}
          <strong className="text-ocean-900">Publicações</strong> do CRM,
          adiciona latitude e longitude a cada cartão (e executa{" "}
          <code className="rounded bg-white px-1 text-xs">
            sql/sprint3_plan_features.sql
          </code>{" "}
          no Supabase).
        </p>
      ) : (
        <div className="mt-10">
          <ExperiencesMapDynamic pins={pins} />
        </div>
      )}
    </div>
  );
}
