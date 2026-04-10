/** Defaults: posts públicos da Sílvia no Instagram (editável via env). */
export const DEFAULT_INSTAGRAM_PHOTO_POST =
  "https://www.instagram.com/p/DOegj5PjRjg/";
export const DEFAULT_INSTAGRAM_VIDEO_POST =
  "https://www.instagram.com/p/DQXPeKeDaaI/";

export function getInstagramPhotoPostUrl(): string {
  return (
    process.env.NEXT_PUBLIC_INSTAGRAM_PHOTO_POST_URL?.trim() ||
    DEFAULT_INSTAGRAM_PHOTO_POST
  );
}

export function getInstagramVideoPostUrl(): string {
  return (
    process.env.NEXT_PUBLIC_INSTAGRAM_VIDEO_POST_URL?.trim() ||
    DEFAULT_INSTAGRAM_VIDEO_POST
  );
}

/** Retrato: cola aqui a URL pública (ex.: Supabase Storage) — links instagram.com/p/... não funcionam como imagem. */
export function getConsultoraPortraitUrl(): string | null {
  const u = process.env.NEXT_PUBLIC_CONSULTORA_PORTRAIT_URL?.trim();
  return u || null;
}

/**
 * Miniatura do vídeo em destaque (zona de publicações).
 * Exporta um frame do Reels no telemóvel ou usa imagem no Storage — melhora muito o cartão até haver CRUD no CRM.
 */
export function getFeaturedVideoPosterUrl(): string | null {
  const u = process.env.NEXT_PUBLIC_FEATURED_VIDEO_POSTER_URL?.trim();
  return u || null;
}

/** Imagem de fundo do hero (viagens) — editável; default Unsplash (água tropical). */
export function getHeroTravelImageUrl(): string {
  return (
    process.env.NEXT_PUBLIC_HERO_TRAVEL_IMAGE_URL?.trim() ||
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1920&q=85"
  );
}
