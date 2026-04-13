/** Perfil principal no Instagram (marketing + assinatura de emails). */
export const DEFAULT_INSTAGRAM_PROFILE_URL =
  "https://www.instagram.com/viagenscomsilvia_/";

/** Perfil principal no TikTok (marketing + assinatura de emails). */
export const DEFAULT_TIKTOK_PROFILE_URL =
  "https://www.tiktok.com/@silviamilheiro";

/** Email de contacto da consultora nas assinaturas automáticas. */
export const CONSULTORA_PUBLIC_EMAIL = "silviaamaralmilheiro@viagenscomsilvia.com";

export function getSiteOrigin(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.replace(/^https?:\/\//, "")}`;
  }
  return "http://localhost:3000";
}

export function getClientAreaAbsoluteUrl(): string {
  return `${getSiteOrigin()}/conta`;
}

export function getInstagramProfileUrl(): string {
  return (
    process.env.NEXT_PUBLIC_INSTAGRAM_PROFILE_URL?.trim() ||
    DEFAULT_INSTAGRAM_PROFILE_URL
  );
}

export function getTikTokProfileUrl(): string {
  return (
    process.env.NEXT_PUBLIC_TIKTOK_PROFILE_URL?.trim() ||
    DEFAULT_TIKTOK_PROFILE_URL
  );
}

/** Dados para o rodapé dos emails enviados pela consultora no CRM. */
export function getCrmEmailSignatureLinks(): {
  siteOrigin: string;
  clientAreaUrl: string;
  instagramUrl: string;
  tiktokUrl: string;
  consultoraEmail: string;
} {
  return {
    siteOrigin: getSiteOrigin(),
    clientAreaUrl: getClientAreaAbsoluteUrl(),
    instagramUrl: getInstagramProfileUrl(),
    tiktokUrl: getTikTokProfileUrl(),
    consultoraEmail: CONSULTORA_PUBLIC_EMAIL,
  };
}

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
