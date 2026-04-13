import { escapeHtml } from "@/lib/email/html";

export function buildClientAccountCreatedEmail(opts: {
  loginUrl: string;
}): { subject: string; html: string; text: string } {
  const subject = "A tua conta Viagens com Sílvia está pronta";
  const { loginUrl } = opts;

  const text = `Olá,

A tua conta na área de cliente foi criada com sucesso.

Entra aqui para aceder aos teus pedidos:
${loginUrl}

Usa o email e a palavra-passe que definiste no registo.

Com os melhores cumprimentos,
Viagens com Sílvia`;

  const html = `
<!DOCTYPE html>
<html>
<body style="font-family: system-ui, sans-serif; line-height: 1.6; color: #0c4a6e; max-width: 560px;">
  <p>Olá,</p>
  <p>A tua conta na <strong>área de cliente</strong> foi criada com sucesso.</p>
  <p style="margin-top: 1.5rem;">
    <a href="${escapeHtml(loginUrl)}" style="display: inline-block; padding: 12px 20px; background: #0c4a6e; color: #fff; text-decoration: none; border-radius: 12px; font-weight: 600;">
      Entrar na conta
    </a>
  </p>
  <p style="margin-top: 1rem; font-size: 0.95rem;">Ou copia este endereço no browser:<br/>
  <span style="word-break: break-all; color: #0369a1;">${escapeHtml(loginUrl)}</span></p>
  <p style="margin-top: 1rem; font-size: 0.95rem;">Usa o email e a palavra-passe que definiste no registo.</p>
  <p style="margin-top: 2rem; color: #0369a1;">Com os melhores cumprimentos,<br/>Viagens com Sílvia</p>
</body>
</html>`.trim();

  return { subject, html, text };
}
