"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import {
  LEAD_THANKS_EMAIL_SENT_KEY,
  LEAD_THANKS_NAME_KEY,
} from "@/lib/marketing/lead-thanks-storage";
import type { SiteContent } from "@/lib/site/site-content";

type Props = {
  copy: SiteContent["quizSuccess"];
};

function applyNome(template: string, nome: string): string {
  const n = nome.trim() || "viajante";
  return template.split("{nome}").join(n);
}

export function ThankYouBoardingPass({ copy }: Props) {
  const [nome, setNome] = useState("");
  const [emailSent, setEmailSent] = useState(false);

  useEffect(() => {
    try {
      setNome(sessionStorage.getItem(LEAD_THANKS_NAME_KEY) ?? "");
      setEmailSent(
        sessionStorage.getItem(LEAD_THANKS_EMAIL_SENT_KEY) === "true",
      );
    } catch {
      setNome("");
    }
  }, []);

  const spotify = copy.spotifyUrl.trim();
  const showSpotify =
    spotify.startsWith("https://") || spotify.startsWith("http://");

  const cardBg = copy.cardBackgroundUrl.trim();
  const showCardBg =
    cardBg.startsWith("https://") || cardBg.startsWith("http://");

  return (
    <div className="mx-auto max-w-lg px-4 py-16 sm:py-24">
      <div
        className="relative overflow-hidden rounded-2xl border-2 border-dashed border-ocean-300/80 bg-gradient-to-br from-white via-sand to-ocean-50/40 p-8 shadow-[0_24px_60px_-28px_rgba(15,61,57,0.35)] sm:p-10"
        style={{
          backgroundImage: showCardBg
            ? undefined
            : `repeating-linear-gradient(
            -12deg,
            transparent,
            transparent 11px,
            rgba(15,61,57,0.04) 11px,
            rgba(15,61,57,0.04) 12px
          )`,
        }}
      >
        {showCardBg ? (
          <>
            <div
              className="pointer-events-none absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${cardBg})` }}
              aria-hidden
            />
            <div
              className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/88 via-sand/90 to-ocean-50/85"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute inset-0 opacity-90"
              style={{
                backgroundImage: `repeating-linear-gradient(
            -12deg,
            transparent,
            transparent 11px,
            rgba(15,61,57,0.05) 11px,
            rgba(15,61,57,0.05) 12px
          )`,
              }}
              aria-hidden
            />
          </>
        ) : null}
        <div className="relative z-[1]">
          <div className="absolute right-6 top-6 h-14 w-14 rounded-full border-2 border-ocean-200/80 bg-white/60" />
          <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-ocean-500">
            Boarding pass
          </p>
          <p className="mt-4 font-serif text-xl text-ocean-800 sm:text-2xl">
            {applyNome(copy.greetingLine, nome)}
          </p>
          <h1 className="mt-4 font-serif text-2xl font-normal leading-snug tracking-tight text-ocean-900 sm:text-3xl">
            {copy.headline}
          </h1>
          <p className="mt-5 text-base leading-relaxed text-ocean-700">
            {copy.body}
          </p>
          {emailSent && copy.emailConfirmLine.trim() ? (
            <p className="mt-4 text-sm text-ocean-600">{copy.emailConfirmLine}</p>
          ) : null}
          {showSpotify ? (
            <a
              href={spotify}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 flex items-center gap-3 rounded-xl border border-ocean-200/80 bg-white/80 px-4 py-3 text-sm font-medium text-ocean-800 transition hover:border-ocean-400 hover:bg-white"
            >
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ocean-900 text-xs font-bold text-white"
                aria-hidden
              >
                ♪
              </span>
              <span>{copy.spotifyLabel}</span>
            </a>
          ) : null}
          <Link
            href="/"
            className="mt-10 inline-flex h-12 items-center justify-center rounded-full bg-ocean-900 px-8 text-sm font-semibold text-white transition hover:bg-ocean-800"
          >
            {copy.backHomeLabel}
          </Link>
        </div>
      </div>
    </div>
  );
}
