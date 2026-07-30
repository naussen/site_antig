"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BookOpen,
  GraduationCap,
  Loader2,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  CheckSquare,
  Square,
  ChevronRight,
  Sparkles,
  StickyNote,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ThemeSwitcher } from "@/components/theme-switcher";
import type { SectionRow } from "@/types/database";

interface DashboardNavigationProps {
  userEmail: string | null;
  studySections?: SectionRow[];
  progressMap?: Record<string, boolean>;
  activeSectionId?: string | null;
  onToggleProgress?: (sectionId: string) => void;
  onSectionClick?: (sectionId: string) => void;
}

const SIDEBAR_COLLAPSED_KEY = "pro-resumos:sidebar-collapsed";

function subscribeSidebarState(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("pro-resumos:sidebar-change", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("pro-resumos:sidebar-change", callback);
  };
}

function getSidebarSnapshot() {
  return window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "true";
}

function getSidebarServerSnapshot() {
  return false;
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

export function DashboardNavigation({
  userEmail,
  studySections = [],
  progressMap = {},
  activeSectionId = null,
  onToggleProgress,
  onSectionClick,
}: DashboardNavigationProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const collapsed = useSyncExternalStore(
    subscribeSidebarState,
    getSidebarSnapshot,
    getSidebarServerSnapshot,
  );

  const toggleCollapsed = () => {
    window.localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(!collapsed));
    window.dispatchEvent(new Event("pro-resumos:sidebar-change"));
  };

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
      <div className={`shrink-0 flex items-center border-b py-5 ${collapsed ? "justify-center px-3" : "gap-3 px-5"}`} style={{ borderColor: "var(--dashboard-sidebar-border)" }}>
        <span
          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-white"
          style={{
            background:
              "linear-gradient(135deg, var(--mnemonic-gradient-from), var(--mnemonic-gradient-to))",
          }}
        >
          <Sparkles size={20} />
        </span>
        <div className={`min-w-0 ${collapsed ? "hidden" : ""}`}>
          <strong className="block truncate text-sm" style={{ color: "var(--dashboard-sidebar-text)" }}>
            PRO Resumos
          </strong>
          <span className="block truncate text-xs" style={{ color: "var(--dashboard-sidebar-muted)" }}>
            Sua biblioteca
          </span>
        </div>
      </div>

      <nav
        className="min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain p-3"
        aria-label="Navegação principal"
      >
        {navigationItems.map(({ href, label, icon: Icon, exact }) => {
          const active = isActive(href, exact);
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              aria-current={active ? "page" : undefined}
              className={`flex items-center rounded-xl border py-3 text-sm font-semibold transition-colors ${collapsed ? "justify-center px-2" : "gap-3 px-3"}`}
              style={{
                background: active ? "var(--dashboard-sidebar-active)" : "transparent",
                borderColor: active ? "var(--dashboard-sidebar-border)" : "transparent",
                color: active ? "var(--accent)" : "var(--dashboard-sidebar-muted)",
              }}
            >
              <Icon size={19} />
              <span className={collapsed ? "sr-only" : undefined}>{label}</span>
            </Link>
          );
        })}

        {studySections.length > 0 && !collapsed && (
          <div className="mt-5 border-t pt-4" style={{ borderColor: "var(--dashboard-sidebar-border)" }}>
            <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: "var(--dashboard-sidebar-muted)" }}>
              Tópicos
            </p>
            <div className="space-y-1">
              {studySections.map((section) => {
                const isCompleted = progressMap[section.section_id] ?? false;
                const isActive = activeSectionId === section.section_id;

                return (
                  <div
                    key={section.section_id}
                    className="flex items-start gap-2 rounded-lg px-2 py-2"
                    style={{ background: isActive ? "var(--dashboard-sidebar-active)" : "transparent" }}
                  >
                    <button
                      type="button"
                      onClick={() => onToggleProgress?.(section.section_id)}
                      className="mt-0.5 shrink-0 cursor-pointer"
                      style={{ color: isCompleted ? "var(--callout-tip-border)" : "var(--dashboard-sidebar-muted)" }}
                      aria-label={`Marcar "${section.title}" como ${isCompleted ? "não concluída" : "concluída"}`}
                    >
                      {isCompleted ? <CheckSquare size={16} /> : <Square size={16} />}
                    </button>
                    <button
                      type="button"
                      onClick={() => onSectionClick?.(section.section_id)}
                      className="min-w-0 flex-1 text-left text-xs leading-snug"
                      style={{
                        color: isActive ? "var(--accent)" : "var(--dashboard-sidebar-muted)",
                        textDecoration: isCompleted ? "line-through" : "none",
                        fontWeight: isActive ? 700 : 400,
                      }}
                    >
                      {section.title}
                    </button>
                    {isActive && <ChevronRight size={13} className="mt-0.5 shrink-0" style={{ color: "var(--accent)" }} />}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </nav>

      <div className="shrink-0 space-y-4 border-t p-4" style={{ borderColor: "var(--dashboard-sidebar-border)" }}>
        <button
          type="button"
          onClick={toggleCollapsed}
          className="flex w-full items-center justify-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors hover:bg-white/5"
          style={{ borderColor: "var(--dashboard-sidebar-border)", color: "var(--dashboard-sidebar-muted)" }}
          aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
          title={collapsed ? "Expandir menu" : "Recolher menu"}
        >
          {collapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
          <span className={collapsed ? "sr-only" : undefined}>{collapsed ? "Expandir" : "Recolher menu"}</span>
        </button>

        <div className={collapsed ? "hidden" : ""}>
          <span className="mb-2 block text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--dashboard-sidebar-muted)" }}>
            Aparência
          </span>
          <ThemeSwitcher />
        </div>

        {userEmail && (
          <div className="border-t pt-4" style={{ borderColor: "var(--dashboard-sidebar-border)" }}>
            <span className="mb-2 block truncate text-xs" title={userEmail} style={{ color: "var(--dashboard-sidebar-muted)" }}>
              {userEmail}
            </span>
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors hover:bg-red-500/10 hover:text-red-500 disabled:cursor-wait disabled:opacity-60"
              style={{ color: "var(--dashboard-sidebar-muted)" }}
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
        className={`sticky top-0 hidden h-screen shrink-0 flex-col border-r transition-[width] duration-200 lg:flex ${collapsed ? "w-[4.5rem]" : "w-60"}`}
        style={{ background: "var(--dashboard-sidebar)", borderColor: "var(--dashboard-sidebar-border)" }}
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
        style={{ background: "var(--dashboard-sidebar)", borderColor: "var(--dashboard-sidebar-border)" }}
        aria-hidden={!mobileOpen}
        inert={!mobileOpen}
      >
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          className="absolute right-3 top-3 z-10 grid h-10 w-10 place-items-center rounded-xl"
          style={{ color: "var(--dashboard-sidebar-muted)" }}
          aria-label="Fechar navegação"
        >
          <X size={21} />
        </button>
        {navigationContent}
      </aside>
    </>
  );
}
