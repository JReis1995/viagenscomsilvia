"use client";

import { useState } from "react";

import { submitLeadClientDecision } from "@/app/(client)/conta/(authed)/actions";

type Props = {
  leadId: string;
  hasProposta: boolean;
};

export function LeadProposalActions({ leadId, hasProposta }: Props) {
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState<"approved" | "changes" | null>(
    null,
  );
  const [message, setMessage] = useState<string | null>(null);

  if (!hasProposta) return null;

  async function send(decision: "approved" | "changes_requested") {
    setMessage(null);
    setLoading(decision === "approved" ? "approved" : "changes");
    const res = await submitLeadClientDecision({
      leadId,
      decision,
      note: decision === "changes_requested" ? note : undefined,
    });
    setLoading(null);
    if (!res.ok) {
      setMessage(res.error);
      return;
    }
    setMessage(
      decision === "approved"
        ? "Obrigado — a tua aprovação foi registada. A Sílvia vai avançar contigo."
        : "O teu pedido de alterações foi enviado.",
    );
    setNote("");
  }

  return (
    <div className="rounded-2xl border border-ocean-200 bg-ocean-50/40 p-5">
      <p className="text-xs font-semibold uppercase tracking-wider text-ocean-500">
        Orçamento
      </p>
      <p className="mt-2 text-sm text-ocean-800">
        Podes aprovar a proposta ou pedir ajustes — fica registado no painel da
        consultora.
      </p>
      {message ? (
        <p
          className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50/80 px-3 py-2 text-sm text-emerald-900"
          role="status"
        >
          {message}
        </p>
      ) : null}
      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          disabled={loading !== null}
          onClick={() => void send("approved")}
          className="rounded-full bg-ocean-900 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-ocean-800 disabled:opacity-50"
        >
          {loading === "approved" ? "A enviar…" : "Aprovar orçamento"}
        </button>
        <button
          type="button"
          disabled={loading !== null}
          onClick={() => void send("changes_requested")}
          className="rounded-full border border-ocean-300 bg-white px-5 py-2.5 text-sm font-semibold text-ocean-800 hover:bg-ocean-50 disabled:opacity-50"
        >
          {loading === "changes" ? "A enviar…" : "Pedir alterações"}
        </button>
      </div>
      <label className="mt-4 block text-sm text-ocean-700">
        <span className="text-xs font-medium text-ocean-600">
          Nota (obrigatória se pedires alterações)
        </span>
        <textarea
          className="mt-1 min-h-[72px] w-full rounded-xl border border-ocean-200 bg-white px-3 py-2 text-sm"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Ex.: gostava de estender uma noite, ou voos com menos escalas…"
          rows={3}
        />
      </label>
    </div>
  );
}
