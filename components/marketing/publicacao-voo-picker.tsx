"use client";

import type { PostFlightOptionVariant } from "@/lib/posts/post-variants-types";

type Props = {
  flightOptions: PostFlightOptionVariant[];
  selectedFlightId: string | null;
  onSelect: (id: string | null) => void;
  notasVoo: string;
  onNotasVooChange: (value: string) => void;
};

export function PublicacaoVooPicker({
  flightOptions,
  selectedFlightId,
  onSelect,
  notasVoo,
  onNotasVooChange,
}: Props) {
  return (
    <div className="space-y-3">
      {flightOptions.length > 0 ? (
        <div className="space-y-2">
          <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-ocean-100 bg-white px-4 py-3">
            <input
              type="radio"
              checked={selectedFlightId === null}
              onChange={() => onSelect(null)}
              name="flight-option"
            />
            <span className="text-sm text-ocean-800">Sem voo definido (sob consulta)</span>
          </label>
          {flightOptions.map((flight) => {
            const isSelected = selectedFlightId === flight.id;
            return (
              <label
                key={flight.id}
                className={`flex cursor-pointer items-start gap-3 rounded-2xl border px-4 py-3 transition ${
                  isSelected ? "border-ocean-700 bg-ocean-50 shadow-sm" : "border-ocean-100 bg-white"
                }`}
              >
                <input
                  type="radio"
                  checked={isSelected}
                  onChange={() => onSelect(flight.id)}
                  name="flight-option"
                  className="mt-1"
                />
                <span className="space-y-1">
                  <span className="block text-sm font-semibold text-ocean-900">{flight.label}</span>
                  <span className="block text-xs text-ocean-600">
                    {flight.origem_iata && flight.destino_iata
                      ? `${flight.origem_iata} → ${flight.destino_iata}`
                      : "Rota por confirmar"}
                  </span>
                  {flight.preco_label ? (
                    <span className="mt-1 inline-block rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-ocean-700">
                      {flight.preco_label}
                    </span>
                  ) : null}
                </span>
              </label>
            );
          })}
        </div>
      ) : (
        <p className="rounded-xl border border-ocean-100 bg-ocean-50 px-4 py-3 text-sm text-ocean-700">
          Sem opções de voo pré-configuradas.
        </p>
      )}
      <label className="block text-sm text-ocean-700">
        Notas sobre voo (opcional)
        <textarea
          rows={3}
          value={notasVoo}
          onChange={(e) => onNotasVooChange(e.target.value)}
          className="mt-1 w-full rounded-xl border border-ocean-200 px-3 py-2"
          placeholder="Ex.: aeroporto preferido, horário, bagagem..."
        />
      </label>
    </div>
  );
}
