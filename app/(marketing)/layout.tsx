import Link from "next/link";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-col bg-sand text-ocean-900">
      <header className="border-b border-ocean-100/80 bg-sand/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <Link
            href="/"
            className="text-lg font-semibold tracking-tight text-ocean-800"
          >
            Viagens com Sílvia
          </Link>
          <nav className="flex items-center gap-2">
            <Link
              href="/login"
              className="rounded-2xl px-4 py-2 text-sm font-medium text-ocean-700 transition-colors hover:bg-ocean-50"
            >
              Área da consultora
            </Link>
          </nav>
        </div>
      </header>
      <div className="flex-1">{children}</div>
      <footer className="border-t border-ocean-100/60 py-10 text-center text-sm text-ocean-600">
        © {new Date().getFullYear()} Viagens com Sílvia
      </footer>
    </div>
  );
}
