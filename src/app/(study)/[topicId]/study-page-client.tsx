"use client";

import { useCallback, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { ListTree, PanelLeftOpen } from "lucide-react";
import type { SectionRow, TopicRow } from "@/types/database";
import { useSectionProgress } from "@/hooks/use-section-progress";
import { SidebarNav } from "@/components/study/sidebar-nav";
import { MarkdownViewer } from "@/components/study/markdown-viewer";
import { CalloutList } from "@/components/study/callout-block";
import { MnemonicList } from "@/components/study/mnemonic-card";
import { FlashcardDeck } from "@/components/study/flashcard-deck";
import { NotesPanel } from "@/components/study/notes-panel";
import { AppDock } from "@/components/navigation/app-dock";

// Mermaid: import dinâmico com ssr: false para evitar hydration errors
const MermaidViewer = dynamic(
  () => import("@/components/study/mermaid-viewer"),
  {
    ssr: false,
    loading: () => (
      <div
        className="h-40 rounded-xl animate-pulse-soft"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
      />
    ),
  }
);

interface StudyPageClientProps {
  topic: TopicRow;
  sections: SectionRow[];
  userId: string;
  userEmail: string | null;
}

/**
 * Client Component: monta o layout de 3 colunas (sidebar + conteúdo + notes).
 * Gerencia estado de navegação, progresso e sidebar/notes toggles para mobile.
 */
export function StudyPageClient({ topic, sections, userId, userEmail }: StudyPageClientProps) {
  const [activeSectionId, setActiveSectionId] = useState<string | null>(
    sections[0]?.section_id ?? null
  );
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [notesOpen, setNotesOpen] = useState(false);
  const [notesVisible, setNotesVisible] = useState(true);

  const sectionIds = useMemo(
    () => sections.map((s) => s.section_id),
    [sections]
  );

  const sectionTitleMap = useMemo(
    () => Object.fromEntries(sections.map((s) => [s.section_id, s.title])),
    [sections]
  );

  const {
    progressMap,
    toggleProgress,
    completedCount,
    totalCount,
    progressPercent,
  } = useSectionProgress(userId, sectionIds);

  const handleSectionClick = useCallback((sectionId: string) => {
    setActiveSectionId(sectionId);
    setSidebarOpen(false);

    const element = document.getElementById(`section-${sectionId}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  const activeSection = sections.find(
    (s) => s.section_id === activeSectionId
  );
  const expandedReadingWidth = !sidebarVisible && !notesVisible;
  const contentWidthClass = expandedReadingWidth
    ? "max-w-[1440px]"
    : !sidebarVisible || !notesVisible
      ? "max-w-[1280px]"
      : "max-w-[1120px]";

  return (
    <>
      {/* Sidebar overlay (mobile) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <button
        type="button"
        className="study-navigation-trigger lg:hidden"
        onClick={() => {
          setSidebarVisible(true);
          setSidebarOpen(true);
        }}
        aria-label="Abrir menu de navegação do resumo"
        aria-expanded={sidebarOpen}
        aria-controls="study-sidebar"
      >
        <span className="study-navigation-trigger-icon" aria-hidden="true">
          <ListTree size={28} strokeWidth={2.2} />
        </span>
        <span>Sumário</span>
      </button>

      {/* Sidebar */}
      <aside
        id="study-sidebar"
        className={`
          fixed lg:static inset-y-0 left-0 z-40 w-72 lg:w-80 border-r overflow-y-auto shrink-0
          transition-transform duration-300 lg:translate-x-0
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          ${sidebarVisible ? "lg:block" : "lg:hidden"}
        `}
        style={{
          borderColor: "var(--border)",
          background: "var(--bg-sidebar)",
          top: "0",
        }}
      >
        <SidebarNav
          sections={sections}
          progressMap={progressMap}
          onToggleProgress={toggleProgress}
          activeSectionId={activeSectionId}
          onSectionClick={handleSectionClick}
          progressPercent={progressPercent}
          completedCount={completedCount}
          totalCount={totalCount}
          onClose={() => {
            setSidebarVisible(false);
            setSidebarOpen(false);
          }}
        />
      </aside>

      {!sidebarVisible && (
        <button
          onClick={() => setSidebarVisible(true)}
          className="fixed left-4 top-4 z-30 hidden items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-black/5 dark:hover:bg-white/5 lg:flex"
          style={{
            background: "var(--bg-card)",
            borderColor: "var(--border)",
            color: "var(--text-secondary)",
          }}
          aria-label="Mostrar sumário"
          title="Mostrar sumário"
        >
          <PanelLeftOpen size={18} />
          Sumário
        </button>
      )}

      {/* Main content */}
      <main className="min-w-0 flex-1 overflow-y-auto">
        <div className={`w-full ${contentWidthClass} mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-8 pb-28 transition-[max-width] duration-300`}>
          {/* Título do tópico */}
          <h1
            className="text-3xl font-bold mb-8"
            style={{ color: "var(--text-primary)" }}
          >
            {topic.title}
          </h1>

          {/* Renderizar todas as seções */}
          {sections.map((section, index) => (
            <article
              key={section.section_id}
              id={`section-${section.section_id}`}
              className="mb-12 scroll-mt-20"
            >
              {/* Título da seção */}
              <h2
                className="text-xl font-bold mb-4 pb-2 border-b"
                style={{
                  color: "var(--text-primary)",
                  borderColor: "var(--border)",
                }}
              >
                <span
                  className="text-xs font-mono mr-2 px-2 py-0.5 rounded"
                  style={{
                    background: "var(--accent-soft)",
                    color: "var(--accent)",
                  }}
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                {section.title}
              </h2>

              {/* Markdown content */}
              {section.content_markdown && (
                <MarkdownViewer content={section.content_markdown} />
              )}

              {/* Callouts */}
              {section.callouts && section.callouts.length > 0 && (
                <div className="mt-6">
                  <CalloutList callouts={section.callouts} />
                </div>
              )}

              {/* Mermaid mindmap */}
              {section.mermaid_mindmap && (
                <div className="mt-6">
                  <h3
                    className="text-sm font-semibold uppercase tracking-wider mb-3 flex items-center gap-2"
                    style={{ color: "var(--text-muted)" }}
                  >
                    🗺️ Mapa Mental
                  </h3>
                  <MermaidViewer chart={section.mermaid_mindmap} />
                </div>
              )}

              {/* Mnemônicos */}
              {section.mnemonics && section.mnemonics.length > 0 && (
                <div className="mt-6">
                  <MnemonicList mnemonics={section.mnemonics} />
                </div>
              )}

              {/* Flashcards */}
              {section.flashcards && section.flashcards.length > 0 && (
                <div className="mt-6">
                  <FlashcardDeck flashcards={section.flashcards} />
                </div>
              )}

              {/* Divider entre seções */}
              {index < sections.length - 1 && (
                <hr
                  className="mt-10"
                  style={{ borderColor: "var(--border)" }}
                />
              )}
            </article>
          ))}
        </div>
      </main>

      {/* Notes overlay (mobile) */}
      {notesOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          onClick={() => setNotesOpen(false)}
        />
      )}

      {/* Notes panel */}
      <aside
        className={`
          fixed lg:static inset-y-0 right-0 z-40 w-72 border-l overflow-y-auto shrink-0
          transition-transform duration-300 lg:translate-x-0
          ${notesOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"}
          ${notesVisible ? "lg:flex" : "lg:hidden"}
        `}
        style={{
          borderColor: "var(--border)",
          top: "0",
        }}
      >
        {activeSection && (
          <NotesPanel
            userId={userId}
            sectionId={activeSection.section_id}
            sectionTitle={activeSection.title}
            allSectionIds={sectionIds}
            sectionTitleMap={sectionTitleMap}
            onClose={() => {
              setNotesVisible(false);
              setNotesOpen(false);
            }}
          />
        )}
      </aside>

      {/* Dock de Navegação Estilo macOS */}
      <AppDock 
        userEmail={userEmail} 
        notesVisible={notesVisible || notesOpen}
        onToggleNotes={() => {
          setNotesVisible(!notesVisible);
          setNotesOpen(!notesOpen);
        }}
      />
    </>
  );
}
