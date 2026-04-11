import type {
  LeadTimelineDirection,
  LeadTimelineRow,
} from "@/lib/crm/lead-timeline";

function directionLabel(d: LeadTimelineDirection): string {
  if (d === "sent") return "Enviado";
  if (d === "received") return "Recebido";
  return "Automático";
}

function directionBadgeClass(d: LeadTimelineDirection): string {
  if (d === "sent") {
    return "bg-ocean-900/90 text-white";
  }
  if (d === "received") {
    return "bg-emerald-100 text-emerald-900";
  }
  return "bg-ocean-100 text-ocean-800";
}

type Props = {
  row: LeadTimelineRow;
  formatWhen: (iso: string) => string;
};

export function LeadTimelineEntry({ row, formatWhen }: Props) {
  const isCrmEmail = row.kind === "crm_email";
  const isCrmInbound = row.kind === "crm_email_inbound";

  return (
    <li className="relative text-sm">
      <span className="absolute -left-[calc(0.5rem+2px)] top-2 h-2 w-2 -translate-x-1/2 rounded-full bg-ocean-400" />
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${directionBadgeClass(row.direction)}`}
        >
          {directionLabel(row.direction)}
        </span>
        <span className="text-[11px] text-ocean-500">
          {formatWhen(row.at)}
        </span>
      </div>
      {isCrmEmail && row.body ? (
        <>
          <p className="mt-1.5 text-[10px] font-semibold uppercase tracking-wider text-ocean-500">
            Assunto
          </p>
          <p className="font-medium text-ocean-900">{row.title}</p>
          <p className="mt-2 text-[10px] font-semibold uppercase tracking-wider text-ocean-500">
            Mensagem enviada
          </p>
          <p className="mt-0.5 whitespace-pre-wrap rounded-lg border border-ocean-100 bg-ocean-50/50 px-2.5 py-2 text-xs leading-relaxed text-ocean-800">
            {row.body}
          </p>
        </>
      ) : isCrmInbound && row.body ? (
        <>
          <p className="mt-1.5 text-[10px] font-semibold uppercase tracking-wider text-ocean-500">
            Assunto
          </p>
          <p className="font-medium text-ocean-900">{row.title}</p>
          <p className="mt-2 text-[10px] font-semibold uppercase tracking-wider text-ocean-500">
            Mensagem recebida (email)
          </p>
          <p className="mt-0.5 whitespace-pre-wrap rounded-lg border border-emerald-100 bg-emerald-50/40 px-2.5 py-2 text-xs leading-relaxed text-ocean-800">
            {row.body}
          </p>
        </>
      ) : (
        <>
          <p className="mt-1 font-medium text-ocean-900">{row.title}</p>
          {row.body ? (
            <p className="mt-1 whitespace-pre-wrap rounded-lg border border-ocean-100/80 bg-ocean-50/30 px-2.5 py-2 text-xs leading-relaxed text-ocean-800">
              {row.body}
            </p>
          ) : null}
        </>
      )}
    </li>
  );
}
