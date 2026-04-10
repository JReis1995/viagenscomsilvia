"use client";

import { useActionState } from "react";

import {
  addLeadClientNote,
  type AddNoteResult,
} from "@/app/(client)/conta/(authed)/actions";

type Props = {
  leadId: string;
};

const initial: AddNoteResult | null = null;

export function ClientLeadNoteForm({ leadId }: Props) {
  const [state, formAction, pending] = useActionState(addLeadClientNote, initial);

  return (
    <form action={formAction} className="mt-4 space-y-2">
      <input type="hidden" name="leadId" value={leadId} />
      <label className="block">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-ocean-500">
          Mensagem para a consultora
        </span>
        <textarea
          name="message"
          required
          rows={4}
          disabled={pending}
          placeholder="Novas datas, número de pessoas, orçamento atualizado…"
          className="mt-1 w-full rounded-xl border border-ocean-200 bg-white px-3 py-2 text-sm text-ocean-900 outline-none focus:border-ocean-500 focus:ring-2 focus:ring-ocean-500/20 disabled:opacity-60"
        />
      </label>
      {state && !state.ok ? (
        <p className="text-sm text-terracotta" role="alert">
          {state.error}
        </p>
      ) : null}
      {state?.ok ? (
        <p className="text-sm text-ocean-600">Mensagem enviada. Obrigado.</p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-ocean-800 px-5 py-2 text-sm font-semibold text-white transition hover:bg-ocean-900 disabled:opacity-60"
      >
        {pending ? "A enviar…" : "Enviar mensagem"}
      </button>
    </form>
  );
}
