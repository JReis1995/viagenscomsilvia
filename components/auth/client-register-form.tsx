"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { createClient } from "@/lib/supabase/client";

export function ClientRegisterForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);

    const origin =
      typeof window !== "undefined" ? window.location.origin : "";
    const supabase = createClient();
    const { error: signError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent("/conta")}`,
      },
    });

    setLoading(false);

    if (signError) {
      setError(signError.message);
      return;
    }

    setInfo(
      "Se o teu projeto tiver confirmação por email, abre a caixa de entrada e valida a conta. Depois podes entrar aqui.",
    );
    router.refresh();
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <label
          htmlFor="reg-email"
          className="text-sm font-medium text-ocean-800"
        >
          Email
        </label>
        <input
          id="reg-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-2xl border border-ocean-100 bg-white px-4 py-3 text-ocean-900 shadow-sm outline-none transition focus:border-ocean-500 focus:ring-2 focus:ring-ocean-500/20"
        />
        <p className="text-xs text-ocean-500">
          Usa o <strong className="font-medium text-ocean-700">mesmo email</strong>{" "}
          que indicaste no pedido de proposta para associarmos o teu pedido.
        </p>
      </div>
      <div className="flex flex-col gap-2">
        <label
          htmlFor="reg-password"
          className="text-sm font-medium text-ocean-800"
        >
          Palavra-passe
        </label>
        <input
          id="reg-password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-2xl border border-ocean-100 bg-white px-4 py-3 text-ocean-900 shadow-sm outline-none transition focus:border-ocean-500 focus:ring-2 focus:ring-ocean-500/20"
        />
      </div>
      {error ? (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      ) : null}
      {info ? (
        <p className="rounded-xl border border-ocean-200 bg-ocean-50/80 px-4 py-3 text-sm text-ocean-800">
          {info}{" "}
          <Link href="/login?next=%2Fconta" className="font-semibold underline">
            Ir para o login
          </Link>
        </p>
      ) : null}
      <button
        type="submit"
        disabled={loading}
        className="mt-2 inline-flex h-12 items-center justify-center rounded-2xl bg-ocean-800 px-6 text-sm font-semibold text-white shadow-lg transition hover:bg-ocean-900 disabled:opacity-60"
      >
        {loading ? "A criar conta…" : "Criar conta"}
      </button>
    </form>
  );
}
