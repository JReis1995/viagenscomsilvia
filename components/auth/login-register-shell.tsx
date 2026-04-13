"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { ClientRegisterForm } from "@/components/auth/client-register-form";
import { LoginForm } from "@/components/auth/login-form";
import { OAuthProviderButtons } from "@/components/auth/oauth-provider-buttons";
import type { SiteContent } from "@/lib/site/site-content";

type Props = {
  registerIncentive?: SiteContent["registerIncentive"];
};

export function LoginRegisterShell({ registerIncentive }: Props) {
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
          {registerIncentive ? (
            <div className="mt-4 rounded-xl border border-ocean-100 bg-ocean-50/60 px-4 py-3 text-sm text-ocean-800">
              <p className="font-medium text-ocean-900">
                {registerIncentive.headline}
              </p>
              <ul className="mt-2 list-inside list-disc space-y-1 text-ocean-700">
                <li>{registerIncentive.bullet1}</li>
                <li>{registerIncentive.bullet2}</li>
                <li>{registerIncentive.bullet3}</li>
              </ul>
            </div>
          ) : null}
        </div>
        <OAuthProviderButtons nextParam={next ?? null} />
        <div className="relative py-1">
          <div className="absolute inset-0 flex items-center" aria-hidden>
            <span className="w-full border-t border-ocean-100" />
          </div>
          <div className="relative flex justify-center text-xs uppercase tracking-wide text-ocean-500">
            <span className="bg-white px-2">ou com email</span>
          </div>
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
      <OAuthProviderButtons nextParam={next ?? null} />
      <div className="relative py-1">
        <div className="absolute inset-0 flex items-center" aria-hidden>
          <span className="w-full border-t border-ocean-100" />
        </div>
        <div className="relative flex justify-center text-xs uppercase tracking-wide text-ocean-500">
          <span className="bg-white px-2">ou com email</span>
        </div>
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
