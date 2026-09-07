"use client";

/* eslint-disable @next/next/no-html-link-for-pages -- navegação entre zonas exige recarga completa */
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
  ChevronRight,
  StickyNote,
  Scale,
  X,
} from "lucide-react";
import { ProLogo } from "@/components/brand/pro-logo";
import { createClient } from "@/lib/supabase/client";
import { ThemeSwitcher } from "@/components/theme-switcher";
import type { SectionRow } from "@/types/database";

interface DashboardNavigationProps {
  userEmail: string | null;
  userName?: string | null;
  mobileOverlay?: boolean;
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
  mobileOverlay = false,
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
      <div className={`relative flex shrink-0 items-center overflow-hidden border-b py-5 before:pointer-events-none before:absolute before:-right-10 before:-top-12 before:h-28 before:w-28 before:rounded-full before:bg-[var(--dashboard-sidebar-active)] before:blur-2xl ${isCollapsed ? "justify-center px-3" : "gap-3 px-5"}`} style={{ borderColor: "var(--dashboard-sidebar-border)" }}>
        <ProLogo
          size={isCollapsed ? 38 : 40}
          variant={isCollapsed ? "icon" : "full"}
          tone="dark"
          className="relative z-10 transition-transform duration-300 hover:scale-[1.02]"
        />
      </div>

      <div className="hidden shrink-0 justify-end px-3 pt-2 lg:flex">
        <button
          type="button"
          onClick={toggleCollapsed}
          className="group grid h-9 w-9 cursor-pointer place-items-center rounded-xl border border-[var(--dashboard-sidebar-border)] bg-white/[0.02] text-[var(--dashboard-sidebar-muted)] shadow-md transition-[transform,background-color,border-color,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-[var(--accent)] hover:bg-[var(--dashboard-sidebar-active)] hover:shadow-[0_8px_24px_-12px_var(--accent)] active:translate-y-0 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
          aria-label={isCollapsed ? "Expandir menu" : "Recolher menu"}
          aria-expanded={!isCollapsed}
          aria-controls="dashboard-desktop-navigation"
          title={isCollapsed ? "Expandir menu" : "Recolher menu"}
        >
          {isCollapsed ? <PanelLeftOpen size={16} className="transition-transform duration-200 group-hover:translate-x-0.5" /> : <PanelLeftClose size={16} className="transition-transform duration-200 group-hover:-translate-x-0.5" />}
          <span className="sr-only">{isCollapsed ? "Expandir" : "Recolher menu"}</span>
        </button>
      </div>

      <nav
        className={`min-h-0 flex-1 overscroll-contain p-3 ${isCollapsed ? "overflow-visible" : "overflow-y-auto"}`}
        aria-label="Navegação principal"
      >
        {!isCollapsed && (
          <p className="mb-2 px-3 pt-1 text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: "var(--dashboard-sidebar-muted)" }}>
            Navegação
          </p>
        )}
        <div className="space-y-1.5">
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
              className={`group relative isolate flex h-12 items-center overflow-hidden rounded-2xl border text-sm font-semibold transition-[transform,background-color,border-color,color,box-shadow] duration-200 before:pointer-events-none before:absolute before:inset-0 before:-translate-x-[115%] before:bg-[linear-gradient(110deg,transparent,rgba(255,255,255,0.08),transparent)] before:transition-transform before:duration-500 hover:-translate-y-0.5 hover:border-[var(--dashboard-sidebar-border)] hover:bg-[var(--dashboard-sidebar-active)] hover:text-[var(--dashboard-sidebar-text)] hover:shadow-[0_12px_28px_-18px_var(--accent)] hover:before:translate-x-[115%] active:translate-y-0 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${active ? "border-[var(--dashboard-sidebar-border)] bg-[var(--dashboard-sidebar-active)] text-[var(--accent)] shadow-[0_12px_30px_-18px_var(--accent)]" : "border-transparent text-[var(--dashboard-sidebar-muted)]"} ${isCollapsed ? "justify-center px-2" : "gap-3 px-2.5"}`}
            >
              {isCollapsed && active && (
                <span className="absolute left-0 h-6 w-1 rounded-r-full bg-[var(--accent)]" aria-hidden="true" />
              )}
              <span className={`relative z-10 grid h-8 w-8 shrink-0 place-items-center rounded-xl border transition-[transform,background-color,border-color] duration-200 group-hover:scale-105 ${active ? "border-[var(--accent)]/30 bg-[var(--accent)] text-white" : "border-white/10 bg-white/[0.035] group-hover:border-[var(--accent)]/35"}`}>
                <Icon size={17} strokeWidth={active ? 2.35 : 2} aria-hidden="true" />
              </span>
              <span className={isCollapsed ? "sr-only" : "relative z-10 flex-1"}>{label}</span>
              {!isCollapsed && (
                <ChevronRight size={15} aria-hidden="true" className={`relative z-10 transition-[transform,opacity] duration-200 ${active ? "translate-x-0 opacity-100" : "-translate-x-1 opacity-0 group-hover:translate-x-0 group-hover:opacity-70"}`} />
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
                  {label}
                </span>
              )}
            </Link>
          );
        })}

        <a
          href="/legis"
          onClick={() => setMobileOpen(false)}
          aria-label={isCollapsed ? "PRO Legis" : undefined}
          title={isCollapsed ? "PRO Legis" : undefined}
          className={`group relative isolate mt-1.5 flex h-12 items-center overflow-hidden rounded-2xl border border-transparent text-sm font-semibold text-[var(--dashboard-sidebar-muted)] transition-[transform,background-color,border-color,color,box-shadow] duration-200 before:pointer-events-none before:absolute before:inset-0 before:-translate-x-[115%] before:bg-[linear-gradient(110deg,transparent,rgba(255,255,255,0.08),transparent)] before:transition-transform before:duration-500 hover:-translate-y-0.5 hover:border-[var(--dashboard-sidebar-border)] hover:bg-[var(--dashboard-sidebar-active)] hover:text-[var(--dashboard-sidebar-text)] hover:shadow-[0_12px_28px_-18px_var(--accent)] hover:before:translate-x-[115%] active:translate-y-0 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${isCollapsed ? "justify-center px-2" : "gap-3 px-2.5"}`}
        >
          <span className="relative z-10 grid h-8 w-8 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[0.035] transition-[transform,background-color,border-color] duration-200 group-hover:scale-105 group-hover:border-[var(--action)]/45 group-hover:bg-[var(--action)]/10 group-hover:text-[var(--action)]">
            <Scale size={17} aria-hidden="true" />
          </span>
          <span className={isCollapsed ? "sr-only" : "relative z-10 flex-1"}>PRO Legis</span>
          {!isCollapsed && <ChevronRight size={15} aria-hidden="true" className="relative z-10 -translate-x-1 opacity-0 transition-[transform,opacity] duration-200 group-hover:translate-x-0 group-hover:opacity-70" />}
          {isCollapsed && (
            <span role="tooltip" className="pointer-events-none invisible absolute left-full z-50 ml-3 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs font-semibold opacity-0 shadow-lg transition-opacity group-hover:visible group-hover:opacity-100 group-focus-visible:visible group-focus-visible:opacity-100" style={{ background: "var(--dashboard-sidebar-text)", color: "var(--dashboard-sidebar)" }}>
              PRO Legis
            </span>
          )}
        </a>
        </div>

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
                    className={`group/section flex items-start gap-2 rounded-xl border px-2 py-2 transition-[transform,background-color,border-color] duration-200 hover:translate-x-0.5 hover:border-[var(--dashboard-sidebar-border)] hover:bg-[var(--dashboard-sidebar-active)] ${isActive ? "border-[var(--dashboard-sidebar-border)] bg-[var(--dashboard-sidebar-active)]" : "border-transparent"}`}
                  >
                    <input
                      type="checkbox"
                      checked={isCompleted}
                      onChange={() => onToggleProgress?.(section.section_id)}
                      className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-[var(--accent)]"
                      aria-label={`Marcar "${section.title}" como ${isCompleted ? "não concluída" : "concluída"}`}
                    />
                    <button
                      type="button"
                      onClick={() => onSectionClick?.(section.section_id)}
                      className="min-w-0 flex-1 cursor-pointer text-left text-xs leading-snug transition-colors group-hover/section:text-[var(--dashboard-sidebar-text)]"
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

      <div className={`shrink-0 border-t bg-black/[0.06] ${isCollapsed ? "space-y-3 p-3" : "space-y-4 p-4"}`} style={{ borderColor: "var(--dashboard-sidebar-border)" }}>
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
              className={isCollapsed ? "group relative mb-2 grid h-10 w-10 place-items-center rounded-xl border border-[var(--dashboard-sidebar-border)] text-sm font-bold transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-[var(--accent)] hover:shadow-[0_8px_24px_-14px_var(--accent)] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]" : "group mb-2 block truncate rounded-xl border border-transparent px-2.5 py-2 text-left transition-[transform,background-color,border-color] duration-200 hover:-translate-y-0.5 hover:border-[var(--dashboard-sidebar-border)] hover:bg-[var(--dashboard-sidebar-active)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"}
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
              className={`group relative flex cursor-pointer items-center rounded-xl border border-transparent text-sm font-semibold text-[var(--dashboard-sidebar-muted)] transition-[transform,background-color,border-color,color] duration-200 hover:-translate-y-0.5 hover:border-red-500/20 hover:bg-red-500/10 hover:text-red-400 active:translate-y-0 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:cursor-wait disabled:opacity-60 ${isCollapsed ? "h-10 w-10 justify-center" : "w-full gap-3 px-3 py-2.5"}`}
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
        className={`relative sticky top-0 hidden h-screen shrink-0 flex-col overflow-visible border-r shadow-[8px_0_32px_-28px_rgba(0,0,0,0.8)] transition-[width] duration-300 ease-out lg:flex ${collapsed ? "w-[4.5rem]" : "w-64"}`}
        style={{ background: "var(--dashboard-sidebar)", borderColor: "var(--dashboard-sidebar-border)" }}
      >
        {renderNavigationContent(collapsed)}
      </aside>

      {mobileOverlay ? (
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="fixed left-0 top-1/2 z-30 grid h-12 w-10 -translate-y-1/2 place-items-center rounded-r-xl border border-l-0 shadow-lg lg:hidden"
          style={{
            background: "var(--dashboard-sidebar)",
            borderColor: "var(--dashboard-sidebar-border)",
            color: "var(--dashboard-sidebar-text)",
          }}
          aria-label="Abrir navegação"
          aria-expanded={mobileOpen}
          aria-controls="dashboard-mobile-navigation"
        >
          <PanelLeftOpen size={21} aria-hidden="true" />
        </button>
      ) : (
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
            className="grid h-11 w-11 place-items-center rounded-xl border transition-[transform,background-color,border-color] duration-200 hover:-translate-y-0.5 hover:border-[var(--accent)] hover:bg-[var(--accent-soft)] active:translate-y-0 active:scale-95"
            style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
            aria-label="Abrir navegação"
            aria-expanded={mobileOpen}
            aria-controls="dashboard-mobile-navigation"
          >
            <Menu size={22} aria-hidden="true" />
          </button>
        </header>
      )}

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
        className={`fixed inset-y-0 z-50 flex w-[min(86vw,320px)] flex-col transition-transform duration-300 lg:hidden ${
          mobileOverlay ? "left-0 border-r" : "right-0 border-l"
        } ${
          mobileOpen ? "translate-x-0" : mobileOverlay ? "-translate-x-full" : "translate-x-full"
        }`}
        style={{ background: "var(--dashboard-sidebar)", borderColor: "var(--dashboard-sidebar-border)" }}
        aria-hidden={!mobileOpen}
        inert={!mobileOpen}
      >
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          className="absolute right-3 top-3 z-10 grid h-10 w-10 place-items-center rounded-xl border border-transparent transition-[transform,background-color,border-color] duration-200 hover:rotate-3 hover:border-[var(--dashboard-sidebar-border)] hover:bg-[var(--dashboard-sidebar-active)] active:scale-95"
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
