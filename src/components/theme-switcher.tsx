"use client";

import { Sun, Moon, BookOpen } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import type { Theme } from "@/types/database";

const THEME_OPTIONS: { value: Theme; icon: typeof Sun; label: string }[] = [
  { value: "light", icon: Sun, label: "Claro" },
  { value: "dark", icon: Moon, label: "Escuro" },
  { value: "sepia", icon: BookOpen, label: "Sépia" },
];

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  return (
    <div
      className="flex items-center gap-1 p-1 rounded-xl"
      style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}
      role="radiogroup"
      aria-label="Selecionar tema"
    >
      {THEME_OPTIONS.map(({ value, icon: Icon, label }) => {
        const isActive = theme === value;
        return (
          <button
            key={value}
            onClick={() => setTheme(value)}
            role="radio"
            aria-checked={isActive}
            aria-label={label}
            title={label}
            className="relative p-2 rounded-lg cursor-pointer"
            style={{
              background: isActive ? "var(--accent-soft)" : "transparent",
              color: isActive ? "var(--accent)" : "var(--text-muted)",
            }}
          >
            <Icon size={16} strokeWidth={2} />
          </button>
        );
      })}
    </div>
  );
}
