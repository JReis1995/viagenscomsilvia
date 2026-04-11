import { NextResponse } from "next/server";

import { computePostLoginPath } from "@/lib/auth/compute-post-login-path";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const next = url.searchParams.get("next");
  const supabase = await createClient();
  const result = await computePostLoginPath(supabase, next);

  if ("error" in result) {
    return NextResponse.json(
      { error: "Sem sessão activa." },
      { status: 401 },
    );
  }

  return NextResponse.json({ path: result.path });
}
