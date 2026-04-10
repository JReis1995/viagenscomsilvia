import { createClient } from "@supabase/supabase-js";

/**
 * Cliente Supabase com chave anónima no servidor — respeita RLS (insert público em `leads`).
 * Não usar para operações que exijam utilizador autenticado.
 *
 * `cache: "no-store"` evita que o Next.js guarde respostas REST do Supabase no Data Cache
 * quando a página é re-renderizada após `revalidatePath` (senão o conteúdo podia ficar velho).
 */
export function createPublicServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error("Variáveis Supabase em falta.");
  }
  return createClient(url, key, {
    global: {
      fetch: (input, init) =>
        fetch(input, {
          ...init,
          cache: "no-store",
        }),
    },
  });
}
