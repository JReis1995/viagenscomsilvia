"use client";

import { useEffect, useMemo, useState } from "react";

type Props = {
  dataInicio?: string;
  dataFim?: string;
  destinoLabel: string;
  latitude?: number;
  longitude?: number;
};

function weatherCodeLabel(code: number): string {
  const wmo: Record<number, string> = {
    0: "Céu limpo",
    1: "Principalmente limpo",
    2: "Parcialmente nublado",
    3: "Nublado",
    45: "Nevoeiro",
    48: "Nevoeiro com geada",
    51: "Chuvisco ligeiro",
    61: "Chuva ligeira",
    80: "Aguaceiros",
    95: "Trovoada",
  };
  return wmo[code] ?? "Condições variáveis";
}

export function TripCountdownWeather({
  dataInicio,
  dataFim,
  destinoLabel,
  latitude,
  longitude,
}: Props) {
  const [now, setNow] = useState(() => Date.now());
  const [weather, setWeather] = useState<{
    temp: number;
    code: number;
  } | null>(null);
  const [weatherErr, setWeatherErr] = useState<string | null>(null);

  const targetMs = useMemo(() => {
    if (!dataInicio?.trim()) return null;
    const t = new Date(`${dataInicio.trim()}T12:00:00`).getTime();
    return Number.isNaN(t) ? null : t;
  }, [dataInicio]);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setWeatherErr(null);
      setWeather(null);
      let lat = latitude;
      let lon = longitude;
      if (
        (lat == null || lon == null || Number.isNaN(lat) || Number.isNaN(lon)) &&
        destinoLabel.trim()
      ) {
        try {
          const gRes = await fetch(
            `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(destinoLabel.trim())}&count=1`,
          );
          const gJson = (await gRes.json()) as {
            results?: { latitude: number; longitude: number }[];
          };
          const r = gJson.results?.[0];
          if (r) {
            lat = r.latitude;
            lon = r.longitude;
          }
        } catch {
          if (!cancelled) setWeatherErr("Não foi possível localizar o destino.");
          return;
        }
      }
      if (lat == null || lon == null) {
        if (!cancelled) setWeatherErr(null);
        return;
      }
      try {
        const wRes = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code`,
        );
        const wJson = (await wRes.json()) as {
          current?: { temperature_2m: number; weather_code: number };
        };
        const c = wJson.current;
        if (c && !cancelled) {
          setWeather({ temp: c.temperature_2m, code: c.weather_code });
        }
      } catch {
        if (!cancelled) setWeatherErr("Meteo indisponível de momento.");
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [latitude, longitude, destinoLabel]);

  const countdown = useMemo(() => {
    if (targetMs == null) return null;
    const diff = targetMs - now;
    if (diff <= 0) return { ended: true as const, text: "A tua viagem já começou ou está a começar — boa viagem!" };
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const parts: string[] = [];
    if (d > 0) parts.push(`${d} ${d === 1 ? "dia" : "dias"}`);
    if (h > 0) parts.push(`${h} h`);
    parts.push(`${m} min`);
    return { ended: false as const, text: parts.join(" · ") };
  }, [targetMs, now]);

  if (!dataInicio?.trim() && !dataFim?.trim() && weather == null && !weatherErr)
    return null;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {countdown ? (
        <div className="rounded-2xl border border-ocean-100 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-ocean-500">
            Contagem decrescente
          </p>
          <p className="mt-2 font-serif text-xl text-ocean-900">
            {countdown.ended ? countdown.text : `Faltam ${countdown.text}`}
          </p>
          {dataFim?.trim() ? (
            <p className="mt-2 text-xs text-ocean-500">
              Fim previsto: {dataFim.trim()}
            </p>
          ) : null}
        </div>
      ) : null}
      {(weather != null || weatherErr) && (
        <div className="rounded-2xl border border-ocean-100 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-ocean-500">
            Previsão agora (Open-Meteo)
          </p>
          {weatherErr ? (
            <p className="mt-2 text-sm text-ocean-600">{weatherErr}</p>
          ) : weather ? (
            <>
              <p className="mt-2 text-3xl font-semibold text-ocean-900">
                {Math.round(weather.temp)}°C
              </p>
              <p className="mt-1 text-sm text-ocean-600">
                {weatherCodeLabel(weather.code)}
              </p>
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}
