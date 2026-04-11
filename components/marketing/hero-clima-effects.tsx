"use client";

import type { QuizClimaKey } from "@/lib/marketing/quiz-clima";

type Props = {
  clima: QuizClimaKey | null;
  reduceMotion: boolean;
};

/** Camadas ligeiras por cima da foto/vídeo do hero (ondas, chuva, neve, luzes). */
export function HeroClimaEffects({ clima, reduceMotion }: Props) {
  if (!clima || reduceMotion) return null;

  if (clima === "praia") {
    return (
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden
      >
        {/* Luz de sol + reflexo suave no céu (sem “chuva”) */}
        <div className="hero-beach-sun-glow absolute inset-0" />
        <div className="hero-beach-light-sweep absolute inset-0 mix-blend-soft-light" />
        {/* Brilhos no horizonte / água ao longe — só pulsam, não caem */}
        {BEACH_SPARKLE_SEEDS.map((s, i) => (
          <span
            key={`s-${i}`}
            className="hero-beach-sparkle absolute rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.85)]"
            style={{
              left: `${s.left}%`,
              top: `${s.top}%`,
              width: `${s.size}px`,
              height: `${s.size}px`,
              animationDuration: `${s.dur}s`,
              animationDelay: `${s.delay}s`,
            }}
          />
        ))}
        {/* Ondas só na faixa inferior — não sobem atrás dos botões */}
        <div className="absolute inset-x-0 bottom-0 h-[min(24vh,200px)] max-h-[220px] overflow-hidden sm:h-[min(22vh,210px)]">
          <svg
            className="hero-wave-layer-strip absolute bottom-0 left-0 h-[130%] min-h-[140px] w-[220%] max-w-none text-white/35"
            viewBox="0 0 1200 120"
            preserveAspectRatio="none"
          >
            <path
              fill="currentColor"
              d="M0,60 C200,20 400,100 600,55 C800,10 1000,90 1200,50 L1200,120 L0,120 Z"
            />
          </svg>
          <svg
            className="hero-wave-layer-strip-delayed absolute bottom-0 left-[-55%] h-[135%] min-h-[150px] w-[220%] max-w-none text-cyan-100/30"
            viewBox="0 0 1200 120"
            preserveAspectRatio="none"
          >
            <path
              fill="currentColor"
              d="M0,70 C250,35 450,95 650,60 C850,25 1050,85 1200,45 L1200,120 L0,120 Z"
            />
          </svg>
        </div>
      </div>
    );
  }

  if (clima === "neve") {
    return (
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden
      >
        {SNOW_SEEDS.map((s, i) => (
          <span
            key={i}
            className="hero-snowflake absolute rounded-full bg-white/90 shadow-[0_0_6px_rgba(255,255,255,0.8)]"
            style={{
              left: `${s.left}%`,
              top: "-6%",
              width: s.size,
              height: s.size,
              animationDuration: `${s.dur}s`,
              animationDelay: `${s.delay}s`,
            }}
          />
        ))}
      </div>
    );
  }

  if (clima === "cidade") {
    return (
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden
      >
        {RAIN_SEEDS.map((s, i) => (
          <span
            key={i}
            className="hero-rain-drop absolute w-[2px] rounded-full bg-gradient-to-b from-white/20 via-white/75 to-white/15 shadow-[0_0_4px_rgba(255,255,255,0.4)]"
            style={{
              left: `${s.left}%`,
              top: "-12%",
              height: `${s.h}px`,
              animationDuration: `${s.dur}s`,
              animationDelay: `${s.delay}s`,
            }}
          />
        ))}
      </div>
    );
  }

  if (clima === "misto") {
    return (
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden
      >
        <div className="hero-misto-shimmer absolute inset-0 bg-gradient-to-br from-amber-300/35 via-fuchsia-200/20 to-cyan-300/30" />
        <div className="hero-misto-shimmer-slow absolute inset-0 bg-gradient-to-tl from-transparent via-white/10 to-transparent" />
      </div>
    );
  }

  return null;
}

const SNOW_SEEDS = [
  { left: 3, size: 4, dur: 6.5, delay: 0 },
  { left: 8, size: 5, dur: 8.2, delay: 0.3 },
  { left: 14, size: 3, dur: 5.8, delay: 1.1 },
  { left: 19, size: 6, dur: 9, delay: 0.15 },
  { left: 25, size: 3, dur: 7.2, delay: 2.4 },
  { left: 31, size: 5, dur: 6, delay: 0.7 },
  { left: 37, size: 4, dur: 8.5, delay: 1.8 },
  { left: 43, size: 3, dur: 5.5, delay: 0.4 },
  { left: 49, size: 6, dur: 7.8, delay: 2.9 },
  { left: 55, size: 4, dur: 6.8, delay: 0.9 },
  { left: 61, size: 5, dur: 8, delay: 1.4 },
  { left: 67, size: 3, dur: 5.2, delay: 0.2 },
  { left: 73, size: 5, dur: 7.4, delay: 2.1 },
  { left: 79, size: 4, dur: 6.2, delay: 1.6 },
  { left: 85, size: 6, dur: 8.8, delay: 0.5 },
  { left: 91, size: 4, dur: 7, delay: 3 },
  { left: 96, size: 5, dur: 6.5, delay: 1.2 },
];

const RAIN_SEEDS = Array.from({ length: 88 }, (_, i) => ({
  left: (i * 7 + (i % 11) * 5) % 100,
  h: 18 + (i % 9) * 10,
  dur: 0.38 + (i % 10) * 0.05,
  delay: (i % 24) * 0.05,
}));

/** Pontos de luz no céu / horizonte — pulsam no sítio (não queda vertical). */
const BEACH_SPARKLE_SEEDS = Array.from({ length: 20 }, (_, i) => ({
  left: 5 + (i * 19 + (i % 6) * 3) % 88,
  top: 8 + (i * 7) % 32,
  size: 2 + (i % 4),
  dur: (i % 3 === 0 ? 3.4 : 2.2) + (i % 6) * 0.35,
  delay: (i % 12) * 0.18,
}));
