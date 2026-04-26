/** Query `pedido_data_inicio` / `pedido_data_fim` (YYYY-MM-DD) para pré-preencher o pedido. */

export function parsePedidoDataIso(
  raw: string | null | undefined,
): string | null {
  if (!raw) return null;
  const t = raw.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(t)) return null;
  const d = new Date(`${t}T12:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  return t;
}

export function formatJanelaDatasLabel(
  inicio: string | null,
  fim: string | null,
): string | null {
  if (!inicio && !fim) return null;
  if (inicio && fim) return `Ida: ${inicio} · Regresso: ${fim}`;
  if (inicio) return `Ida: ${inicio}`;
  return `Regresso: ${fim}`;
}

export function replacePedidoDatasInUrl(
  router: { replace: (href: string, opts?: { scroll?: boolean }) => void },
  pathname: string,
  currentSearch: string,
  inicio: string | null,
  fim: string | null,
): void {
  const params = new URLSearchParams(currentSearch);
  if (inicio) params.set("pedido_data_inicio", inicio);
  else params.delete("pedido_data_inicio");
  if (fim) params.set("pedido_data_fim", fim);
  else params.delete("pedido_data_fim");
  const q = params.toString();
  const href = q ? `${pathname}?${q}` : pathname;
  router.replace(href, { scroll: false });
}
