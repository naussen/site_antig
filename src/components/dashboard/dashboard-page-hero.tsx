import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface DashboardPageHeroProps {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  description: ReactNode;
  children?: ReactNode;
}

/** Identidade-base dos módulos auxiliares, preservando conteúdo e recursos próprios. */
export function DashboardPageHero({
  icon: Icon,
  eyebrow,
  title,
  description,
  children,
}: DashboardPageHeroProps) {
  return (
    <header className="relative overflow-hidden rounded-[2rem] border border-white/15 bg-[linear-gradient(135deg,var(--catalog-hero-start),var(--catalog-hero-end))] p-6 text-white shadow-[var(--shadow-lg)] sm:p-8">
      <div
        className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-[var(--catalog-hero-glow)] blur-3xl"
        aria-hidden="true"
      />
      <div className="relative">
        <span className="grid h-12 w-12 place-items-center rounded-2xl border border-white/15 bg-white/10 text-[var(--catalog-gold-light)]">
          <Icon size={24} aria-hidden="true" />
        </span>
        <p className="mt-6 text-xs font-black uppercase tracking-[0.16em] text-white/75">
          {eyebrow}
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-4xl">
          {title}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-white/75 sm:text-base">
          {description}
        </p>
        {children}
      </div>
    </header>
  );
}
