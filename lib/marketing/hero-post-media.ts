import {
  getYoutubeThumbnailUrl,
  getYoutubeVideoId,
  isDirectVideoFileUrl,
} from "@/lib/marketing/media";
import type { PublishedPost } from "@/types/post";

export type HeroBackdropKind = "image" | "file-video";

/** URL visual para fundo do hero / cartões (imagem ou vídeo ficheiro). */
export function heroPostBackdrop(
  post: PublishedPost,
): { kind: HeroBackdropKind; src: string } | null {
  const raw = post.media_url?.trim() ?? "";
  if (!raw) return null;
  if (post.tipo === "video") {
    const id = getYoutubeVideoId(raw);
    if (id) return { kind: "image", src: getYoutubeThumbnailUrl(id) };
    if (isDirectVideoFileUrl(raw)) return { kind: "file-video", src: raw };
  }
  return { kind: "image", src: raw };
}
