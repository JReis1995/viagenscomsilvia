"use client";

import { useReducedMotion } from "framer-motion";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import {
  COMPANHIA_OPTIONS,
  ORCAMENTO_OPTIONS,
  VIBE_OPTIONS,
} from "@/components/marketing/quiz-options";
import {
  LEAD_THANKS_EMAIL_SENT_KEY,
  LEAD_THANKS_NAME_KEY,
} from "@/lib/marketing/lead-thanks-storage";
import type { PedidoOrcamentoPrefill } from "@/lib/marketing/pedido-orcamento";
import {
  CLIMA_LABEL_QUIZ_FIELD,
  climaLabelForKey,
  climaOptionsFromCopy,
  type QuizClimaKey,
} from "@/lib/marketing/quiz-clima";
import {
  parsePedidoClimaParam,
  replacePedidoClimaInUrl,
} from "@/lib/marketing/pedido-clima-url";
import { getLeadMarketingAttributionPayload } from "@/lib/marketing/session-attribution";
import { CrmInlineText } from "@/components/crm/crm-inline-text";
import {
  flexibilidadeLabel,
  voosHotelLabel,
} from "@/lib/marketing/quiz-qualificacao";
import { quizImmersiveShellClass } from "@/lib/marketing/quiz-vibe-theme";
import type { SiteContent } from "@/lib/site/site-content";
import { trackFunnelEvent } from "@/lib/analytics/funnel";

const LAST_STEP = 12;

type FormData = {
  clima: QuizClimaKey | "";
  nome: string;
  email: string;
  telemovel: string;
  vibe: string;
  companhia: string;
  destino_sonho: string;
  orcamento_estimado: string;
  janela_datas: string;
  flexibilidade_datas:
    | ""
    | "fixas"
    | "mais_menos_semana"
    | "totalmente_flexivel";
  ja_tem_voos_hotel: "" | "nada" | "so_voos" | "so_hotel" | "ambos";
};

const initialForm: FormData = {
  clima: "",
  nome: "",
  email: "",
  telemovel: "",
  vibe: "",
  companhia: "",
  destino_sonho: "",
  orcamento_estimado: "",
  janela_datas: "",
  flexibilidade_datas: "",
  ja_tem_voos_hotel: "",
};

function formWithPrefill(prefill: PedidoOrcamentoPrefill | null): FormData {
  const base: FormData = { ...initialForm };
  if (prefill?.destinoSonho?.trim()) {
    base.destino_sonho = prefill.destinoSonho.trim();
  }
  if (prefill?.vibe) {
    base.vibe = prefill.vibe;
  }
  if (prefill?.clima) {
    base.clima = prefill.clima;
  }
  return base;
}

type Props = {
  prefill?: PedidoOrcamentoPrefill | null;
  quizCopy: SiteContent["quiz"];
  crm?: {
    patchQuiz: (field: keyof SiteContent["quiz"], value: string) => void;
  };
};

function qLine(
  copy: SiteContent["quiz"],
  key: keyof SiteContent["quiz"],
  fallback: string,
): string {
  const raw = copy[key];
  return typeof raw === "string" && raw.trim() ? raw.trim() : fallback;
}

export function TravelQuiz({ prefill = null, quizCopy, crm }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const reduceMotion = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>(() => formWithPrefill(prefill));
  const [honeypot, setHoneypot] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quickOpen, setQuickOpen] = useState(false);
  const [quickDestino, setQuickDestino] = useState("");
  const [quickLoading, setQuickLoading] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const prevFocusRef = useRef<HTMLElement | null>(null);
  const prevStepRef = useRef(0);
  const closeImmersiveRef = useRef<() => void>(() => {});

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    getLeadMarketingAttributionPayload();
  }, []);

  useEffect(() => {
    if (step !== 3 && step !== 4) {
      setQuickOpen(false);
      setQuickDestino("");
    }
  }, [step]);

  const pedidoClimaQuery = searchParams.toString();
  useEffect(() => {
    const sp = new URLSearchParams(pedidoClimaQuery);
    const c = parsePedidoClimaParam(sp.get("pedido_clima"));
    setForm((f) => ({ ...f, clima: c ?? "" }));
  }, [pedidoClimaQuery]);

  useEffect(() => {
    if (step >= 1 && step <= LAST_STEP) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [step]);

  const progress =
    step <= LAST_STEP ? Math.min(100, (step / LAST_STEP) * 100) : 100;

  const shellClass = quizImmersiveShellClass(form.vibe, reduceMotion ?? false);
  const climaOptions = climaOptionsFromCopy(quizCopy);

  const goNext = useCallback(() => {
    setError(null);
    setStep((s) => Math.min(LAST_STEP, s + 1));
  }, []);

  const goBack = useCallback(() => {
    setError(null);
    setStep((s) => Math.max(0, s - 1));
  }, []);

  const handleCloseImmersive = useCallback(() => {
    setStep((current) => {
      if (current < 1 || current > LAST_STEP) return current;
      if (
        current > 1 &&
        !window.confirm(
          "Queres sair do pedido? Se saíres agora, terás de recomeçar do início.",
        )
      ) {
        return current;
      }
      queueMicrotask(() => {
        setForm(formWithPrefill(prefill));
        setError(null);
      });
      return 0;
    });
  }, [prefill]);

  useEffect(() => {
    closeImmersiveRef.current = () => {
      handleCloseImmersive();
    };
  }, [handleCloseImmersive]);

  useEffect(() => {
    if (step === 1 && prevStepRef.current === 0) {
      prevFocusRef.current =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null;
    }
    if (step === 0 && prevStepRef.current >= 1) {
      const el = prevFocusRef.current;
      prevFocusRef.current = null;
      if (el?.isConnected) {
        requestAnimationFrame(() => el.focus());
      }
    }
    prevStepRef.current = step;
  }, [step]);

  useEffect(() => {
    if (step < 1 || step > LAST_STEP) return;
    const el = dialogRef.current;
    if (!el) return;
    const id = window.setTimeout(() => el.focus(), 0);

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        closeImmersiveRef.current();
        return;
      }
      if (e.key !== "Tab") return;
      const trap = dialogRef.current;
      if (!trap) return;
      const nodes = trap.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      const list = Array.from(nodes).filter(
        (node) =>
          !node.hasAttribute("disabled") &&
          !node.getAttribute("aria-hidden") &&
          node.offsetParent !== null,
      );
      if (list.length === 0) return;
      const first = list[0]!;
      const last = list[list.length - 1]!;
      const active = document.activeElement;
      if (e.shiftKey) {
        if (active === first || active === trap) {
          e.preventDefault();
          last.focus();
        }
      } else if (active === last) {
        e.preventDefault();
        first.focus();
      }
    }

    el.addEventListener("keydown", onKeyDown);
    return () => {
      window.clearTimeout(id);
      el.removeEventListener("keydown", onKeyDown);
    };
  }, [step]);

  function validateCurrent(): string | null {
    const telemovelDigits = form.telemovel.replace(/\D/g, "");
    switch (step) {
      case 0:
        return null;
      case 1:
        if (form.nome.trim().length < 2)
          return "Indica o teu nome (mín. 2 caracteres).";
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
        if (!form.clima)
          return "Escolhe o clima ou ambiente que mais te atrai neste momento.";
        return null;
      case 5:
        if (!form.vibe)
          return "Escolhe o estilo de viagem que mais te identifica.";
        return null;
      case 6:
        if (!form.companhia) return "Indica com quem imaginas viajar.";
        return null;
      case 7:
        if (form.destino_sonho.trim().length < 2)
          return "Descreve um destino, região ou ideia (mín. 2 caracteres).";
        return null;
      case 8:
        if (!form.orcamento_estimado) return "Escolhe uma faixa de orçamento.";
        return null;
      case 9:
        if (form.janela_datas.trim().length < 2)
          return "Indica uma janela de datas (mesmo aproximada).";
        return null;
      case 10:
        if (!form.flexibilidade_datas)
          return "Escolhe o quanto podes flexibilizar as datas.";
        return null;
      case 11:
        if (!form.ja_tem_voos_hotel)
          return "Indica se já tens voos ou hotel reservados.";
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
    trackFunnelEvent("quiz_step", { step: String(step) });
    goNext();
  }

  function validateAll(): string | null {
    if (form.nome.trim().length < 2)
      return "Indica o teu nome (mín. 2 caracteres).";
    const em = form.email.trim();
    if (!em) return "Indica o teu email.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) return "Email inválido.";
    const telDigits = form.telemovel.replace(/\D/g, "");
    if (!form.telemovel.trim() || telDigits.length < 9 || telDigits.length > 15)
      return "Indica um telemóvel válido (mínimo 9 dígitos).";
    if (!form.clima)
      return "Escolhe o clima ou ambiente que mais te atrai neste momento.";
    if (!form.vibe) return "Escolhe o estilo de viagem.";
    if (!form.companhia) return "Indica a companhia de viagem.";
    if (form.destino_sonho.trim().length < 2)
      return "Descreve o destino ou ideia.";
    if (!form.orcamento_estimado) return "Escolhe uma faixa de orçamento.";
    if (form.janela_datas.trim().length < 2)
      return "Indica uma janela de datas (mesmo aproximada).";
    if (!form.flexibilidade_datas)
      return "Escolhe o quanto podes flexibilizar as datas.";
    if (!form.ja_tem_voos_hotel)
      return "Indica se já tens voos ou hotel reservados.";
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
          clima_preferido: form.clima,
          telemovel: form.telemovel.trim(),
          vibe: form.vibe,
          companhia: form.companhia,
          destino_sonho: form.destino_sonho.trim(),
          orcamento_estimado: form.orcamento_estimado,
          janela_datas: form.janela_datas.trim(),
          flexibilidade_datas: form.flexibilidade_datas,
          ja_tem_voos_hotel: form.ja_tem_voos_hotel,
          website_url: honeypot,
          ...getLeadMarketingAttributionPayload(),
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        emailSent?: boolean;
        code?: string;
      };
      if (!res.ok) {
        trackFunnelEvent("lead_submit_error", {
          kind: "full",
          status: String(res.status),
        });
        if (res.status === 409 && data.code === "duplicate_open_lead") {
          setError(
            quizCopy.duplicateOpenLeadMessage.trim() ||
              data.error ||
              "Já existe um pedido em aberto com este contacto.",
          );
          return;
        }
        setError(data.error ?? "Algo correu mal. Tenta novamente.");
        return;
      }
      trackFunnelEvent("lead_submit", { kind: "full" });
      try {
        const first = form.nome.trim().split(/\s+/)[0] ?? "";
        sessionStorage.setItem(LEAD_THANKS_NAME_KEY, first);
        sessionStorage.setItem(
          LEAD_THANKS_EMAIL_SENT_KEY,
          String(data.emailSent ?? false),
        );
      } catch {
        /* private mode / quota */
      }
      document.body.style.overflow = "";
      router.push("/obrigado");
    } catch {
      trackFunnelEvent("lead_submit_error", { kind: "full", status: "0" });
      setError("Erro de rede. Verifica a ligação e tenta de novo.");
    } finally {
      setLoading(false);
    }
  }

  async function handleQuickSubmit() {
    if (form.nome.trim().length < 2) {
      setError("Volta atrás e indica o teu nome para o pedido rápido.");
      return;
    }
    const em = form.email.trim();
    if (!em || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) {
      setError("Volta atrás e indica um email válido.");
      return;
    }
    const tel = form.telemovel.trim();
    const telDigits = tel.replace(/\D/g, "");
    if (tel && (telDigits.length < 9 || telDigits.length > 15)) {
      setError("Telemóvel inválido — corrige ou deixa em branco para o pedido rápido.");
      return;
    }
    const dest = quickDestino.trim();
    if (dest.length < 2) {
      setError("Escreve uma linha sobre o destino ou a tua ideia (mín. 2 caracteres).");
      return;
    }
    setQuickLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pedido_rapido: true,
          nome: form.nome.trim(),
          email: em,
          telemovel: tel,
          destino_sonho: dest,
          website_url: honeypot,
          ...getLeadMarketingAttributionPayload(),
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        emailSent?: boolean;
        code?: string;
      };
      if (!res.ok) {
        trackFunnelEvent("lead_submit_error", {
          kind: "quick",
          status: String(res.status),
        });
        if (res.status === 409 && data.code === "duplicate_open_lead") {
          setError(
            quizCopy.duplicateOpenLeadMessage.trim() ||
              data.error ||
              "Já existe um pedido em aberto com este contacto.",
          );
          return;
        }
        setError(data.error ?? "Algo correu mal. Tenta novamente.");
        return;
      }
      trackFunnelEvent("lead_submit", { kind: "quick" });
      try {
        const first = form.nome.trim().split(/\s+/)[0] ?? "";
        sessionStorage.setItem(LEAD_THANKS_NAME_KEY, first);
        sessionStorage.setItem(
          LEAD_THANKS_EMAIL_SENT_KEY,
          String(data.emailSent ?? false),
        );
      } catch {
        /* private mode */
      }
      document.body.style.overflow = "";
      router.push("/obrigado");
    } catch {
      trackFunnelEvent("lead_submit_error", { kind: "quick", status: "0" });
      setError("Erro de rede. Verifica a ligação e tenta de novo.");
    } finally {
      setQuickLoading(false);
    }
  }

  const honeypotBlock = (
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
  );

  const progressBlock = (
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
  );

  const errorBlock =
    error ? (
      <p
        className="mb-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800"
        role="alert"
      >
        {error}
      </p>
    ) : null;

  const stepBlocks = (
    <>
      {step === 1 && (
        <div className="mx-auto max-w-md">
          <h2 className="text-xl font-semibold text-ocean-900 md:text-2xl">
            {crm ? (
              <CrmInlineText
                label="Passo nome — título"
                value={quizCopy.pedidoStep1Title}
                onApply={(v) => crm.patchQuiz("pedidoStep1Title", v)}
              />
            ) : (
              qLine(quizCopy, "pedidoStep1Title", "Como te chamas?")
            )}
          </h2>
          <p className="mt-2 text-sm text-ocean-600">
            {crm ? (
              <CrmInlineText
                label="Passo nome — texto de ajuda"
                multiline
                value={quizCopy.pedidoStep1Hint}
                onApply={(v) => crm.patchQuiz("pedidoStep1Hint", v)}
              />
            ) : (
              qLine(
                quizCopy,
                "pedidoStep1Hint",
                "O nome que preferires que usemos nas mensagens.",
              )
            )}
          </p>
          <input
            type="text"
            autoFocus
            value={form.nome}
            onChange={(e) =>
              setForm((f) => ({ ...f, nome: e.target.value }))
            }
            onKeyDown={(e) => e.key === "Enter" && handleNext()}
            className="mt-8 w-full rounded-2xl border border-ocean-100 bg-white/90 px-4 py-3.5 text-ocean-900 outline-none ring-ocean-500/20 transition focus:border-ocean-500 focus:ring-2"
            placeholder={qLine(quizCopy, "pedidoStep1Placeholder", "O teu nome")}
            autoComplete="name"
          />
        </div>
      )}

      {step === 2 && (
        <div className="mx-auto max-w-md">
          <h2 className="text-xl font-semibold text-ocean-900 md:text-2xl">
            {crm ? (
              <CrmInlineText
                label="Passo email — título"
                value={quizCopy.pedidoStep2Title}
                onApply={(v) => crm.patchQuiz("pedidoStep2Title", v)}
              />
            ) : (
              qLine(quizCopy, "pedidoStep2Title", "O teu email")
            )}
          </h2>
          <p className="mt-2 text-sm text-ocean-600">
            {crm ? (
              <CrmInlineText
                label="Passo email — texto de ajuda"
                multiline
                value={quizCopy.pedidoStep2Hint}
                onApply={(v) => crm.patchQuiz("pedidoStep2Hint", v)}
              />
            ) : (
              qLine(
                quizCopy,
                "pedidoStep2Hint",
                "Para te enviarmos confirmação e a proposta quando estiver pronta.",
              )
            )}
          </p>
          <input
            type="email"
            autoFocus
            value={form.email}
            onChange={(e) =>
              setForm((f) => ({ ...f, email: e.target.value }))
            }
            onKeyDown={(e) => e.key === "Enter" && handleNext()}
            className="mt-8 w-full rounded-2xl border border-ocean-100 bg-white/90 px-4 py-3.5 text-ocean-900 outline-none ring-ocean-500/20 transition focus:border-ocean-500 focus:ring-2"
            placeholder={qLine(
              quizCopy,
              "pedidoStep2Placeholder",
              "nome@email.com",
            )}
            autoComplete="email"
          />
        </div>
      )}

      {step === 3 && (
        <div className="mx-auto max-w-md">
          <h2 className="text-xl font-semibold text-ocean-900 md:text-2xl">
            {crm ? (
              <CrmInlineText
                label="Passo telemóvel — título"
                value={quizCopy.pedidoStep3Title}
                onApply={(v) => crm.patchQuiz("pedidoStep3Title", v)}
              />
            ) : (
              qLine(quizCopy, "pedidoStep3Title", "O teu telemóvel")
            )}
          </h2>
          <p className="mt-2 text-sm text-ocean-600">
            {crm ? (
              <CrmInlineText
                label="Passo telemóvel — texto de ajuda"
                multiline
                value={quizCopy.pedidoStep3Hint}
                onApply={(v) => crm.patchQuiz("pedidoStep3Hint", v)}
              />
            ) : (
              qLine(
                quizCopy,
                "pedidoStep3Hint",
                "Para a Sílvia te poder ligar com rapidez se fizer sentido — não partilhamos o número fora deste contacto.",
              )
            )}
          </p>
          <input
            type="tel"
            autoFocus
            inputMode="tel"
            autoComplete="tel"
            value={form.telemovel}
            onChange={(e) =>
              setForm((f) => ({ ...f, telemovel: e.target.value }))
            }
            onKeyDown={(e) => e.key === "Enter" && handleNext()}
            className="mt-8 w-full rounded-2xl border border-ocean-100 bg-white/90 px-4 py-3.5 text-ocean-900 outline-none ring-ocean-500/20 transition focus:border-ocean-500 focus:ring-2"
            placeholder={qLine(
              quizCopy,
              "pedidoStep3Placeholder",
              "Ex.: 912 345 678 ou +351 912 345 678",
            )}
          />
        </div>
      )}

      {step === 4 && (
        <div>
          <h2 className="text-xl font-semibold text-ocean-900 md:text-2xl">
            {crm ? (
              <CrmInlineText
                label="Passo clima — pergunta"
                value={quizCopy.climaQuestion}
                onApply={(v) => crm.patchQuiz("climaQuestion", v)}
              />
            ) : (
              qLine(
                quizCopy,
                "climaQuestion",
                "Que clima te chama mais neste momento?",
              )
            )}
          </h2>
          <p className="mt-2 text-sm text-ocean-600">
            {crm ? (
              <CrmInlineText
                label="Passo clima — ajuda"
                multiline
                value={quizCopy.climaHint}
                onApply={(v) => crm.patchQuiz("climaHint", v)}
              />
            ) : (
              qLine(
                quizCopy,
                "climaHint",
                "É só um ponto de partida — depois combinamos pormenores e alternativas.",
              )
            )}
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {climaOptions.map((opt) => {
              const field = CLIMA_LABEL_QUIZ_FIELD[opt.key];
              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => {
                    setForm((f) => ({ ...f, clima: opt.key }));
                    setError(null);
                    replacePedidoClimaInUrl(
                      router,
                      pathname,
                      pedidoClimaQuery,
                      opt.key,
                    );
                  }}
                  className={`rounded-2xl border px-4 py-4 text-left text-sm font-medium transition ${
                    form.clima === opt.key
                      ? "border-ocean-500 bg-ocean-50 text-ocean-900 shadow-md"
                      : "border-ocean-100 bg-white/80 text-ocean-800 hover:border-ocean-200"
                  }`}
                >
                  {crm ? (
                    <CrmInlineText
                      label={`Opção clima: ${opt.key}`}
                      value={String(quizCopy[field])}
                      onApply={(v) => crm.patchQuiz(field, v)}
                    />
                  ) : (
                    opt.label
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {step === 5 && (
        <div>
          <h2 className="text-xl font-semibold text-ocean-900 md:text-2xl">
            {crm ? (
              <CrmInlineText
                label="Passo experiência — título"
                value={quizCopy.pedidoStep5Title}
                onApply={(v) => crm.patchQuiz("pedidoStep5Title", v)}
              />
            ) : (
              qLine(
                quizCopy,
                "pedidoStep5Title",
                "Que experiência te faz brilhar os olhos?",
              )
            )}
          </h2>
          <p className="mt-2 text-sm text-ocean-600">
            {crm ? (
              <CrmInlineText
                label="Passo experiência — ajuda"
                multiline
                value={quizCopy.pedidoStep5Hint}
                onApply={(v) => crm.patchQuiz("pedidoStep5Hint", v)}
              />
            ) : (
              qLine(
                quizCopy,
                "pedidoStep5Hint",
                "Escolhe a que mais se aproxima — depois afinamos ao pormenor.",
              )
            )}
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
                    : "border-ocean-100 bg-white/80 text-ocean-800 hover:border-ocean-200"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 6 && (
        <div>
          <h2 className="text-xl font-semibold text-ocean-900 md:text-2xl">
            {crm ? (
              <CrmInlineText
                label="Passo companhia — título"
                value={quizCopy.pedidoStep6Title}
                onApply={(v) => crm.patchQuiz("pedidoStep6Title", v)}
              />
            ) : (
              qLine(
                quizCopy,
                "pedidoStep6Title",
                "Com quem imaginas partir à descoberta?",
              )
            )}
          </h2>
          <p className="mt-2 text-sm text-ocean-600">
            {crm ? (
              <CrmInlineText
                label="Passo companhia — ajuda"
                multiline
                value={quizCopy.pedidoStep6Hint}
                onApply={(v) => crm.patchQuiz("pedidoStep6Hint", v)}
              />
            ) : (
              qLine(
                quizCopy,
                "pedidoStep6Hint",
                "Ajuda-nos a pensar em quartos, ritmo e tipo de experiência.",
              )
            )}
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
                    : "border-ocean-100 bg-white/80 text-ocean-800 hover:border-ocean-200"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 7 && (
        <div className="mx-auto max-w-lg">
          <h2 className="text-xl font-semibold text-ocean-900 md:text-2xl">
            {crm ? (
              <CrmInlineText
                label="Passo destino — título"
                value={quizCopy.pedidoStep7Title}
                onApply={(v) => crm.patchQuiz("pedidoStep7Title", v)}
              />
            ) : (
              qLine(
                quizCopy,
                "pedidoStep7Title",
                "Onde queres que a história comece?",
              )
            )}
          </h2>
          <p className="mt-2 text-sm text-ocean-600">
            {crm ? (
              <CrmInlineText
                label="Passo destino — ajuda"
                multiline
                value={quizCopy.pedidoStep7Hint}
                onApply={(v) => crm.patchQuiz("pedidoStep7Hint", v)}
              />
            ) : (
              qLine(
                quizCopy,
                "pedidoStep7Hint",
                "País, ilha, cidade ou até uma ideia vaga — se vieste de uma publicação, já deixámos uma sugestão; podes alterar à vontade.",
              )
            )}
          </p>
          <textarea
            autoFocus
            value={form.destino_sonho}
            onChange={(e) =>
              setForm((f) => ({ ...f, destino_sonho: e.target.value }))
            }
            rows={5}
            className="mt-8 w-full resize-y rounded-2xl border border-ocean-100 bg-white/90 px-4 py-3.5 text-ocean-900 outline-none ring-ocean-500/20 transition focus:border-ocean-500 focus:ring-2"
            placeholder={qLine(
              quizCopy,
              "pedidoStep7Placeholder",
              "Ex.: Maldivas em bungalow sobre a água, Japão na primavera…",
            )}
          />
        </div>
      )}

      {step === 8 && (
        <div>
          <h2 className="text-xl font-semibold text-ocean-900 md:text-2xl">
            {crm ? (
              <CrmInlineText
                label="Passo orçamento — título"
                value={quizCopy.pedidoStep8Title}
                onApply={(v) => crm.patchQuiz("pedidoStep8Title", v)}
              />
            ) : (
              qLine(
                quizCopy,
                "pedidoStep8Title",
                "Em que faixa te queres mover?",
              )
            )}
          </h2>
          <p className="mt-2 text-sm text-ocean-600">
            {crm ? (
              <CrmInlineText
                label="Passo orçamento — ajuda"
                multiline
                value={quizCopy.pedidoStep8Hint}
                onApply={(v) => crm.patchQuiz("pedidoStep8Hint", v)}
              />
            ) : (
              qLine(
                quizCopy,
                "pedidoStep8Hint",
                "Por pessoa ou por casal — como fizer sentido para ti. É só uma referência para calibrarmos expectativas.",
              )
            )}
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
                    : "border-ocean-100 bg-white/80 text-ocean-800 hover:border-ocean-200"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 9 && (
        <div className="mx-auto max-w-lg">
          <h2 className="text-xl font-semibold text-ocean-900 md:text-2xl">
            {crm ? (
              <CrmInlineText
                label="Janela de datas — pergunta"
                value={quizCopy.janelaDatasQuestion}
                onApply={(v) => crm.patchQuiz("janelaDatasQuestion", v)}
              />
            ) : (
              qLine(
                quizCopy,
                "janelaDatasQuestion",
                "Que janela de datas tens em mente?",
              )
            )}
          </h2>
          <p className="mt-2 text-sm text-ocean-600">
            {crm ? (
              <CrmInlineText
                label="Janela de datas — ajuda"
                multiline
                value={quizCopy.janelaDatasHint}
                onApply={(v) => crm.patchQuiz("janelaDatasHint", v)}
              />
            ) : (
              qLine(
                quizCopy,
                "janelaDatasHint",
                "Mesmo aproximada — ajuda a preparar orçamentos sem idas e voltas.",
              )
            )}
          </p>
          <textarea
            autoFocus
            value={form.janela_datas}
            onChange={(e) =>
              setForm((f) => ({ ...f, janela_datas: e.target.value }))
            }
            rows={4}
            className="mt-8 w-full resize-y rounded-2xl border border-ocean-100 bg-white/90 px-4 py-3.5 text-ocean-900 outline-none ring-ocean-500/20 transition focus:border-ocean-500 focus:ring-2"
            placeholder={qLine(
              quizCopy,
              "janelaDatasPlaceholder",
              "Ex.: 10 a 20 de agosto…",
            )}
          />
        </div>
      )}

      {step === 10 && (
        <div>
          <h2 className="text-xl font-semibold text-ocean-900 md:text-2xl">
            {crm ? (
              <CrmInlineText
                label="Flexibilidade — pergunta"
                value={quizCopy.flexDatasQuestion}
                onApply={(v) => crm.patchQuiz("flexDatasQuestion", v)}
              />
            ) : (
              qLine(
                quizCopy,
                "flexDatasQuestion",
                "Quão fixas são essas datas?",
              )
            )}
          </h2>
          <p className="mt-2 text-sm text-ocean-600">
            {crm ? (
              <CrmInlineText
                label="Flexibilidade — ajuda"
                multiline
                value={quizCopy.flexDatasHint}
                onApply={(v) => crm.patchQuiz("flexDatasHint", v)}
              />
            ) : (
              qLine(
                quizCopy,
                "flexDatasHint",
                "Quanto mais margem tiveres, mais opções costumam aparecer.",
              )
            )}
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {(
              [
                {
                  value: "fixas" as const,
                  field: "flexDatasLabelFixas" as const,
                  fb: "Datas fixas (não posso mudar)",
                },
                {
                  value: "mais_menos_semana" as const,
                  field: "flexDatasLabelMaisMenosUmaSemana" as const,
                  fb: "Posso flexibilizar cerca de uma semana",
                },
                {
                  value: "totalmente_flexivel" as const,
                  field: "flexDatasLabelTotalmenteFlex" as const,
                  fb: "Totalmente flexível — o melhor preço manda",
                },
              ] as const
            ).map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  setForm((f) => ({ ...f, flexibilidade_datas: opt.value }));
                  setError(null);
                }}
                className={`rounded-2xl border px-4 py-4 text-left text-sm font-medium transition ${
                  form.flexibilidade_datas === opt.value
                    ? "border-ocean-500 bg-ocean-50 text-ocean-900 shadow-md"
                    : "border-ocean-100 bg-white/80 text-ocean-800 hover:border-ocean-200"
                }`}
              >
                {crm ? (
                  <CrmInlineText
                    label={`Flexibilidade — opção ${opt.value}`}
                    value={String(quizCopy[opt.field])}
                    onApply={(v) => crm.patchQuiz(opt.field, v)}
                  />
                ) : (
                  qLine(quizCopy, opt.field, opt.fb)
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 11 && (
        <div>
          <h2 className="text-xl font-semibold text-ocean-900 md:text-2xl">
            {crm ? (
              <CrmInlineText
                label="Voos/hotel — pergunta"
                value={quizCopy.voosHotelQuestion}
                onApply={(v) => crm.patchQuiz("voosHotelQuestion", v)}
              />
            ) : (
              qLine(
                quizCopy,
                "voosHotelQuestion",
                "Já tens voos ou hotel reservados?",
              )
            )}
          </h2>
          <p className="mt-2 text-sm text-ocean-600">
            {crm ? (
              <CrmInlineText
                label="Voos/hotel — ajuda"
                multiline
                value={quizCopy.voosHotelHint}
                onApply={(v) => crm.patchQuiz("voosHotelHint", v)}
              />
            ) : (
              qLine(
                quizCopy,
                "voosHotelHint",
                "Sabermos isto evita duplicar trabalho na proposta.",
              )
            )}
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {(
              [
                {
                  value: "nada" as const,
                  field: "voosHotelLabelNada" as const,
                  fb: "Ainda não — quero ajuda com tudo",
                },
                {
                  value: "so_voos" as const,
                  field: "voosHotelLabelSoVoos" as const,
                  fb: "Já tenho voos",
                },
                {
                  value: "so_hotel" as const,
                  field: "voosHotelLabelSoHotel" as const,
                  fb: "Já tenho hotel / alojamento",
                },
                {
                  value: "ambos" as const,
                  field: "voosHotelLabelAmbos" as const,
                  fb: "Já tenho voos e hotel",
                },
              ] as const
            ).map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  setForm((f) => ({ ...f, ja_tem_voos_hotel: opt.value }));
                  setError(null);
                }}
                className={`rounded-2xl border px-4 py-4 text-left text-sm font-medium transition ${
                  form.ja_tem_voos_hotel === opt.value
                    ? "border-ocean-500 bg-ocean-50 text-ocean-900 shadow-md"
                    : "border-ocean-100 bg-white/80 text-ocean-800 hover:border-ocean-200"
                }`}
              >
                {crm ? (
                  <CrmInlineText
                    label={`Voos/hotel — opção ${opt.value}`}
                    value={String(quizCopy[opt.field])}
                    onApply={(v) => crm.patchQuiz(opt.field, v)}
                  />
                ) : (
                  qLine(quizCopy, opt.field, opt.fb)
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {(step === 3 || step === 4) && (
        <div className="mt-8 rounded-2xl border border-ocean-200/90 bg-ocean-50/60 p-5 text-left">
          {!quickOpen ? (
            <>
              <p className="text-sm font-medium text-ocean-800">
                {crm ? (
                  <CrmInlineText
                    label="Pedido rápido — título do cartão"
                    value={quizCopy.pedidoRapidoCardTitle}
                    onApply={(v) => crm.patchQuiz("pedidoRapidoCardTitle", v)}
                  />
                ) : (
                  qLine(
                    quizCopy,
                    "pedidoRapidoCardTitle",
                    "Preferes não continuar com todos os passos agora?",
                  )
                )}
              </p>
              <p className="mt-1 text-sm text-ocean-600">
                {crm ? (
                  <CrmInlineText
                    label="Pedido rápido — texto do cartão"
                    multiline
                    value={quizCopy.pedidoRapidoCardBody}
                    onApply={(v) => crm.patchQuiz("pedidoRapidoCardBody", v)}
                  />
                ) : (
                  qLine(
                    quizCopy,
                    "pedidoRapidoCardBody",
                    "Envia um pedido rápido com o contacto que já indicaste e uma linha sobre o destino — a Sílvia trata do resto. O formulário completo continua disponível se quiseres voltar depois.",
                  )
                )}
              </p>
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setQuickOpen(true);
                }}
                className="mt-4 text-sm font-semibold text-ocean-700 underline decoration-ocean-300 underline-offset-4 transition hover:text-ocean-900"
              >
                {crm ? (
                  <CrmInlineText
                    label="Pedido rápido — texto do link"
                    value={quizCopy.pedidoRapidoCardCta}
                    onApply={(v) => crm.patchQuiz("pedidoRapidoCardCta", v)}
                  />
                ) : (
                  qLine(
                    quizCopy,
                    "pedidoRapidoCardCta",
                    "Usar pedido rápido (contacto + destino)",
                  )
                )}
              </button>
            </>
          ) : (
            <div className="space-y-4">
              <p className="text-sm font-medium text-ocean-900">
                {crm ? (
                  <CrmInlineText
                    label="Pedido rápido — título no painel"
                    value={quizCopy.pedidoRapidoModalTitle}
                    onApply={(v) => crm.patchQuiz("pedidoRapidoModalTitle", v)}
                  />
                ) : (
                  qLine(quizCopy, "pedidoRapidoModalTitle", "Pedido rápido")
                )}
              </p>
              <p className="text-sm text-ocean-600">
                {crm ? (
                  <CrmInlineText
                    label="Pedido rápido — texto no painel"
                    multiline
                    value={quizCopy.pedidoRapidoModalBody}
                    onApply={(v) => crm.patchQuiz("pedidoRapidoModalBody", v)}
                  />
                ) : (
                  qLine(
                    quizCopy,
                    "pedidoRapidoModalBody",
                    "Uma linha sobre onde queres ir ou o que imaginaste — depois completamos pormenores contigo.",
                  )
                )}
              </p>
              <textarea
                value={quickDestino}
                onChange={(e) => setQuickDestino(e.target.value)}
                rows={3}
                className="w-full resize-y rounded-2xl border border-ocean-100 bg-white/95 px-4 py-3 text-sm text-ocean-900 outline-none ring-ocean-500/20 focus:border-ocean-500 focus:ring-2"
                placeholder={qLine(
                  quizCopy,
                  "pedidoRapidoModalPlaceholder",
                  "Ex.: Lua-de-mel nas Maldivas em maio…",
                )}
                autoFocus
              />
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  disabled={quickLoading}
                  onClick={() => void handleQuickSubmit()}
                  className="inline-flex h-11 min-w-[160px] items-center justify-center rounded-2xl bg-terracotta px-5 text-sm font-semibold text-white shadow-md transition hover:bg-terracotta-hover disabled:opacity-60"
                >
                  {quickLoading
                    ? "A enviar…"
                    : qLine(
                        quizCopy,
                        "pedidoRapidoModalSubmit",
                        "Enviar pedido rápido",
                      )}
                </button>
                <button
                  type="button"
                  disabled={quickLoading}
                  onClick={() => {
                    setQuickOpen(false);
                    setQuickDestino("");
                    setError(null);
                  }}
                  className="rounded-2xl px-4 py-2.5 text-sm font-medium text-ocean-600 hover:bg-ocean-100/80"
                >
                  {crm ? (
                    <CrmInlineText
                      label="Pedido rápido — voltar ao formulário completo"
                      value={quizCopy.pedidoRapidoModalBack}
                      onApply={(v) => crm.patchQuiz("pedidoRapidoModalBack", v)}
                    />
                  ) : (
                    qLine(
                      quizCopy,
                      "pedidoRapidoModalBack",
                      "Continuar o pedido completo",
                    )
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {step === 12 && (
        <div className="mx-auto max-w-lg">
          <h2 className="text-xl font-semibold text-ocean-900 md:text-2xl">
            {crm ? (
              <CrmInlineText
                label="Revisão final — título"
                value={quizCopy.pedidoStep12Title}
                onApply={(v) => crm.patchQuiz("pedidoStep12Title", v)}
              />
            ) : (
              qLine(
                quizCopy,
                "pedidoStep12Title",
                "Está tudo como imaginaste?",
              )
            )}
          </h2>
          <p className="mt-2 text-sm text-ocean-600">
            {crm ? (
              <CrmInlineText
                label="Revisão final — ajuda"
                multiline
                value={quizCopy.pedidoStep12Hint}
                onApply={(v) => crm.patchQuiz("pedidoStep12Hint", v)}
              />
            ) : (
              qLine(
                quizCopy,
                "pedidoStep12Hint",
                "Revê os detalhes — depois é connosco: a Sílvia trata do resto.",
              )
            )}
          </p>
          <dl className="mt-8 space-y-4 rounded-2xl bg-ocean-50/80 p-6 text-sm">
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
              <dt className="font-medium text-ocean-500">Clima / ambiente</dt>
              <dd className="mt-1 text-ocean-900">
                {form.clima
                  ? climaLabelForKey(form.clima, quizCopy)
                  : "—"}
              </dd>
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
            <div>
              <dt className="font-medium text-ocean-500">Janela de datas</dt>
              <dd className="mt-1 whitespace-pre-wrap text-ocean-900">
                {form.janela_datas.trim()}
              </dd>
            </div>
            <div>
              <dt className="font-medium text-ocean-500">Flexibilidade</dt>
              <dd className="mt-1 text-ocean-900">
                {form.flexibilidade_datas
                  ? flexibilidadeLabel(form.flexibilidade_datas, quizCopy)
                  : "—"}
              </dd>
            </div>
            <div>
              <dt className="font-medium text-ocean-500">Voos / hotel</dt>
              <dd className="mt-1 text-ocean-900">
                {form.ja_tem_voos_hotel
                  ? voosHotelLabel(form.ja_tem_voos_hotel, quizCopy)
                  : "—"}
              </dd>
            </div>
          </dl>
        </div>
      )}

      <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-ocean-100/80 pt-8">
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
    </>
  );

  const immersivePortal =
    mounted && step >= 1 && step <= LAST_STEP
      ? createPortal(
          <div
            ref={dialogRef}
            tabIndex={-1}
            className={`fixed inset-0 z-[100] flex flex-col outline-none ${shellClass}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="quiz-immersive-title"
          >
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-ocean-900/10 bg-white/10 px-4 py-3 backdrop-blur-sm">
              <p
                id="quiz-immersive-title"
                className="text-xs font-medium uppercase tracking-[0.2em] text-ocean-900/80"
              >
                Pedido de proposta · {step}/{LAST_STEP}
              </p>
              <button
                type="button"
                onClick={handleCloseImmersive}
                className="rounded-full border border-ocean-900/15 bg-white/70 px-4 py-2 text-sm font-medium text-ocean-800 transition hover:bg-white"
                aria-label="Fechar o pedido de proposta"
              >
                Fechar
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-10 pt-6 sm:px-6">
              <div className="mx-auto max-w-lg rounded-3xl border border-white/40 bg-white/92 p-6 shadow-2xl backdrop-blur-md md:p-9">
                {honeypotBlock}
                {progressBlock}
                {errorBlock}
                {stepBlocks}
              </div>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      {step === 0 ? (
        <div className="relative rounded-3xl border border-ocean-100 bg-white p-6 shadow-xl md:p-10">
          {honeypotBlock}
          <div className="text-center md:px-4">
            <h2 className="text-2xl font-semibold tracking-tight text-ocean-900 md:text-3xl">
              {crm ? (
                <CrmInlineText
                  label="Cartão inicial do pedido — título"
                  value={quizCopy.introCardTitle}
                  onApply={(v) => crm.patchQuiz("introCardTitle", v)}
                />
              ) : (
                quizCopy.introCardTitle
              )}
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-ocean-600">
              {crm ? (
                <CrmInlineText
                  label="Cartão inicial do pedido — texto"
                  multiline
                  value={quizCopy.introCardBody}
                  onApply={(v) => crm.patchQuiz("introCardBody", v)}
                />
              ) : (
                quizCopy.introCardBody
              )}
            </p>
            {prefill?.temaDestaque ? (
              <p className="mx-auto mt-6 max-w-lg rounded-2xl border border-ocean-100 bg-ocean-50/80 px-5 py-4 text-sm leading-relaxed text-ocean-800">
                <span className="font-medium text-ocean-900">
                  Trouxeste a inspiração do feed:
                </span>{" "}
                <span className="text-ocean-700">
                  «{prefill.temaDestaque}»
                </span>{" "}
                já está sugerida no passo do destino — podes editar quando
                chegares lá.
              </p>
            ) : null}
            {prefill?.vibe ? (
              <p className="mx-auto mt-6 max-w-lg rounded-2xl border border-ocean-100 bg-ocean-50/80 px-5 py-4 text-sm leading-relaxed text-ocean-800">
                <span className="font-medium text-ocean-900">
                  Estilo de viagem pré-seleccionado:
                </span>{" "}
                <span className="text-ocean-700">
                  «
                  {VIBE_OPTIONS.find((o) => o.value === prefill.vibe)?.label ??
                    prefill.vibe}
                  »
                </span>
                . No passo certo já vem marcado — podes alterar se quiseres.
              </p>
            ) : null}
            <button
              type="button"
              onClick={() => {
                trackFunnelEvent("quiz_open");
                goNext();
              }}
              className="mt-10 inline-flex h-14 min-w-[200px] items-center justify-center rounded-3xl bg-terracotta px-8 text-base font-semibold text-white shadow-lg transition hover:bg-terracotta-hover"
            >
              {crm ? (
                <CrmInlineText
                  label="Cartão inicial — texto do botão"
                  value={quizCopy.introCardCtaLabel}
                  onApply={(v) => crm.patchQuiz("introCardCtaLabel", v)}
                  className="text-white"
                  variant="onDark"
                />
              ) : (
                quizCopy.introCardCtaLabel
              )}
            </button>
          </div>
        </div>
      ) : null}
      {immersivePortal}
    </>
  );
}
