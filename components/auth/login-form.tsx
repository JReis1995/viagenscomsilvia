"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";

import { resolvePostLoginRedirect } from "@/lib/auth/post-login";
import { createClient } from "@/lib/supabase/client";

export function LoginForm() {
  const searchParams = useSearchParams();
  const nextParam = searchParams.get("next");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const fd = new FormData(e.currentTarget);
    const emailRaw = String(fd.get("email") ?? "").trim();
    const passwordRaw = String(fd.get("password") ?? "");

    const supabase = createClient();
    const { error: signError } = await supabase.auth.signInWithPassword({
      email: emailRaw,
      password: passwordRaw,
    });

    if (signError) {
      setLoading(false);
      setError(signError.message);
      return;
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user?.email) {
      setLoading(false);
      setError("Não foi possível ler a sessão. Tenta de novo.");
      return;
    }

    const path = await resolvePostLoginRedirect(
      session.user.email,
      nextParam,
    );

    // Não usar router.refresh() aqui: o proxy redirecciona quem já tem sessão
    // em /login; refresh + replace competem e o App Router pode ficar preso até
    // haver foco noutra janela/separador. Navegação completa aplica cookies e
    // evita esse estado intermédio.
    window.location.assign(path);
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <label
          htmlFor="email"
          className="text-sm font-medium text-ocean-800"
        >
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-2xl border border-ocean-100 bg-sand px-4 py-3 text-ocean-900 shadow-sm outline-none transition focus:border-ocean-500 focus:ring-2 focus:ring-ocean-500/20"
        />
      </div>
      <div className="flex flex-col gap-2">
        <label
          htmlFor="password"
          className="text-sm font-medium text-ocean-800"
        >
          Palavra-passe
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-2xl border border-ocean-100 bg-sand px-4 py-3 text-ocean-900 shadow-sm outline-none transition focus:border-ocean-500 focus:ring-2 focus:ring-ocean-500/20"
        />
      </div>
      {error ? (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={loading}
        className="mt-2 inline-flex h-12 items-center justify-center rounded-2xl bg-terracotta px-6 text-sm font-semibold text-white shadow-lg transition hover:bg-terracotta-hover disabled:opacity-60"
      >
        {loading ? "A entrar…" : "Entrar"}
      </button>
    </form>
  );
}
