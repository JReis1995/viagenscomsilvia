"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { parseDetalhesProposta } from "@/lib/crm/detalhes-proposta";
import type { LeadBoardRow } from "@/types/lead";

type Props = {
  lead: LeadBoardRow;
  onClose: () => void;
  /** Fecha o modal de proposta e abre o resumo do quiz (ex.: mesmo lead no Kanban). */
  onViewQuiz?: () => void;
};

function buildPayload(
  titulo: string,
  destino: string,
  datas: string,
  inclui: string,
  valorTotal: string,
  notas: string,
  atualizarEstado: boolean,
  apenasPrevizualizar: boolean,
) {
  return {
    titulo,
    destino,
    datas,
    inclui,
    valor_total: valorTotal,
    notas: notas.trim() || undefined,
    atualizar_estado: atualizarEstado,
    apenas_previzualizar: apenasPrevizualizar,
  };
}

export function ProposalSendModal({ lead, onClose, onViewQuiz }: Props) {
  const router = useRouter();
  const prev = parseDetalhesProposta(lead.detalhes_proposta);
  const previewObjectUrlRef = useRef<string | null>(null);

  const [titulo, setTitulo] = useState(
    prev?.titulo ?? "Proposta de viagem personalizada",
  );
  const [destino, setDestino] = useState(
    prev?.destino ?? lead.destino_sonho ?? "",
  );
  const [datas, setDatas] = useState(prev?.datas ?? "");
  const [inclui, setInclui] = useState(prev?.inclui?.join("\n") ?? "");
  const [valorTotal, setValorTotal] = useState(prev?.valor_total ?? "");
  const [notas, setNotas] = useState(prev?.notas ?? "");
  const [atualizarEstado, setAtualizarEstado] = useState(true);
  const [sending, setSending] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const revokePreview = () => {
    if (previewObjectUrlRef.current) {
      URL.revokeObjectURL(previewObjectUrlRef.current);
      previewObjectUrlRef.current = null;
    }
    setPreviewUrl(null);
  };

  useEffect(() => {
    return () => {
      if (previewObjectUrlRef.current) {
        URL.revokeObjectURL(previewObjectUrlRef.current);
      }
    };
  }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== "Escape" || sending) return;
      e.preventDefault();
      onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose, sending]);

  const invalidatePreview = () => {
    revokePreview();
  };

  async function handlePreview() {
    setPreviewLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/crm/leads/${lead.id}/orcamento`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          buildPayload(
            titulo,
            destino,
            datas,
            inclui,
            valorTotal,
            notas,
            atualizarEstado,
            true,
          ),
        ),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? "Não foi possível gerar a pré-visualização.");
        setPreviewLoading(false);
        return;
      }

      const blob = await res.blob();
      if (blob.type && !blob.type.includes("pdf")) {
        setError("Resposta inválida do servidor.");
        setPreviewLoading(false);
        return;
      }

      revokePreview();
      const url = URL.createObjectURL(blob);
      previewObjectUrlRef.current = url;
      setPreviewUrl(url);
    } catch {
      setError("Erro de rede ao gerar o PDF.");
    } finally {
      setPreviewLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!previewUrl) {
      setError("Pré-visualiza o PDF antes de enviar.");
      return;
    }

    setSending(true);
    setError(null);

    try {
      const res = await fetch(`/api/crm/leads/${lead.id}/orcamento`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          buildPayload(
            titulo,
            destino,
            datas,
            inclui,
            valorTotal,
            notas,
            atualizarEstado,
            false,
          ),
        ),
      });

      const data = (await res.json()) as { error?: string };

      if (!res.ok) {
        setError(data.error ?? "Pedido falhou.");
        setSending(false);
        return;
      }

      revokePreview();
      onClose();
      router.refresh();
    } catch {
      setError("Erro de rede. Tenta de novo.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ocean-900/40 p-3 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="proposal-modal-title"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Fechar"
        onClick={onClose}
      />
      <div className="relative z-10 flex max-h-[min(92vh,880px)] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-ocean-100 bg-white shadow-xl">
        <div className="shrink-0 border-b border-ocean-100 px-5 py-4 md:px-6">
          <h2
            id="proposal-modal-title"
            className="font-serif text-xl font-normal text-ocean-900 md:text-2xl"
          >
            Orçamento por email
          </h2>
          <p className="mt-1 text-sm text-ocean-600">
            Cliente:{" "}
            <span className="font-medium text-ocean-800">{lead.email}</span> ·
            Gera o PDF, pré-visualiza e só depois envia.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {onViewQuiz ? (
              <button
                type="button"
                onClick={() => onViewQuiz()}
                disabled={sending}
                className="rounded-full border border-ocean-200 bg-sand/50 px-4 py-2 text-xs font-semibold text-ocean-800 transition hover:bg-sand disabled:opacity-50"
              >
                Ver respostas do pedido
              </button>
            ) : null}
            <span className="text-[11px] text-ocean-500">
              <kbd className="rounded border border-ocean-200 bg-ocean-50 px-1.5 py-0.5 font-mono text-[10px] text-ocean-700">
                Esc
              </kbd>{" "}
              fecha
            </span>
          </div>
        </div>

        <form
          className="flex min-h-0 flex-1 flex-col overflow-hidden md:flex-row"
          onSubmit={(e) => void handleSubmit(e)}
        >
          <div className="min-h-0 w-full shrink-0 overflow-y-auto border-ocean-100 p-5 md:w-[min(100%,380px)] md:border-r md:p-6">
            {error ? (
              <p
                className="mb-4 rounded-xl border border-terracotta/40 bg-terracotta/10 px-3 py-2 text-sm text-ocean-900"
                role="alert"
              >
                {error}
              </p>
            ) : null}

            <p className="mb-4 text-xs text-ocean-500">
              Alterar o formulário invalida a pré-visualização — volta a gerar o
              PDF antes de enviar.
            </p>

            <div className="space-y-4">
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wider text-ocean-600">
                  Título da proposta
                </span>
                <input
                  className="mt-1 w-full rounded-xl border border-ocean-200 px-3 py-2 text-sm text-ocean-900"
                  value={titulo}
                  onChange={(e) => {
                    setTitulo(e.target.value);
                    invalidatePreview();
                  }}
                  required
                />
              </label>

              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wider text-ocean-600">
                  Destino
                </span>
                <input
                  className="mt-1 w-full rounded-xl border border-ocean-200 px-3 py-2 text-sm text-ocean-900"
                  value={destino}
                  onChange={(e) => {
                    setDestino(e.target.value);
                    invalidatePreview();
                  }}
                  required
                />
              </label>

              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wider text-ocean-600">
                  Datas / período
                </span>
                <input
                  className="mt-1 w-full rounded-xl border border-ocean-200 px-3 py-2 text-sm text-ocean-900"
                  value={datas}
                  onChange={(e) => {
                    setDatas(e.target.value);
                    invalidatePreview();
                  }}
                  required
                  placeholder="ex.: 12–19 Julho 2026"
                />
              </label>

              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wider text-ocean-600">
                  O que inclui (uma linha por item)
                </span>
                <textarea
                  className="mt-1 min-h-[88px] w-full rounded-xl border border-ocean-200 px-3 py-2 text-sm text-ocean-900"
                  value={inclui}
                  onChange={(e) => {
                    setInclui(e.target.value);
                    invalidatePreview();
                  }}
                  rows={4}
                  placeholder="Voos diretos&#10;Alojamento BB&#10;Transfer aeroporto"
                />
              </label>

              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wider text-ocean-600">
                  Valor total
                </span>
                <input
                  className="mt-1 w-full rounded-xl border border-ocean-200 px-3 py-2 text-sm text-ocean-900"
                  value={valorTotal}
                  onChange={(e) => {
                    setValorTotal(e.target.value);
                    invalidatePreview();
                  }}
                  required
                  placeholder="ex.: 2 450 € (duas pessoas)"
                />
              </label>

              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wider text-ocean-600">
                  Notas (opcional)
                </span>
                <textarea
                  className="mt-1 min-h-[64px] w-full rounded-xl border border-ocean-200 px-3 py-2 text-sm text-ocean-900"
                  value={notas}
                  onChange={(e) => {
                    setNotas(e.target.value);
                    invalidatePreview();
                  }}
                  rows={2}
                />
              </label>

              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-ocean-100 bg-ocean-50/50 px-3 py-3">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={atualizarEstado}
                  onChange={(e) => {
                    setAtualizarEstado(e.target.checked);
                    invalidatePreview();
                  }}
                />
                <span className="text-sm text-ocean-800">
                  Após enviar, passar a lead para{" "}
                  <strong>Proposta enviada</strong>
                </span>
              </label>
            </div>
          </div>

          <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-sand/40 p-4 md:p-5">
            <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 pb-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-ocean-600">
                Pré-visualização do PDF
              </p>
              <button
                type="button"
                onClick={() => void handlePreview()}
                disabled={previewLoading}
                className="rounded-full border border-ocean-300 bg-white px-4 py-2 text-sm font-semibold text-ocean-800 shadow-sm hover:bg-ocean-50 disabled:opacity-60"
              >
                {previewLoading ? "A gerar…" : "Gerar / atualizar PDF"}
              </button>
            </div>

            <div className="relative min-h-[280px] flex-1 overflow-hidden rounded-xl border border-ocean-200 bg-ocean-900/5 md:min-h-[420px]">
              {previewUrl ? (
                <iframe
                  title="Pré-visualização do PDF"
                  src={previewUrl}
                  className="h-full min-h-[280px] w-full md:min-h-[420px]"
                />
              ) : (
                <div className="flex h-full min-h-[280px] flex-col items-center justify-center gap-2 px-6 text-center md:min-h-[420px]">
                  <p className="text-sm text-ocean-600">
                    Clica em{" "}
                    <strong className="text-ocean-800">
                      Gerar / atualizar PDF
                    </strong>{" "}
                    para ver o documento com o branding{" "}
                    <span className="font-mono text-xs text-ocean-700">
                      viagenscomsilvia
                    </span>
                    .
                  </p>
                </div>
              )}
            </div>

            <div className="flex shrink-0 flex-wrap gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-ocean-200 px-5 py-2.5 text-sm font-medium text-ocean-700 hover:bg-white"
                disabled={sending}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={sending || !previewUrl}
                className="rounded-full bg-ocean-900 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-ocean-800 disabled:opacity-50"
                title={
                  !previewUrl
                    ? "Pré-visualiza o PDF antes de enviar"
                    : undefined
                }
              >
                {sending ? "A enviar…" : "Enviar por email com PDF"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
