import { NextResponse } from "next/server";
import { Resend } from "resend";
import { z } from "zod";

import { buildClientAccountCreatedEmail } from "@/lib/email/client-account-created";
import { tryCreateServiceRoleClient } from "@/lib/supabase/service-role";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  email: z.string().trim().email("Email inválido."),
  password: z.string().min(6, "A palavra-passe deve ter pelo menos 6 caracteres."),
});

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    const first =
      Object.values(parsed.error.flatten().fieldErrors).flat()[0] ??
      "Dados inválidos.";
    return NextResponse.json({ error: first }, { status: 400 });
  }

  const { email, password } = parsed.data;
  const sr = tryCreateServiceRoleClient();
  if (!sr.ok) {
    return NextResponse.json(
      { error: "Servidor sem SUPABASE_SERVICE_ROLE_KEY configurada." },
      { status: 503 },
    );
  }

  const { data: created, error: createError } =
    await sr.client.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

  if (createError || !created.user) {
    const msg = createError?.message?.toLowerCase() ?? "";
    if (
      msg.includes("already") ||
      msg.includes("registered") ||
      msg.includes("exists")
    ) {
      return NextResponse.json(
        { error: "Já existe uma conta com este email." },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { error: createError?.message ?? "Não foi possível criar a conta." },
      { status: 400 },
    );
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM?.trim();
  if (!apiKey || !from) {
    await sr.client.auth.admin.deleteUser(created.user.id);
    return NextResponse.json(
      {
        error:
          "Email não configurado no servidor (RESEND_API_KEY / RESEND_FROM).",
      },
      { status: 503 },
    );
  }

  const envSite = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const headerOrigin = request.headers.get("origin")?.trim();
  let base = envSite || headerOrigin || "";
  if (!base) {
    try {
      base = new URL(request.url).origin;
    } catch {
      base = "";
    }
  }
  if (!base) {
    await sr.client.auth.admin.deleteUser(created.user.id);
    return NextResponse.json(
      { error: "Não foi possível determinar o endereço do site para o email." },
      { status: 500 },
    );
  }

  const loginUrl = `${base.replace(/\/$/, "")}/login?next=${encodeURIComponent("/conta")}`;
  const { subject, html, text } = buildClientAccountCreatedEmail({ loginUrl });

  try {
    const resend = new Resend(apiKey);
    const { error: sendError } = await resend.emails.send({
      from,
      to: email,
      subject,
      html,
      text,
    });

    if (sendError) {
      console.error("[register-client] Resend:", sendError.message);
      await sr.client.auth.admin.deleteUser(created.user.id);
      return NextResponse.json(
        { error: "Não foi possível enviar o email de boas-vindas. Tenta de novo." },
        { status: 502 },
      );
    }
  } catch (e) {
    console.error("[register-client] Resend exception:", e);
    await sr.client.auth.admin.deleteUser(created.user.id);
    return NextResponse.json(
      { error: "Não foi possível enviar o email de boas-vindas. Tenta de novo." },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}
