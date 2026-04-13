"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { completeFirstLoginConsent } from "@/app/(client)/conta/(authed)/actions";
import { CONSENT_POLICY_VERSION } from "@/lib/auth/consent";

type Props = {
  email: string;
  /** Pré-selecção a partir de `promo_alert_prefs` (só UI; o envio legal exige confirmar de novo no formulário). */
  initialMarketingOptIn: boolean;
  privacyPolicyUrl: string | null;
};

export function FirstLoginConsentGate({
  email,
  initialMarketingOptIn,
  privacyPolicyUrl,
}: Props) {
  const router = useRouter();
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [marketingOptIn, setMarketingOptIn] = useState(initialMarketingOptIn);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!acceptPrivacy) {
      setError("Marca a caixa para aceitares o tratamento de dados antes de continuar.");
      return;
    }
    setPending(true);
    const res = await completeFirstLoginConsent({ marketingOptIn });
    setPending(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    router.refresh();
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center overflow-y-auto bg-ocean-950/50 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="consent-title"
    >
      <div className="mb-0 w-full max-w-lg rounded-2xl border border-ocean-100 bg-white p-6 shadow-2xl sm:mb-0 md:p-8">
        <h2
          id="consent-title"
          className="text-xl font-semibold tracking-tight text-ocean-900 md:text-2xl"
        >
          Antes de continuar
        </h2>
        <p className="mt-3 text-sm text-ocean-600">
          Na primeira visita à área de cliente, confirma como tratamos os teus dados e se
          queres receber emails promocionais. Isto alinha com o mesmo opt-in usado nas
          campanhas e alertas do site (RGPD).
        </p>

        <dl className="mt-6 space-y-3 rounded-xl border border-ocean-100 bg-sand/50 px-4 py-3 text-sm">
          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-wider text-ocean-500">
              Email da conta
            </dt>
            <dd className="mt-0.5 font-medium text-ocean-900">{email}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-wider text-ocean-500">
              Versão da informação legal
            </dt>
            <dd className="mt-0.5 text-ocean-800">{CONSENT_POLICY_VERSION}</dd>
          </div>
        </dl>

        <form onSubmit={(e) => void handleSubmit(e)} className="mt-6 space-y-5">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 rounded border-ocean-300"
              checked={acceptPrivacy}
              disabled={pending}
              onChange={(e) => setAcceptPrivacy(e.target.checked)}
            />
            <span className="text-sm text-ocean-800">
              Li e aceito o tratamento dos meus dados pessoais para gestão da conta e do
              pedido de viagem, nos termos aplicáveis.{" "}
              {privacyPolicyUrl ? (
                <Link
                  href={privacyPolicyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-ocean-900 underline-offset-2 hover:underline"
                >
                  Política de privacidade
                </Link>
              ) : (
                <span className="text-ocean-600">
                  (Podes pedir detalhes à consultora ou consultar o site público.)
                </span>
              )}
            </span>
          </label>

          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 rounded border-ocean-300"
              checked={marketingOptIn}
              disabled={pending}
              onChange={(e) => setMarketingOptIn(e.target.checked)}
            />
            <span className="text-sm text-ocean-800">
              Quero receber emails sobre novas promoções e publicações no site (opcional —
              consentimento explícito; podes mudar depois em «Os teus pedidos»).
            </span>
          </label>

          {error ? (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={pending || !acceptPrivacy}
            className="w-full rounded-2xl bg-ocean-900 py-3 text-sm font-semibold text-white shadow transition hover:bg-ocean-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pending ? "A guardar…" : "Confirmar e entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
