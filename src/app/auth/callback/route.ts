import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { withSiteBasePath } from "@/lib/site-paths.mjs";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // Se "next" estiver no query string, usa ele para redirecionar de volta.
  const requestedNext = searchParams.get("next") ?? "/dashboard";
  const next =
    requestedNext.startsWith("/") && !requestedNext.startsWith("//")
      ? requestedNext
      : "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(
        new URL(withSiteBasePath(next), origin)
      );
    }
  }

  // Se der erro ou não tiver código, redireciona para login com aviso
  return NextResponse.redirect(
    new URL(withSiteBasePath("/login?error=auth"), origin)
  );
}
