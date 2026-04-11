"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { removeWishlistItem } from "@/app/(client)/conta/(authed)/actions";

export function WishlistRemoveButton({ itemId }: { itemId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        setPending(true);
        void removeWishlistItem(itemId).then((res) => {
          if (res.ok) router.refresh();
          setPending(false);
        });
      }}
      className="text-xs font-medium text-terracotta underline-offset-2 hover:underline disabled:opacity-50"
    >
      {pending ? "…" : "Remover"}
    </button>
  );
}
