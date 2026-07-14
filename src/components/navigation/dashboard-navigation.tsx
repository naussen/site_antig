"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BookOpen,
  GraduationCap,
  Loader2,
  LogOut,
  Menu,
  Sparkles,
  StickyNote,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ThemeSwitcher } from "@/components/theme-switcher";

interface DashboardNavigationProps {
  userEmail: string | null;
}

const navigationItems = [
  { href: "/dashboard", label: "Início", icon: BookOpen, exact: true },
  { href: "/dashboard/notas", label: "Notas", icon: StickyNote },
  {
    href: "/dashboard/configuracoes",
    label: "Matérias",
    icon: GraduationCap,
  },
];

export function DashboardNavigation({ userEmail }: DashboardNavigationProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/login");
      router.refresh();
    } finally {
      setLoggingOut(false);
    }
  };

  const navigationContent = (
    <>
      <div className="flex items-center gap-3 border-b px-5 py-5" style={{ borderColor: "var(--border)" }}>
        <span
          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-white"
          style={{
            background:
              "linear-gradient(135deg, var(--mnemonic-gradient-from), var(--mnemonic-gradient-to))",
          }}
        >
          <Sparkles size={20} />
        </span>
        <div className="min-w-0">
          <strong className="block truncate text-sm" style={{ color: "var(--text-primary)" }}>
            PRO Resumos
          </strong>
          <span className="block truncate text-xs" style={{ color: "var(--text-muted)" }}>
            Sua biblioteca
          </span>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-3" aria-label="Navegação principal">
        {navigationItems.map(({ href, label, icon: Icon, exact }) => {
          const active = isActive(href, exact);
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              aria-current={active ? "page" : undefined}
              className="flex items-center gap-3 rounded-xl border px-3 py-3 text-sm font-semibold transition-colors"
              style={{
                background: active ? "var(--accent-soft)" : "transparent",
                borderColor: active ? "var(--border)" : "transparent",
                color: active ? "var(--accent)" : "var(--text-secondary)",
              }}
            >
              <Icon size={19} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-4 border-t p-4" style={{ borderColor: "var(--border)" }}>
        <div>
          <span className="mb-2 block text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
            Aparência
          </span>
          <ThemeSwitcher />
        </div>

        {userEmail && (
          <div className="border-t pt-4" style={{ borderColor: "var(--border)" }}>
            <span className="mb-2 block truncate text-xs" title={userEmail} style={{ color: "var(--text-muted)" }}>
              {userEmail}
            </span>
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors hover:bg-red-500/10 hover:text-red-500 disabled:cursor-wait disabled:opacity-60"
              style={{ color: "var(--text-secondary)" }}
            >
              {loggingOut ? <Loader2 size={18} className="animate-spin" /> : <LogOut size={18} />}
              Sair da conta
            </button>
          </div>
        )}
      </div>
    </>
  );

  return (
    <>
      <aside
        className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r lg:flex"
        style={{ background: "var(--bg-sidebar)", borderColor: "var(--border)" }}
      >
        {navigationContent}
      </aside>

      <header
        className="sticky top-0 z-30 flex items-center justify-between border-b px-4 py-3 lg:hidden"
        style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
      >
        <Link href="/dashboard" className="flex items-center gap-2 font-bold" style={{ color: "var(--text-primary)" }}>
          <Sparkles size={19} style={{ color: "var(--accent)" }} />
          PRO Resumos
        </Link>
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="grid h-11 w-11 place-items-center rounded-xl border"
          style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
          aria-label="Abrir navegação"
          aria-expanded={mobileOpen}
          aria-controls="dashboard-mobile-navigation"
        >
          <Menu size={22} />
        </button>
      </header>

      {mobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-label="Fechar navegação"
        />
      )}

      <aside
        id="dashboard-mobile-navigation"
        className={`fixed inset-y-0 right-0 z-50 flex w-[min(86vw,320px)] flex-col border-l transition-transform duration-300 lg:hidden ${
          mobileOpen ? "translate-x-0" : "translate-x-full"
        }`}
        style={{ background: "var(--bg-sidebar)", borderColor: "var(--border)" }}
        aria-hidden={!mobileOpen}
        inert={!mobileOpen}
      >
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          className="absolute right-3 top-3 z-10 grid h-10 w-10 place-items-center rounded-xl"
          style={{ color: "var(--text-secondary)" }}
          aria-label="Fechar navegação"
        >
          <X size={21} />
        </button>
        {navigationContent}
      </aside>
    </>
  );
}
