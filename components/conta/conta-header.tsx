"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

export function ContaHeader({ email }: { email?: string | null }) {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh();
    router.replace("/login");
  }

  return (
    <header className="border-b border-ocean-100 bg-white/90 shadow-sm backdrop-blur-sm">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-6 py-4">
        <div className="flex min-w-0 flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-2">
          <Link
            href="/"
            className="truncate text-sm font-semibold text-ocean-900 hover:text-ocean-700"
          >
            Viagens com Sílvia
          </Link>
          <span className="hidden text-ocean-300 sm:inline">·</span>
          <span className="text-xs text-ocean-600 sm:text-sm">A minha conta</span>
        </div>
        <nav className="flex flex-wrap gap-2 text-xs font-medium sm:text-sm">
          <Link
            href="/conta"
            className="rounded-full border border-ocean-200 px-3 py-1.5 text-ocean-700 hover:bg-ocean-50"
          >
            Pedidos
          </Link>
          <Link
            href="/conta/wishlist"
            className="rounded-full border border-ocean-200 px-3 py-1.5 text-ocean-700 hover:bg-ocean-50"
          >
            Wishlist
          </Link>
          <Link
            href="/conta/roteiros"
            className="rounded-full border border-ocean-200 px-3 py-1.5 text-ocean-700 hover:bg-ocean-50"
          >
            Roteiros secretos
          </Link>
        </nav>
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          {email ? (
            <span className="hidden max-w-[140px] truncate text-xs text-ocean-500 sm:inline sm:max-w-[200px] sm:text-sm">
              {email}
            </span>
          ) : null}
          <button
            type="button"
            onClick={() => void handleSignOut()}
            className="rounded-2xl border border-ocean-200 px-3 py-2 text-xs font-medium text-ocean-700 transition hover:bg-ocean-50 sm:px-4 sm:text-sm"
          >
            Sair
          </button>
        </div>
      </div>
    </header>
  );
}
