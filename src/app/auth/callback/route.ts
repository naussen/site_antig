import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { withSiteBasePath } from "@/lib/site-paths.mjs";
import { isAllowedReturnPath, resolveReturnUrl } from "@/lib/return-paths.mjs";
import { resolveUserStartPath } from "@/lib/user-start-page.mjs";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // Se "next" estiver no query string, usa ele para redirecionar de volta.
  const requestedNext = searchParams.get("next");
  const next = isAllowedReturnPath(requestedNext) ? requestedNext : null;

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      let destination = next;

      if (!destination && data.user) {
        const { data: preferences } = await supabase
          .from("user_dashboard_preferences")
          .select("start_module, start_discipline")
          .eq("user_id", data.user.id)
          .maybeSingle();
        destination = resolveUserStartPath(preferences);
      }

      return NextResponse.redirect(
        resolveReturnUrl(destination ?? resolveUserStartPath(null), request.url)
      );
    }
  }

  // Se der erro ou não tiver código, redireciona para login com aviso
  const loginUrl = new URL(withSiteBasePath("/login"), origin);
  loginUrl.searchParams.set("error", "auth");
  if (next) loginUrl.searchParams.set("next", next);
  return NextResponse.redirect(loginUrl);
}
