"use client";

import { Sun, Moon, BookOpen } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import type { Theme } from "@/types/database";

const THEME_OPTIONS: { value: Theme; icon: typeof Sun; label: string }[] = [
  { value: "light", icon: Sun, label: "Claro" },
  { value: "dark", icon: Moon, label: "Escuro" },
  { value: "sepia", icon: BookOpen, label: "Sépia" },
];

export function ThemeSwitcher({ compact = false }: { compact?: boolean }) {
  const { theme, setTheme } = useTheme();

  if (compact) {
    const currentIndex = THEME_OPTIONS.findIndex(({ value }) => value === theme);
    const current = THEME_OPTIONS[currentIndex] ?? THEME_OPTIONS[0];
    const next = THEME_OPTIONS[(currentIndex + 1) % THEME_OPTIONS.length];
    const CurrentIcon = current.icon;

    return (
      <button
        type="button"
        onClick={() => setTheme(next.value)}
        className="group relative grid h-10 w-10 cursor-pointer place-items-center overflow-hidden rounded-xl border border-[var(--dashboard-sidebar-border)] text-[var(--dashboard-sidebar-muted)] transition-[transform,background-color,border-color,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-[var(--accent)] hover:bg-[var(--dashboard-sidebar-active)] hover:shadow-[0_8px_24px_-14px_var(--accent)] active:translate-y-0 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
        aria-label={`Alterar tema. Atual: ${current.label}. Próximo: ${next.label}`}
        title={`Tema: ${current.label}`}
      >
        <CurrentIcon size={18} aria-hidden="true" className="transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110" />
        <span
          role="tooltip"
          className="pointer-events-none invisible absolute left-full z-50 ml-3 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs font-semibold opacity-0 shadow-lg transition-opacity group-hover:visible group-hover:opacity-100 group-focus-visible:visible group-focus-visible:opacity-100"
          style={{
            background: "var(--dashboard-sidebar-text)",
            color: "var(--dashboard-sidebar)",
          }}
        >
          {`Tema: ${current.label}`}
        </span>
      </button>
    );
  }

  return (
    <div
      className="grid grid-cols-3 items-center gap-1 rounded-2xl p-1.5 shadow-inner"
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
            className={`group relative grid h-9 cursor-pointer place-items-center overflow-hidden rounded-xl border transition-[transform,background-color,border-color,box-shadow] duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${isActive ? "border-[var(--accent)]/25 shadow-[0_6px_18px_-12px_var(--accent)]" : "border-transparent hover:border-[var(--border)] hover:bg-[var(--accent-soft)]"}`}
            style={{
              background: isActive ? "var(--accent-soft)" : "transparent",
              color: isActive ? "var(--accent)" : "var(--text-muted)",
            }}
          >
            <Icon size={16} strokeWidth={isActive ? 2.4 : 2} className="transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110" />
          </button>
        );
      })}
    </div>
  );
}
