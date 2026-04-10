"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { ClientRegisterForm } from "@/components/auth/client-register-form";
import { LoginForm } from "@/components/auth/login-form";

export function LoginRegisterShell() {
  const searchParams = useSearchParams();
  const isRegistar = searchParams.get("registar") === "1";
  const next = searchParams.get("next");
  const nextQs = next
    ? `?${new URLSearchParams({ next }).toString()}`
    : "";

  if (isRegistar) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ocean-900">
            Criar conta
          </h1>
          <p className="mt-2 text-sm text-ocean-600">
            Usa o <strong className="font-medium text-ocean-800">mesmo email</strong>{" "}
            que no pedido de proposta da página inicial para veres o teu pedido
            aqui.
          </p>
        </div>
        <ClientRegisterForm />
        <p className="text-center text-sm text-ocean-600">
          Já tens conta?{" "}
          <Link
            href={nextQs ? `/login${nextQs}` : "/login"}
            className="font-semibold text-ocean-800 underline-offset-2 hover:underline"
          >
            Entrar
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ocean-900">
          Iniciar sessão
        </h1>
        <p className="mt-2 text-sm text-ocean-600">
          {
            "Se já és cliente coloca o teu email e palavra-passe para aceder ao teu painel, caso contrário clica em \"Criar conta de cliente\"."
          }
        </p>
      </div>
      <LoginForm />
      <p className="text-center text-sm text-ocean-600">
        Primeira vez?{" "}
        <Link
          href={
            next
              ? `/login?registar=1&next=${encodeURIComponent(next)}`
              : "/login?registar=1&next=%2Fconta"
          }
          className="font-semibold text-ocean-800 underline-offset-2 hover:underline"
        >
          Criar conta de cliente
        </Link>
      </p>
    </div>
  );
}
