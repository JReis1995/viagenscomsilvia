"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

type Props = {
  email?: string | null;
};

export function CrmHeader({ email }: Props) {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh();
    router.replace("/login");
  }

  return (
    <header className="border-b border-ocean-100 bg-white shadow-sm">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-3 gap-y-2 px-3 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:flex-nowrap sm:gap-4 sm:px-6 sm:py-4">
        <div className="flex min-w-0 flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-3">
          <Link
            href="/crm"
            className="text-base font-semibold tracking-tight text-ocean-900 sm:text-lg"
          >
            CRM
          </Link>
          <span className="hidden text-ocean-300 sm:inline">·</span>
          <span className="hidden text-sm text-ocean-600 sm:inline">
            Viagens com Sílvia
          </span>
        </div>
        <nav className="order-3 flex w-full basis-full flex-wrap items-center gap-x-1 gap-y-1 text-xs font-medium text-ocean-700 sm:order-none sm:flex-1 sm:basis-auto sm:w-auto sm:justify-center sm:gap-1 sm:text-sm">
          <Link
            href="/crm"
            className="rounded-xl px-2 py-1.5 transition hover:bg-ocean-50 hover:text-ocean-900"
          >
            Leads
          </Link>
          <span className="text-ocean-200" aria-hidden>
            |
          </span>
          <Link
            href="/crm/site"
            className="rounded-xl px-2 py-1.5 transition hover:bg-ocean-50 hover:text-ocean-900"
            title="Editar textos da página inicial"
          >
            Site
          </Link>
          <span className="text-ocean-200" aria-hidden>
            |
          </span>
          <Link
            href="/crm/publicacoes"
            className="rounded-xl px-2 py-1.5 transition hover:bg-ocean-50 hover:text-ocean-900"
          >
            Publicações
          </Link>
        </nav>
        <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-4">
          <Link
            href="/"
            className="rounded-2xl border border-ocean-200 bg-white px-3 py-2 text-sm font-medium text-ocean-800 transition hover:bg-ocean-50 sm:px-4"
          >
            Página inicial
          </Link>
          {email ? (
            <span className="hidden truncate text-sm text-ocean-600 sm:max-w-[200px] sm:inline">
              {email}
            </span>
          ) : null}
          <button
            type="button"
            onClick={() => void handleSignOut()}
            className="rounded-2xl border border-ocean-200 px-4 py-2 text-sm font-medium text-ocean-700 transition hover:bg-ocean-50"
          >
            Sair
          </button>
        </div>
      </div>
    </header>
  );
}
