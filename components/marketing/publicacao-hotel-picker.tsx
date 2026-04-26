"use client";

import { useMemo, useState } from "react";

import type { PostHotelVariant } from "@/lib/posts/post-variants-types";

type Props = {
  hotels: PostHotelVariant[];
  selectedHotelId: string | null;
  onSelect: (id: string) => void;
};

export function PublicacaoHotelPicker({ hotels, selectedHotelId, onSelect }: Props) {
  const [regimeFilter, setRegimeFilter] = useState<string>("all");
  const [petsOnly, setPetsOnly] = useState(false);
  const [sortBy, setSortBy] = useState<"default" | "name" | "priceAsc" | "priceDesc">("default");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [expandedHotelId, setExpandedHotelId] = useState<string | null>(null);

  const regimes = useMemo(() => {
    const unique = new Set<string>();
    for (const hotel of hotels) {
      if (hotel.regime?.trim()) unique.add(hotel.regime.trim());
    }
    return Array.from(unique).sort((a, b) => a.localeCompare(b, "pt-PT"));
  }, [hotels]);

  const filteredHotels = useMemo(() => {
    const base = hotels.filter((hotel) => {
      if (regimeFilter !== "all" && (hotel.regime?.trim() ?? "") !== regimeFilter) return false;
      if (petsOnly && hotel.pets_allowed !== true) return false;
      return true;
    });
    if (sortBy === "name") return [...base].sort((a, b) => a.nome.localeCompare(b.nome, "pt-PT"));
    if (sortBy === "priceAsc") {
      return [...base].sort((a, b) => (a.preco_delta_eur ?? Number.MAX_SAFE_INTEGER) - (b.preco_delta_eur ?? Number.MAX_SAFE_INTEGER));
    }
    if (sortBy === "priceDesc") {
      return [...base].sort((a, b) => (b.preco_delta_eur ?? Number.MIN_SAFE_INTEGER) - (a.preco_delta_eur ?? Number.MIN_SAFE_INTEGER));
    }
    return [...base].sort((a, b) => a.ordem - b.ordem);
  }, [hotels, regimeFilter, petsOnly, sortBy]);

  const hasActiveFilters = regimeFilter !== "all" || petsOnly || sortBy !== "default";

  if (!hotels.length) {
    return (
      <p className="rounded-xl border border-ocean-100 bg-ocean-50 px-4 py-3 text-sm text-ocean-700">
        Esta publicação não tem hotéis configurados.
      </p>
    );
  }

  const filtersBlock = (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ocean-500">Filtros</p>
        <p className="mt-1 text-sm text-ocean-700">Refina a lista para comparar mais depressa.</p>
      </div>
      <label className="block text-sm text-ocean-700">
        Regime
        <select
          value={regimeFilter}
          onChange={(e) => setRegimeFilter(e.target.value)}
          className="mt-1 w-full rounded-xl border border-ocean-200 bg-white px-3 py-2 text-sm"
        >
          <option value="all">Todos os regimes</option>
          {regimes.map((regime) => (
            <option key={regime} value={regime}>
              {regime}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm text-ocean-700">
        Ordenar por
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as "default" | "name" | "priceAsc" | "priceDesc")}
          className="mt-1 w-full rounded-xl border border-ocean-200 bg-white px-3 py-2 text-sm"
        >
          <option value="default">Recomendação</option>
          <option value="name">Nome (A-Z)</option>
          <option value="priceAsc">Preço (mais baixo)</option>
          <option value="priceDesc">Preço (mais alto)</option>
        </select>
      </label>
      <label className="flex cursor-pointer items-start gap-2 rounded-xl border border-ocean-100 bg-ocean-50 px-3 py-2 text-sm text-ocean-800">
        <input
          type="checkbox"
          checked={petsOnly}
          onChange={(e) => setPetsOnly(e.target.checked)}
          className="mt-1"
        />
        Aceita animais de estimação
      </label>
      {hasActiveFilters ? (
        <button
          type="button"
          onClick={() => {
            setRegimeFilter("all");
            setPetsOnly(false);
            setSortBy("default");
          }}
          className="w-full rounded-xl border border-ocean-200 px-3 py-2 text-sm font-semibold text-ocean-700 hover:bg-ocean-50"
        >
          Limpar filtros
        </button>
      ) : null}
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between lg:hidden">
        <p className="text-sm font-semibold text-ocean-800">{filteredHotels.length} hotéis disponíveis</p>
        <button
          type="button"
          onClick={() => setIsDrawerOpen(true)}
          className="rounded-xl border border-ocean-200 bg-white px-3 py-2 text-sm font-semibold text-ocean-800"
        >
          Filtros
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="hidden rounded-2xl border border-ocean-100 bg-ocean-50/70 p-4 lg:block">
          {filtersBlock}
        </aside>

        <div className="space-y-3">
          {filteredHotels.length === 0 ? (
            <p className="rounded-xl border border-ocean-100 bg-ocean-50 px-4 py-3 text-sm text-ocean-700">
              Nenhum hotel corresponde aos filtros aplicados.
            </p>
          ) : null}
          {filteredHotels.map((hotel) => {
            const isSelected = selectedHotelId === hotel.id;
            const isExpanded = expandedHotelId === hotel.id || isSelected;
            const thumb = hotel.media.find((m) => m.kind === "image")?.url;
            const gallery = hotel.media.filter((m) => m.kind === "image").slice(0, 4);
            const highlights = [
              hotel.regime ? `Regime: ${hotel.regime}` : null,
              hotel.capacidade_max ? `Até ${hotel.capacidade_max} pessoas` : null,
              hotel.pets_allowed === true ? "Pet friendly" : null,
            ].filter(Boolean);
            return (
              <article
                key={hotel.id}
                className={`overflow-hidden rounded-2xl border bg-white transition ${
                  isSelected ? "border-ocean-700 shadow-md ring-2 ring-ocean-100" : "border-ocean-100"
                }`}
              >
                <div className="grid gap-4 p-4 md:grid-cols-[220px_minmax(0,1fr)_190px] md:items-start">
                  <div className="overflow-hidden rounded-xl bg-ocean-100">
                    {thumb ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={thumb} alt={hotel.nome} className="h-36 w-full object-cover md:h-32" />
                    ) : (
                      <div className="flex h-36 items-center justify-center text-sm text-ocean-600 md:h-32">
                        Sem imagem
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-ocean-900">{hotel.nome}</h3>
                    {hotel.descricao ? (
                      <p className="line-clamp-2 text-sm leading-relaxed text-ocean-700">{hotel.descricao}</p>
                    ) : null}
                    {highlights.length > 0 ? (
                      <ul className="flex flex-wrap gap-2">
                        {highlights.map((item) => (
                          <li
                            key={`${hotel.id}-${item}`}
                            className="rounded-full bg-ocean-50 px-2.5 py-1 text-xs font-medium text-ocean-700"
                          >
                            {item}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                  <div className="space-y-3 md:text-right">
                    <p className="text-sm font-semibold text-ocean-800">
                      {hotel.preco_label ?? "Preço sob consulta"}
                    </p>
                    <div className="flex gap-2 md:justify-end">
                      <button
                        type="button"
                        onClick={() => setExpandedHotelId((prev) => (prev === hotel.id ? null : hotel.id))}
                        className="w-full rounded-xl border border-ocean-200 px-3 py-2 text-sm font-semibold text-ocean-900 hover:bg-ocean-50 md:w-auto"
                      >
                        {isExpanded ? "Menos detalhes" : "Ver detalhes"}
                      </button>
                      <button
                        type="button"
                        onClick={() => onSelect(hotel.id)}
                        className={`w-full rounded-xl px-4 py-2 text-sm font-semibold md:w-auto ${
                          isSelected
                            ? "bg-ocean-900 text-white"
                            : "border border-ocean-200 text-ocean-900 hover:bg-ocean-50"
                        }`}
                      >
                        {isSelected ? "Selecionado" : "Selecionar"}
                      </button>
                    </div>
                  </div>
                </div>
                {isExpanded ? (
                  <div className="border-t border-ocean-100 bg-ocean-50/60 p-4">
                    {hotel.condicoes ? (
                      <p className="text-sm leading-relaxed text-ocean-700">{hotel.condicoes}</p>
                    ) : (
                      <p className="text-sm text-ocean-600">Sem condições adicionais publicadas.</p>
                    )}
                    {gallery.length > 1 ? (
                      <div className="mt-3 grid grid-cols-4 gap-2">
                        {gallery.map((item) => (
                          <div key={item.id} className="overflow-hidden rounded-lg bg-white">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={item.url}
                              alt={item.alt ?? hotel.nome}
                              className="h-16 w-full object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      </div>

      {isDrawerOpen ? (
        <div className="fixed inset-0 z-40 bg-ocean-950/40 lg:hidden">
          <div className="absolute inset-y-0 right-0 w-[88%] max-w-sm overflow-y-auto bg-white p-4 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold text-ocean-900">Filtros de hotéis</h3>
              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                className="rounded-lg border border-ocean-200 px-2.5 py-1 text-sm text-ocean-700"
              >
                Fechar
              </button>
            </div>
            {filtersBlock}
          </div>
          <button
            type="button"
            aria-label="Fechar filtros"
            onClick={() => setIsDrawerOpen(false)}
            className="absolute inset-0 -z-10"
          />
        </div>
      ) : null}
    </div>
  );
}
