import type {
  PostExtraVariant,
  PostFlightOptionVariant,
  PostHotelVariant,
} from "@/lib/posts/post-variants-types";

type ComputePostTotalInput = {
  preco_base_eur: number | null;
  hotels: PostHotelVariant[];
  extras: PostExtraVariant[];
  flight_options: PostFlightOptionVariant[];
  hotel_id?: string | null;
  extra_ids?: string[] | null;
  flight_option_id?: string | null;
  checkin_date?: string | null;
  room_selections?: Array<{ room_option_id: string; qty: number }> | null;
};

export type ComputePostTotalResult = {
  total_eur: number | null;
  mode: "known" | "partial" | "unknown";
};

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function isFiniteNumber(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

function toMonthDay(isoDate?: string | null): string | null {
  if (!isoDate) return null;
  const m = isoDate.match(/^\d{4}-(\d{2})-(\d{2})$/);
  if (!m) return null;
  return `${m[1]}-${m[2]}`;
}

function isMonthDayInSeason(monthDay: string, start: string, end: string): boolean {
  if (start <= end) return monthDay >= start && monthDay <= end;
  return monthDay >= start || monthDay <= end;
}

export function computePostTotal(input: ComputePostTotalInput): ComputePostTotalResult {
  const {
    preco_base_eur,
    hotels,
    extras,
    flight_options,
    hotel_id,
    extra_ids,
    flight_option_id,
    checkin_date,
    room_selections,
  } = input;

  if (!isFiniteNumber(preco_base_eur)) {
    return { total_eur: null, mode: "unknown" };
  }

  let total = preco_base_eur;
  let partial = false;

  if (hotel_id) {
    const hotel = hotels.find((x) => x.id === hotel_id);
    if (hotel) {
      if (isFiniteNumber(hotel.preco_delta_eur)) total += hotel.preco_delta_eur;
      else partial = true;

      const monthDay = toMonthDay(checkin_date);
      if (monthDay && hotel.seasons.length > 0) {
        const season = hotel.seasons.find((item) =>
          isMonthDayInSeason(monthDay, item.start_month_day, item.end_month_day),
        );
        if (season) {
          if (isFiniteNumber(season.preco_delta_eur)) total += season.preco_delta_eur;
          else partial = true;
        }
      }

      const roomSelectionsSafe = room_selections ?? [];
      if (roomSelectionsSafe.length > 0 && hotel.room_options.length > 0) {
        for (const roomSelection of roomSelectionsSafe) {
          const room = hotel.room_options.find((x) => x.id === roomSelection.room_option_id);
          if (!room) continue;
          if (isFiniteNumber(room.preco_delta_eur)) total += room.preco_delta_eur * roomSelection.qty;
          else partial = true;
        }
      }
    }
  }

  const pickedExtraIds = new Set(extra_ids ?? []);
  for (const extra of extras) {
    if (!pickedExtraIds.has(extra.id)) continue;
    if (isFiniteNumber(extra.preco_delta_eur)) total += extra.preco_delta_eur;
    else partial = true;
  }

  if (flight_option_id) {
    const flight = flight_options.find((x) => x.id === flight_option_id);
    if (flight) {
      if (isFiniteNumber(flight.preco_delta_eur)) total += flight.preco_delta_eur;
      else partial = true;
    }
  }

  return { total_eur: round2(total), mode: partial ? "partial" : "known" };
}
