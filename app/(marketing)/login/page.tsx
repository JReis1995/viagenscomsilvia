import type { Metadata } from "next";

import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Entrar",
  description: "Acesso reservado à consultora — painel CRM.",
};

type Props = {
  searchParams: Promise<{ error?: string; next?: string }>;
};

export default async function LoginPage({ searchParams }: Props) {
  const params = await searchParams;
  const authError = params.error === "auth";

  return (
    <div className="mx-auto flex max-w-lg flex-1 flex-col justify-center px-6 py-16">
      <div className="rounded-2xl bg-white p-8 shadow-lg md:p-10">
        <h1 className="text-2xl font-semibold tracking-tight text-ocean-900">
          Área da consultora
        </h1>
        <p className="mt-2 text-sm text-ocean-600">
          Inicia sessão para aceder ao painel de leads e orçamentos.
        </p>
        {authError ? (
          <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">
            Não foi possível concluir o início de sessão. Tenta novamente.
          </p>
        ) : null}
        <div className="mt-8">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
