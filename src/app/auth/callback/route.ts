import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { withSiteBasePath } from "@/lib/site-paths.mjs";
import { resolveReturnUrl, sanitizeReturnPath } from "@/lib/return-paths.mjs";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // Se "next" estiver no query string, usa ele para redirecionar de volta.
  const next = sanitizeReturnPath(searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(resolveReturnUrl(next, request.url));
    }
  }

  // Se der erro ou não tiver código, redireciona para login com aviso
  const loginUrl = new URL(withSiteBasePath("/login"), origin);
  loginUrl.searchParams.set("error", "auth");
  loginUrl.searchParams.set("next", next);
  return NextResponse.redirect(loginUrl);
}
