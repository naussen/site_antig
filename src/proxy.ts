import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { hasGoogleSession } from "@/lib/auth/google-only.mjs";
import { sanitizeOAuthCallbackUrl } from "@/lib/auth/oauth-callback-url.mjs";
import {
  isPublicPageRequest,
  SESSION_AWARE_REQUEST_HEADER,
} from "@/lib/public-request-paths.mjs";
import { isStudyPath } from "@/lib/site-paths.mjs";

const SUPABASE_CACHE_HEADER_NAMES = [
  "cache-control",
  "expires",
  "pragma",
] as const;

function copySessionResponseMetadata(
  source: NextResponse,
  target: NextResponse,
) {
  source.cookies
    .getAll()
    .forEach((cookie) => target.cookies.set(cookie));

  SUPABASE_CACHE_HEADER_NAMES.forEach((headerName) => {
    const value = source.headers.get(headerName);
    if (value) target.headers.set(headerName, value);
  });
}

/**
 * Proxy: renova o token de sessão do Supabase a cada request.
 * Antecipa apenas o redirecionamento de visitantes anônimos nas páginas de
 * estudo. Autorização completa (MFA e assinatura) permanece no Server Component.
 * Usamos um objeto wrapper para evitar o bug de reassignment de `response`
 * antes que os cookies sejam propagados no setAll.
 */
export async function proxy(request: NextRequest) {
  const localPath = request.nextUrl.pathname.startsWith("/resumos/")
    ? request.nextUrl.pathname.slice("/resumos".length)
    : request.nextUrl.pathname;

  // Somente páginas públicas explícitas e métodos sem mutação ignoram a
  // renovação de sessão. POST continua protegido para não contornar Server Actions.
  if (isPublicPageRequest(request.method, localPath)) {
    const publicHeaders = new Headers(request.headers);
    publicHeaders.delete(SESSION_AWARE_REQUEST_HEADER);
    return NextResponse.next({ request: { headers: publicHeaders } });
  }

  const createSessionAwareResponse = () => {
    const sessionAwareHeaders = new Headers(request.headers);
    sessionAwareHeaders.set(SESSION_AWARE_REQUEST_HEADER, "1");
    return NextResponse.next({ request: { headers: sessionAwareHeaders } });
  };

  // Wrapper estável para que setAll sempre enxergue o response atual
  const responseHolder = {
    value: createSessionAwareResponse(),
  };

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, cacheHeaders) {
          // Primeiro propaga os cookies no request para o próximo handler
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          // Recria o response com o request já atualizado
          responseHolder.value = createSessionAwareResponse();
          // Propaga os cookies com opções (expiração, httpOnly, etc.) na response
          cookiesToSet.forEach(({ name, value, options }) =>
            responseHolder.value.cookies.set(name, value, options)
          );
          Object.entries(cacheHeaders).forEach(([key, value]) =>
            responseHolder.value.headers.set(key, value)
          );
        },
      },
    }
  );

  // getUser valida a sessão no servidor e renova os cookies quando necessário.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: claimsData, error: claimsError } = user
    ? await supabase.auth.getClaims()
    : { data: null, error: null };

  if (
    user &&
    !claimsError &&
    hasGoogleSession(user, claimsData?.claims) &&
    localPath !== "/auth/callback"
  ) {
    const cleanUrl = sanitizeOAuthCallbackUrl(request.nextUrl);

    if (cleanUrl.toString() !== request.nextUrl.toString()) {
      const cleanResponse = NextResponse.redirect(cleanUrl, 303);
      copySessionResponseMetadata(responseHolder.value, cleanResponse);
      cleanResponse.headers.set("Cache-Control", "private, no-store, max-age=0");
      cleanResponse.headers.set("Referrer-Policy", "no-referrer");
      return cleanResponse;
    }
  }

  if (user && (claimsError || !hasGoogleSession(user, claimsData?.claims))) {
    await supabase.auth.signOut();

    if (localPath === "/login" || localPath === "/auth/callback") {
      return responseHolder.value;
    }

    if (localPath.startsWith("/api/")) {
      const unauthorizedResponse = NextResponse.json(
        { error: "Autenticação Google necessária." },
        { status: 401 }
      );
      copySessionResponseMetadata(responseHolder.value, unauthorizedResponse);
      return unauthorizedResponse;
    }

    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.search = "?error=google_required";
    const redirectResponse = NextResponse.redirect(loginUrl);
    copySessionResponseMetadata(responseHolder.value, redirectResponse);
    return redirectResponse;
  }

  if (!user && isStudyPath(request.nextUrl.pathname)) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.search = "";

    const redirectResponse = NextResponse.redirect(loginUrl);
    copySessionResponseMetadata(responseHolder.value, redirectResponse);

    return redirectResponse;
  }

  return responseHolder.value;
}

export const config = {
  matcher: [
    /*
     * Executa em todos os paths exceto assets estáticos e otimização de imagens.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:css|svg|png|jpg|jpeg|gif|webp|ico|xml|txt)$).*)",
  ],
};
