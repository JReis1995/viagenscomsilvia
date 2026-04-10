"use client";

import { useCallback, useState } from "react";

import {
  COMPANHIA_OPTIONS,
  ORCAMENTO_OPTIONS,
  VIBE_OPTIONS,
} from "@/components/marketing/quiz-options";
import type { PedidoOrcamentoPrefill } from "@/lib/marketing/pedido-orcamento";

const LAST_STEP = 8;

type FormData = {
  nome: string;
  email: string;
  telemovel: string;
  vibe: string;
  companhia: string;
  destino_sonho: string;
  orcamento_estimado: string;
};

const initialForm: FormData = {
  nome: "",
  email: "",
  telemovel: "",
  vibe: "",
  companhia: "",
  destino_sonho: "",
  orcamento_estimado: "",
};

function formWithPrefill(prefill: PedidoOrcamentoPrefill | null): FormData {
  const base: FormData = { ...initialForm };
  if (prefill?.destinoSonho?.trim()) {
    base.destino_sonho = prefill.destinoSonho.trim();
  }
  return base;
}

type Props = {
  prefill?: PedidoOrcamentoPrefill | null;
};

export function TravelQuiz({ prefill = null }: Props) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>(() => formWithPrefill(prefill));
  const [honeypot, setHoneypot] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState<boolean | null>(null);

  const progress = step <= LAST_STEP ? Math.min(100, (step / LAST_STEP) * 100) : 100;

  const goNext = useCallback(() => {
    setError(null);
    setStep((s) => Math.min(LAST_STEP, s + 1));
  }, []);

  const goBack = useCallback(() => {
    setError(null);
    setStep((s) => Math.max(0, s - 1));
  }, []);

  function validateCurrent(): string | null {
    const telemovelDigits = form.telemovel.replace(/\D/g, "");
    switch (step) {
      case 0:
        return null;
      case 1:
        if (form.nome.trim().length < 2) return "Indica o teu nome (mín. 2 caracteres).";
        return null;
      case 2: {
        const em = form.email.trim();
        if (!em) return "Indica o teu email.";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) return "Email inválido.";
        return null;
      }
      case 3:
        if (!form.telemovel.trim()) return "Indica o teu telemóvel.";
        if (telemovelDigits.length < 9 || telemovelDigits.length > 15)
          return "Telemóvel inválido — usa pelo menos 9 dígitos.";
        return null;
      case 4:
        if (!form.vibe) return "Escolhe o estilo de viagem que mais te identifica.";
        return null;
      case 5:
        if (!form.companhia) return "Indica com quem imaginas viajar.";
        return null;
      case 6:
        if (form.destino_sonho.trim().length < 2)
          return "Descreve um destino, região ou ideia (mín. 2 caracteres).";
        return null;
      case 7:
        if (!form.orcamento_estimado) return "Escolhe uma faixa de orçamento.";
        return null;
      default:
        return null;
    }
  }

  function handleNext() {
    const msg = validateCurrent();
    if (msg) {
      setError(msg);
      return;
    }
    goNext();
  }

  function validateAll(): string | null {
    if (form.nome.trim().length < 2) return "Indica o teu nome (mín. 2 caracteres).";
    const em = form.email.trim();
    if (!em) return "Indica o teu email.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) return "Email inválido.";
    const telDigits = form.telemovel.replace(/\D/g, "");
    if (!form.telemovel.trim() || telDigits.length < 9 || telDigits.length > 15)
      return "Indica um telemóvel válido (mínimo 9 dígitos).";
    if (!form.vibe) return "Escolhe o estilo de viagem.";
    if (!form.companhia) return "Indica a companhia de viagem.";
    if (form.destino_sonho.trim().length < 2) return "Descreve o destino ou ideia.";
    if (!form.orcamento_estimado) return "Escolhe uma faixa de orçamento.";
    return null;
  }

  async function handleSubmit() {
    const msg = validateAll();
    if (msg) {
      setError(msg);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: form.nome.trim(),
          email: form.email.trim(),
          telemovel: form.telemovel.trim(),
          vibe: form.vibe,
          companhia: form.companhia,
          destino_sonho: form.destino_sonho.trim(),
          orcamento_estimado: form.orcamento_estimado,
          website_url: honeypot,
        }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string; emailSent?: boolean };
      if (!res.ok) {
        setError(data.error ?? "Algo correu mal. Tenta novamente.");
        return;
      }
      setEmailSent(data.emailSent ?? false);
      setStep(9);
    } catch {
      setError("Erro de rede. Verifica a ligação e tenta de novo.");
    } finally {
      setLoading(false);
    }
  }

  if (step === 9) {
    return (
      <div className="rounded-3xl border border-ocean-100 bg-white p-8 shadow-xl md:p-10">
        <div className="mx-auto max-w-md text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-ocean-50 text-ocean-600">
            <svg
              className="h-7 w-7"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="mt-6 text-2xl font-semibold tracking-tight text-ocean-900">
            Obrigado, {form.nome.trim().split(/\s+/)[0]}!
          </h2>
          <p className="mt-3 text-ocean-600">
            Recebemos o teu pedido de proposta. A Sílvia vai ler com atenção o
            que partilhaste e pode contactar-te por email ou telemóvel em breve.
          </p>
          {emailSent ? (
            <p className="mt-4 text-sm text-ocean-600">
              Enviámos um email de confirmação para{" "}
              <span className="font-medium text-ocean-800">{form.email.trim()}</span>
              . Se não o vires, verifica a pasta de spam.
            </p>
          ) : (
            <p className="mt-4 text-sm text-ocean-500">
              Não recebeste email automático? Não faz mal — o pedido ficou
              registado e serás contactado/a por email.
            </p>
          )}
          <button
            type="button"
            onClick={() => {
              setStep(0);
              setForm(initialForm);
              setEmailSent(null);
              setError(null);
            }}
            className="mt-10 inline-flex h-12 items-center justify-center rounded-2xl border border-ocean-200 px-6 text-sm font-medium text-ocean-700 transition hover:bg-ocean-50"
          >
            Novo pedido
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative rounded-3xl border border-ocean-100 bg-white p-6 shadow-xl md:p-10">
      <div
        className="mb-8 h-1.5 overflow-hidden rounded-full bg-ocean-100"
        role="progressbar"
        aria-valuenow={Math.round(progress)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Progresso do pedido de orçamento"
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-ocean-500 to-ocean-700 transition-[width] duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Honeypot — não preencher */}
      <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden>
        <label htmlFor="website_url">Website</label>
        <input
          id="website_url"
          name="website_url"
          tabIndex={-1}
          autoComplete="off"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
        />
      </div>

      {error ? (
        <p
          className="mb-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      {step === 0 && (
        <div className="text-center md:px-4">
          <h2 className="text-2xl font-semibold tracking-tight text-ocean-900 md:text-3xl">
            Vamos desenhar a tua próxima viagem
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-ocean-600">
            Poucos passos, sem pressa: conta-nos o essencial para a Sílvia te
            responder com uma proposta que faça sentido — não um pacote genérico.
          </p>
          {prefill?.temaDestaque ? (
            <p className="mx-auto mt-6 max-w-lg rounded-2xl border border-ocean-100 bg-ocean-50/80 px-5 py-4 text-sm leading-relaxed text-ocean-800">
              <span className="font-medium text-ocean-900">
                Trouxeste a inspiração do feed:
              </span>{" "}
              <span className="text-ocean-700">«{prefill.temaDestaque}»</span>{" "}
              já está sugerida no passo do destino — podes editar quando
              chegares lá.
            </p>
          ) : null}
          <button
            type="button"
            onClick={goNext}
            className="mt-10 inline-flex h-14 min-w-[200px] items-center justify-center rounded-3xl bg-terracotta px-8 text-base font-semibold text-white shadow-lg transition hover:bg-terracotta-hover"
          >
            Começar o meu pedido
          </button>
        </div>
      )}

      {step === 1 && (
        <div className="mx-auto max-w-md">
          <h2 className="text-xl font-semibold text-ocean-900 md:text-2xl">
            Como te chamas?
          </h2>
          <p className="mt-2 text-sm text-ocean-600">
            O nome que preferires que usemos nas mensagens.
          </p>
          <input
            type="text"
            autoFocus
            value={form.nome}
            onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
            onKeyDown={(e) => e.key === "Enter" && handleNext()}
            className="mt-8 w-full rounded-2xl border border-ocean-100 bg-sand px-4 py-3.5 text-ocean-900 outline-none ring-ocean-500/20 transition focus:border-ocean-500 focus:ring-2"
            placeholder="O teu nome"
            autoComplete="name"
          />
        </div>
      )}

      {step === 2 && (
        <div className="mx-auto max-w-md">
          <h2 className="text-xl font-semibold text-ocean-900 md:text-2xl">
            O teu email
          </h2>
          <p className="mt-2 text-sm text-ocean-600">
            Para te enviarmos confirmação e a proposta quando estiver pronta.
          </p>
          <input
            type="email"
            autoFocus
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            onKeyDown={(e) => e.key === "Enter" && handleNext()}
            className="mt-8 w-full rounded-2xl border border-ocean-100 bg-sand px-4 py-3.5 text-ocean-900 outline-none ring-ocean-500/20 transition focus:border-ocean-500 focus:ring-2"
            placeholder="nome@email.com"
            autoComplete="email"
          />
        </div>
      )}

      {step === 3 && (
        <div className="mx-auto max-w-md">
          <h2 className="text-xl font-semibold text-ocean-900 md:text-2xl">
            O teu telemóvel
          </h2>
          <p className="mt-2 text-sm text-ocean-600">
            Para a Sílvia te poder ligar com rapidez se fizer sentido — não
            partilhamos o número fora deste contacto.
          </p>
          <input
            type="tel"
            autoFocus
            inputMode="tel"
            autoComplete="tel"
            value={form.telemovel}
            onChange={(e) => setForm((f) => ({ ...f, telemovel: e.target.value }))}
            onKeyDown={(e) => e.key === "Enter" && handleNext()}
            className="mt-8 w-full rounded-2xl border border-ocean-100 bg-sand px-4 py-3.5 text-ocean-900 outline-none ring-ocean-500/20 transition focus:border-ocean-500 focus:ring-2"
            placeholder="Ex.: 912 345 678 ou +351 912 345 678"
          />
        </div>
      )}

      {step === 4 && (
        <div>
          <h2 className="text-xl font-semibold text-ocean-900 md:text-2xl">
            Que experiência te faz brilhar os olhos?
          </h2>
          <p className="mt-2 text-sm text-ocean-600">
            Escolhe a que mais se aproxima — depois afinamos ao pormenor.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {VIBE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  setForm((f) => ({ ...f, vibe: opt.value }));
                  setError(null);
                }}
                className={`rounded-2xl border px-4 py-4 text-left text-sm font-medium transition ${
                  form.vibe === opt.value
                    ? "border-ocean-500 bg-ocean-50 text-ocean-900 shadow-md"
                    : "border-ocean-100 bg-sand/50 text-ocean-800 hover:border-ocean-200"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 5 && (
        <div>
          <h2 className="text-xl font-semibold text-ocean-900 md:text-2xl">
            Com quem imaginas partir à descoberta?
          </h2>
          <p className="mt-2 text-sm text-ocean-600">
            Ajuda-nos a pensar em quartos, ritmo e tipo de experiência.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {COMPANHIA_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  setForm((f) => ({ ...f, companhia: opt.value }));
                  setError(null);
                }}
                className={`rounded-2xl border px-4 py-4 text-left text-sm font-medium transition ${
                  form.companhia === opt.value
                    ? "border-ocean-500 bg-ocean-50 text-ocean-900 shadow-md"
                    : "border-ocean-100 bg-sand/50 text-ocean-800 hover:border-ocean-200"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 6 && (
        <div className="mx-auto max-w-lg">
          <h2 className="text-xl font-semibold text-ocean-900 md:text-2xl">
            Onde queres que a história comece?
          </h2>
          <p className="mt-2 text-sm text-ocean-600">
            País, ilha, cidade ou até uma ideia vaga — se vieste de uma
            publicação, já deixámos uma sugestão; podes alterar à vontade.
          </p>
          <textarea
            autoFocus
            value={form.destino_sonho}
            onChange={(e) =>
              setForm((f) => ({ ...f, destino_sonho: e.target.value }))
            }
            rows={5}
            className="mt-8 w-full resize-y rounded-2xl border border-ocean-100 bg-sand px-4 py-3.5 text-ocean-900 outline-none ring-ocean-500/20 transition focus:border-ocean-500 focus:ring-2"
            placeholder="Ex.: Maldivas em bungalow sobre a água, Japão na primavera…"
          />
        </div>
      )}

      {step === 7 && (
        <div>
          <h2 className="text-xl font-semibold text-ocean-900 md:text-2xl">
            Em que faixa te queres mover?
          </h2>
          <p className="mt-2 text-sm text-ocean-600">
            Por pessoa ou por casal — como fizer sentido para ti. É só uma
            referência para calibrarmos expectativas.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {ORCAMENTO_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  setForm((f) => ({ ...f, orcamento_estimado: opt.value }));
                  setError(null);
                }}
                className={`rounded-2xl border px-4 py-4 text-left text-sm font-medium transition ${
                  form.orcamento_estimado === opt.value
                    ? "border-ocean-500 bg-ocean-50 text-ocean-900 shadow-md"
                    : "border-ocean-100 bg-sand/50 text-ocean-800 hover:border-ocean-200"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 8 && (
        <div className="mx-auto max-w-lg">
          <h2 className="text-xl font-semibold text-ocean-900 md:text-2xl">
            Está tudo como imaginaste?
          </h2>
          <p className="mt-2 text-sm text-ocean-600">
            Revê os detalhes — depois é connosco: a Sílvia trata do resto.
          </p>
          <dl className="mt-8 space-y-4 rounded-2xl bg-sand/80 p-6 text-sm">
            <div>
              <dt className="font-medium text-ocean-500">Nome</dt>
              <dd className="mt-1 text-ocean-900">{form.nome.trim()}</dd>
            </div>
            <div>
              <dt className="font-medium text-ocean-500">Email</dt>
              <dd className="mt-1 text-ocean-900">{form.email.trim()}</dd>
            </div>
            <div>
              <dt className="font-medium text-ocean-500">Telemóvel</dt>
              <dd className="mt-1 text-ocean-900">{form.telemovel.trim()}</dd>
            </div>
            <div>
              <dt className="font-medium text-ocean-500">Estilo</dt>
              <dd className="mt-1 text-ocean-900">{form.vibe}</dd>
            </div>
            <div>
              <dt className="font-medium text-ocean-500">Companhia</dt>
              <dd className="mt-1 text-ocean-900">{form.companhia}</dd>
            </div>
            <div>
              <dt className="font-medium text-ocean-500">Destino / ideia</dt>
              <dd className="mt-1 whitespace-pre-wrap text-ocean-900">
                {form.destino_sonho.trim()}
              </dd>
            </div>
            <div>
              <dt className="font-medium text-ocean-500">Orçamento</dt>
              <dd className="mt-1 text-ocean-900">{form.orcamento_estimado}</dd>
            </div>
          </dl>
        </div>
      )}

      {step > 0 && step <= LAST_STEP && (
        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-ocean-100 pt-8">
          <button
            type="button"
            onClick={goBack}
            className="rounded-2xl px-5 py-3 text-sm font-medium text-ocean-600 transition hover:bg-ocean-50 hover:text-ocean-900"
          >
            ← Voltar
          </button>
          {step < LAST_STEP ? (
            <button
              type="button"
              onClick={handleNext}
              className="inline-flex h-12 min-w-[140px] items-center justify-center rounded-3xl bg-ocean-700 px-6 text-sm font-semibold text-white shadow-md transition hover:bg-ocean-800"
            >
              Continuar
            </button>
          ) : (
            <button
              type="button"
              disabled={loading}
              onClick={() => void handleSubmit()}
              className="inline-flex h-12 min-w-[160px] items-center justify-center rounded-3xl bg-terracotta px-6 text-sm font-semibold text-white shadow-lg transition hover:bg-terracotta-hover disabled:opacity-60"
            >
              {loading ? "A enviar…" : "Enviar pedido"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
