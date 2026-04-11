/**
 * Ligações de composição na web — funcionam no Windows mesmo quando mailto://
 * está mal configurado (ex.: Chrome sem handler útil).
 */
export function gmailComposeUrl(to: string, subject: string, body: string): string {
  const t = to.trim();
  const params = new URLSearchParams();
  params.set("view", "cm");
  params.set("fs", "1");
  if (t) params.set("to", t);
  if (subject.trim()) params.set("su", subject);
  if (body.length > 0) params.set("body", body);
  return `https://mail.google.com/mail/?${params.toString()}`;
}

/** Outlook.com / conta Microsoft pessoal */
export function outlookLiveComposeUrl(
  to: string,
  subject: string,
  body: string,
): string {
  const q = new URLSearchParams();
  if (to.trim()) q.set("to", to.trim());
  if (subject.trim()) q.set("subject", subject);
  if (body.length > 0) q.set("body", body);
  return `https://outlook.live.com/mail/0/deeplink/compose?${q.toString()}`;
}
