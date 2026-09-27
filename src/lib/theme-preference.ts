import type { Theme } from "@/types/database";

export const THEME_COOKIE_NAME = "pro-resumos-theme";
export const DEFAULT_THEME: Theme = "light";

export function parseTheme(value: unknown): Theme | null {
  return value === "light" || value === "dark" || value === "sepia"
    ? value
    : null;
}
