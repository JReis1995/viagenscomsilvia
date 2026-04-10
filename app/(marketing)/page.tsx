import Link from "next/link";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-20 md:py-28">
      <div className="rounded-2xl bg-white p-10 shadow-lg md:p-16">
        <p className="text-sm font-medium uppercase tracking-wider text-ocean-500">
          Consultoria independente
        </p>
        <h1 className="mt-4 max-w-2xl text-4xl font-semibold tracking-tight text-ocean-900 md:text-5xl md:leading-tight">
          Viagens pensadas para ti, com calma e detalhe.
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-ocean-700">
          Em breve: quiz interativo para percebermos o teu estilo de viagem e
          prepararmos uma proposta alinhada contigo.
        </p>
        <div className="mt-12 flex flex-wrap gap-4">
          <span className="inline-flex items-center rounded-2xl bg-ocean-50 px-5 py-3 text-sm font-medium text-ocean-800">
            Sprint 2 — Quiz de viagem
          </span>
        </div>
        <p className="mt-14 text-sm text-ocean-600">
          Já és consultora?{" "}
          <Link
            href="/login"
            className="font-medium text-ocean-700 underline-offset-4 hover:text-terracotta hover:underline"
          >
            Entrar no CRM
          </Link>
        </p>
      </div>
    </div>
  );
}
