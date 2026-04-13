/**
 * Imagens JPEG (Unsplash) para capa/rodapé do PDF e hero do email.
 * Presets permitem alinhar a capa ao tipo de viagem (sem assumir praia por defeito).
 *
 * Opcional: para o preset `neutral`, sobrescrever com NEXT_PUBLIC_PROPOSAL_PDF_* no .env
 */
import type { CapaPreset, DetalhesProposta } from "@/lib/crm/detalhes-proposta";

const q = "w=1400&q=88&fm=jpg&fit=crop";
const qa = "w=800&q=88&fm=jpg&fit=crop";

/** Capa genérica (estrada / viagem) — já não é praia por defeito. */
const STOCK_NEUTRAL_BANNER = `https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?${q}`;
const STOCK_NEUTRAL_ACCENT = `https://images.unsplash.com/photo-1488646953014-85cb44e25828?${qa}`;

const STOCK_PRAIA_BANNER = `https://images.unsplash.com/photo-1507525428034-b723cf961d3e?${q}`;
const STOCK_PRAIA_ACCENT = `https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?${qa}`;

const STOCK_CIDADE_BANNER = `https://images.unsplash.com/photo-1514565131-fce0801e5785?${q}`;
const STOCK_CIDADE_ACCENT = `https://images.unsplash.com/photo-1449824913935-59a10b8d2000?${qa}`;

const STOCK_MONTANHA_BANNER = `https://images.unsplash.com/photo-1506905925346-21bda4d32df4?${q}`;
const STOCK_MONTANHA_ACCENT = `https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?${qa}`;

const STOCK_NATUREZA_BANNER = `https://images.unsplash.com/photo-1441974231531-622b421a29ef?${q}`;
const STOCK_NATUREZA_ACCENT = `https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?${qa}`;

const STOCK_CULTURA_BANNER = `https://images.unsplash.com/photo-1555881400-74d7acaacd8b?${q}`;
const STOCK_CULTURA_ACCENT = `https://images.unsplash.com/photo-1566073771259-6a8506099945?${qa}`;

const STOCK_FAMILIA_BANNER = `https://images.unsplash.com/photo-1529154166925-119dcb7ec76a?${q}`;
const STOCK_FAMILIA_ACCENT = `https://images.unsplash.com/photo-1602002418082-a4443e081dd1?${qa}`;

const PRESET_ASSETS: Record<
  CapaPreset,
  { banner: string; accent: string }
> = {
  neutral: {
    banner: STOCK_NEUTRAL_BANNER,
    accent: STOCK_NEUTRAL_ACCENT,
  },
  praia: {
    banner: STOCK_PRAIA_BANNER,
    accent: STOCK_PRAIA_ACCENT,
  },
  cidade: {
    banner: STOCK_CIDADE_BANNER,
    accent: STOCK_CIDADE_ACCENT,
  },
  montanha: {
    banner: STOCK_MONTANHA_BANNER,
    accent: STOCK_MONTANHA_ACCENT,
  },
  natureza: {
    banner: STOCK_NATUREZA_BANNER,
    accent: STOCK_NATUREZA_ACCENT,
  },
  cultura: {
    banner: STOCK_CULTURA_BANNER,
    accent: STOCK_CULTURA_ACCENT,
  },
  familia: {
    banner: STOCK_FAMILIA_BANNER,
    accent: STOCK_FAMILIA_ACCENT,
  },
};

function effectivePreset(p: DetalhesProposta): CapaPreset {
  return p.capa_preset ?? "neutral";
}

function safeHttpsUrl(raw: string | undefined): string | undefined {
  const t = raw?.trim();
  if (!t || t.length < 12 || !/^https:\/\//i.test(t)) return undefined;
  return t;
}

/**
 * URLs finais para capa (email + PDF) e detalhe do rodapé (PDF).
 * Respeita URLs opcionais na proposta e variáveis de ambiente só no preset neutral.
 */
export function resolveProposalImageUrls(p: DetalhesProposta): {
  bannerUrl: string;
  accentUrl: string;
} {
  const preset = effectivePreset(p);
  const stock = PRESET_ASSETS[preset];

  const envBanner = process.env.NEXT_PUBLIC_PROPOSAL_PDF_BANNER_URL?.trim();
  const envAccent = process.env.NEXT_PUBLIC_PROPOSAL_PDF_ACCENT_URL?.trim();

  const customBanner = safeHttpsUrl(p.capa_banner_url);
  const customAccent = safeHttpsUrl(p.capa_accent_url);

  const bannerUrl =
    customBanner ||
    (preset === "neutral" && envBanner ? envBanner : stock.banner);

  const accentUrl =
    customAccent ||
    (preset === "neutral" && envAccent ? envAccent : stock.accent);

  return { bannerUrl, accentUrl };
}

export async function fetchProposalJpeg(url: string): Promise<Uint8Array | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(12_000) });
    if (!res.ok) return null;
    return new Uint8Array(await res.arrayBuffer());
  } catch {
    return null;
  }
}
