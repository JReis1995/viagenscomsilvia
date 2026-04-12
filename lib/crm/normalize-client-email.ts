/**
 * Gmail / Googlemail ignoram tudo após + no local-part. Se a lead responde com
 * um alias (+newsletter) mas na BD está sem +, ainda assim fazemos match.
 */
export function stripGmailPlusAddressing(email: string): string {
  const e = email.trim().toLowerCase();
  const m = e.match(/^([^+@]+)(\+[^@]*)?(@gmail\.com|@googlemail\.com)$/i);
  if (m) return `${m[1]}${m[3].toLowerCase()}`;
  return e;
}
