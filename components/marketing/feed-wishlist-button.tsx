"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { toggleWishlistPost } from "@/app/actions/wishlist-post";

type Props = {
  postId: string;
  initialSaved: boolean;
  hotelOptions?: string[];
  /** Mais baixo quando há badge «Oferta» à esquerda */
  compactTop?: boolean;
};

export function FeedWishlistButton({
  postId,
  initialSaved,
  hotelOptions = [],
  compactTop,
}: Props) {
  const [saved, setSaved] = useState(initialSaved);
  const [pending, setPending] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const router = useRouter();

  async function onClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setMsg(null);
    setPending(true);
    let preferredHotel: string | undefined;
    if (!saved && hotelOptions.length > 0) {
      const suggestion = hotelOptions.slice(0, 4).join(", ");
      const answer = window.prompt(
        suggestion
          ? `Hotel preferido (opcional)\nSugestões: ${suggestion}`
          : "Hotel preferido (opcional)",
        "",
      );
      if (answer != null) {
        const normalized = answer.trim();
        preferredHotel = normalized || undefined;
      }
    }
    const res = await toggleWishlistPost(postId, preferredHotel);
    setPending(false);
    if (!res.ok) {
      if (
        res.error.toLowerCase().includes("sessão") ||
        res.error.toLowerCase().includes("inicia")
      ) {
        router.push(`/login?next=${encodeURIComponent("/")}`);
        return;
      }
      setMsg(res.error);
      return;
    }
    setSaved(res.added);
  }

  return (
    <div
      className={`absolute right-3 z-30 flex flex-col items-end gap-1 ${compactTop ? "top-12 sm:top-14" : "top-3"}`}
    >
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        title={saved ? "Remover da wishlist" : "Guardar na wishlist"}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-lg text-ocean-900 shadow-md ring-1 ring-ocean-900/10 backdrop-blur-sm transition hover:scale-105 disabled:opacity-60"
        aria-label={saved ? "Remover da wishlist" : "Guardar na wishlist"}
      >
        {pending ? "…" : saved ? "♥" : "♡"}
      </button>
      {msg ? (
        <p className="max-w-[140px] text-right text-[10px] text-amber-100">
          {msg}{" "}
          <Link href="/login" className="underline">
            Entrar
          </Link>
        </p>
      ) : null}
    </div>
  );
}
