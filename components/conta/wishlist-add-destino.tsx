"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { addWishlistDestinoLabel } from "@/app/(client)/conta/(authed)/actions";

export function WishlistAddDestino() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [pending, setPending] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setPending(true);
    const res = await addWishlistDestinoLabel(value);
    setPending(false);
    if (!res.ok) {
      setMsg(res.error);
      return;
    }
    setValue("");
    setMsg("Adicionado à wishlist.");
    router.refresh();
  }

  return (
    <form
      onSubmit={(e) => void submit(e)}
      className="rounded-2xl border border-ocean-100 bg-ocean-50/40 p-4"
    >
      <p className="text-sm font-medium text-ocean-900">
        Guardar um destino à mão
      </p>
      <p className="mt-1 text-xs text-ocean-600">
        Ex.: um sítio que sonhas visitar e ainda não está no feed.
      </p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <input
          className="min-w-0 flex-1 rounded-xl border border-ocean-200 bg-white px-3 py-2 text-sm"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="ex.: Japão na época das cerejeiras"
          maxLength={500}
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-ocean-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {pending ? "…" : "Adicionar"}
        </button>
      </div>
      {msg ? (
        <p className="mt-2 text-xs text-ocean-600" role="status">
          {msg}
        </p>
      ) : null}
    </form>
  );
}
