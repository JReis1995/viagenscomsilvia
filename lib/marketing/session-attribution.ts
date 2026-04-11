"use client";

import type { LeadMarketingAttribution } from "@/lib/validations/lead-quiz";

const STORAGE_KEY = "vs_lead_attr_v1";

type Stored = {
  landing_path: string;
  referrer: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
};

function readUtm(sp: URLSearchParams): Pick<
  Stored,
  "utm_source" | "utm_medium" | "utm_campaign" | "utm_content" | "utm_term"
> {
  const pick = (k: string) => {
    const v = sp.get(k);
    return v && v.trim() ? v.trim().slice(0, 200) : undefined;
  };
  return {
    utm_source: pick("utm_source"),
    utm_medium: pick("utm_medium"),
    utm_campaign: pick("utm_campaign"),
    utm_content: pick("utm_content"),
    utm_term: pick("utm_term"),
  };
}

/** Grava na primeira visita da sessão e devolve sempre o mesmo payload para o POST /api/leads. */
export function getLeadMarketingAttributionPayload(): LeadMarketingAttribution {
  if (typeof window === "undefined") return {};
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) {
      const o = JSON.parse(raw) as Stored;
      return {
        landing_path: o.landing_path,
        referrer: o.referrer || undefined,
        utm_source: o.utm_source,
        utm_medium: o.utm_medium,
        utm_campaign: o.utm_campaign,
        utm_content: o.utm_content,
        utm_term: o.utm_term,
      };
    }
    const sp = new URLSearchParams(window.location.search);
    const payload: Stored = {
      landing_path: `${window.location.pathname}${window.location.search}`.slice(
        0,
        2000,
      ),
      referrer: (document.referrer || "").slice(0, 2000),
      ...readUtm(sp),
    };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    return {
      landing_path: payload.landing_path,
      referrer: payload.referrer || undefined,
      utm_source: payload.utm_source,
      utm_medium: payload.utm_medium,
      utm_campaign: payload.utm_campaign,
      utm_content: payload.utm_content,
      utm_term: payload.utm_term,
    };
  } catch {
    return {};
  }
}
