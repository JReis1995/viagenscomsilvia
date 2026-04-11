import { createClient } from "@supabase/supabase-js";

/**
 * Cliente com service role — ignora RLS. Usar só no servidor, depois de
 * confirmar `isConsultoraEmail` (ou outro critério explícito).
 */
export function createServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY ou NEXT_PUBLIC_SUPABASE_URL em falta.",
    );
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) =>
        fetch(input, {
          ...init,
          cache: "no-store",
        }),
    },
  });
}

export function tryCreateServiceRoleClient():
  | { ok: true; client: ReturnType<typeof createServiceRoleClient> }
  | { ok: false; message: string } {
  try {
    return { ok: true, client: createServiceRoleClient() };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, message: msg };
  }
}
