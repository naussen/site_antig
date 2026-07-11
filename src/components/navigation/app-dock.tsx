"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BookOpen, StickyNote, LogOut, Sparkles, Loader2, PanelRightOpen, PanelRightClose } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ThemeSwitcher } from "@/components/theme-switcher";

interface AppDockProps {
  userEmail: string | null;
  onToggleNotes?: () => void;
  notesVisible?: boolean;
}

export function AppDock({ 
  userEmail, 
  onToggleNotes, 
  notesVisible = true
}: AppDockProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [visible, setVisible] = useState(true);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Determina se estamos na página de estudo (qualquer página fora do dashboard)
  const isStudyPage = pathname !== "/dashboard" && pathname !== "/dashboard/notas" && pathname !== "/";


  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    } finally {
      setLoggingOut(false);
    }
  };

  // Funções para gerenciar o auto-hide do Dock no desktop
  const showDock = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setVisible(true);
  };

  const hideDockDeferred = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      // Só esconde no desktop, no mobile a mídia query lida com isso mantendo visível
      if (window.innerWidth > 768) {
        setVisible(false);
      }
    }, 1200); // 1.2 segundos de tolerância
  };

  useEffect(() => {
    // Ao mudar de rota, mostra o dock
    setVisible(true);
    hideDockDeferred();

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [pathname]);

  // Se for a tela inicial (não logado) ou login, não renderiza o dock
  if (pathname === "/" || pathname === "/login") {
    return null;
  }

  return (
    <>
      {/* Zona de hover invisível na parte inferior da tela */}
      <div 
        className="app-dock-trigger-zone"
        onMouseEnter={showDock}
        onMouseLeave={hideDockDeferred}
      />

      <div
        className={`app-dock-container ${visible ? "" : "hidden-dock"}`}
        onMouseEnter={showDock}
        onMouseLeave={hideDockDeferred}
      >
        <div className="app-dock">
          {/* Logo / Home link */}
          <Link
            href="/dashboard"
            className={`app-dock-item ${pathname === "/dashboard" ? "active" : ""}`}
            aria-label="Ir para o Dashboard"
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
              style={{
                background: "linear-gradient(135deg, var(--mnemonic-gradient-from), var(--mnemonic-gradient-to))",
              }}
            >
              <Sparkles size={18} />
            </div>
            <span className="app-dock-dot" style={{ display: pathname === "/dashboard" ? "block" : "none" }} />
            <span className="app-dock-tooltip">PRO Resumos</span>
          </Link>

          <div className="app-dock-separator" />

          {/* Resumos Link */}
          <Link
            href="/dashboard"
            className={`app-dock-item ${pathname === "/dashboard" ? "active" : ""}`}
            aria-label="Meus Resumos"
          >
            <BookOpen size={22} />
            <span className="app-dock-tooltip">Resumos</span>
          </Link>

          {/* Notas Link */}
          <Link
            href="/dashboard/notas"
            className={`app-dock-item ${pathname === "/dashboard/notas" ? "active" : ""}`}
            aria-label="Minhas Notas"
          >
            <StickyNote size={22} />
            <span className="app-dock-tooltip">Minhas Notas</span>
          </Link>

          {/* Toggle Anotações Lateral (Somente em páginas de estudo com notes configurado) */}
          {isStudyPage && onToggleNotes && (
            <button
              onClick={onToggleNotes}
              className={`app-dock-item ${notesVisible ? "active" : ""}`}
              aria-label={notesVisible ? "Ocultar anotações" : "Mostrar anotações"}
            >
              {notesVisible ? <PanelRightClose size={22} /> : <PanelRightOpen size={22} />}
              <span className="app-dock-tooltip">
                {notesVisible ? "Ocultar Notas" : "Mostrar Notas"}
              </span>
            </button>
          )}


          <div className="app-dock-separator" />

          {/* Theme switcher */}
          <div className="flex items-center px-1">
            <ThemeSwitcher />
          </div>

          <div className="app-dock-separator" />

          {/* Perfil / Sair */}
          {userEmail && (
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="app-dock-item hover:bg-red-500/10 hover:text-red-500"
              style={{ color: "var(--text-secondary)" }}
              aria-label="Sair da Conta"
            >
              {loggingOut ? (
                <Loader2 size={22} className="animate-spin" />
              ) : (
                <LogOut size={22} />
              )}
              <span className="app-dock-tooltip">Sair ({userEmail.split("@")[0]})</span>
            </button>
          )}
        </div>
      </div>

      {/* Pull-tab visual — indica ao usuário que há um menu retratil */}
      <div
        className="app-dock-handle"
        onMouseEnter={showDock}
        onClick={showDock}
        aria-label="Mostrar menu"
        role="button"
        tabIndex={0}
      />
    </>
  );
}
