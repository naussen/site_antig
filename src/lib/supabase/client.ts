import { createBrowserClient } from "@supabase/ssr";

/**
 * Client-side Supabase client (singleton para o browser).
 * Usado em Client Components e hooks.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
