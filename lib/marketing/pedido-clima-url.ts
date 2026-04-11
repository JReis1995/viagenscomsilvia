import {
  isQuizClimaKey,
  type QuizClimaKey,
} from "@/lib/marketing/quiz-clima";

export function parsePedidoClimaParam(
  raw: string | null | undefined,
): QuizClimaKey | null {
  if (!raw || !isQuizClimaKey(raw)) return null;
  return raw;
}

/** Imagens por omissão (Unsplash) quando o CMS não define `heroImageUrl` por clima. */
export const DEFAULT_HERO_IMAGE_BY_CLIMA: Record<QuizClimaKey, string> = {
  praia:
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1920&q=85",
  neve:
    "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1920&q=85",
  cidade:
    "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=1920&q=85",
  misto:
    "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1920&q=85",
};

export function replacePedidoClimaInUrl(
  router: { replace: (href: string, opts?: { scroll?: boolean }) => void },
  pathname: string,
  currentSearch: string,
  clima: QuizClimaKey | null,
): void {
  const params = new URLSearchParams(currentSearch);
  if (clima) params.set("pedido_clima", clima);
  else params.delete("pedido_clima");
  const q = params.toString();
  const href = q ? `${pathname}?${q}` : pathname;
  router.replace(href, { scroll: false });
}
