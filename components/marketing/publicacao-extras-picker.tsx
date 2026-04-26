"use client";

import type { PostExtraVariant } from "@/lib/posts/post-variants-types";

type Props = {
  extras: PostExtraVariant[];
  selectedExtraIds: string[];
  onToggle: (id: string) => void;
};

export function PublicacaoExtrasPicker({ extras, selectedExtraIds, onToggle }: Props) {
  if (!extras.length) {
    return (
      <p className="rounded-xl border border-ocean-100 bg-ocean-50 px-4 py-3 text-sm text-ocean-700">
        Sem extras opcionais para esta publicação.
      </p>
    );
  }
  const selected = new Set(selectedExtraIds);
  return (
    <div className="space-y-3">
      {extras.map((extra) => {
        const isSelected = selected.has(extra.id);
        return (
          <label
            key={extra.id}
            className={`flex cursor-pointer items-start gap-3 rounded-2xl border px-4 py-3 transition ${
              isSelected ? "border-ocean-700 bg-ocean-50 shadow-sm" : "border-ocean-100 bg-white"
            }`}
          >
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onToggle(extra.id)}
              className="mt-1"
            />
            <span className="flex-1">
              <span className="block text-sm font-semibold text-ocean-900">{extra.nome}</span>
              {extra.descricao ? (
                <span className="block text-sm text-ocean-700">{extra.descricao}</span>
              ) : null}
              <span className="mt-1 inline-block rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-ocean-700">
                {extra.preco_label ?? "Sob consulta"}
              </span>
            </span>
          </label>
        );
      })}
    </div>
  );
}
