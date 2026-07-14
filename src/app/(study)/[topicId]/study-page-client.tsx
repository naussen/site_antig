"use client";

import { useCallback, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowLeft, ListTree, StickyNote, X } from "lucide-react";
import type { SectionRow, TopicRow } from "@/types/database";
import { useSectionProgress } from "@/hooks/use-section-progress";
import { SidebarNav } from "@/components/study/sidebar-nav";
import { MarkdownViewer } from "@/components/study/markdown-viewer";
import { CalloutList } from "@/components/study/callout-block";
import { MnemonicList } from "@/components/study/mnemonic-card";
import { FlashcardDeck } from "@/components/study/flashcard-deck";
import { NotesPanel } from "@/components/study/notes-panel";

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
}

/**
 * Client Component: mantém o conteúdo como área principal e abre sumário/notas
 * em painéis sobrepostos. O estado persistente continua nos hooks por usuário.
 */
export function StudyPageClient({ topic, sections, userId }: StudyPageClientProps) {
  const [activeSectionId, setActiveSectionId] = useState<string | null>(
    sections[0]?.section_id ?? null
  );
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);

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

  const openSidebar = () => {
    setNotesOpen(false);
    setSidebarOpen(true);
  };

  const openNotes = () => {
    setSidebarOpen(false);
    setNotesOpen(true);
  };

  return (
    <>
      {(sidebarOpen || notesOpen) && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[1px]"
          onClick={() => {
            setSidebarOpen(false);
            setNotesOpen(false);
          }}
          aria-hidden="true"
        />
      )}

      <button
        type="button"
        className="fixed left-0 top-1/2 z-30 flex -translate-y-1/2 flex-col items-center gap-2 rounded-r-2xl border border-l-0 px-2 py-4 text-xs font-bold shadow-lg transition-transform hover:translate-x-0.5"
        style={{
          background: "var(--bg-card)",
          borderColor: "var(--border)",
          color: "var(--accent)",
        }}
        onClick={openSidebar}
        aria-label="Abrir sumário e checklist do resumo"
        aria-expanded={sidebarOpen}
        aria-controls="study-sidebar"
      >
        <ListTree size={22} aria-hidden="true" />
        <span className="[writing-mode:vertical-rl]">Sumário</span>
      </button>

      <aside
        id="study-sidebar"
        className={`fixed inset-y-0 left-0 z-50 w-[min(88vw,360px)] overflow-y-auto border-r transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{
          borderColor: "var(--border)",
          background: "var(--bg-sidebar)",
        }}
        aria-hidden={!sidebarOpen}
        inert={!sidebarOpen}
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
          onClose={() => setSidebarOpen(false)}
        />
      </aside>

      <main className="min-w-0 flex-1 overflow-y-auto">
        <header
          className="sticky top-0 z-20 border-b px-4 py-3 backdrop-blur-xl sm:px-6 lg:px-8"
          style={{
            background: "color-mix(in srgb, var(--bg-primary) 88%, transparent)",
            borderColor: "var(--border)",
          }}
        >
          <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <Link
                href="/dashboard"
                className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border transition-colors hover:border-[var(--accent)]"
                style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
                aria-label="Voltar para a biblioteca"
                title="Voltar para a biblioteca"
              >
                <ArrowLeft size={19} />
              </Link>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                  {topic.title}
                </p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {completedCount}/{totalCount} seções · {progressPercent}%
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={openNotes}
              className="flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition-colors hover:border-[var(--accent)]"
              style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
              aria-label="Abrir notas da seção atual"
              aria-expanded={notesOpen}
              aria-controls="study-notes"
            >
              <StickyNote size={18} />
              <span className="hidden sm:inline">Notas</span>
            </button>
          </div>
          <div className="absolute inset-x-0 bottom-0 h-0.5" style={{ background: "var(--progress-bg)" }}>
            <div
              className="h-full transition-[width] duration-300"
              style={{ width: `${progressPercent}%`, background: "var(--progress-bar)" }}
            />
          </div>
        </header>

        <div className="mx-auto w-full max-w-[1280px] px-5 py-8 pb-20 sm:px-8 lg:px-12 xl:px-16">
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

      <aside
        id="study-notes"
        className={`fixed inset-y-0 right-0 z-50 flex w-[min(92vw,420px)] overflow-y-auto border-l transition-transform duration-300 ${
          notesOpen ? "translate-x-0" : "translate-x-full"
        }`}
        style={{
          borderColor: "var(--border)",
          background: "var(--bg-card)",
        }}
        aria-hidden={!notesOpen}
        inert={!notesOpen}
      >
        {activeSection && (
          <NotesPanel
            key={activeSection.section_id}
            userId={userId}
            sectionId={activeSection.section_id}
            sectionTitle={activeSection.title}
            allSectionIds={sectionIds}
            sectionTitleMap={sectionTitleMap}
            onClose={() => setNotesOpen(false)}
          />
        )}
        {!activeSection && (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
            <X size={24} style={{ color: "var(--text-muted)" }} />
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              Nenhuma seção disponível para anotações.
            </p>
          </div>
        )}
      </aside>
    </>
  );
}
