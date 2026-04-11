"use client";

import { CircleMarker, MapContainer, Popup, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import Link from "next/link";

import { buildPedidoOrcamentoHrefFromPost } from "@/lib/marketing/pedido-orcamento";
import {
  getYoutubeThumbnailUrl,
  getYoutubeVideoId,
  isLikelyVideoUrl,
} from "@/lib/marketing/media";
import type { MapPinPost } from "@/types/post";

const PT_CENTER: [number, number] = [39.5, -8.0];

type Props = {
  pins: MapPinPost[];
};

function thumb(post: MapPinPost): string {
  if (post.tipo === "video") {
    const id = getYoutubeVideoId(post.media_url);
    if (id) return getYoutubeThumbnailUrl(id);
  }
  return post.media_url;
}

export function ExperiencesMap({ pins }: Props) {
  const center: [number, number] =
    pins.length > 0
      ? [
          pins.reduce((s, p) => s + p.latitude, 0) / pins.length,
          pins.reduce((s, p) => s + p.longitude, 0) / pins.length,
        ]
      : PT_CENTER;

  return (
    <MapContainer
      center={center}
      zoom={pins.length ? 4 : 6}
      className="h-[min(420px,70vh)] w-full rounded-2xl border border-ocean-100 shadow-md"
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {pins.map((post) => {
        const href =
          post.link_cta?.trim() || buildPedidoOrcamentoHrefFromPost(post);
        const src = thumb(post);
        const video = post.tipo === "video" || isLikelyVideoUrl(post.media_url);
        return (
          <CircleMarker
            key={post.id}
            center={[post.latitude, post.longitude]}
            radius={10}
            pathOptions={{
              color: "#0f3d39",
              fillColor: "#d9785c",
              fillOpacity: 0.85,
            }}
          >
            <Popup className="min-w-[200px]">
              <div className="text-ocean-900">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt=""
                  className="mb-2 h-24 w-full rounded-lg object-cover"
                />
                <p className="text-sm font-semibold">{post.titulo}</p>
                {post.descricao ? (
                  <p className="mt-1 line-clamp-3 text-xs text-ocean-600">
                    {post.descricao}
                  </p>
                ) : null}
                <Link
                  href={href}
                  className="mt-2 inline-block text-xs font-semibold text-ocean-800 underline"
                >
                  {video ? "Ver / pedir orçamento" : "Abrir"}
                </Link>
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
