"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { HeroClimaEffects } from "@/components/marketing/hero-clima-effects";
import { isAllowedQuizVibe } from "@/components/marketing/quiz-options";
import {
  DEFAULT_HERO_IMAGE_BY_CLIMA,
  parsePedidoClimaParam,
  replacePedidoClimaInUrl,
} from "@/lib/marketing/pedido-clima-url";
import { CrmInlineText } from "@/components/crm/crm-inline-text";
import {
  climaOptionsFromCopy,
  type QuizClimaKey,
} from "@/lib/marketing/quiz-clima";
import type { SiteContent } from "@/lib/site/site-content";
import { getHeroTravelImageUrl } from "@/lib/site/social";

const fadeUp = {
  hidden: { opacity: 0, y: 26 },
  show: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.75, delay, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

type Props = {
  copy: SiteContent["hero"];
  quizCopy: SiteContent["quiz"];
  /** CRM: edição inline + links/botões desactivados */
  crm?: {
    patchHero: (field: keyof SiteContent["hero"], value: string) => void;
    patchQuiz: (field: keyof SiteContent["quiz"], value: string) => void;
  };
};

function climaFieldForKey(
  key: QuizClimaKey,
): keyof SiteContent["quiz"] | null {
  const m: Record<QuizClimaKey, keyof SiteContent["quiz"]> = {
    neve: "climaLabelNeve",
    praia: "climaLabelPraia",
    cidade: "climaLabelCidade",
    misto: "climaLabelMisto",
  };
  return m[key] ?? null;
}

function isHttpUrl(s: string): boolean {
  const t = s.trim();
  return t.startsWith("https://") || t.startsWith("http://");
}

export function LuxuryHero({ copy, quizCopy, crm }: Props) {
  const reduceMotion = useReducedMotion();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const climaSel = parsePedidoClimaParam(searchParams.get("pedido_clima"));

  const heroImageSrc = climaSel
    ? DEFAULT_HERO_IMAGE_BY_CLIMA[climaSel]
    : copy.heroImageUrl.trim() !== ""
      ? copy.heroImageUrl.trim()
      : getHeroTravelImageUrl();

  const videoUrl = copy.heroVideoUrl.trim();
  const posterUrl = copy.heroVideoPosterUrl.trim();
  const useVideo =
    isHttpUrl(videoUrl) && !reduceMotion && !climaSel;

  const climaOptions = climaOptionsFromCopy(quizCopy);

  const promptButtons = [
    { label: copy.promptBtn1Label, vibe: copy.promptBtn1Vibe },
    { label: copy.promptBtn2Label, vibe: copy.promptBtn2Vibe },
    { label: copy.promptBtn3Label, vibe: copy.promptBtn3Vibe },
  ].filter(
    (b) =>
      b.label.trim().length > 0 &&
      isAllowedQuizVibe(b.vibe.trim()),
  ) as { label: string; vibe: string }[];

  const showPrompt =
    copy.promptQuestion.trim().length > 0 && promptButtons.length > 0;

  const lock = !!crm;
  /** Bloqueia navegação/cliques nos botões no CRM, mas permite editar rótulos via CrmInlineText. */
  const navLock = lock
    ? "pointer-events-none [&_.crm-hero-pe]:pointer-events-auto"
    : "";

  function setClimaInUrl(next: typeof climaSel) {
    replacePedidoClimaInUrl(
      router,
      pathname,
      searchParams.toString(),
      next,
    );
  }

  return (
    <section
      id="topo-pagina-inicial"
      className="relative min-h-[min(92svh,900px)] scroll-mt-28 overflow-hidden"
    >
      <div className="absolute inset-0" aria-hidden>
        <motion.div
          className="relative h-full min-h-[min(92svh,900px)] w-full"
          initial={reduceMotion ? false : { scale: 1.12 }}
          animate={reduceMotion ? undefined : { scale: 1 }}
          transition={{ duration: 1.35, ease: [0.22, 1, 0.36, 1] as const }}
        >
          {useVideo ? (
            <video
              className="absolute inset-0 h-full w-full object-cover object-center"
              autoPlay
              muted
              playsInline
              loop
              poster={posterUrl && isHttpUrl(posterUrl) ? posterUrl : undefined}
            >
              <source src={videoUrl} />
            </video>
          ) : (
            /* eslint-disable-next-line @next/next/no-img-element -- URL editável (Storage / CDN) */
            <img
              key={heroImageSrc}
              src={heroImageSrc}
              alt=""
              className="absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-700"
              fetchPriority="high"
              decoding="async"
            />
          )}
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-t from-ocean-950 via-ocean-950/55 to-ocean-900/35" />
        <div className="absolute inset-0 bg-gradient-to-r from-ocean-950/80 via-transparent to-ocean-950/50" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_100%,rgba(15,61,57,0.5),transparent_65%)]" />
        <HeroClimaEffects
          clima={climaSel}
          reduceMotion={reduceMotion ?? false}
        />
      </div>

      <div className="relative z-10 flex min-h-[min(92svh,900px)] flex-col justify-center px-5 pb-16 pt-24 sm:px-8 sm:pb-16 sm:pt-28 md:pb-20 md:pt-24">
        <div className="mx-auto w-full max-w-4xl text-center md:max-w-5xl md:text-left">
          <motion.div
            className="mx-auto mb-10 max-w-2xl md:mx-0"
            initial={reduceMotion ? false : "hidden"}
            animate={reduceMotion ? undefined : "show"}
            variants={fadeUp}
            custom={0}
            role="group"
            aria-label="Clima ou ambiente preferido"
          >
            <p className="text-[11px] font-medium uppercase tracking-[0.32em] text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.85),0_0_12px_rgba(0,0,0,0.45)] sm:text-xs">
              <CrmInlineText
                label="Pergunta do clima no topo"
                variant="onDark"
                value={
                  quizCopy.climaQuestion.trim() ||
                  "Que clima te chama mais neste momento?"
                }
                onApply={(v) => {
                  crm?.patchQuiz("climaQuestion", v);
                }}
              />
            </p>
            <p className="mt-2 max-w-xl text-sm text-white/95 [text-shadow:0_1px_4px_rgba(0,0,0,0.9),0_0_20px_rgba(0,0,0,0.35)] md:max-w-lg">
              <CrmInlineText
                label="Texto de ajuda do clima"
                variant="onDark"
                multiline
                value={
                  quizCopy.climaHint.trim() ||
                  "É só um ponto de partida — depois combinamos pormenores e alternativas."
                }
                onApply={(v) => {
                  crm?.patchQuiz("climaHint", v);
                }}
              />
            </p>
            <div
              className={`mt-4 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:gap-3 ${navLock}`}
            >
              {climaOptions.map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  aria-pressed={climaSel === opt.key}
                  onClick={() =>
                    setClimaInUrl(climaSel === opt.key ? null : opt.key)
                  }
                  className={`inline-flex min-h-[3rem] items-center justify-center rounded-full border-2 px-5 py-2.5 text-center text-[13px] tracking-wide backdrop-blur-md transition duration-200 ${
                    climaSel === opt.key
                      ? "border-amber-400 bg-white font-semibold text-ocean-900 shadow-[0_0_0_2px_rgba(251,191,36,0.95),0_12px_40px_-6px_rgba(0,0,0,0.55)]"
                      : "border-white/55 bg-black/45 font-medium text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.95)] hover:border-white/80 hover:bg-black/55"
                  }`}
                >
                  {crm ? (
                    <CrmInlineText
                      label={`Rótulo do botão de clima (${opt.key})`}
                      variant="onDark"
                      value={opt.label}
                      onApply={(v) => {
                        const f = climaFieldForKey(opt.key);
                        if (f) crm.patchQuiz(f, v);
                      }}
                      className={`crm-hero-pe ${
                        climaSel === opt.key
                          ? "text-ocean-900 [text-shadow:none]"
                          : ""
                      }`}
                    />
                  ) : (
                    opt.label
                  )}
                </button>
              ))}
            </div>
          </motion.div>

          {showPrompt ? (
            <motion.div
              className="mx-auto mb-10 max-w-xl md:mx-0"
              initial={reduceMotion ? false : "hidden"}
              animate={reduceMotion ? undefined : "show"}
              variants={fadeUp}
              custom={0.04}
            >
              <p className="text-[11px] font-medium uppercase tracking-[0.32em] text-white/65 sm:text-xs">
                <CrmInlineText
                  label="Pergunta dos botões de estilo"
                  variant="onDark"
                  value={copy.promptQuestion}
                  onApply={(v) => {
                  crm?.patchHero("promptQuestion", v);
                }}
                />
              </p>
              <div
                className={`mt-4 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:gap-3 ${navLock}`}
              >
                {promptButtons.map((b, i) => {
                  const p = new URLSearchParams(searchParams.toString());
                  p.set("pedido_vibe", b.vibe);
                  const q = p.toString();
                  const href = q
                    ? `/?${q}#pedido-orcamento`
                    : `/#pedido-orcamento`;
                  const field =
                    i === 0
                      ? ("promptBtn1Label" as const)
                      : i === 1
                        ? ("promptBtn2Label" as const)
                        : ("promptBtn3Label" as const);
                  return (
                    <Link
                      key={b.vibe + b.label}
                      href={href}
                      className={`inline-flex min-h-[3rem] items-center justify-center rounded-full border border-white/25 bg-white/10 px-6 py-2.5 text-center text-[13px] font-medium tracking-wide text-white/95 backdrop-blur-md transition hover:border-white/45 hover:bg-white/18 ${navLock}`}
                    >
                      {crm ? (
                        <CrmInlineText
                          label="Texto do botão de estilo"
                          variant="onDark"
                          value={b.label.trim()}
                          onApply={(v) => {
                            crm?.patchHero(field, v);
                          }}
                          className="crm-hero-pe"
                        />
                      ) : (
                        b.label.trim()
                      )}
                    </Link>
                  );
                })}
              </div>
            </motion.div>
          ) : null}

          <motion.p
            className="text-[10px] font-medium uppercase tracking-[0.42em] text-white/70 sm:text-[11px]"
            initial={reduceMotion ? false : "hidden"}
            animate={reduceMotion ? undefined : "show"}
            variants={fadeUp}
            custom={showPrompt ? 0.08 : 0.04}
          >
            <CrmInlineText
              label="Linha pequena (eyebrow) do topo"
              variant="onDark"
              value={copy.eyebrow}
              onApply={(v) => {
                  crm?.patchHero("eyebrow", v);
                }}
            />
          </motion.p>
          <motion.h1
            className="mx-auto mt-6 max-w-[18ch] font-serif text-[2.75rem] font-normal leading-[1.02] tracking-tight text-white drop-shadow-sm sm:max-w-none sm:text-5xl md:text-6xl md:leading-[0.98] lg:text-[3.75rem] xl:text-[4rem] md:mx-0"
            initial={reduceMotion ? false : "hidden"}
            animate={reduceMotion ? undefined : "show"}
            variants={fadeUp}
            custom={showPrompt ? 0.12 : 0.07}
          >
            <span className="block text-white">
              <CrmInlineText
                label="Título — linha 1"
                variant="onDark"
                value={copy.line1}
                onApply={(v) => {
                  crm?.patchHero("line1", v);
                }}
              />
            </span>
            {crm ? (
              <span className="mt-2 block font-light italic text-amber-100">
                <CrmInlineText
                  label="Título — linha em itálico"
                  variant="onDark"
                  value={copy.line2Italic}
                  onApply={(v) => crm.patchHero("line2Italic", v)}
                />
              </span>
            ) : (
              <span className="mt-2 block bg-gradient-to-r from-amber-100 via-white to-cyan-100 bg-clip-text font-light italic text-transparent">
                {copy.line2Italic}
              </span>
            )}
            <span className="mt-1 block text-white/95">
              <CrmInlineText
                label="Título — linha final"
                variant="onDark"
                value={copy.line3}
                onApply={(v) => {
                  crm?.patchHero("line3", v);
                }}
              />
            </span>
          </motion.h1>
          <motion.p
            className="mx-auto mt-8 max-w-xl text-base leading-relaxed text-white/85 sm:text-lg md:mx-0 md:max-w-lg"
            initial={reduceMotion ? false : "hidden"}
            animate={reduceMotion ? undefined : "show"}
            variants={fadeUp}
            custom={showPrompt ? 0.18 : 0.15}
          >
            <CrmInlineText
              label="Parágrafo principal do topo"
              variant="onDark"
              multiline
              value={copy.body}
              onApply={(v) => {
                  crm?.patchHero("body", v);
                }}
            />
          </motion.p>
          <motion.div
            className="mx-auto mt-10 flex max-w-lg flex-col gap-3 sm:flex-row sm:flex-wrap md:mx-0"
            initial={reduceMotion ? false : "hidden"}
            animate={reduceMotion ? undefined : "show"}
            variants={fadeUp}
            custom={showPrompt ? 0.22 : 0.22}
          >
            <a
              href="#pedido-orcamento"
              className={`inline-flex h-14 min-h-[3.5rem] items-center justify-center rounded-full bg-white px-10 text-[15px] font-semibold tracking-wide text-ocean-900 shadow-[0_20px_50px_-18px_rgba(0,0,0,0.4)] transition hover:bg-ocean-50 ${navLock}`}
            >
              {crm ? (
                <CrmInlineText
                  label="Texto do botão principal"
                  value={copy.ctaPrimary}
                  onApply={(v) => {
                    crm?.patchHero("ctaPrimary", v);
                  }}
                  className="crm-hero-pe text-ocean-900"
                />
              ) : (
                copy.ctaPrimary
              )}
            </a>
            <a
              href="#inspiracoes"
              className={`inline-flex h-14 min-h-[3.5rem] items-center justify-center rounded-full border-2 border-white/35 bg-white/10 px-9 text-[15px] font-semibold tracking-wide text-white backdrop-blur-md transition hover:border-white/55 hover:bg-white/20 ${navLock}`}
            >
              {crm ? (
                <CrmInlineText
                  label="Texto do botão secundário"
                  variant="onDark"
                  value={copy.ctaSecondary}
                  onApply={(v) => {
                    crm?.patchHero("ctaSecondary", v);
                  }}
                  className="crm-hero-pe"
                />
              ) : (
                copy.ctaSecondary
              )}
            </a>
          </motion.div>
          <motion.div
            className="mx-auto mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-xs font-medium uppercase tracking-[0.2em] text-white/55 md:mx-0 md:justify-start"
            initial={reduceMotion ? false : "hidden"}
            animate={reduceMotion ? undefined : "show"}
            variants={fadeUp}
            custom={showPrompt ? 0.28 : 0.28}
          >
            <span>
              <CrmInlineText
                label="Frase de confiança 1"
                variant="onDark"
                value={copy.trust1}
                onApply={(v) => {
                  crm?.patchHero("trust1", v);
                }}
              />
            </span>
            <span className="hidden text-white/30 sm:inline" aria-hidden>
              ·
            </span>
            <span>
              <CrmInlineText
                label="Frase de confiança 2"
                variant="onDark"
                value={copy.trust2}
                onApply={(v) => {
                  crm?.patchHero("trust2", v);
                }}
              />
            </span>
            <Link
              href="/login"
              className={`w-full text-center normal-case tracking-normal text-white/80 underline-offset-4 hover:text-white hover:underline sm:w-auto sm:pl-2 ${navLock}`}
            >
              {crm ? (
                <CrmInlineText
                  label="Texto do link da consultora"
                  variant="onDark"
                  value={copy.consultoraLinkLabel}
                  onApply={(v) => {
                    crm?.patchHero("consultoraLinkLabel", v);
                  }}
                  className="crm-hero-pe"
                />
              ) : (
                copy.consultoraLinkLabel
              )}
            </Link>
          </motion.div>
        </div>
      </div>

      <motion.div
        className="relative z-10 flex justify-center pb-8 md:absolute md:bottom-8 md:left-1/2 md:-translate-x-1/2 md:pb-0"
        initial={reduceMotion ? false : { opacity: 0 }}
        animate={reduceMotion ? undefined : { opacity: 1 }}
        transition={{ delay: 0.55, duration: 0.6 }}
        aria-hidden
      >
        <span className="flex flex-col items-center gap-2 text-[10px] font-medium uppercase tracking-[0.35em] text-white/45">
          <CrmInlineText
            label="Texto da seta para descer"
            variant="onDark"
            value={copy.scrollHint}
            onApply={(v) => {
              crm?.patchHero("scrollHint", v);
            }}
          />
          <span className="block h-10 w-px bg-gradient-to-b from-white/40 to-transparent" />
        </span>
      </motion.div>
    </section>
  );
}
