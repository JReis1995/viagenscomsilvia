"use client";

import { CrmInlineText } from "@/components/crm/crm-inline-text";
import type { SiteContent } from "@/lib/site/site-content";

type Crm = {
  patch: (
    field:
      | "eyebrow"
      | "title"
      | "subtitle"
      | "firstContactTitle"
      | "firstContactBody"
      | "timingsTitle"
      | "timingsBody",
    value: string,
  ) => void;
  patchStep: (index: number, field: "title" | "body", value: string) => void;
  addStep: () => void;
  removeStep: (index: number) => void;
  moveStep: (index: number, dir: -1 | 1) => void;
};

type Props = {
  copy: SiteContent["howWeWork"];
  showPlaceholder?: boolean;
  crm?: Crm;
};

function stepVisible(s: { title: string; body: string }): boolean {
  return Boolean(s.title.trim() || s.body.trim());
}

export function HowWeWorkSection({ copy, showPlaceholder, crm }: Props) {
  const hasTitle = copy.title.trim().length > 0;
  const stepsPublic = copy.steps.filter(stepVisible);

  if (!crm && !hasTitle) {
    if (!showPlaceholder) return null;
    return (
      <section
        id="como-trabalhamos"
        className="scroll-mt-24 border-t border-ocean-100/80 bg-ocean-50/30 py-14 md:py-16"
        aria-label="Como trabalhamos"
      >
        <div className="mx-auto max-w-6xl px-4 text-center sm:px-6">
          <p className="text-sm text-ocean-500">
            Bloco «Como trabalhamos» — coloca-o na ordem da home e edita-o na
            pré-visualização com conta de consultora.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section
      id="como-trabalhamos"
      className="scroll-mt-24 border-t border-ocean-100/80 bg-ocean-50/30 py-14 md:py-20"
      aria-labelledby="como-trabalhamos-heading"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {crm ? (
          <p className="mb-4 text-xs text-ocean-600">
            Clica nos textos para editar. Usa <strong>Adicionar passo</strong>{" "}
            para mais etapas (máx. 8).
          </p>
        ) : null}
        <header className="max-w-2xl">
          {(crm || copy.eyebrow.trim()) ? (
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ocean-600">
              {crm ? (
                <CrmInlineText
                  label="Processo — linha pequena"
                  value={copy.eyebrow}
                  onApply={(v) => crm.patch("eyebrow", v)}
                />
              ) : (
                copy.eyebrow
              )}
            </p>
          ) : null}
          <h2
            id="como-trabalhamos-heading"
            className="mt-2 font-serif text-2xl font-normal tracking-tight text-ocean-900 md:text-3xl"
          >
            {crm ? (
              <CrmInlineText
                label="Processo — título (vazio esconde o bloco no site)"
                value={copy.title}
                onApply={(v) => crm.patch("title", v)}
              />
            ) : (
              copy.title
            )}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-ocean-700 md:text-base">
            {crm ? (
              <CrmInlineText
                label="Processo — subtítulo"
                multiline
                value={copy.subtitle}
                onApply={(v) => crm.patch("subtitle", v)}
              />
            ) : (
              copy.subtitle
            )}
          </p>
        </header>

        {crm && copy.steps.length > 0 ? (
          <ol className="mt-12 space-y-8 border-l-2 border-ocean-200/90 pl-6 md:pl-8">
            {copy.steps.map((step, idx) => (
              <li key={`step-${idx}`} className="relative">
                <span
                  className="absolute -left-[calc(1.5rem+5px)] top-1 flex h-3 w-3 rounded-full bg-ocean-700 md:-left-[calc(2rem+5px)]"
                  aria-hidden
                />
                <div className="mb-2 flex flex-wrap gap-2 text-[11px] text-ocean-600">
                  <button
                    type="button"
                    className="underline decoration-ocean-300"
                    onClick={() => crm.moveStep(idx, -1)}
                    disabled={idx === 0}
                  >
                    Subir
                  </button>
                  <button
                    type="button"
                    className="underline decoration-ocean-300"
                    onClick={() => crm.moveStep(idx, 1)}
                    disabled={idx === copy.steps.length - 1}
                  >
                    Descer
                  </button>
                  <button
                    type="button"
                    className="font-medium text-terracotta underline"
                    onClick={() => crm.removeStep(idx)}
                  >
                    Remover passo
                  </button>
                </div>
                <h3 className="font-serif text-lg text-ocean-900">
                  <CrmInlineText
                    label="Título do passo"
                    value={step.title}
                    onApply={(v) => crm.patchStep(idx, "title", v)}
                  />
                </h3>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ocean-700">
                  <CrmInlineText
                    label="Descrição do passo"
                    multiline
                    value={step.body}
                    onApply={(v) => crm.patchStep(idx, "body", v)}
                  />
                </p>
              </li>
            ))}
          </ol>
        ) : !crm && stepsPublic.length > 0 ? (
          <ol className="mt-12 space-y-8 border-l-2 border-ocean-200/90 pl-6 md:pl-8">
            {stepsPublic.map((step, idx) => (
              <li key={`step-p-${idx}`} className="relative">
                <span
                  className="absolute -left-[calc(1.5rem+5px)] top-1 flex h-3 w-3 rounded-full bg-ocean-700 md:-left-[calc(2rem+5px)]"
                  aria-hidden
                />
                <h3 className="font-serif text-lg text-ocean-900">
                  {step.title}
                </h3>
                {step.body.trim() ? (
                  <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ocean-700">
                    {step.body}
                  </p>
                ) : null}
              </li>
            ))}
          </ol>
        ) : null}

        {crm && copy.steps.length < 8 ? (
          <div className="mt-8">
            <button
              type="button"
              onClick={() => crm.addStep()}
              className="rounded-full border-2 border-dashed border-ocean-300 bg-white px-5 py-2.5 text-sm font-semibold text-ocean-800 hover:border-ocean-500 hover:bg-ocean-50/80"
            >
              + Adicionar passo
            </button>
          </div>
        ) : null}

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {(crm ||
            copy.firstContactTitle.trim() ||
            copy.firstContactBody.trim()) ? (
            <div className="rounded-2xl border border-ocean-100 bg-white/90 p-6 shadow-sm">
              <h3 className="font-serif text-lg text-ocean-900">
                {crm ? (
                  <CrmInlineText
                    label="Título — primeiro contacto"
                    value={copy.firstContactTitle}
                    onApply={(v) => crm.patch("firstContactTitle", v)}
                  />
                ) : copy.firstContactTitle.trim() ? (
                  copy.firstContactTitle
                ) : null}
              </h3>
              {(crm || copy.firstContactBody.trim()) ? (
                <p className="mt-3 text-sm leading-relaxed text-ocean-700">
                  {crm ? (
                    <CrmInlineText
                      label="Texto — primeiro contacto"
                      multiline
                      value={copy.firstContactBody}
                      onApply={(v) => crm.patch("firstContactBody", v)}
                    />
                  ) : (
                    copy.firstContactBody
                  )}
                </p>
              ) : null}
            </div>
          ) : null}
          {(crm || copy.timingsTitle.trim() || copy.timingsBody.trim()) ? (
            <div className="rounded-2xl border border-ocean-100 bg-white/90 p-6 shadow-sm">
              <h3 className="font-serif text-lg text-ocean-900">
                {crm ? (
                  <CrmInlineText
                    label="Título — prazos"
                    value={copy.timingsTitle}
                    onApply={(v) => crm.patch("timingsTitle", v)}
                  />
                ) : copy.timingsTitle.trim() ? (
                  copy.timingsTitle
                ) : null}
              </h3>
              {(crm || copy.timingsBody.trim()) ? (
                <p className="mt-3 text-sm leading-relaxed text-ocean-700">
                  {crm ? (
                    <CrmInlineText
                      label="Texto — prazos"
                      multiline
                      value={copy.timingsBody}
                      onApply={(v) => crm.patch("timingsBody", v)}
                    />
                  ) : (
                    copy.timingsBody
                  )}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
