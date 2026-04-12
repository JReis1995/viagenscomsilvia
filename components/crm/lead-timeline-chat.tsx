import type { ReactNode } from "react";

import type {
  LeadTimelineKind,
  LeadTimelineRow,
} from "@/lib/crm/lead-timeline";

function formatDatePt(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("pt-PT", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function formatTimePt(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString("pt-PT", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

function emptyBodyFallback(kind: LeadTimelineKind): string {
  switch (kind) {
    case "orcamento_pdf":
      return "Orçamento em PDF enviado (sem texto guardado).";
    case "cron":
      return "Lembrete automático registado.";
    default:
      return "Sem texto adicional.";
  }
}

function ChatBubble({
  direction,
  children,
}: {
  direction: "sent" | "received" | "system";
  children: ReactNode;
}) {
  if (direction === "system") {
    return (
      <div className="mx-auto max-w-[min(100%,20rem)] rounded-xl bg-gray-100/95 px-3 py-2 text-center text-xs leading-relaxed text-gray-700">
        {children}
      </div>
    );
  }
  const sent = direction === "sent";
  return (
    <div
      className={`max-w-[min(100%,85%)] rounded-2xl px-3 py-2.5 text-sm leading-relaxed text-ocean-900 ${
        sent
          ? "rounded-br-md bg-teal-50"
          : "rounded-bl-md bg-gray-100"
      }`}
    >
      {children}
    </div>
  );
}

type Props = {
  rows: LeadTimelineRow[];
};

export function LeadTimelineChat({ rows }: Props) {
  if (rows.length === 0) {
    return <p className="px-1 text-sm text-gray-500">Sem eventos.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      {rows.map((row, i) => {
        const date = formatDatePt(row.at);
        const time = formatTimePt(row.at);
        const subject = row.title.trim() || "—";
        const bodyText = row.body?.trim();
        const showBody = Boolean(bodyText);
        const inner =
          showBody && bodyText ? (
            <p className="whitespace-pre-wrap text-sm">{bodyText}</p>
          ) : (
            <p className="text-sm text-ocean-700/90">
              {emptyBodyFallback(row.kind)}
            </p>
          );

        if (row.direction === "system") {
          return (
            <div
              key={`${row.at}-${row.kind}-${i}`}
              className="flex flex-col items-center gap-1.5"
            >
              <p
                className="max-w-full px-1 text-center text-xs text-gray-500"
                title={`${subject}`}
              >
                {date} · {time}
                {subject !== "—" ? ` · ${subject}` : null}
              </p>
              <ChatBubble direction="system">{inner}</ChatBubble>
            </div>
          );
        }

        const sent = row.direction === "sent";
        return (
          <div
            key={`${row.at}-${row.kind}-${i}`}
            className={`flex flex-col gap-1 ${sent ? "items-end" : "items-start"}`}
          >
            <p
              className="max-w-[min(100%,85%)] px-1 text-xs text-gray-500"
              title={subject}
            >
              {date} · {time} · {subject}
            </p>
            <ChatBubble direction={sent ? "sent" : "received"}>
              {inner}
            </ChatBubble>
          </div>
        );
      })}
    </div>
  );
}
