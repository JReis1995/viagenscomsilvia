"use client";

import { useState } from "react";
import type { ReactNode } from "react";

type TabId = "quadro" | "arquivo";

export function CrmHomeTabs({
  quadro,
  arquivo,
}: {
  quadro: ReactNode;
  arquivo: ReactNode;
}) {
  const [tab, setTab] = useState<TabId>("quadro");

  return (
    <div className="space-y-6">
      <div
        className="flex flex-wrap gap-1 rounded-xl border border-ocean-100 bg-ocean-50/40 p-1"
        role="tablist"
        aria-label="Secções do painel de leads"
      >
        <button
          type="button"
          role="tab"
          aria-selected={tab === "quadro"}
          onClick={() => setTab("quadro")}
          className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
            tab === "quadro"
              ? "bg-white text-ocean-900 shadow-sm"
              : "text-ocean-600 hover:bg-white/60 hover:text-ocean-900"
          }`}
        >
          Quadro
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "arquivo"}
          onClick={() => setTab("arquivo")}
          className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
            tab === "arquivo"
              ? "bg-white text-ocean-900 shadow-sm"
              : "text-ocean-600 hover:bg-white/60 hover:text-ocean-900"
          }`}
        >
          Exportar CSV
        </button>
      </div>

      <div
        role="tabpanel"
        hidden={tab !== "quadro"}
        className={`space-y-6 ${tab !== "quadro" ? "hidden" : ""}`}
      >
        {quadro}
      </div>
      <div
        role="tabpanel"
        hidden={tab !== "arquivo"}
        className={`space-y-6 ${tab !== "arquivo" ? "hidden" : ""}`}
      >
        {arquivo}
      </div>
    </div>
  );
}
