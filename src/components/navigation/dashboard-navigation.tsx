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
  StickyNote,
  X,
} from "lucide-react";
import { ProLogo } from "@/components/brand/pro-logo";
import { createClient } from "@/lib/supabase/client";
import { ThemeSwitcher } from "@/components/theme-switcher";
import type { SectionRow } from "@/types/database";

interface DashboardNavigationProps {
  userEmail: string | null;
  userName?: string | null;
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
  userName = null,
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
  const accountName = userName?.trim() || userEmail;

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

  const renderNavigationContent = (isCollapsed: boolean) => (
    <>
      <div className={`shrink-0 flex items-center border-b py-5 ${isCollapsed ? "justify-center px-3" : "gap-3 px-5"}`} style={{ borderColor: "var(--dashboard-sidebar-border)" }}>
        <ProLogo
          size={isCollapsed ? 38 : 40}
          variant={isCollapsed ? "icon" : "full"}
          tone="dark"
        />
      </div>

      <div className="hidden shrink-0 justify-end px-3 pt-2 lg:flex">
        <button
          type="button"
          onClick={toggleCollapsed}
          className="grid h-8 w-8 cursor-pointer place-items-center rounded-full border shadow-md transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
          style={{ borderColor: "var(--dashboard-sidebar-border)", color: "var(--dashboard-sidebar-muted)" }}
          aria-label={isCollapsed ? "Expandir menu" : "Recolher menu"}
          aria-expanded={!isCollapsed}
          aria-controls="dashboard-desktop-navigation"
          title={isCollapsed ? "Expandir menu" : "Recolher menu"}
        >
          {isCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
          <span className="sr-only">{isCollapsed ? "Expandir" : "Recolher menu"}</span>
        </button>
      </div>

      <nav
        className={`min-h-0 flex-1 space-y-1 overscroll-contain p-3 ${isCollapsed ? "overflow-visible" : "overflow-y-auto"}`}
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
              aria-label={isCollapsed ? label : undefined}
              title={isCollapsed ? label : undefined}
              className={`group relative flex h-11 items-center rounded-xl border text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${isCollapsed ? "justify-center px-2" : "gap-3 px-3"}`}
              style={{
                background: active ? "var(--dashboard-sidebar-active)" : "transparent",
                borderColor: active ? "var(--dashboard-sidebar-border)" : "transparent",
                color: active ? "var(--accent)" : "var(--dashboard-sidebar-muted)",
              }}
            >
              {isCollapsed && active && (
                <span className="absolute left-0 h-6 w-1 rounded-r-full bg-[var(--accent)]" aria-hidden="true" />
              )}
              <Icon size={19} aria-hidden="true" />
              <span className={isCollapsed ? "sr-only" : undefined}>{label}</span>
              {isCollapsed && (
                <span
                  role="tooltip"
                  className="pointer-events-none invisible absolute left-full z-50 ml-3 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs font-semibold opacity-0 shadow-lg transition-opacity group-hover:visible group-hover:opacity-100 group-focus-visible:visible group-focus-visible:opacity-100"
                  style={{
                    background: "var(--dashboard-sidebar-text)",
                    color: "var(--dashboard-sidebar)",
                  }}
                >
                  {label}
                </span>
              )}
            </Link>
          );
        })}

        {studySections.length > 0 && !isCollapsed && (
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

      <div className={`shrink-0 border-t ${isCollapsed ? "space-y-3 p-3" : "space-y-4 p-4"}`} style={{ borderColor: "var(--dashboard-sidebar-border)" }}>
        <div className={isCollapsed ? "flex justify-center" : ""}>
          <span className={isCollapsed ? "sr-only" : "mb-2 block text-[11px] font-bold uppercase tracking-wider"} style={{ color: "var(--dashboard-sidebar-muted)" }}>
            Aparência
          </span>
          <ThemeSwitcher compact={isCollapsed} />
        </div>

        {userEmail && (
          <div className={`border-t ${isCollapsed ? "flex flex-col items-center pt-3" : "pt-4"}`} style={{ borderColor: "var(--dashboard-sidebar-border)" }}>
            <Link
              href="/dashboard/assinatura"
              onClick={() => setMobileOpen(false)}
              className={isCollapsed ? "group relative mb-2 grid h-10 w-10 place-items-center rounded-full text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]" : "mb-2 block truncate rounded-lg px-1 py-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"}
              title={isCollapsed ? `Gerenciar assinatura (${accountName})` : "Gerenciar assinatura"}
              aria-label={isCollapsed ? `Gerenciar assinatura de ${accountName}` : undefined}
              style={{
                color: "var(--dashboard-sidebar-muted)",
                background: isCollapsed ? "var(--dashboard-sidebar-active)" : "transparent",
              }}
            >
              {isCollapsed ? accountName?.charAt(0).toUpperCase() : (
                <>
                  <strong className="block truncate text-xs" style={{ color: "var(--dashboard-sidebar-text)" }}>
                    {accountName}
                  </strong>
                  <span className="block truncate text-[11px]" style={{ color: "var(--dashboard-sidebar-muted)" }}>
                    Gerenciar assinatura
                  </span>
                </>
              )}
              {isCollapsed && (
                <span
                  role="tooltip"
                  className="pointer-events-none invisible absolute left-full z-50 ml-3 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs font-semibold opacity-0 shadow-lg transition-opacity group-hover:visible group-hover:opacity-100 group-focus-visible:visible group-focus-visible:opacity-100"
                  style={{
                    background: "var(--dashboard-sidebar-text)",
                    color: "var(--dashboard-sidebar)",
                  }}
                >
                  Gerenciar assinatura
                </span>
              )}
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className={`group relative flex cursor-pointer items-center rounded-xl text-sm font-semibold transition-colors hover:bg-red-500/10 hover:text-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:cursor-wait disabled:opacity-60 ${isCollapsed ? "h-10 w-10 justify-center" : "w-full gap-3 px-3 py-2.5"}`}
              style={{ color: "var(--dashboard-sidebar-muted)" }}
              aria-label={isCollapsed ? "Sair da conta" : undefined}
              title={isCollapsed ? "Sair da conta" : undefined}
            >
              {loggingOut ? <Loader2 size={18} className="animate-spin" /> : <LogOut size={18} />}
              <span className={isCollapsed ? "sr-only" : undefined}>Sair da conta</span>
              {isCollapsed && (
                <span
                  role="tooltip"
                  className="pointer-events-none invisible absolute left-full z-50 ml-3 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs font-semibold opacity-0 shadow-lg transition-opacity group-hover:visible group-hover:opacity-100 group-focus-visible:visible group-focus-visible:opacity-100"
                  style={{
                    background: "var(--dashboard-sidebar-text)",
                    color: "var(--dashboard-sidebar)",
                  }}
                >
                  Sair da conta
                </span>
              )}
            </button>
          </div>
        )}
      </div>
    </>
  );

  return (
    <>
      <aside
        id="dashboard-desktop-navigation"
        className={`relative sticky top-0 hidden h-screen shrink-0 flex-col overflow-visible border-r transition-[width] duration-200 lg:flex ${collapsed ? "w-[4.5rem]" : "w-64"}`}
        style={{ background: "var(--dashboard-sidebar)", borderColor: "var(--dashboard-sidebar-border)" }}
      >
        {renderNavigationContent(collapsed)}
      </aside>

      <header
        className="sticky top-0 z-30 flex items-center justify-between border-b px-4 py-3 lg:hidden"
        style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
      >
        <Link href="/dashboard" className="flex items-center gap-2 font-bold" style={{ color: "var(--text-primary)" }}>
          <ProLogo size={32} variant="full" />
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
        {renderNavigationContent(false)}
      </aside>
    </>
  );
}
