"use client";

import dynamic from "next/dynamic";

import type { MapPinPost } from "@/types/post";

const ExperiencesMap = dynamic(
  () =>
    import("@/components/marketing/experiences-map").then((m) => ({
      default: m.ExperiencesMap,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[min(420px,70vh)] items-center justify-center rounded-2xl border border-ocean-100 bg-ocean-50/50 text-sm text-ocean-600">
        A carregar mapa…
      </div>
    ),
  },
);

type Props = {
  pins: MapPinPost[];
};

export function ExperiencesMapDynamic({ pins }: Props) {
  return <ExperiencesMap pins={pins} />;
}
