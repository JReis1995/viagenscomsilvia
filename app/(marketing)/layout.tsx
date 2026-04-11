import Link from "next/link";

import { SocialLinks } from "@/components/marketing/social-links";
import { isConsultoraEmailAsync } from "@/lib/auth/consultora";
import { createClient } from "@/lib/supabase/server";

export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let user: { email?: string | null } | null = null;
  let isConsultora = false;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (supabaseUrl && supabaseAnon) {
    const supabase = await createClient();
    const {
      data: { user: u },
    } = await supabase.auth.getUser();
    user = u;
    if (u?.email) {
      isConsultora = await isConsultoraEmailAsync(u.email, supabase);
    }
  }
  const painelHref = !user
    ? "/login"
    : isConsultora
      ? "/crm"
      : "/conta";
  const painelLabel = !user
    ? "Entrar"
    : isConsultora
      ? "Painel CRM"
      : "A minha conta";

  return (
    <div className="flex min-h-full flex-col bg-sand text-ocean-900">
      <header className="border-b border-ocean-100/80 bg-sand/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-6 py-5">
          <Link
            href="/"
            className="text-lg font-semibold tracking-tight text-ocean-800"
          >
            Viagens com Sílvia
          </Link>
          <nav className="flex flex-wrap items-center justify-end gap-1 sm:gap-2">
            <Link
              href="/#inspiracoes"
              className="rounded-2xl px-3 py-2 text-sm font-medium text-ocean-700 transition-colors hover:bg-ocean-50 sm:px-4"
            >
              Inspirações
            </Link>
            <Link
              href="/#pedido-orcamento"
              className="rounded-2xl px-3 py-2 text-sm font-medium text-ocean-700 transition-colors hover:bg-ocean-50 sm:px-4"
            >
              Pedir orçamento
            </Link>
            <Link
              href="/mapa"
              className="rounded-2xl px-3 py-2 text-sm font-medium text-ocean-700 transition-colors hover:bg-ocean-50 sm:px-4"
            >
              Mapa
            </Link>
            <Link
              href={painelHref}
              className="rounded-2xl px-3 py-2 text-sm font-medium text-ocean-700 transition-colors hover:bg-ocean-50 sm:px-4"
            >
              {painelLabel}
            </Link>
          </nav>
        </div>
      </header>
      <div className="flex-1">{children}</div>
      <footer className="border-t border-ocean-100/60 py-10">
        <SocialLinks className="mb-6" />
        <p className="text-center text-sm text-ocean-600">
          © {new Date().getFullYear()} Viagens com Sílvia
        </p>
      </footer>
    </div>
  );
}
