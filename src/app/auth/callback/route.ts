import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { hasGoogleSession } from "@/lib/auth/google-only.mjs";
import { sanitizeOAuthCallbackUrl } from "@/lib/auth/oauth-callback-url.mjs";
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
    const { data: claimsData, error: claimsError } = !error
      ? await supabase.auth.getClaims()
      : { data: null, error };
    if (
      !error &&
      !claimsError &&
      data.user &&
      hasGoogleSession(data.user, claimsData?.claims)
    ) {
      let destination = next;

      if (!destination && data.user) {
        const { data: preferences } = await supabase
          .from("user_dashboard_preferences")
          .select("start_module, start_discipline")
          .eq("user_id", data.user.id)
          .maybeSingle();
        destination = resolveUserStartPath(preferences);
      }

      const cleanDestination = sanitizeOAuthCallbackUrl(
        resolveReturnUrl(destination ?? resolveUserStartPath(null), request.url)
      );
      const response = NextResponse.redirect(cleanDestination, 303);
      response.headers.set("Cache-Control", "private, no-store, max-age=0");
      response.headers.set("Referrer-Policy", "no-referrer");
      return response;
    }

    if (!error && data.user) {
      await supabase.auth.signOut();
      const loginUrl = new URL(withSiteBasePath("/login"), origin);
      loginUrl.searchParams.set("error", "google_required");
      if (next) loginUrl.searchParams.set("next", next);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Se der erro ou não tiver código, redireciona para login com aviso
  const loginUrl = new URL(withSiteBasePath("/login"), origin);
  loginUrl.searchParams.set("error", "auth");
  if (next) loginUrl.searchParams.set("next", next);
  return NextResponse.redirect(loginUrl);
}
