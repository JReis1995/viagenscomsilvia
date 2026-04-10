import type { Metadata } from "next";
import { Suspense } from "react";

import { LoginRegisterShell } from "@/components/auth/login-register-shell";

export const metadata: Metadata = {
  title: "Entrar",
  description: "Inicia sessão — cliente ou consultora.",
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
        {authError ? (
          <p className="mb-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">
            Não foi possível concluir o início de sessão. Tenta novamente.
          </p>
        ) : null}
        <Suspense
          fallback={
            <p className="text-sm text-ocean-600">A carregar…</p>
          }
        >
          <LoginRegisterShell />
        </Suspense>
      </div>
    </div>
  );
}
