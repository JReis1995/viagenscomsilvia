/**
 * Fontes standard do pdf-lib (Helvetica / WinAnsi) não codificam muitos caracteres Unicode.
 * Teclados móveis (iOS/Android) usam aspas curvas, travessões “longos”, etc. — geram excepção
 * em `drawText` e o CRM devolve “Não foi possível gerar o PDF.”
 */
export function pdfSafeText(raw: string): string {
  if (!raw) return raw;
  let s = raw.normalize("NFC");
  s = s
    .replace(/\u20AC/g, " EUR")
    .replace(/[\u2018\u2019\u201A\u201B\u2032\u2035\u02BC]/g, "'")
    .replace(/[\u201C\u201D\u201E\u201F\u2033\u00AB\u00BB]/g, '"')
    .replace(/[\u2013\u2014\u2212\u2010\u2011]/g, "-")
    .replace(/\u2026/g, "...")
    .replace(/\u00A0/g, " ")
    .replace(/[\u2000-\u200A\u202F\u205F]/g, " ")
    .replace(/[\uFEFF\u200B-\u200D\u2060]/g, "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n");

  let out = "";
  for (const char of s) {
    const cp = char.codePointAt(0)!;
    if (cp === 9 || cp === 10) {
      out += " ";
      continue;
    }
    if (cp < 32) continue;
    if (cp >= 32 && cp <= 255) {
      out += char;
      continue;
    }
    const stripped = char.normalize("NFD").replace(/\p{M}/gu, "");
    if (!stripped) {
      out += "?";
      continue;
    }
    let ok = true;
    for (const c of Array.from(stripped)) {
      const p = c.codePointAt(0)!;
      if (p < 32 || p > 255) {
        ok = false;
        break;
      }
    }
    out += ok ? stripped : "?";
  }
  return out;
}
