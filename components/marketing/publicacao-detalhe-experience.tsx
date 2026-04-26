"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { PublicacaoExtrasPicker } from "@/components/marketing/publicacao-extras-picker";
import { PublicacaoHotelPicker } from "@/components/marketing/publicacao-hotel-picker";
import { PublicacaoPassageirosForm } from "@/components/marketing/publicacao-passageiros-form";
import { PublicacaoResumoSticky } from "@/components/marketing/publicacao-resumo-sticky";
import { PublicacaoVooPicker } from "@/components/marketing/publicacao-voo-picker";
import {
  campaignTokenPayloadForLead,
  stashCampaignTokenFromSearchParams,
} from "@/lib/marketing/campaign-token-client";
import {
  formatJanelaDatasLabel,
  parsePedidoDataIso,
} from "@/lib/marketing/pedido-datas-url";
import { getLeadMarketingAttributionPayload } from "@/lib/marketing/session-attribution";
import {
  computePostTotal,
  type ComputePostTotalResult,
} from "@/lib/posts/compute-post-total";
import type { PublicacaoComVariantes } from "@/lib/posts/post-variants-types";
import { createClient } from "@/lib/supabase/client";
import type { SiteContent } from "@/lib/site/site-content";

type Props = {
  post: PublicacaoComVariantes;
  quizCopy: SiteContent["quiz"];
};

function parseKidsAges(raw: string): number[] {
  return raw
    .split(",")
    .map((v) => Number.parseInt(v.trim(), 10))
    .filter((n) => Number.isFinite(n) && n >= 0 && n <= 17)
    .slice(0, 10);
}

function eurLabel(value: number): string {
  return new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(value);
}

const POST_CHOICE_SESSION_KEY = "post_choice_session_key";

function getChoiceSessionKey(): string {
  try {
    const existing = window.localStorage.getItem(POST_CHOICE_SESSION_KEY);
    if (existing && existing.trim()) return existing;
    const generated = crypto.randomUUID();
    window.localStorage.setItem(POST_CHOICE_SESSION_KEY, generated);
    return generated;
  } catch {
    return `fallback-${Date.now()}`;
  }
}

export function PublicacaoDetalheExperience({ post, quizCopy }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const rawPetsPreference = (searchParams.get("pedido_animais_estimacao") ?? "")
    .trim()
    .toLowerCase();
  const petsPreference =
    rawPetsPreference === "1" ||
    rawPetsPreference === "true" ||
    rawPetsPreference === "sim"
      ? true
      : rawPetsPreference === "0" ||
          rawPetsPreference === "false" ||
          rawPetsPreference === "nao" ||
          rawPetsPreference === "não"
        ? false
        : null;
  const filteredHotels = useMemo(() => {
    if (petsPreference !== true) return post.hotels;
    return post.hotels.filter((hotel) => hotel.pets_allowed !== false);
  }, [post.hotels, petsPreference]);
  const filteredExtras = useMemo(() => {
    if (petsPreference !== true) return post.extras;
    return post.extras.filter((extra) => extra.pets_allowed !== false);
  }, [post.extras, petsPreference]);
  const filteredFlightOptions = useMemo(() => {
    if (petsPreference !== true) return post.flight_options;
    return post.flight_options.filter((flight) => flight.pets_allowed !== false);
  }, [post.flight_options, petsPreference]);
  const hasHotelOptions = filteredHotels.length > 0;
  const hasExtrasOptions = filteredExtras.length > 0;
  const hasFlightOptions = filteredFlightOptions.length > 0;
  const hasVariantFlow =
    post.has_variants ||
    hasHotelOptions ||
    hasExtrasOptions ||
    hasFlightOptions;
  const flowSteps = useMemo<Array<1 | 2 | 3 | 4>>(
    () => [
      ...(hasHotelOptions ? [1 as const] : []),
      ...(hasExtrasOptions ? [2 as const] : []),
      ...(hasFlightOptions ? [3 as const] : []),
      4,
    ],
    [hasHotelOptions, hasExtrasOptions, hasFlightOptions],
  );
  const [adultos, setAdultos] = useState(searchParams.get("pedido_adultos") ?? "2");
  const [criancas, setCriancas] = useState(searchParams.get("pedido_criancas") ?? "0");
  const [quartosNecessarios, setQuartosNecessarios] = useState(
    searchParams.get("pedido_quartos") ?? "1",
  );
  const [idadesCriancas, setIdadesCriancas] = useState<number[]>(() => {
    const fromQuery = parseKidsAges(searchParams.get("pedido_idades_criancas") ?? "");
    const kids = Number.parseInt(searchParams.get("pedido_criancas") ?? "0", 10);
    if (!Number.isFinite(kids) || kids <= 0) return [];
    if (fromQuery.length >= kids) return fromQuery.slice(0, kids);
    return [...fromQuery, ...Array.from({ length: kids - fromQuery.length }, () => 7)];
  });
  const [inicio, setInicio] = useState(searchParams.get("pedido_data_inicio") ?? "");
  const [fim, setFim] = useState(searchParams.get("pedido_data_fim") ?? "");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telemovel, setTelemovel] = useState("");
  const [notasVoo, setNotasVoo] = useState("");
  const [preferenciaHotel, setPreferenciaHotel] = useState("");
  const [preferenciaExtras, setPreferenciaExtras] = useState("");
  const [preferenciaVoo, setPreferenciaVoo] = useState("");
  const [step, setStep] = useState<1 | 2 | 3 | 4>(flowSteps[0] ?? 4);
  const [selectedHotelId, setSelectedHotelId] = useState<string | null>(
    filteredHotels[0]?.id ?? null,
  );
  const [selectedExtraIds, setSelectedExtraIds] = useState<string[]>(
    filteredExtras.filter((x) => x.default_selected).map((x) => x.id),
  );
  const [selectedFlightId, setSelectedFlightId] = useState<string | null>(null);
  const [selectedRooms, setSelectedRooms] = useState<Array<{ room_option_id: string; qty: number }>>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const canMoveFromHotel = !hasHotelOptions || selectedHotelId !== null;

  const selectedHotel = useMemo(
    () => filteredHotels.find((x) => x.id === selectedHotelId) ?? null,
    [filteredHotels, selectedHotelId],
  );
  const selectedExtras = useMemo(
    () => filteredExtras.filter((x) => selectedExtraIds.includes(x.id)),
    [filteredExtras, selectedExtraIds],
  );
  const selectedFlight = useMemo(
    () => filteredFlightOptions.find((x) => x.id === selectedFlightId) ?? null,
    [filteredFlightOptions, selectedFlightId],
  );
  const selectedRoomSummary = useMemo(() => {
    if (!selectedHotel) return [];
    return selectedRooms
      .map((item) => {
        const room = selectedHotel.room_options.find((x) => x.id === item.room_option_id);
        if (!room) return null;
        return { id: room.id, label: room.nome, qty: item.qty };
      })
      .filter((item): item is { id: string; label: string; qty: number } => !!item);
  }, [selectedHotel, selectedRooms]);

  const hotelAvailabilityInfo = useMemo(() => {
    if (!selectedHotel || !inicio || !fim || selectedHotel.availability.length === 0) return null;
    const match = selectedHotel.availability.find((item) => item.data_inicio <= inicio && item.data_fim >= fim);
    if (!match) return null;
    return {
      disponivel: match.disponivel,
      quartos_disponiveis: match.quartos_disponiveis,
    };
  }, [selectedHotel, inicio, fim]);

  const total: ComputePostTotalResult = useMemo(
    () =>
      computePostTotal({
        preco_base_eur: post.preco_base_eur,
        hotels: post.hotels,
        extras: post.extras,
        flight_options: post.flight_options,
        hotel_id: selectedHotelId,
        extra_ids: selectedExtraIds,
        flight_option_id: selectedFlightId,
        checkin_date: inicio || null,
        room_selections: selectedRooms,
      }),
    [post, selectedHotelId, selectedExtraIds, selectedFlightId, inicio, selectedRooms],
  );

  const totalLabel =
    total.mode === "known" && total.total_eur != null
      ? `Total estimado: ${eurLabel(total.total_eur)}`
      : total.mode === "partial" && total.total_eur != null
        ? `A partir de ${eurLabel(total.total_eur)} (valor final sob consulta)`
        : post.preco_desde?.trim()
          ? `Sob consulta · ${post.preco_desde.trim()}`
          : "Sob consulta";

  const datasResumo = formatJanelaDatasLabel(
    parsePedidoDataIso(inicio),
    parsePedidoDataIso(fim),
  );
  const stepTitleMap: Record<1 | 2 | 3 | 4, string> = {
    1: "Hotel",
    2: "Extras",
    3: "Voo",
    4: "Confirmação",
  };
  const stepNumberById = useMemo(() => {
    const entries = flowSteps.map((id, index) => [id, index + 1] as const);
    return Object.fromEntries(entries) as Record<1 | 2 | 3 | 4, number>;
  }, [flowSteps]);

  function stepNumber(id: 1 | 2 | 3 | 4): number {
    return stepNumberById[id];
  }

  function nextStepTitle(current: 1 | 2 | 3 | 4): string | null {
    const idx = flowSteps.indexOf(current);
    if (idx < 0 || idx >= flowSteps.length - 1) return null;
    return stepTitleMap[flowSteps[idx + 1]];
  }

  function trackChoiceEvent(
    eventName: string,
    payload: {
      hotel_id?: string | null;
      flight_option_id?: string | null;
      extra_id?: string | null;
      event_payload?: Record<string, unknown>;
    } = {},
  ) {
    void fetch("/api/leads/post-choice-events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        post_id: post.id,
        event_name: eventName,
        session_key: getChoiceSessionKey(),
        ...payload,
      }),
    }).catch(() => {
      // Não bloqueia UX.
    });
  }

  function goToNextStep() {
    if (step === 1 && hasHotelOptions) {
      if (!canMoveFromHotel) {
        setMsg("Escolhe um hotel para continuar.");
        return;
      }
      setMsg(null);
    }
    const currentIndex = flowSteps.indexOf(step);
    if (currentIndex >= 0 && currentIndex < flowSteps.length - 1) {
      setStep(flowSteps[currentIndex + 1]);
    }
  }

  function goToPrevStep() {
    const currentIndex = flowSteps.indexOf(step);
    if (currentIndex > 0) {
      setStep(flowSteps[currentIndex - 1]);
    }
  }

  function syncKidAgesForCount(rawCount: string) {
    const c = Number.parseInt(rawCount || "0", 10);
    if (!Number.isFinite(c) || c <= 0) {
      setIdadesCriancas([]);
      return;
    }
    setIdadesCriancas((prev) => {
      if (prev.length === c) return prev;
      if (prev.length > c) return prev.slice(0, c);
      return [...prev, ...Array.from({ length: c - prev.length }, () => 7)];
    });
  }

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const sb = createClient();
        const {
          data: { user },
        } = await sb.auth.getUser();
        if (cancelled || !user) return;
        setEmail(user.email ?? "");
        const fullName =
          typeof user.user_metadata?.full_name === "string"
            ? user.user_metadata.full_name
            : typeof user.user_metadata?.name === "string"
              ? user.user_metadata.name
              : "";
        if (fullName.trim()) setNome(fullName.trim());
      } catch {
        // sem bloqueio
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    stashCampaignTokenFromSearchParams(searchParams);
    getLeadMarketingAttributionPayload();
  }, [searchParams]);

  useEffect(() => {
    if (selectedHotelId && !filteredHotels.some((hotel) => hotel.id === selectedHotelId)) {
      setSelectedHotelId(filteredHotels[0]?.id ?? null);
    }
    setSelectedExtraIds((prev) =>
      prev.filter((id) => filteredExtras.some((extra) => extra.id === id)),
    );
    if (
      selectedFlightId &&
      !filteredFlightOptions.some((flight) => flight.id === selectedFlightId)
    ) {
      setSelectedFlightId(null);
    }
  }, [
    filteredHotels,
    filteredExtras,
    filteredFlightOptions,
    selectedHotelId,
    selectedFlightId,
  ]);

  function syncUrl() {
    const params = new URLSearchParams(searchParams.toString());
    params.set("pedido_adultos", adultos || "2");
    params.set("pedido_criancas", criancas || "0");
    params.set("pedido_quartos", quartosNecessarios || "1");
    if (idadesCriancas.length > 0) params.set("pedido_idades_criancas", idadesCriancas.join(","));
    else params.delete("pedido_idades_criancas");
    params.delete("pedido_animais_estimacao");
    if (parsePedidoDataIso(inicio)) params.set("pedido_data_inicio", inicio);
    else params.delete("pedido_data_inicio");
    if (parsePedidoDataIso(fim)) params.set("pedido_data_fim", fim);
    else params.delete("pedido_data_fim");
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  async function submitLead() {
    setMsg(null);
    if (nome.trim().length < 2) {
      setMsg("Indica o teu nome.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setMsg("Indica um email válido.");
      return;
    }
    if (hasVariantFlow && !selectedHotelId && filteredHotels.length > 0) {
      setMsg("Escolhe um hotel para continuar.");
      return;
    }

    const adultosNum = Number.parseInt(adultos || "2", 10);
    const criancasNum = Number.parseInt(criancas || "0", 10);
    const quartosNum = Number.parseInt(quartosNecessarios || "1", 10);
    if (!Number.isFinite(quartosNum) || quartosNum < 1 || quartosNum > 20) {
      setMsg("Indica a quantidade de quartos necessária (1 a 20).");
      return;
    }
    const snapshot = {
      hotel: selectedHotel
        ? {
            id: selectedHotel.id,
            label: selectedHotel.nome,
            preco_delta_eur: selectedHotel.preco_delta_eur,
            preco_label: selectedHotel.preco_label,
          }
        : undefined,
      extras: selectedExtras.map((extra) => ({
        id: extra.id,
        label: extra.nome,
        preco_delta_eur: extra.preco_delta_eur,
        preco_label: extra.preco_label,
      })),
      flight: selectedFlight
        ? {
            id: selectedFlight.id,
            label: selectedFlight.label,
            preco_delta_eur: selectedFlight.preco_delta_eur,
            preco_label: selectedFlight.preco_label,
          }
        : undefined,
    };
    const notasPreferencias = [
      notasVoo.trim() ? `Notas voo: ${notasVoo.trim()}` : null,
      preferenciaHotel.trim() ? `Preferência de hotel: ${preferenciaHotel.trim()}` : null,
      preferenciaExtras.trim() ? `Pedido de extras: ${preferenciaExtras.trim()}` : null,
      preferenciaVoo.trim() ? `Pedido de voo: ${preferenciaVoo.trim()}` : null,
    ]
      .filter(Boolean)
      .join(" | ")
      .slice(0, 1000);

    const destinoResumo = [
      post.titulo,
      selectedHotel ? `Hotel: ${selectedHotel.nome}` : null,
      selectedExtras.length ? `Extras: ${selectedExtras.map((x) => x.nome).join(", ")}` : null,
      selectedFlight ? `Voo: ${selectedFlight.label}` : null,
      datasResumo,
      `Quartos necessários: ${quartosNum}`,
    ]
      .filter(Boolean)
      .join(" · ");

    setBusy(true);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pedido_rapido: true,
          nome: nome.trim(),
          email: email.trim(),
          telemovel: telemovel.trim(),
          destino_sonho: destinoResumo.slice(0, 300),
          janela_datas: datasResumo ?? undefined,
          pedido_adultos: Number.isFinite(adultosNum) ? adultosNum : undefined,
          pedido_criancas: Number.isFinite(criancasNum) ? criancasNum : undefined,
          pedido_quartos: quartosNum,
          pedido_idades_criancas: idadesCriancas.length > 0 ? idadesCriancas : undefined,
          post_id: post.id,
          post_choice: {
            hotel_id: selectedHotelId ?? undefined,
            extra_ids: selectedExtraIds.length ? selectedExtraIds : undefined,
            flight_option_id: selectedFlightId ?? undefined,
            checkin_date: parsePedidoDataIso(inicio) ? inicio : undefined,
            checkout_date: parsePedidoDataIso(fim) ? fim : undefined,
            rooms: selectedRooms.length ? selectedRooms : undefined,
            rooms_required: quartosNum,
            notas_voo: notasPreferencias || undefined,
            computed_total_eur: total.total_eur ?? undefined,
            currency: "EUR",
            computed_at: new Date().toISOString(),
            snapshot,
          },
          website_url: "",
          ...getLeadMarketingAttributionPayload(),
          ...campaignTokenPayloadForLead(),
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setMsg(data.error ?? quizCopy.duplicateOpenLeadMessage ?? "Não foi possível enviar.");
        return;
      }
      router.push("/obrigado");
    } catch {
      setMsg("Erro de rede. Tenta novamente.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-sand px-5 py-10 sm:px-6">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-1">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-sm font-semibold text-ocean-700 hover:text-ocean-900">
              ← Voltar ao site
            </Link>
          </div>

          <section className="rounded-3xl border border-ocean-100 bg-white p-5 shadow-sm md:p-7">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-ocean-500">
              Publicação
            </p>
            <h1 className="mt-2 font-serif text-3xl text-ocean-900">{post.titulo}</h1>
            {post.descricao ? (
              <p className="mt-3 max-w-3xl text-sm leading-relaxed text-ocean-700">
                {post.descricao}
              </p>
            ) : null}
            <div className="mt-4 flex flex-wrap gap-2">
              {post.preco_desde ? (
                <span className="rounded-full bg-ocean-900 px-3 py-1 text-xs font-semibold text-white">
                  {post.preco_desde}
                </span>
              ) : null}
            </div>
            {hasVariantFlow ? (
              <nav className="mt-5 flex flex-wrap gap-2">
                {flowSteps.map((stepItem) => {
                  const isCurrent = step === stepItem;
                  const isComplete = step > stepItem;
                  return (
                    <button
                      key={stepItem}
                      type="button"
                      onClick={() => setStep(stepItem)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                        isCurrent
                          ? "border-ocean-700 bg-ocean-700 text-white"
                          : isComplete
                            ? "border-ocean-300 bg-ocean-50 text-ocean-800"
                            : "border-ocean-200 bg-white text-ocean-600"
                      }`}
                    >
                      {stepNumber(stepItem)}. {stepTitleMap[stepItem]}
                    </button>
                  );
                })}
              </nav>
            ) : null}
          </section>

          {hasHotelOptions && step === 1 ? (
            <section className="rounded-3xl border border-ocean-100 bg-white p-5 shadow-sm md:p-7">
              <h2 className="font-serif text-2xl text-ocean-900">
                {stepNumber(1)}. Escolhe o hotel
              </h2>
              <p className="mt-2 text-sm text-ocean-600">
                Compara opções lado a lado e seleciona a base da tua proposta.
              </p>
              <div className="mt-4">
                <PublicacaoHotelPicker
                  hotels={filteredHotels}
                  selectedHotelId={selectedHotelId}
                  onSelect={(hotelId) => {
                    setSelectedHotelId(hotelId);
                    trackChoiceEvent("hotel_selected", { hotel_id: hotelId });
                  }}
                />
              </div>
              {selectedHotel?.room_options.length ? (
                <div className="mt-4 rounded-2xl border border-ocean-100 bg-ocean-50/50 p-4">
                  <p className="text-sm font-semibold text-ocean-800">Quartos</p>
                  <p className="mt-1 text-xs text-ocean-600">
                    Seleciona múltiplos quartos se precisares de combinações diferentes.
                  </p>
                  <div className="mt-3 space-y-2">
                    {selectedHotel.room_options.map((room) => {
                      const qty = selectedRooms.find((x) => x.room_option_id === room.id)?.qty ?? 0;
                      return (
                        <label key={room.id} className="flex items-center justify-between gap-3 text-sm text-ocean-700">
                          <span>
                            {room.nome}
                            {room.preco_label ? (
                              <span className="ml-2 text-xs text-ocean-600">{room.preco_label}</span>
                            ) : null}
                          </span>
                          <input
                            type="number"
                            min={0}
                            max={10}
                            value={qty}
                            onChange={(e) => {
                              const nextQty = Number.parseInt(e.target.value || "0", 10);
                              setSelectedRooms((prev) => {
                                const without = prev.filter((x) => x.room_option_id !== room.id);
                                if (!Number.isFinite(nextQty) || nextQty <= 0) return without;
                                return [...without, { room_option_id: room.id, qty: Math.min(nextQty, 10) }];
                              });
                              trackChoiceEvent("room_selection_changed", {
                                hotel_id: selectedHotel.id,
                                event_payload: { room_option_id: room.id, qty: nextQty },
                              });
                            }}
                            className="w-20 rounded-lg border border-ocean-200 px-2 py-1"
                          />
                        </label>
                      );
                    })}
                  </div>
                </div>
              ) : null}
              {hotelAvailabilityInfo ? (
                <p
                  className={`mt-3 rounded-xl px-3 py-2 text-sm ${
                    hotelAvailabilityInfo.disponivel
                      ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border border-terracotta/30 bg-terracotta/10 text-terracotta"
                  }`}
                >
                  {hotelAvailabilityInfo.disponivel
                    ? `Disponível para as datas selecionadas${
                        hotelAvailabilityInfo.quartos_disponiveis != null
                          ? ` · ${hotelAvailabilityInfo.quartos_disponiveis} quarto(s)`
                          : ""
                      }`
                    : "Sem disponibilidade para as datas selecionadas."}
                </p>
              ) : null}
              {msg ? <p className="mt-3 text-sm text-terracotta">{msg}</p> : null}
              <div className="mt-5 border-t border-ocean-100 pt-4">
                <div className="w-full">
                  <PublicacaoResumoSticky
                    hotelNome={selectedHotel?.nome ?? null}
                    extrasLabels={selectedExtras.map((x) => x.nome)}
                    vooLabel={selectedFlight?.label ?? null}
                    totalLabel={`${totalLabel}${
                      selectedRoomSummary.length
                        ? ` · Quartos: ${selectedRoomSummary
                            .map((item) => `${item.qty}x ${item.label}`)
                            .join(", ")}`
                        : ""
                    }`}
                    onConfirm={goToNextStep}
                    actionLabel={`Continuar para ${nextStepTitle(step)?.toLowerCase() ?? "confirmação"}`}
                  />
                </div>
              </div>
            </section>
          ) : null}

          {hasExtrasOptions && step === 2 ? (
            <section className="rounded-3xl border border-ocean-100 bg-white p-5 shadow-sm md:p-7">
              <h2 className="font-serif text-2xl text-ocean-900">
                {stepNumber(2)}. Extras opcionais
              </h2>
              <p className="mt-2 text-sm text-ocean-600">Marca só o que faz sentido para ti.</p>
              <div className="mt-4">
                <PublicacaoExtrasPicker
                  extras={filteredExtras}
                  selectedExtraIds={selectedExtraIds}
                  onToggle={(id) => {
                    setSelectedExtraIds((prev) => {
                      if (prev.includes(id)) {
                        trackChoiceEvent("extra_unselected", { extra_id: id });
                        return prev.filter((x) => x !== id);
                      }
                      trackChoiceEvent("extra_selected", { extra_id: id });
                      return [...prev, id];
                    });
                  }}
                />
              </div>
              <div className="mt-4 flex gap-3">
                <button
                  type="button"
                  onClick={goToPrevStep}
                  className="rounded-xl border border-ocean-200 px-4 py-2 text-sm font-semibold text-ocean-800"
                >
                  Voltar
                </button>
              </div>
              <div className="mt-5 border-t border-ocean-100 pt-4">
                <div className="w-full">
                  <PublicacaoResumoSticky
                    hotelNome={selectedHotel?.nome ?? null}
                    extrasLabels={selectedExtras.map((x) => x.nome)}
                    vooLabel={selectedFlight?.label ?? null}
                    totalLabel={`${totalLabel}${
                      selectedRoomSummary.length
                        ? ` · Quartos: ${selectedRoomSummary
                            .map((item) => `${item.qty}x ${item.label}`)
                            .join(", ")}`
                        : ""
                    }`}
                    onConfirm={goToNextStep}
                    actionLabel={`Continuar para ${nextStepTitle(step)?.toLowerCase() ?? "confirmação"}`}
                  />
                </div>
              </div>
            </section>
          ) : null}

          {hasFlightOptions && step === 3 ? (
            <section className="rounded-3xl border border-ocean-100 bg-white p-5 shadow-sm md:p-7">
              <h2 className="font-serif text-2xl text-ocean-900">
                {stepNumber(3)}. Opção de voo
              </h2>
              <p className="mt-2 text-sm text-ocean-600">Escolhe um voo sugerido ou deixa em aberto.</p>
              <div className="mt-4">
                <PublicacaoVooPicker
                  flightOptions={filteredFlightOptions}
                  selectedFlightId={selectedFlightId}
                  onSelect={(flightId) => {
                    setSelectedFlightId(flightId);
                    trackChoiceEvent("flight_selected", { flight_option_id: flightId });
                  }}
                  notasVoo={notasVoo}
                  onNotasVooChange={setNotasVoo}
                />
              </div>
              <div className="mt-4 flex gap-3">
                <button
                  type="button"
                  onClick={goToPrevStep}
                  className="rounded-xl border border-ocean-200 px-4 py-2 text-sm font-semibold text-ocean-800"
                >
                  Voltar
                </button>
              </div>
              <div className="mt-5 border-t border-ocean-100 pt-4">
                <div className="w-full">
                  <PublicacaoResumoSticky
                    hotelNome={selectedHotel?.nome ?? null}
                    extrasLabels={selectedExtras.map((x) => x.nome)}
                    vooLabel={selectedFlight?.label ?? null}
                    totalLabel={`${totalLabel}${
                      selectedRoomSummary.length
                        ? ` · Quartos: ${selectedRoomSummary
                            .map((item) => `${item.qty}x ${item.label}`)
                            .join(", ")}`
                        : ""
                    }`}
                    onConfirm={goToNextStep}
                    actionLabel={`Continuar para ${nextStepTitle(step)?.toLowerCase() ?? "confirmação"}`}
                  />
                </div>
              </div>
            </section>
          ) : null}

          {step === 4 ? (
            <section className="rounded-3xl border border-ocean-100 bg-white p-5 shadow-sm md:p-7">
              <h2 className="font-serif text-2xl text-ocean-900">
                {hasVariantFlow
                  ? `${stepNumber(4)}. Passageiros e contacto`
                  : "Confirma os dados de viagem"}
              </h2>
              <p className="mt-2 text-sm text-ocean-600">
                Ajusta os dados e envia o pedido para receberes proposta personalizada.
              </p>
              <div className="mt-4">
                <PublicacaoPassageirosForm
                  inicio={inicio}
                  fim={fim}
                  adultos={adultos}
                  criancas={criancas}
                  idadesCriancas={idadesCriancas}
                  onInicioChange={setInicio}
                  onFimChange={setFim}
                  onAdultosChange={setAdultos}
                  onCriancasChange={(value) => {
                    setCriancas(value);
                    syncKidAgesForCount(value);
                  }}
                  onIdadeCriancaChange={(index, value) => {
                    setIdadesCriancas((prev) =>
                      prev.map((current, i) => (i === index ? value : current)),
                    );
                  }}
                />
                <label className="mt-3 block text-sm text-ocean-700">
                  Quantidade de quartos necessária
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={quartosNecessarios}
                    onChange={(e) => setQuartosNecessarios(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-ocean-200 px-3 py-2"
                  />
                </label>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <label className="text-sm text-ocean-700">
                  Nome
                  <input
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-ocean-200 px-3 py-2"
                  />
                </label>
                <label className="text-sm text-ocean-700">
                  Email
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-ocean-200 px-3 py-2"
                  />
                </label>
                <label className="text-sm text-ocean-700 md:col-span-2">
                  Telemóvel (opcional)
                  <input
                    value={telemovel}
                    onChange={(e) => setTelemovel(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-ocean-200 px-3 py-2"
                  />
                </label>
              </div>
              <div className="mt-4 space-y-3">
                <p className="text-sm font-semibold text-ocean-800">
                  Preferências opcionais para pedido personalizado
                </p>
                {!hasHotelOptions ? (
                  <label className="block text-sm text-ocean-700">
                    Preferência de hotel (opcional)
                    <textarea
                      rows={2}
                      value={preferenciaHotel}
                      onChange={(e) => setPreferenciaHotel(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-ocean-200 px-3 py-2"
                      placeholder="Ex.: 5 estrelas, perto da praia, zona tranquila..."
                    />
                  </label>
                ) : null}
                {!hasExtrasOptions ? (
                  <label className="block text-sm text-ocean-700">
                    Pedido de extras (opcional)
                    <textarea
                      rows={2}
                      value={preferenciaExtras}
                      onChange={(e) => setPreferenciaExtras(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-ocean-200 px-3 py-2"
                      placeholder="Ex.: transfer privado, seguro premium, experiências..."
                    />
                  </label>
                ) : null}
                {!hasFlightOptions ? (
                  <label className="block text-sm text-ocean-700">
                    Pedido de voo (opcional)
                    <textarea
                      rows={2}
                      value={preferenciaVoo}
                      onChange={(e) => setPreferenciaVoo(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-ocean-200 px-3 py-2"
                      placeholder="Ex.: aeroporto, horários, bagagem, classe..."
                    />
                  </label>
                ) : null}
              </div>
              {msg ? <p className="mt-3 text-sm text-terracotta">{msg}</p> : null}
              <div className="mt-5 border-t border-ocean-100 pt-4">
                <div className="w-full">
                  <PublicacaoResumoSticky
                    hotelNome={selectedHotel?.nome ?? null}
                    extrasLabels={selectedExtras.map((x) => x.nome)}
                    vooLabel={selectedFlight?.label ?? null}
                    totalLabel={`${totalLabel}${
                      selectedRoomSummary.length
                        ? ` · Quartos: ${selectedRoomSummary
                            .map((item) => `${item.qty}x ${item.label}`)
                            .join(", ")}`
                        : ""
                    }`}
                    onConfirm={() => {
                      syncUrl();
                      void submitLead();
                    }}
                    actionLabel={busy ? "A enviar..." : "Confirmar"}
                    disabled={busy}
                    showAction={false}
                  />
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                {hasVariantFlow && flowSteps.indexOf(4) > 0 ? (
                  <button
                    type="button"
                    onClick={goToPrevStep}
                    className="rounded-xl border border-ocean-200 px-4 py-2 text-sm font-semibold text-ocean-800"
                  >
                    Voltar
                  </button>
                ) : null}
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    syncUrl();
                    void submitLead();
                  }}
                  className="rounded-xl bg-terracotta px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {busy ? "A enviar..." : "Confirmar e enviar pedido"}
                </button>
              </div>
            </section>
          ) : null}
        </div>
      </div>
    </main>
  );
}
