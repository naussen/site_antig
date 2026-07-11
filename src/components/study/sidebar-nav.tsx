"use client";

import { CheckSquare, Square, ChevronRight, ChevronsLeft } from "lucide-react";
import type { SectionRow } from "@/types/database";

interface SidebarNavProps {
  sections: SectionRow[];
  progressMap: Record<string, boolean>;
  onToggleProgress: (sectionId: string) => void;
  activeSectionId: string | null;
  onSectionClick: (sectionId: string) => void;
  progressPercent: number;
  completedCount: number;
  totalCount: number;
  onClose?: () => void;
}

export function SidebarNav({
  sections,
  progressMap,
  onToggleProgress,
  activeSectionId,
  onSectionClick,
  progressPercent,
  completedCount,
  totalCount,
  onClose,
}: SidebarNavProps) {
  return (
    <nav
      className="flex flex-col h-full"
      style={{ background: "var(--bg-sidebar)" }}
      aria-label="Navegação de seções"
    >
      {/* Barra de progresso */}
      <div className="p-4 border-b" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="min-w-0">
            <span
              className="block text-xs font-semibold uppercase tracking-wider"
              style={{ color: "var(--text-muted)" }}
            >
              Progresso
            </span>
          </div>
          <span
            className="text-xs font-bold shrink-0"
            style={{ color: "var(--accent)" }}
          >
            {completedCount}/{totalCount} ({progressPercent}%)
          </span>
        </div>
        <div
          className="w-full h-2 rounded-full overflow-hidden"
          style={{ background: "var(--progress-bg)" }}
        >
          <div
            className="h-full rounded-full"
            style={{
              width: `${progressPercent}%`,
              background: `linear-gradient(90deg, var(--mnemonic-gradient-from), var(--mnemonic-gradient-to))`,
              transition: "width 0.4s ease-out",
            }}
          />
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border px-2 py-1.5 text-xs font-medium transition-colors hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
            style={{
              borderColor: "var(--border)",
              color: "var(--text-secondary)",
            }}
            title="Recolher sumário"
            aria-label="Recolher sumário"
          >
            <ChevronsLeft size={14} />
            Recolher sumário
          </button>
        )}
      </div>

      {/* Lista de seções */}
      <div className="flex-1 overflow-y-auto py-2">
        {sections.map((section) => {
          const isCompleted = progressMap[section.section_id] ?? false;
          const isActive = activeSectionId === section.section_id;

          return (
            <div
              key={section.section_id}
              className="flex items-start gap-2 px-3 py-2.5 mx-2 rounded-lg cursor-pointer group"
              style={{
                background: isActive ? "var(--accent-soft)" : "transparent",
              }}
            >
              {/* Checkbox */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleProgress(section.section_id);
                }}
                className="mt-0.5 shrink-0 cursor-pointer"
                style={{
                  color: isCompleted
                    ? "var(--callout-tip-border)"
                    : "var(--text-muted)",
                }}
                aria-label={`Marcar "${section.title}" como ${isCompleted ? "não concluída" : "concluída"}`}
              >
                {isCompleted ? (
                  <CheckSquare size={18} />
                ) : (
                  <Square size={18} />
                )}
              </button>

              {/* Link para a seção */}
              <button
                onClick={() => onSectionClick(section.section_id)}
                className="flex-1 text-left text-sm leading-snug cursor-pointer"
                style={{
                  color: isActive
                    ? "var(--accent)"
                    : isCompleted
                      ? "var(--text-muted)"
                      : "var(--text-secondary)",
                  textDecoration: isCompleted ? "line-through" : "none",
                  fontWeight: isActive ? 600 : 400,
                }}
              >
                {section.title}
              </button>

              {isActive && (
                <ChevronRight
                  size={14}
                  className="mt-0.5 shrink-0"
                  style={{ color: "var(--accent)" }}
                />
              )}
            </div>
          );
        })}
      </div>
    </nav>
  );
}
