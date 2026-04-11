/**
 * Ligação wa.me para contactar a lead. Só usar com consentimento explícito
 * (número fornecido no pedido). Mensagem genérica com primeiro nome.
 */
export function whatsappHrefForLead(
  telemovel: string | null | undefined,
  nome: string,
): string | null {
  const digits = telemovel?.replace(/\D/g, "") ?? "";
  if (digits.length < 9) return null;

  let n = digits;
  if (/^9\d{8}$/.test(n)) {
    n = `351${n}`;
  }

  const first = nome.trim().split(/\s+/)[0] ?? "";
  const msg = first
    ? `Olá ${first}, sou a Sílvia (Viagens com Sílvia). `
    : "Olá, sou a Sílvia (Viagens com Sílvia). ";

  return `https://wa.me/${n}?text=${encodeURIComponent(msg)}`;
}
