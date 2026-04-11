import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { LeadProposalActions } from "@/components/conta/lead-proposal-actions";
import { TripCountdownWeather } from "@/components/conta/trip-countdown-weather";
import { parseDetalhesProposta } from "@/lib/crm/detalhes-proposta";
import { leadStatusLabelForClient } from "@/lib/crm/lead-status-client";
import {
  getYoutubeThumbnailUrl,
  getYoutubeVideoId,
  isLikelyVideoUrl,
} from "@/lib/marketing/media";
import { createClient } from "@/lib/supabase/server";
import type { PostTipo } from "@/types/post";

type Props = { params: Promise<{ leadId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { leadId } = await params;
  return {
    title: "Proposta interativa",
    description: `Pedido ${leadId.slice(0, 8)}…`,
  };
}

function isUuid(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    id,
  );
}

export default async function PedidoInterativoPage({ params }: Props) {
  const { leadId } = await params;
  if (!isUuid(leadId)) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) notFound();

  const { data: lead, error } = await supabase
    .from("leads")
    .select(
      "id, nome, status, data_pedido, data_envio_orcamento, detalhes_proposta, destino_sonho",
    )
    .eq("id", leadId)
    .maybeSingle();

  if (error || !lead) notFound();

  const proposta = parseDetalhesProposta(lead.detalhes_proposta);

  const { data: decisions } = await supabase
    .from("lead_client_decisions")
    .select("decision, note, created_at")
    .eq("lead_id", leadId)
    .order("created_at", { ascending: false });

  let relatedPosts: {
    id: string;
    tipo: string;
    titulo: string;
    descricao: string | null;
    media_url: string;
    link_cta: string | null;
  }[] = [];

  if (proposta?.slug_destino?.trim()) {
    const slug = proposta.slug_destino.trim().toLowerCase();
    const { data: posts } = await supabase
      .from("posts")
      .select("id, tipo, titulo, descricao, media_url, link_cta, data_publicacao, status")
      .eq("slug_destino", slug)
      .eq("status", true)
      .lte("data_publicacao", new Date().toISOString())
      .order("data_publicacao", { ascending: false })
      .limit(12);

    relatedPosts = (posts ?? []).filter((p) =>
      ["promocao", "video", "inspiracao"].includes(p.tipo),
    );
  }

  return (
    <div className="space-y-10">
      <div>
        <Link
          href="/conta"
          className="text-sm font-medium text-ocean-600 underline-offset-2 hover:text-ocean-900 hover:underline"
        >
          ← Voltar aos pedidos
        </Link>
        <h1 className="mt-4 font-serif text-2xl font-normal text-ocean-900 md:text-3xl">
          {proposta?.titulo ?? lead.destino_sonho?.trim() ?? "O teu pedido"}
        </h1>
        <p className="mt-2 text-sm text-ocean-600">
          Estado:{" "}
          <span className="font-medium text-ocean-800">
            {leadStatusLabelForClient(lead.status)}
          </span>
          {lead.data_envio_orcamento ? (
            <>
              {" "}
              · Orçamento enviado em{" "}
              {new Date(lead.data_envio_orcamento).toLocaleDateString("pt-PT")}
            </>
          ) : null}
        </p>
      </div>

      <TripCountdownWeather
        dataInicio={proposta?.data_inicio}
        dataFim={proposta?.data_fim}
        destinoLabel={proposta?.destino ?? lead.destino_sonho ?? ""}
        latitude={proposta?.latitude}
        longitude={proposta?.longitude}
      />

      {proposta ? (
        <div className="space-y-6 rounded-2xl border border-ocean-100 bg-white p-6 shadow-md md:p-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-ocean-500">
              Resumo da proposta
            </p>
            <ul className="mt-3 space-y-2 text-sm text-ocean-800">
              <li>
                <span className="text-ocean-500">Destino: </span>
                {proposta.destino}
              </li>
              <li>
                <span className="text-ocean-500">Datas: </span>
                {proposta.datas}
              </li>
              <li>
                <span className="text-ocean-500">Valor: </span>
                {proposta.valor_total}
              </li>
            </ul>
          </div>
          {proposta.inclui?.length ? (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-ocean-500">
                Inclui
              </p>
              <ul className="mt-2 list-inside list-disc text-sm text-ocean-800">
                {proposta.inclui.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {proposta.links_uteis?.length ? (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-ocean-500">
                Links úteis
              </p>
              <ul className="mt-2 space-y-2 text-sm">
                {proposta.links_uteis.map((l) => (
                  <li key={l.url}>
                    <a
                      href={l.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-ocean-800 underline-offset-2 hover:underline"
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {proposta.notas?.trim() ? (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-ocean-500">
                Notas da consultora
              </p>
              <p className="mt-2 whitespace-pre-wrap text-sm text-ocean-800">
                {proposta.notas.trim()}
              </p>
            </div>
          ) : null}
        </div>
      ) : (
        <p className="rounded-2xl border border-ocean-100 bg-ocean-50/50 px-4 py-6 text-sm text-ocean-700">
          Ainda não há uma proposta guardada para este pedido. Quando a Sílvia
          enviar o orçamento, os detalhes aparecem aqui.
        </p>
      )}

      {proposta?.galeria_urls?.length ? (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-ocean-500">
            Galeria
          </p>
          <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {proposta.galeria_urls.map((url) => (
              <li
                key={url}
                className="relative aspect-square overflow-hidden rounded-xl bg-ocean-100"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt=""
                  className="h-full w-full object-cover"
                />
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {relatedPosts.length > 0 ? (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-ocean-500">
            Da consultora sobre este destino
          </p>
          <ul className="mt-4 grid gap-4 sm:grid-cols-2">
            {relatedPosts.map((post) => (
              <li
                key={post.id}
                className="overflow-hidden rounded-2xl border border-ocean-100 bg-white shadow-sm"
              >
                <RelatedPostCard post={post} />
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <LeadProposalActions leadId={lead.id} hasProposta={!!proposta} />

      {decisions && decisions.length > 0 ? (
        <div className="rounded-2xl border border-ocean-100 bg-sand/40 p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-ocean-500">
            O teu histórico de respostas
          </p>
          <ul className="mt-3 space-y-3 text-sm">
            {decisions.map((d) => (
              <li key={d.created_at} className="text-ocean-800">
                <span className="font-medium">
                  {d.decision === "approved"
                    ? "Aprovaste o orçamento"
                    : "Pediste alterações"}
                </span>
                {d.note?.trim() ? (
                  <p className="mt-1 whitespace-pre-wrap text-ocean-700">
                    {d.note.trim()}
                  </p>
                ) : null}
                <p className="mt-1 text-xs text-ocean-500">
                  {new Date(d.created_at).toLocaleString("pt-PT")}
                </p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function RelatedPostCard({
  post,
}: {
  post: {
    id: string;
    tipo: string;
    titulo: string;
    descricao: string | null;
    media_url: string;
    link_cta: string | null;
  };
}) {
  const tipo = post.tipo as PostTipo;
  let src = post.media_url;
  if (tipo === "video") {
    const id = getYoutubeVideoId(post.media_url);
    if (id) src = getYoutubeThumbnailUrl(id);
  }
  const href = post.link_cta?.trim() || `/#inspiracoes`;
  const video = tipo === "video" || isLikelyVideoUrl(post.media_url);

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group block"
    >
      <div className="relative aspect-[16/10] bg-ocean-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt=""
          className="h-full w-full object-cover transition group-hover:opacity-95"
        />
        {video ? (
          <span className="absolute inset-0 flex items-center justify-center bg-ocean-900/20">
            <span className="rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-ocean-900 shadow">
              Vídeo
            </span>
          </span>
        ) : null}
      </div>
      <div className="p-4">
        <p className="font-medium text-ocean-900">{post.titulo}</p>
        {post.descricao ? (
          <p className="mt-1 line-clamp-2 text-xs text-ocean-600">
            {post.descricao}
          </p>
        ) : null}
      </div>
    </a>
  );
}
