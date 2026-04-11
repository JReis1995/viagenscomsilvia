import { resolvePostLoginPathUsingPublicEnv } from "@/lib/auth/post-login-public-env";

function waitTwoFrames(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });
}

/**
 * Resolve o caminho pós-login sem Server Actions (menos conflitos com extensões
 * e com o protocolo RSC). Retentativas suaves por atraso na escrita de cookies.
 */
export async function fetchPostLoginPath(
  nextParam: string | null,
  userEmail: string,
): Promise<string> {
  await waitTwoFrames();

  const qs = nextParam
    ? `?${new URLSearchParams({ next: nextParam }).toString()}`
    : "";
  const url = `/api/auth/resolve-login-redirect${qs}`;

  let lastStatus = 0;
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) {
      await new Promise((r) => setTimeout(r, 60 + attempt * 60));
    }

    const res = await fetch(url, {
      credentials: "include",
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    lastStatus = res.status;

    if (res.ok) {
      const data: unknown = await res.json();
      if (
        data &&
        typeof data === "object" &&
        "path" in data &&
        typeof (data as { path: unknown }).path === "string"
      ) {
        const path = (data as { path: string }).path;
        if (path.startsWith("/") && !path.startsWith("//")) {
          return path;
        }
      }
      break;
    }

    if (res.status !== 401 && res.status !== 403) {
      break;
    }
  }

  const fromEnv = resolvePostLoginPathUsingPublicEnv(userEmail, nextParam);
  if (fromEnv) return fromEnv;

  return "/conta";
}
