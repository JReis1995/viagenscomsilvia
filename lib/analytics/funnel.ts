"use client";

type Props = Record<string, string | number | boolean | undefined>;

/**
 * Eventos de funil: Plausible (custom events) e/ou gtag (GA4), se estiverem carregados.
 * Configuração: `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` + script em `AnalyticsScripts`,
 * e/ou `NEXT_PUBLIC_GA_MEASUREMENT_ID`.
 */
function compactProps(
  props?: Props,
): Record<string, string | number | boolean> | undefined {
  if (!props) return undefined;
  const out: Record<string, string | number | boolean> = {};
  for (const [k, v] of Object.entries(props)) {
    if (v === undefined) continue;
    out[k] = v;
  }
  return Object.keys(out).length ? out : undefined;
}

export function trackFunnelEvent(name: string, props?: Props): void {
  if (typeof window === "undefined") return;

  const w = window as unknown as {
    plausible?: (
      event: string,
      opts?: { props?: Record<string, string | number | boolean> },
    ) => void;
    gtag?: (...args: unknown[]) => void;
  };

  const clean = compactProps(props);

  try {
    if (typeof w.plausible === "function") {
      w.plausible(name, clean ? { props: clean } : undefined);
    }
  } catch {
    /* ignore */
  }

  try {
    if (typeof w.gtag === "function") {
      w.gtag("event", name, clean ?? {});
    }
  } catch {
    /* ignore */
  }
}
