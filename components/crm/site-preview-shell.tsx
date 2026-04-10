"use client";

import Link from "next/link";
import { useMemo, useSyncExternalStore } from "react";

import { ConsultoraSection } from "@/components/marketing/consultora-section";
import { ExperienceFeed } from "@/components/marketing/experience-feed";
import { LuxuryHero } from "@/components/marketing/luxury-hero";
import { QuizSection } from "@/components/marketing/quiz-section";

import {
  DEFAULT_SITE_CONTENT,
  mergeSiteContentFromDb,
  parseSiteContentForSave,
  type SiteContent,
} from "@/lib/site/site-content";
import { SITE_PREVIEW_STORAGE_KEY } from "@/lib/site/site-preview-storage";
import type { PublishedPost } from "@/types/post";

type Props = {
  posts: PublishedPost[];
};

function subscribe(onChange: () => void) {
  if (typeof window === "undefined") return () => {};
  const handler = () => onChange();
  window.addEventListener("storage", handler);
  return () => window.removeEventListener("storage", handler);
}

function readDraftRaw(): string {
  if (typeof window === "undefined") return "";
  try {
    return window.localStorage.getItem(SITE_PREVIEW_STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

function parseDraft(raw: string): SiteContent | null {
  if (!raw.trim()) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    return (
      parseSiteContentForSave(parsed) ?? mergeSiteContentFromDb(parsed)
    );
  } catch {
    return DEFAULT_SITE_CONTENT;
  }
}

export function SitePreviewShell({ posts }: Props) {
  const raw = useSyncExternalStore(subscribe, readDraftRaw, () => "");

  const site = useMemo(() => parseDraft(raw), [raw]);

  if (site === null) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-ocean-200 bg-white p-8 text-center shadow-sm">
        <p className="text-ocean-800">Não há rascunho para mostrar.</p>
        <p className="mt-2 text-sm text-ocean-600">
          No editor do site, edita os textos e clica em «Pré-visualizar
          rascunho» — abre esta página com o que tens no ecrã (ainda sem
          guardar).
        </p>
        <Link
          href="/crm/site"
          className="mt-6 inline-block rounded-xl bg-ocean-900 px-5 py-2.5 text-sm font-semibold text-white"
        >
          Ir ao editor do site
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sand">
      <div className="sticky top-0 z-[100] border-b border-amber-200/80 bg-amber-100/95 px-4 py-3 text-center text-sm text-ocean-900 shadow-sm backdrop-blur-sm">
        <span className="font-semibold">Pré-visualização</span>
        <span className="text-ocean-700">
          {" "}
          — só tu vês isto. O site público só muda quando guardas no editor.
        </span>
        <div className="mt-2 flex flex-wrap justify-center gap-3 text-xs">
          <Link
            href="/crm/site"
            className="font-medium text-ocean-800 underline underline-offset-2"
          >
            ← Voltar ao editor
          </Link>
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-ocean-800 underline underline-offset-2"
          >
            Abrir site público (nova aba)
          </a>
        </div>
      </div>
      <LuxuryHero copy={site.hero} />
      <ExperienceFeed
        posts={posts}
        feed={site.feed}
        featuredVideo={site.featuredVideo}
      />
      <ConsultoraSection copy={site.consultora} />
      <QuizSection copy={site.quiz} quizKey="preview" />
    </div>
  );
}
