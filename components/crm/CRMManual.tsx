"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { Search, X } from "lucide-react";
import { createElement, useCallback, useMemo, useState } from "react";

import {
  manualData,
  type CrmManualCategory,
  type CrmManualTopic,
} from "@/lib/crm/crm-manual-data";

function topicKey(categoryId: string, topicId: string) {
  return `${categoryId}:${topicId}`;
}

function parseAnswerParagraphs(text: string): string[] {
  return text
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean);
}

type FilteredCategory = CrmManualCategory & {
  topics: CrmManualTopic[];
};

function filterManual(
  query: string,
): { categories: FilteredCategory[]; activeQuery: string } {
  const q = query.trim().toLowerCase();
  if (!q) {
    return {
      categories: manualData.map((c) => ({ ...c, topics: [...c.topics] })),
      activeQuery: "",
    };
  }
  const categories: FilteredCategory[] = [];
  for (const cat of manualData) {
    const topics = cat.topics.filter((t) => {
      const hay = `${t.question} ${t.answer}`.toLowerCase();
      return hay.includes(q);
    });
    if (topics.length) categories.push({ ...cat, topics });
  }
  return { categories, activeQuery: q };
}

const panelVariants = {
  initial: { opacity: 0, x: 12 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -8 },
};

const accordionContentTransition = {
  duration: 0.28,
  ease: [0.25, 0.1, 0.25, 1] as const,
};

export function CRMManual() {
  const [selectedId, setSelectedId] = useState(manualData[0]?.id ?? "");
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const { categories: visibleCategories, activeQuery } = useMemo(
    () => filterManual(search),
    [search],
  );

  const resolvedCategoryId = useMemo(() => {
    if (!visibleCategories.length) return selectedId;
    if (visibleCategories.some((c) => c.id === selectedId)) return selectedId;
    return visibleCategories[0].id;
  }, [visibleCategories, selectedId]);

  const selected = useMemo(
    () =>
      visibleCategories.find((c) => c.id === resolvedCategoryId) ?? null,
    [visibleCategories, resolvedCategoryId],
  );

  const toggleTopic = useCallback((categoryId: string, topicId: string) => {
    const key = topicKey(categoryId, topicId);
    setOpenKey((prev) => (prev === key ? null : key));
  }, []);

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-ocean-100 bg-white p-6 shadow-sm md:p-8">
        <p className="text-xs font-semibold uppercase tracking-wider text-ocean-500">
          Base de conhecimento
        </p>
        <h1 className="mt-1 font-serif text-2xl font-normal tracking-tight text-ocean-900 md:text-3xl">
          Manual do CRM
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-ocean-600 md:text-base">
          Guia em linguagem simples para o dia-a-dia no painel — organizado por
          temas. Abre cada pergunta para ver a resposta.
        </p>

        <div className="relative mt-5 max-w-lg">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ocean-400"
            aria-hidden
          />
          <input
            type="search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setOpenKey(null);
            }}
            placeholder="Pesquisar em todas as categorias…"
            className="w-full rounded-xl border border-ocean-100 bg-ocean-50/50 py-2.5 pl-10 pr-10 text-sm text-ocean-900 placeholder:text-ocean-400 outline-none transition focus:border-ocean-300 focus:bg-white focus:ring-2 focus:ring-ocean-100"
            aria-label="Pesquisar no manual"
          />
          {search ? (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setOpenKey(null);
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-ocean-500 transition hover:bg-ocean-100 hover:text-ocean-800"
              aria-label="Limpar pesquisa"
            >
              <X className="size-4" />
            </button>
          ) : null}
        </div>

        {activeQuery && visibleCategories.length === 0 ? (
          <p className="mt-4 text-sm text-ocean-600">
            Nenhum resultado. Tenta outras palavras ou{" "}
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setOpenKey(null);
              }}
              className="font-medium text-ocean-800 underline underline-offset-2"
            >
              limpa a pesquisa
            </button>
            .
          </p>
        ) : null}
      </header>

      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,260px)_1fr] lg:items-start">
        {/* Sidebar — categorias */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <p className="mb-2 hidden text-xs font-medium uppercase tracking-wider text-ocean-500 lg:block">
            Categorias
          </p>
          <nav
            className="flex gap-1.5 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0"
            aria-label="Categorias do manual"
          >
            {visibleCategories.map((cat) => {
              const Icon = cat.icon;
              const isActive = cat.id === resolvedCategoryId;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setSelectedId(cat.id);
                    setOpenKey(null);
                  }}
                  className={`flex min-w-[200px] shrink-0 items-start gap-3 rounded-xl border px-3 py-2.5 text-left text-sm transition lg:min-w-0 lg:shrink ${
                    isActive
                      ? "border-ocean-200 bg-white text-ocean-900 shadow-sm"
                      : "border-transparent bg-white/60 text-ocean-700 hover:border-ocean-100 hover:bg-white"
                  }`}
                >
                  <span
                    className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg ${
                      isActive
                        ? "bg-ocean-100 text-ocean-800"
                        : "bg-ocean-50 text-ocean-600"
                    }`}
                  >
                    <Icon className="size-4" aria-hidden />
                  </span>
                  <span className="min-w-0 leading-snug">
                    <span className="font-semibold">{cat.title}</span>
                    {activeQuery ? (
                      <span className="mt-0.5 block text-xs font-normal text-ocean-500">
                        {cat.topics.length} resultado
                        {cat.topics.length === 1 ? "" : "s"}
                      </span>
                    ) : null}
                  </span>
                </button>
              );
            })}
          </nav>

          <div className="mt-4 hidden rounded-xl border border-dashed border-ocean-200 bg-ocean-50/40 p-4 text-xs text-ocean-600 lg:block">
            <p className="font-medium text-ocean-800">Atalhos</p>
            <ul className="mt-2 space-y-1.5">
              <li>
                <Link
                  href="/crm"
                  className="text-ocean-700 underline-offset-2 hover:text-ocean-900 hover:underline"
                >
                  Quadro de leads
                </Link>
              </li>
              <li>
                <Link
                  href="/crm/site"
                  className="text-ocean-700 underline-offset-2 hover:text-ocean-900 hover:underline"
                >
                  Conteúdo do site
                </Link>
              </li>
              <li>
                <Link
                  href="/crm/publicacoes"
                  className="text-ocean-700 underline-offset-2 hover:text-ocean-900 hover:underline"
                >
                  Publicações
                </Link>
              </li>
            </ul>
          </div>
        </aside>

        {/* Painel principal */}
        <section
          className="min-h-[320px] rounded-2xl border border-ocean-100 bg-white p-5 shadow-sm sm:p-6 md:p-8"
          aria-live="polite"
        >
          <AnimatePresence mode="wait">
            {selected ? (
              <motion.div
                key={selected.id + activeQuery}
                role="region"
                aria-labelledby={`manual-cat-${selected.id}`}
                variants={panelVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
                className="space-y-6"
              >
                <div className="flex flex-wrap items-start gap-3 border-b border-ocean-100 pb-5">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-ocean-50 text-ocean-700">
                    {createElement(selected.icon, {
                      className: "size-5",
                      "aria-hidden": true,
                    })}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h2
                      id={`manual-cat-${selected.id}`}
                      className="text-lg font-semibold tracking-tight text-ocean-900 md:text-xl"
                    >
                      {selected.title}
                    </h2>
                    <p className="mt-1 text-sm text-ocean-600">
                      {selected.description}
                    </p>
                  </div>
                </div>

                <ul className="space-y-2">
                  {selected.topics.map((topic) => {
                    const key = topicKey(selected.id, topic.id);
                    const isOpen = openKey === key;
                    const paragraphs = parseAnswerParagraphs(topic.answer);
                    return (
                      <li
                        key={topic.id}
                        className="overflow-hidden rounded-xl border border-ocean-100 bg-ocean-50/30"
                      >
                        <h3 className="m-0">
                          <button
                            type="button"
                            id={`manual-q-${key}`}
                            aria-expanded={isOpen}
                            aria-controls={`manual-a-${key}`}
                            onClick={() => toggleTopic(selected.id, topic.id)}
                            className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left text-sm font-semibold text-ocean-900 transition hover:bg-white/80"
                          >
                            <span className="min-w-0">{topic.question}</span>
                            <motion.span
                              animate={{ rotate: isOpen ? 180 : 0 }}
                              transition={{ duration: 0.2 }}
                              className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-white text-ocean-500 shadow-sm"
                              aria-hidden
                            >
                              <svg
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="m6 9 6 6 6-6" />
                              </svg>
                            </motion.span>
                          </button>
                        </h3>

                        <AnimatePresence initial={false}>
                          {isOpen ? (
                            <motion.div
                              id={`manual-a-${key}`}
                              role="region"
                              aria-labelledby={`manual-q-${key}`}
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={accordionContentTransition}
                              className="overflow-hidden border-t border-ocean-100/80"
                            >
                              <div className="space-y-3 px-4 py-4">
                                {paragraphs.map((p, i) => (
                                  <p
                                    key={i}
                                    className="text-sm leading-relaxed text-ocean-700"
                                  >
                                    {p}
                                  </p>
                                ))}
                                {topic.mediaPlaceholder ? (
                                  <div
                                    className="mt-4 flex aspect-video items-center justify-center rounded-lg bg-gray-100 text-sm text-gray-400"
                                    aria-hidden
                                  >
                                    Espaço para GIF explicativo
                                  </div>
                                ) : null}
                              </div>
                            </motion.div>
                          ) : null}
                        </AnimatePresence>
                      </li>
                    );
                  })}
                </ul>
              </motion.div>
            ) : (
              <motion.p
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm text-ocean-600"
              >
                Sem categorias para mostrar.
              </motion.p>
            )}
          </AnimatePresence>
        </section>
      </div>

    </div>
  );
}
