"use client";

import { useEffect } from "react";

/**
 * Garante scroll ao âncora quando a navegação vem de um Link com hash (ex.: hero → quiz).
 */
export function ScrollToPedidoAnchor() {
  useEffect(() => {
    const raw = window.location.hash.replace(/^#/, "");
    if (raw !== "pedido-orcamento" && raw !== "quiz") return;
    const id = raw === "quiz" ? "pedido-orcamento" : raw;
    requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ block: "start" });
    });
  }, []);

  return null;
}
