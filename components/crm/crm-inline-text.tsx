"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

const CrmInlineActiveContext = createContext(false);

export function CrmVisualInlineEditProvider({
  active,
  children,
}: {
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <CrmInlineActiveContext.Provider value={active}>
      {children}
    </CrmInlineActiveContext.Provider>
  );
}

export function useCrmVisualInlineEditActive() {
  return useContext(CrmInlineActiveContext);
}

type CrmInlineTextProps = {
  value: string;
  onApply: (next: string) => void;
  className?: string;
  multiline?: boolean;
  /** Texto claro sobre fundo escuro (ex.: hero) */
  variant?: "default" | "onDark";
  /** Para o leitor de ecrã / tooltip */
  label: string;
};

export function CrmInlineText({
  value,
  onApply,
  className,
  multiline,
  variant = "default",
  label,
}: CrmInlineTextProps) {
  const active = useCrmVisualInlineEditActive();
  const anchorRef = useRef<HTMLSpanElement>(null);
  const inputRef = useRef<HTMLTextAreaElement | HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);
  const [box, setBox] = useState({ top: 0, left: 0, width: 320 });

  const canUseDom = typeof document !== "undefined";

  const reposition = useCallback(() => {
    const el = anchorRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const pad = 8;
    const w = Math.min(Math.max(r.width, 260), window.innerWidth - 24);
    // fixed = coordenadas da viewport (não somar scrollX/scrollY)
    let left = r.left;
    let top = r.bottom + pad;
    if (left + w > window.innerWidth - 12) {
      left = window.innerWidth - w - 12;
    }
    if (left < 12) left = 12;
    const panelH = multiline ? 200 : 72;
    if (top + panelH > window.innerHeight - 12) {
      top = r.top - pad - (multiline ? 160 : 52);
    }
    if (top < 12) top = 12;
    setBox({ top, left, width: w });
  }, [multiline]);

  useLayoutEffect(() => {
    if (!open) return;
    reposition();
  }, [open, reposition]);

  useEffect(() => {
    if (!open) return;
    function onScroll() {
      reposition();
    }
    function onResize() {
      reposition();
    }
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
    };
  }, [open, reposition]);

  useLayoutEffect(() => {
    if (!open) return;
    const el = inputRef.current;
    if (!el) return;
    el.focus({ preventScroll: true });
  }, [open, multiline]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        setDraft(value);
        setOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, value]);

  function commit() {
    const next = draft.trimEnd();
    onApply(next);
    setOpen(false);
  }

  if (!active) {
    return (
      <span className={className}>
        {value.length > 0 ? value : "\u00a0"}
      </span>
    );
  }

  const highlight =
    variant === "onDark"
      ? "cursor-text rounded-sm px-0.5 ring-1 ring-transparent transition hover:bg-white/10 hover:ring-white/50"
      : "cursor-text rounded-sm px-0.5 decoration-dotted underline-offset-2 transition hover:bg-amber-400/30 hover:decoration-ocean-700/80 hover:underline";

  const portalContent =
    open && canUseDom ? (
      <>
        {/* div (não button): evita que o backdrop seja o primeiro focável e roube o foco ao input */}
        <div
          role="presentation"
          className="fixed inset-0 z-[380] cursor-default bg-ocean-950/20"
          onMouseDown={(e) => {
            e.preventDefault();
          }}
          onClick={() => {
            setDraft(value);
            setOpen(false);
          }}
        />
        <div
          className="pointer-events-auto fixed z-[410] rounded-xl border-2 border-ocean-400 bg-white p-3 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.35)] ring-4 ring-ocean-200/60"
          style={{
            top: box.top,
            left: box.left,
            width: box.width,
            maxWidth: "min(100vw - 24px, 480px)",
          }}
          role="dialog"
          aria-modal="true"
          aria-label={label}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-ocean-500">
            Editar texto
          </p>
          {multiline ? (
            <textarea
              ref={inputRef as React.RefObject<HTMLTextAreaElement>}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={5}
              autoFocus
              className="w-full resize-y rounded-lg border border-ocean-200 bg-ocean-50/30 px-3 py-2 text-sm leading-relaxed text-ocean-900 shadow-inner focus:border-ocean-500 focus:outline-none focus:ring-2 focus:ring-ocean-200"
            />
          ) : (
            <input
              ref={inputRef as React.RefObject<HTMLInputElement>}
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              autoFocus
              className="w-full rounded-lg border border-ocean-200 bg-ocean-50/30 px-3 py-2 text-sm text-ocean-900 shadow-inner focus:border-ocean-500 focus:outline-none focus:ring-2 focus:ring-ocean-200"
            />
          )}
          <div className="mt-3 flex flex-wrap justify-end gap-2">
            <button
              type="button"
              className="rounded-lg border border-ocean-200 px-3 py-1.5 text-sm text-ocean-700 hover:bg-ocean-50"
              onClick={() => {
                setDraft(value);
                setOpen(false);
              }}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="rounded-lg bg-ocean-900 px-4 py-1.5 text-sm font-semibold text-white hover:bg-ocean-800"
              onClick={() => commit()}
            >
              Feito
            </button>
          </div>
        </div>
      </>
    ) : null;

  return (
    <>
      <span
        ref={anchorRef}
        role="button"
        tabIndex={0}
        title="Clica para editar este texto"
        aria-label={label}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDraft(value);
          setOpen(true);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setDraft(value);
            setOpen(true);
          }
        }}
        className={`${highlight} ${className ?? ""}`}
      >
        {value.length > 0 ? value : "…"}
      </span>
      {open && canUseDom ? createPortal(portalContent, document.body) : null}
    </>
  );
}
