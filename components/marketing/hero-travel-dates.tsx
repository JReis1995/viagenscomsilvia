"use client";

import {
  CalendarDays,
  ChevronDown,
  ChevronUp,
  MapPin,
  PawPrint,
  Search,
  Users,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { buildPublicacaoHrefFromPost } from "@/lib/marketing/publicacao-href";
import {
  formatJanelaDatasLabel,
  parsePedidoDataIso,
} from "@/lib/marketing/pedido-datas-url";
import { displayPostTitle, destinoLabelsFromPosts } from "@/lib/marketing/hero-destinos";
import type { PublishedPost } from "@/types/post";

type Props = {
  navLock: string;
  posts: PublishedPost[];
};

function normalized(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function firstSearchParam(
  sp: ReturnType<typeof useSearchParams>,
  key: string,
): string {
  const v = sp.get(key);
  return typeof v === "string" ? v.trim() : "";
}

function parseKidsAgesParam(raw: string): number[] {
  if (!raw.trim()) return [];
  return raw
    .split(",")
    .map((v) => Number.parseInt(v.trim(), 10))
    .filter((n) => Number.isFinite(n) && n >= 0 && n <= 17)
    .slice(0, 10);
}

export function HeroTravelDates({ navLock, posts }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [inicio, setInicio] = useState(() =>
    parsePedidoDataIso(searchParams.get("pedido_data_inicio")) ?? "",
  );
  const [fim, setFim] = useState(() =>
    parsePedidoDataIso(searchParams.get("pedido_data_fim")) ?? "",
  );
  const destinoLabels = useMemo(() => destinoLabelsFromPosts(posts), [posts]);

  const [destinoMode, setDestinoMode] = useState<"lista" | "outro">("lista");
  const [destinoInput, setDestinoInput] = useState(() =>
    firstSearchParam(searchParams, "pedido_destino"),
  );
  const [outroTexto, setOutroTexto] = useState("");
  const [adultos, setAdultos] = useState(() => {
    const raw = firstSearchParam(searchParams, "pedido_adultos");
    return raw !== "" ? raw : "2";
  });
  const [criancas, setCriancas] = useState(() => {
    const raw = firstSearchParam(searchParams, "pedido_criancas");
    return raw !== "" ? raw : "0";
  });
  const [idadesCriancas, setIdadesCriancas] = useState<number[]>(() => {
    const kidsCount = Number.parseInt(
      firstSearchParam(searchParams, "pedido_criancas") || "0",
      10,
    );
    const rawAges = firstSearchParam(searchParams, "pedido_idades_criancas");
    const parsed = parseKidsAgesParam(rawAges);
    if (!Number.isFinite(kidsCount) || kidsCount <= 0) return [];
    if (parsed.length >= kidsCount) return parsed.slice(0, kidsCount);
    return [...parsed, ...Array.from({ length: kidsCount - parsed.length }, () => 7)];
  });
  const [pets, setPets] = useState<"" | "sim" | "nao">(() => {
    const raw = firstSearchParam(searchParams, "pedido_animais_estimacao").toLowerCase();
    if (raw === "sim") return "sim";
    if (raw === "nao") return "nao";
    return "";
  });
  const [comboOpen, setComboOpen] = useState(false);
  const [passageirosOpen, setPassageirosOpen] = useState(false);
  const comboRef = useRef<HTMLDivElement>(null);

  const [busy, setBusy] = useState(false);
  const [hint, setHint] = useState<string | null>(null);

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

  const destinoEfetivo = useMemo(() => {
    if (destinoMode === "outro") return outroTexto.trim();
    return destinoInput.trim();
  }, [destinoMode, destinoInput, outroTexto]);

  const filteredLabels = useMemo(() => {
    const q = normalized(destinoInput);
    if (!q) return destinoLabels.slice(0, 14);
    return destinoLabels
      .filter((l) => normalized(l).includes(q))
      .slice(0, 14);
  }, [destinoInput, destinoLabels]);

  const matchingOffers = useMemo(() => {
    const needle = normalized(destinoEfetivo);
    if (needle.length < 2) return [];
    return posts
      .filter((p) => {
        const blob = normalized(
          `${displayPostTitle(p.titulo)} ${p.descricao ?? ""}`,
        );
        return blob.includes(needle);
      })
      .slice(0, 8);
  }, [destinoEfetivo, posts]);

  const passageirosResumo = useMemo(() => {
    const a = Number.parseInt(adultos || "0", 10);
    const c = Number.parseInt(criancas || "0", 10);
    const partes: string[] = [];
    if (Number.isFinite(a) && a > 0) partes.push(`${a} adulto${a > 1 ? "s" : ""}`);
    if (Number.isFinite(c) && c > 0) partes.push(`${c} criança${c > 1 ? "s" : ""}`);
    if (partes.length === 0) return "Definir passageiros";
    return partes.join(" · ");
  }, [adultos, criancas]);

  useEffect(() => {
    function onDocDown(e: MouseEvent) {
      if (!comboRef.current?.contains(e.target as Node)) setComboOpen(false);
    }
    document.addEventListener("mousedown", onDocDown);
    return () => document.removeEventListener("mousedown", onDocDown);
  }, []);

  function goToPedidoDetalhe() {
    const di = parsePedidoDataIso(inicio || null);
    const df = parsePedidoDataIso(fim || null);
    const d = destinoEfetivo;
    if (di && df && di > df) {
      setHint("A data de regresso deve ser na ida ou depois da ida.");
      return;
    }
    const adultosNum = Number.parseInt(adultos, 10);
    const criancasNum = Number.parseInt(criancas, 10);
    if (!Number.isFinite(adultosNum) || adultosNum < 1 || adultosNum > 20) {
      setHint("Indica o número de adultos (entre 1 e 20).");
      return;
    }
    if (!Number.isFinite(criancasNum) || criancasNum < 0 || criancasNum > 10) {
      setHint("Indica o número de crianças (entre 0 e 10).");
      return;
    }
    if (criancasNum > 0 && idadesCriancas.length !== criancasNum) {
      setHint("Define a idade de cada criança para continuar.");
      return;
    }
    setHint(null);
    setBusy(true);
    const params = new URLSearchParams(searchParams.toString());
    if (di) params.set("pedido_data_inicio", di);
    else params.delete("pedido_data_inicio");
    if (df) params.set("pedido_data_fim", df);
    else params.delete("pedido_data_fim");
    params.set("pedido_destino", d.trim().length >= 2 ? d.trim() : "Destino por definir");
    params.set("pedido_adultos", String(adultosNum));
    params.set("pedido_criancas", String(criancasNum));
    if (criancasNum > 0) {
      params.set("pedido_idades_criancas", idadesCriancas.join(","));
    } else {
      params.delete("pedido_idades_criancas");
    }
    if (pets === "sim") params.set("pedido_animais_estimacao", "sim");
    else if (pets === "nao") params.set("pedido_animais_estimacao", "nao");
    else params.delete("pedido_animais_estimacao");
    const matchedPost = matchingOffers[0];
    if (matchedPost) {
      const href = buildPublicacaoHrefFromPost(matchedPost, params);
      router.push(href);
      return;
    }
    router.push(`/pedido?${params.toString()}`);
    window.setTimeout(() => {
      setBusy(false);
      setHint(null);
    }, 300);
  }

  return (
    <div
      ref={comboRef}
      className={`rounded-2xl border border-ocean-100/20 bg-white/95 px-4 py-5 text-ocean-900 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.45)] backdrop-blur-md sm:px-5 ${navLock}`}
    >
      <p className="text-center font-serif text-3xl font-semibold tracking-tight text-ocean-900 sm:text-4xl">
        Encontre a sua próxima viagem
      </p>
      <p className="mt-2 text-center text-sm leading-relaxed text-ocean-600">
        Sugestões alinhadas com as experiências publicadas. Valores indicativos,
        confirmados caso a caso.
      </p>

      <div className="mt-6 space-y-3">
        {destinoMode === "lista" ? (
          <div className="relative">
            <label className="block text-left">
              <span className="mb-1 flex items-center gap-1.5 text-xs font-medium text-ocean-700">
                <MapPin className="h-4 w-4 shrink-0 text-ocean-600" strokeWidth={2} aria-hidden />
                Destino
              </span>
              <input
                type="text"
                value={destinoInput}
                onChange={(e) => {
                  setDestinoInput(e.target.value);
                  setComboOpen(true);
                }}
                onFocus={() => setComboOpen(true)}
                autoComplete="off"
                placeholder="Selecione um destino"
                className="min-h-14 w-full rounded-2xl border border-ocean-200 bg-white px-4 pr-11 text-[1.05rem] text-ocean-900 shadow-sm focus:border-ocean-500 focus:outline-none focus:ring-2 focus:ring-ocean-200"
              />
              <button
                type="button"
                aria-label="Abrir lista de destinos"
                onClick={() => setComboOpen((v) => !v)}
                className="absolute right-2 top-[2.15rem] rounded-md p-2 text-ocean-600 hover:bg-ocean-50"
              >
                <ChevronDown className="h-4 w-4" aria-hidden />
              </button>
            </label>
            {comboOpen ? (
              <ul
                className="absolute z-50 mt-1 max-h-52 w-full overflow-auto rounded-xl border border-ocean-200 bg-white py-1 text-sm shadow-lg"
                role="listbox"
              >
                {filteredLabels.length > 0 ? (
                  filteredLabels.map((label) => (
                    <li key={label}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={destinoInput === label}
                        className="flex w-full px-3 py-2.5 text-left text-ocean-800 hover:bg-ocean-50"
                        onClick={() => {
                          setDestinoInput(label);
                          setComboOpen(false);
                          setHint(null);
                        }}
                      >
                        {label}
                      </button>
                    </li>
                  ))
                ) : (
                  <li className="px-3 py-2.5 text-ocean-500">
                    Ainda não há destinos publicados.
                  </li>
                )}
              </ul>
            ) : null}
          </div>
        ) : (
          <label className="block text-left text-xs font-medium text-ocean-700">
            <span className="mb-1 flex items-center gap-1.5">
              <MapPin className="h-4 w-4 shrink-0 text-ocean-600" strokeWidth={2} aria-hidden />
              Descreve o destino ou a tua ideia
            </span>
            <textarea
              value={outroTexto}
              onChange={(e) => setOutroTexto(e.target.value)}
              rows={3}
              placeholder="Ex.: Ilhas Gregas em veleiro, lua-de-mel fora dos circuitos habituais…"
              className="w-full resize-y rounded-2xl border border-ocean-200 bg-white px-4 py-3 text-sm text-ocean-900 shadow-sm focus:border-ocean-500 focus:outline-none focus:ring-2 focus:ring-ocean-200"
            />
          </label>
        )}

        <label className="block text-left text-xs font-medium text-ocean-700">
          <span className="mb-1 flex items-center gap-1.5">
            <CalendarDays className="h-4 w-4 shrink-0 text-ocean-600" strokeWidth={2} aria-hidden />
            Data de partida
          </span>
          <input
            type="date"
            value={inicio}
            onChange={(e) => setInicio(e.target.value)}
            className="min-h-14 w-full rounded-2xl border border-ocean-200 bg-white px-4 text-[1.05rem] text-ocean-900 shadow-sm focus:border-ocean-500 focus:outline-none focus:ring-2 focus:ring-ocean-200"
          />
        </label>

        <label className="block text-left text-xs font-medium text-ocean-700">
          <span className="mb-1 flex items-center gap-1.5">
            <CalendarDays className="h-4 w-4 shrink-0 text-ocean-600" strokeWidth={2} aria-hidden />
            Data de regresso
          </span>
          <input
            type="date"
            value={fim}
            onChange={(e) => setFim(e.target.value)}
            className="min-h-14 w-full rounded-2xl border border-ocean-200 bg-white px-4 text-[1.05rem] text-ocean-900 shadow-sm focus:border-ocean-500 focus:outline-none focus:ring-2 focus:ring-ocean-200"
          />
        </label>

        <div className="rounded-2xl border border-ocean-200 bg-white p-3 shadow-sm">
          <button
            type="button"
            onClick={() => setPassageirosOpen((v) => !v)}
            aria-expanded={passageirosOpen}
            aria-controls="hero-passageiros-panel"
            className="flex w-full items-center justify-between gap-3 text-left"
          >
            <span className="flex min-w-0 items-center gap-2">
              <Users className="h-4 w-4 shrink-0 text-ocean-600" strokeWidth={2} aria-hidden />
              <span>
                <span className="block text-xs font-medium text-ocean-700">Passageiros</span>
                <span className="block truncate text-base font-semibold text-ocean-900">
                  {passageirosResumo}
                </span>
              </span>
            </span>
            {passageirosOpen ? (
              <ChevronUp className="h-4 w-4 shrink-0 text-ocean-600" aria-hidden />
            ) : (
              <ChevronDown className="h-4 w-4 shrink-0 text-ocean-600" aria-hidden />
            )}
          </button>

          {passageirosOpen ? (
            <div
              id="hero-passageiros-panel"
              className="mt-3 grid gap-3 border-t border-ocean-100 pt-3 sm:grid-cols-2"
            >
              <label className="block text-left text-xs font-medium text-ocean-700">
                Adultos (18+)
                <input
                  type="number"
                  min={1}
                  max={20}
                  step={1}
                  inputMode="numeric"
                  value={adultos}
                  onChange={(e) => setAdultos(e.target.value)}
                  className="mt-1 min-h-11 w-full rounded-xl border border-ocean-200 bg-white px-3 py-2.5 text-sm text-ocean-900 focus:border-ocean-500 focus:outline-none focus:ring-2 focus:ring-ocean-200"
                />
              </label>
              <label className="block text-left text-xs font-medium text-ocean-700">
                Crianças (0-17)
                <input
                  type="number"
                  min={0}
                  max={10}
                  step={1}
                  inputMode="numeric"
                  value={criancas}
                  onChange={(e) => {
                    setCriancas(e.target.value);
                    syncKidAgesForCount(e.target.value);
                  }}
                  className="mt-1 min-h-11 w-full rounded-xl border border-ocean-200 bg-white px-3 py-2.5 text-sm text-ocean-900 focus:border-ocean-500 focus:outline-none focus:ring-2 focus:ring-ocean-200"
                />
              </label>
              {idadesCriancas.length > 0 ? (
                <div className="sm:col-span-2">
                  <p className="text-xs font-medium text-ocean-700">
                    Idade de cada criança (criança = 0 a 17 anos)
                  </p>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    {idadesCriancas.map((idade, idx) => (
                      <label
                        key={idx}
                        className="block text-left text-xs font-medium text-ocean-700"
                      >
                        Criança {idx + 1}
                        <select
                          value={idade}
                          onChange={(e) => {
                            const v = Number.parseInt(e.target.value, 10);
                            setIdadesCriancas((prev) =>
                              prev.map((x, i) => (i === idx ? v : x)),
                            );
                          }}
                          className="mt-1 min-h-11 w-full rounded-xl border border-ocean-200 bg-white px-3 py-2.5 text-sm text-ocean-900 focus:border-ocean-500 focus:outline-none focus:ring-2 focus:ring-ocean-200"
                        >
                          {Array.from({ length: 18 }, (_, n) => (
                            <option key={n} value={n}>
                              {n} {n === 1 ? "ano" : "anos"}
                            </option>
                          ))}
                        </select>
                      </label>
                    ))}
                  </div>
                </div>
              ) : null}
              <label className="block text-left text-xs font-medium text-ocean-700 sm:col-span-2">
                <span className="mb-1 inline-flex items-center gap-1.5">
                  <PawPrint className="h-3.5 w-3.5 shrink-0 text-ocean-500" strokeWidth={2} aria-hidden />
                  Animais de estimação
                </span>
                <select
                  value={pets}
                  onChange={(e) => setPets(e.target.value as "" | "sim" | "nao")}
                  className="min-h-11 w-full rounded-xl border border-ocean-200 bg-white px-3 py-2.5 text-sm text-ocean-900 focus:border-ocean-500 focus:outline-none focus:ring-2 focus:ring-ocean-200"
                >
                  <option value="">Sem preferência</option>
                  <option value="sim">Sim</option>
                  <option value="nao">Não</option>
                </select>
              </label>
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2">
          {destinoMode === "outro" ? (
            <button
              type="button"
              onClick={() => {
                setDestinoMode("lista");
                setOutroTexto("");
                setHint(null);
              }}
              className="text-xs font-semibold text-ocean-600 underline-offset-2 hover:text-ocean-900 hover:underline"
            >
              ← Voltar à lista de destinos
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setDestinoMode("outro");
                setComboOpen(false);
                setHint(null);
              }}
              className="text-xs font-semibold text-ocean-600 underline-offset-2 hover:text-ocean-900 hover:underline"
            >
              Outro destino (orçamento à medida)
            </button>
          )}
        </div>

        {hint && !busy ? (
          <p className="mt-1 text-center text-xs text-terracotta">
            {hint}
          </p>
        ) : null}
        {busy ? (
          <p className="mt-1 text-center text-xs font-medium text-ocean-600">
            A carregar sugestões…
          </p>
        ) : null}
      </div>

      <button
        type="button"
        disabled={busy}
        onClick={goToPedidoDetalhe}
        className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-terracotta px-3 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-terracotta/90 disabled:opacity-60"
      >
        <Search
          className="h-4 w-4 shrink-0 opacity-95"
          strokeWidth={2}
          aria-hidden
        />
        <span className="text-center leading-tight">Pedir proposta</span>
      </button>
      {inicio || fim ? (
        <p className="mt-3 text-center text-[11px] leading-snug text-ocean-500">
          {formatJanelaDatasLabel(
            parsePedidoDataIso(inicio || null),
            parsePedidoDataIso(fim || null),
          )}
        </p>
      ) : null}

      {matchingOffers.length > 0 ? (
        <p className="mt-3 text-center text-[11px] text-ocean-500">
          Vamos abrir a oferta mais relevante para &quot;{destinoEfetivo}&quot;.
        </p>
      ) : null}
    </div>
  );
}
