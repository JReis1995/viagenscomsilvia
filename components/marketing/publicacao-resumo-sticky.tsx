"use client";

type Props = {
  hotelNome: string | null;
  extrasLabels: string[];
  vooLabel: string | null;
  totalLabel: string;
  onConfirm: () => void;
  actionLabel?: string;
  compact?: boolean;
  disabled?: boolean;
  showAction?: boolean;
};

export function PublicacaoResumoSticky({
  hotelNome,
  extrasLabels,
  vooLabel,
  totalLabel,
  onConfirm,
  actionLabel = "Continuar",
  compact = false,
  disabled = false,
  showAction = true,
}: Props) {
  return (
    <aside
      className={`z-20 rounded-2xl border border-ocean-200 bg-white/95 shadow-lg backdrop-blur ${
        compact ? "p-3" : "sticky top-4 p-4"
      }`}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ocean-500">
        Resumo da escolha
      </p>
      <p className={`${compact ? "mt-1 text-xs" : "mt-1 text-sm"} text-ocean-800`}>
        Hotel: {hotelNome ?? "Por selecionar"}
      </p>
      <p className={`${compact ? "text-xs" : "text-sm"} text-ocean-800`}>
        Extras: {extrasLabels.length > 0 ? extrasLabels.join(", ") : "Sem extras"}
      </p>
      <p className={`${compact ? "text-xs" : "text-sm"} text-ocean-800`}>
        Voo: {vooLabel ?? "Sem voo definido"}
      </p>
      <p className={`${compact ? "mt-1 text-sm" : "mt-2 text-base"} font-semibold text-ocean-900`}>
        {totalLabel}
      </p>
      {showAction ? (
        <button
          type="button"
          onClick={onConfirm}
          disabled={disabled}
          className={`w-full rounded-xl bg-terracotta px-4 font-semibold text-white disabled:opacity-60 ${
            compact ? "mt-2 py-2 text-xs" : "mt-3 py-2.5 text-sm"
          }`}
        >
          {actionLabel}
        </button>
      ) : null}
    </aside>
  );
}
