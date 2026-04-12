"use client";

import { useState, useTransition } from "react";

import { exportLeadsCsvAction } from "@/app/(dashboard)/crm/actions";

export function CrmLeadsExportButton() {
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  function download() {
    setMsg(null);
    startTransition(() => {
      void (async () => {
        const res = await exportLeadsCsvAction();
        if (!res.ok) {
          setMsg(res.error);
          return;
        }
        const blob = new Blob([res.csv], {
          type: "text/csv;charset=utf-8",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = res.filename;
        a.click();
        URL.revokeObjectURL(url);
      })();
    });
  }

  return (
    <div className="flex shrink-0 flex-col items-stretch gap-1 sm:items-end">
      <button
        type="button"
        disabled={pending}
        onClick={() => download()}
        className="inline-flex min-h-[2.75rem] items-center justify-center rounded-2xl border border-ocean-200 bg-white px-4 py-2.5 text-sm font-semibold text-ocean-900 shadow-sm transition hover:bg-ocean-50 disabled:opacity-50"
      >
        {pending ? "A gerar CSV…" : "Exportar CSV"}
      </button>
      {msg ? (
        <p className="max-w-xs text-right text-xs text-terracotta">{msg}</p>
      ) : null}
    </div>
  );
}
