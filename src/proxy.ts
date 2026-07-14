import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Proxy: renova o token de sessão do Supabase a cada request.
 * Não protege rotas — a proteção é feita nos Server Components via redirect("/login").
 * Usamos um objeto wrapper para evitar o bug de reassignment de `response`
 * antes que os cookies sejam propagados no setAll.
 */
export async function proxy(request: NextRequest) {
  // Wrapper estável para que setAll sempre enxergue o response atual
  const responseHolder = {
    value: NextResponse.next({ request: { headers: request.headers } }),
  };

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Primeiro propaga os cookies no request para o próximo handler
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          // Recria o response com o request já atualizado
          responseHolder.value = NextResponse.next({ request });
          // Propaga os cookies com opções (expiração, httpOnly, etc.) na response
          cookiesToSet.forEach(({ name, value, options }) =>
            responseHolder.value.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Chama getUser (mais seguro que getSession) para renovar o token via cookie
  await supabase.auth.getUser();

  return responseHolder.value;
}

export const config = {
  matcher: [
    /*
     * Executa em todos os paths exceto assets estáticos e otimização de imagens.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
