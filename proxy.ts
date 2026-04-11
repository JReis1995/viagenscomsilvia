import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { isConsultoraEmail } from "@/lib/auth/consultora";
import { resolvePostLoginPath } from "@/lib/auth/redirect";

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const path = request.nextUrl.pathname;

  /* URLs antigas — um único login em /login */
  if (path === "/conta/entrar" || path.startsWith("/conta/entrar/")) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", "/conta");
    return NextResponse.redirect(url);
  }

  if (path === "/conta/registar" || path.startsWith("/conta/registar/")) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("registar", "1");
    url.searchParams.set("next", "/conta");
    return NextResponse.redirect(url);
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnon) {
    console.error(
      "[proxy] Variáveis NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY em falta.",
    );
    return NextResponse.next({ request });
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnon,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && path.startsWith("/conta")) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }

  if (!user && path.startsWith("/crm")) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }

  if (user && path.startsWith("/crm") && !isConsultoraEmail(user.email)) {
    const url = request.nextUrl.clone();
    url.pathname = "/conta";
    url.searchParams.set("crm", "forbidden");
    return NextResponse.redirect(url);
  }

  if (user && path === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = resolvePostLoginPath(
      request.nextUrl.searchParams.get("next"),
      isConsultoraEmail(user.email),
    );
    url.searchParams.delete("next");
    url.searchParams.delete("registar");
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
