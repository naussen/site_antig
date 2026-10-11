import "server-only";

import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import {
  DEFAULT_THEME,
  parseTheme,
  THEME_COOKIE_NAME,
} from "@/lib/theme-preference";
import type { Theme } from "@/types/database";

export async function resolveCookieTheme(): Promise<Theme> {
  const cookieStore = await cookies();
  return parseTheme(cookieStore.get(THEME_COOKIE_NAME)?.value) ?? DEFAULT_THEME;
}

export async function resolveInitialTheme(): Promise<Theme> {
  const fallback = await resolveCookieTheme();
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) return fallback;

  const { data, error } = await supabase
    .from("user_dashboard_preferences")
    .select("theme")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) return fallback;
  return parseTheme(data?.theme) ?? fallback;
}
