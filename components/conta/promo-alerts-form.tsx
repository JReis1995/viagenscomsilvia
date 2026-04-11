"use client";

import { useState } from "react";

import { savePromoAlertPrefs } from "@/app/(client)/conta/(authed)/actions";

type Props = {
  initialOptIn: boolean;
};

export function PromoAlertsForm({ initialOptIn }: Props) {
  const [optIn, setOptIn] = useState(initialOptIn);
  const [pending, setPending] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function toggle(next: boolean) {
    setPending(true);
    setMsg(null);
    const res = await savePromoAlertPrefs(next);
    setPending(false);
    if (!res.ok) {
      setMsg(res.error);
      return;
    }
    setOptIn(next);
    setMsg("Preferência guardada.");
  }

  return (
    <div className="rounded-2xl border border-ocean-100 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-ocean-900">
        Alertas de novas promoções no site
      </p>
      <p className="mt-2 text-xs text-ocean-600">
        Se activares, podes receber um email quando a Sílvia publicar uma nova
        promoção. Podes desligar aqui a qualquer momento (RGPD: consentimento
        explícito).
      </p>
      <label className="mt-4 flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          className="mt-1 h-4 w-4 rounded border-ocean-300"
          checked={optIn}
          disabled={pending}
          onChange={(e) => void toggle(e.target.checked)}
        />
        <span className="text-sm text-ocean-800">
          Quero receber emails sobre novas promoções publicadas no site
        </span>
      </label>
      {msg ? (
        <p className="mt-3 text-xs text-ocean-600" role="status">
          {msg}
        </p>
      ) : null}
    </div>
  );
}
