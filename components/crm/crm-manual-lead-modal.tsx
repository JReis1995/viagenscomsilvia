"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

import { createManualLeadAction } from "@/app/(dashboard)/crm/actions";

type Props = {
  onClose: () => void;
};

export function CrmManualLeadModal({ onClose }: Props) {
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telemovel, setTelemovel] = useState("");
  const [destinoSonho, setDestinoSonho] = useState("");
  const [notasInternas, setNotasInternas] = useState("");
  const [autoFollowup, setAutoFollowup] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== "Escape" || pending) return;
      e.preventDefault();
      onClose();
    }
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [onClose, pending]);

  function submit() {
    setError(null);
    startTransition(() => {
      void (async () => {
        const res = await createManualLeadAction({
          nome,
          email,
          telemovel,
          destino_sonho: destinoSonho,
          notas_internas: notasInternas,
          auto_followup: autoFollowup,
        });
        if (res.ok) {
          router.refresh();
          onClose();
        } else {
          setError(res.error);
        }
      })();
    });
  }

  return (
    <div
      className="fixed inset-0 z-[65] flex items-end justify-center bg-ocean-950/50 p-0 pt-[max(0.75rem,env(safe-area-inset-top))] sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="manual-lead-title"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Fechar"
        onClick={() => (!pending ? onClose() : undefined)}
      />
      <div className="relative z-10 flex max-h-[min(92dvh,640px)] w-full max-w-md flex-col overflow-hidden rounded-t-2xl border border-ocean-100 bg-white shadow-2xl sm:rounded-2xl">
        <div className="shrink-0 border-b border-ocean-100 px-4 py-3 sm:px-5">
          <h2
            id="manual-lead-title"
            className="font-serif text-lg text-ocean-900"
          >
            Nova lead manual
          </h2>
          <p className="mt-1 text-xs text-ocean-600">
            Para pedidos que não passaram pelo site (ex.: amigo por telefone).
            Não é enviado email automático de boas-vindas.
          </p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3 sm:px-5">
          <div className="space-y-3">
            <label className="block text-sm">
              <span className="font-medium text-ocean-800">Nome</span>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                disabled={pending}
                autoComplete="name"
                className="mt-1 w-full rounded-xl border border-ocean-200 px-3 py-2 text-sm text-ocean-900 shadow-sm focus:border-ocean-400 focus:outline-none focus:ring-2 focus:ring-ocean-200 disabled:opacity-60"
                placeholder="Nome da pessoa"
              />
            </label>
            <label className="block text-sm">
              <span className="font-medium text-ocean-800">Email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={pending}
                autoComplete="email"
                className="mt-1 w-full rounded-xl border border-ocean-200 px-3 py-2 text-sm text-ocean-900 shadow-sm focus:border-ocean-400 focus:outline-none focus:ring-2 focus:ring-ocean-200 disabled:opacity-60"
                placeholder="email@exemplo.com"
              />
            </label>
            <label className="block text-sm">
              <span className="font-medium text-ocean-800">
                Telemóvel{" "}
                <span className="font-normal text-ocean-500">(opcional)</span>
              </span>
              <input
                type="tel"
                value={telemovel}
                onChange={(e) => setTelemovel(e.target.value)}
                disabled={pending}
                autoComplete="tel"
                className="mt-1 w-full rounded-xl border border-ocean-200 px-3 py-2 text-sm text-ocean-900 shadow-sm focus:border-ocean-400 focus:outline-none focus:ring-2 focus:ring-ocean-200 disabled:opacity-60"
                placeholder="+351 …"
              />
            </label>
            <label className="block text-sm">
              <span className="font-medium text-ocean-800">
                Destino / pedido{" "}
                <span className="font-normal text-ocean-500">(opcional)</span>
              </span>
              <textarea
                value={destinoSonho}
                onChange={(e) => setDestinoSonho(e.target.value)}
                disabled={pending}
                rows={2}
                className="mt-1 w-full resize-y rounded-xl border border-ocean-200 px-3 py-2 text-sm text-ocean-900 shadow-sm focus:border-ocean-400 focus:outline-none focus:ring-2 focus:ring-ocean-200 disabled:opacity-60"
                placeholder="Ex.: Lua de mel nas Maldivas em maio"
              />
            </label>
            <label className="block text-sm">
              <span className="font-medium text-ocean-800">
                Notas internas{" "}
                <span className="font-normal text-ocean-500">(opcional)</span>
              </span>
              <textarea
                value={notasInternas}
                onChange={(e) => setNotasInternas(e.target.value)}
                disabled={pending}
                rows={3}
                maxLength={8000}
                className="mt-1 w-full resize-y rounded-xl border border-ocean-200 px-3 py-2 text-sm text-ocean-900 shadow-sm focus:border-ocean-400 focus:outline-none focus:ring-2 focus:ring-ocean-200 disabled:opacity-60"
                placeholder="Só vês tu no CRM — contexto, próximos passos…"
              />
            </label>
            <label className="flex cursor-pointer items-start gap-2 text-sm text-ocean-800">
              <input
                type="checkbox"
                checked={autoFollowup}
                onChange={(e) => setAutoFollowup(e.target.checked)}
                disabled={pending}
                className="mt-0.5 rounded border-ocean-300 text-ocean-800"
              />
              <span>
                Permitir lembrete automático por email (cron) enquanto estiver
                em «Nova Lead» sem orçamento — igual às leads do site.
              </span>
            </label>
          </div>

          {error ? (
            <p className="mt-3 text-sm text-terracotta" role="alert">
              {error}
            </p>
          ) : null}
        </div>

        <div className="shrink-0 border-t border-ocean-100 px-4 py-3 sm:px-5">
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              disabled={pending}
              onClick={() => onClose()}
              className="rounded-xl border border-ocean-200 py-2.5 text-sm font-medium text-ocean-800 hover:bg-ocean-50 disabled:opacity-50 sm:px-4"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={pending || !nome.trim() || !email.trim()}
              onClick={() => submit()}
              className="rounded-xl bg-ocean-900 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-ocean-800 disabled:opacity-50 sm:px-5"
            >
              {pending ? "A criar…" : "Criar lead"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
