"use client";

import type { CrmPostInput } from "@/app/(dashboard)/crm/actions";
import {
  getYoutubeThumbnailUrl,
  getYoutubeVideoId,
  isDirectVideoFileUrl,
} from "@/lib/marketing/media";

type Props = {
  form: CrmPostInput;
};

export function PostCardPreview({ form }: Props) {
  const raw = form.media_url?.trim() ?? "";
  let src = raw;
  if (form.tipo === "video" && raw) {
    const id = getYoutubeVideoId(raw);
    if (id) src = getYoutubeThumbnailUrl(id);
  }

  const isPromo = form.tipo === "promocao";
  const fileVideo =
    form.tipo === "video" && raw.length > 0 && isDirectVideoFileUrl(raw);

  return (
    <div className="mx-auto max-w-[340px] overflow-hidden rounded-3xl bg-ocean-900 shadow-xl ring-1 ring-ocean-900/10">
      <div className="relative aspect-[4/3] bg-ocean-800">
        {fileVideo ? (
          <video
            src={raw}
            className="absolute inset-0 h-full w-full object-cover"
            muted
            playsInline
            loop
            autoPlay
            preload="metadata"
            aria-hidden
          />
        ) : src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-ocean-700 to-ocean-900 text-center text-sm text-white/60">
            Carrega uma fotografia ou cola um link para ver aqui
          </div>
        )}
        <div
          className="absolute inset-0 bg-gradient-to-t from-ocean-950/95 via-ocean-950/35 to-transparent"
          aria-hidden
        />
        {isPromo ? (
          <span className="absolute left-4 top-4 z-10 rounded-full bg-terracotta px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
            Oferta
          </span>
        ) : null}
      </div>
      <div className="relative z-10 space-y-2 p-5 text-white">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/60">
          {form.tipo === "promocao"
            ? "Promoção"
            : form.tipo === "video"
              ? "Vídeo"
              : "Inspiração"}
        </p>
        <h3 className="font-serif text-xl font-medium leading-snug">
          {form.titulo.trim() || "Título da publicação"}
        </h3>
        {form.descricao?.trim() ? (
          <p className="line-clamp-3 text-sm leading-relaxed text-white/75">
            {form.descricao}
          </p>
        ) : (
          <p className="text-sm italic text-white/40">Sem descrição</p>
        )}
        {isPromo && form.preco_desde?.trim() ? (
          <p className="text-sm font-semibold text-amber-100/95">
            {form.preco_desde}
          </p>
        ) : null}
        <p className="pt-2 text-[10px] uppercase tracking-wider text-white/45">
          {form.status ? "Será visível no site" : "Rascunho (oculto)"} · posição{" "}
          {form.ordem_site}
        </p>
      </div>
    </div>
  );
}
