"use client";

import Image from "next/image";

import type { LeadBoardRow, LeadPostChoiceSnapshotItem } from "@/types/lead";

type Props = {
  lead: LeadBoardRow;
};

function formatEur(value: number | null | undefined): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return "Sob consulta";
  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

function extraPriceLabel(item: LeadPostChoiceSnapshotItem): string {
  if (item.preco_label?.trim()) return item.preco_label.trim();
  if (typeof item.preco_delta_eur === "number" && Number.isFinite(item.preco_delta_eur)) {
    const sign = item.preco_delta_eur > 0 ? "+" : "";
    return `${sign}${item.preco_delta_eur} EUR`;
  }
  return "";
}

export function LeadPostChoiceBlock({ lead }: Props) {
  const choice = lead.post_choice;
  const snapshot = choice?.snapshot;
  const hotel = snapshot?.hotel;
  const extras = snapshot?.extras ?? [];
  const flight = snapshot?.flight;
  const hasChoice = Boolean(hotel || extras.length > 0 || flight || choice?.notas_voo?.trim());

  if (!hasChoice) return null;

  return (
    <section className="mt-6 rounded-xl border border-ocean-200/80 bg-white p-3 shadow-sm">
      <h3 className="text-[10px] font-semibold uppercase tracking-wider text-ocean-600">
        Escolhas do cliente
      </h3>

      {hotel ? (
        <div className="mt-3 rounded-lg border border-ocean-100 bg-ocean-50/40 p-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-ocean-500">
            Hotel escolhido
          </p>
          <div className="mt-2 flex items-center gap-3">
            {lead.post_choice_hotel_thumb_url?.trim() ? (
              <Image
                src={lead.post_choice_hotel_thumb_url}
                alt={hotel.label}
                width={80}
                height={64}
                className="h-16 w-20 rounded-md object-cover"
              />
            ) : null}
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ocean-900">{hotel.label}</p>
              {extraPriceLabel(hotel) ? (
                <p className="text-xs text-ocean-600">{extraPriceLabel(hotel)}</p>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {extras.length > 0 ? (
        <div className="mt-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-ocean-500">Extras</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {extras.map((extra) => (
              <span
                key={extra.id}
                className="inline-flex items-center rounded-full border border-ocean-200 bg-ocean-50 px-2.5 py-1 text-xs text-ocean-800"
              >
                {extra.label}
                {extraPriceLabel(extra) ? ` · ${extraPriceLabel(extra)}` : ""}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {flight ? (
        <div className="mt-3 rounded-lg border border-ocean-100 bg-ocean-50/40 p-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-ocean-500">Voo escolhido</p>
          <p className="mt-1 text-sm font-medium text-ocean-900">{flight.label}</p>
          {extraPriceLabel(flight) ? (
            <p className="text-xs text-ocean-600">{extraPriceLabel(flight)}</p>
          ) : null}
          {choice?.notas_voo?.trim() ? (
            <p className="mt-1 text-xs text-ocean-700">Notas: {choice.notas_voo.trim()}</p>
          ) : null}
        </div>
      ) : null}

      {typeof choice?.rooms_required === "number" ? (
        <p className="mt-3 text-xs text-ocean-700">
          Quartos necessários:{" "}
          <span className="font-semibold text-ocean-900">
            {choice.rooms_required}
          </span>
        </p>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-ocean-100 pt-2">
        <p className="text-xs text-ocean-600">
          Total calculado:{" "}
          <span className="font-semibold text-ocean-900">{formatEur(choice?.computed_total_eur)}</span>
        </p>
        {choice?.computed_at ? (
          <p className="text-[11px] text-ocean-500">
            Calculado em {new Date(choice.computed_at).toLocaleString("pt-PT")}
          </p>
        ) : null}
      </div>
    </section>
  );
}
