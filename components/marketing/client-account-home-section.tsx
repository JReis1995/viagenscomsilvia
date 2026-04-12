"use client";

import Link from "next/link";

import { CrmInlineText } from "@/components/crm/crm-inline-text";
import type { SiteContent } from "@/lib/site/site-content";

type Crm = {
  patch: (
    field: keyof SiteContent["registerIncentive"],
    value: string,
  ) => void;
};

type Props = {
  copy: SiteContent["registerIncentive"];
  showPlaceholder?: boolean;
  crm?: Crm;
};

export function ClientAccountHomeSection({ copy, showPlaceholder, crm }: Props) {
  const title = copy.homeTitle.trim();

  if (!crm && !title) {
    if (!showPlaceholder) return null;
    return (
      <section
        id="conta-cliente"
        className="scroll-mt-24 border-t border-ocean-100/80 bg-white py-12 md:py-14"
        aria-label="Conta de cliente"
      >
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <p className="text-sm text-ocean-500">
            Bloco «Conta de cliente» — na pré-visualização com conta de
            consultora, desce até aqui e clica nos textos para preencher o
            título da home (e publicar depois).
          </p>
        </div>
      </section>
    );
  }

  const ctaLock =
    crm !== undefined
      ? "pointer-events-none [&_.crm-acct-pe]:pointer-events-auto"
      : "";

  return (
    <section
      id="conta-cliente"
      className="scroll-mt-24 border-t border-ocean-100/80 bg-gradient-to-br from-ocean-900 via-ocean-900 to-ocean-950 py-14 text-white md:py-16"
      aria-labelledby="conta-cliente-heading"
    >
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
        {crm ? (
          <p className="mb-3 text-left text-xs text-white/75">
            Clica nos textos para editar. O título da home vazio esconde este
            bloco no site público. Abaixo podes ajustar também o «Obrigado» e o
            ecrã de registo.
          </p>
        ) : null}
        {(crm || copy.homeEyebrow.trim()) ? (
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
            {crm ? (
              <CrmInlineText
                label="Conta na home — linha pequena"
                variant="onDark"
                value={copy.homeEyebrow}
                onApply={(v) => crm.patch("homeEyebrow", v)}
              />
            ) : (
              copy.homeEyebrow
            )}
          </p>
        ) : null}
        <h2
          id="conta-cliente-heading"
          className="mt-3 font-serif text-2xl font-normal tracking-tight md:text-3xl"
        >
          {crm ? (
            <CrmInlineText
              label="Conta na home — título"
              variant="onDark"
              value={copy.homeTitle}
              onApply={(v) => crm.patch("homeTitle", v)}
            />
          ) : (
            title
          )}
        </h2>
        {(crm || copy.homeBody.trim()) ? (
          <p className="mt-4 text-sm leading-relaxed text-white/85 md:text-base">
            {crm ? (
              <CrmInlineText
                label="Conta na home — texto"
                variant="onDark"
                multiline
                value={copy.homeBody}
                onApply={(v) => crm.patch("homeBody", v)}
              />
            ) : (
              copy.homeBody
            )}
          </p>
        ) : null}
        <ul className="mx-auto mt-8 max-w-md list-none space-y-2 text-left text-sm text-white/90">
          <li className="flex gap-2">
            <span className="text-terracotta" aria-hidden>
              ✓
            </span>
            <span>
              {crm ? (
                <CrmInlineText
                  label="Benefício 1 (home + registo)"
                  variant="onDark"
                  value={copy.bullet1}
                  onApply={(v) => crm.patch("bullet1", v)}
                />
              ) : (
                copy.bullet1
              )}
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-terracotta" aria-hidden>
              ✓
            </span>
            <span>
              {crm ? (
                <CrmInlineText
                  label="Benefício 2"
                  variant="onDark"
                  value={copy.bullet2}
                  onApply={(v) => crm.patch("bullet2", v)}
                />
              ) : (
                copy.bullet2
              )}
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-terracotta" aria-hidden>
              ✓
            </span>
            <span>
              {crm ? (
                <CrmInlineText
                  label="Benefício 3"
                  variant="onDark"
                  value={copy.bullet3}
                  onApply={(v) => crm.patch("bullet3", v)}
                />
              ) : (
                copy.bullet3
              )}
            </span>
          </li>
        </ul>
        <div
          className={`mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row ${ctaLock}`}
        >
          <Link
            href="/conta/registar"
            className="inline-flex h-12 min-w-[12rem] items-center justify-center rounded-full bg-white px-8 text-sm font-semibold text-ocean-900 transition hover:bg-sand"
          >
            {crm ? (
              <CrmInlineText
                label="Texto do botão criar conta"
                value={copy.homeCtaLabel.trim() || "Criar conta"}
                onApply={(v) => crm.patch("homeCtaLabel", v)}
                className="crm-acct-pe text-ocean-900"
              />
            ) : (
              copy.homeCtaLabel.trim() || "Criar conta"
            )}
          </Link>
          <Link
            href="/conta/entrar"
            className="text-sm font-medium text-white/90 underline decoration-white/40 underline-offset-2 hover:text-white"
          >
            {crm ? (
              <CrmInlineText
                label="Texto do link já tenho conta"
                variant="onDark"
                value={
                  copy.homeLoginLabel.trim() || "Já tenho conta — entrar"
                }
                onApply={(v) => crm.patch("homeLoginLabel", v)}
                className="crm-acct-pe text-white/90"
              />
            ) : (
              copy.homeLoginLabel.trim() || "Já tenho conta — entrar"
            )}
          </Link>
        </div>

        {crm ? (
          <div className="mt-10 border-t border-white/20 pt-8 text-left">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-white/60">
              Também usado na página «Obrigado» e no registo
            </p>
            <p className="mt-3 text-sm text-white/85">
              <span className="block text-xs font-medium text-white/70">
                Parágrafo antes da caixa no Obrigado
              </span>
              <CrmInlineText
                label="Página Obrigado — texto antes da caixa de conta"
                variant="onDark"
                multiline
                value={copy.thankYouAccountIntro}
                onApply={(v) => crm.patch("thankYouAccountIntro", v)}
                className="mt-1"
              />
            </p>
            <p className="mt-4 text-sm text-white/85">
              <span className="block text-xs font-medium text-white/70">
                Título da caixa (Obrigado + registo)
              </span>
              <CrmInlineText
                label="Headline da caixa de benefícios"
                variant="onDark"
                value={copy.headline}
                onApply={(v) => crm.patch("headline", v)}
                className="mt-1"
              />
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
}
