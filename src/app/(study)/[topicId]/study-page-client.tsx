"use client";

import { useCallback, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Brain,
  Highlighter,
  Layers3,
  Map as MapIcon,
  StickyNote,
  X,
} from "lucide-react";
import type { SectionRow, TopicRow } from "@/types/database";
import { useSectionProgress } from "@/hooks/use-section-progress";
import { DashboardNavigation } from "@/components/navigation/dashboard-navigation";
import { MarkdownViewer } from "@/components/study/markdown-viewer";
import { CalloutList } from "@/components/study/callout-block";
import { MnemonicList } from "@/components/study/mnemonic-card";
import { FlashcardDeck } from "@/components/study/flashcard-deck";
import { NotesPanel } from "@/components/study/notes-panel";
import { TextHighlighter } from "@/components/study/text-highlighter";

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
  previousTopic: Pick<TopicRow, "topic_id" | "title"> | null;
  nextTopic: Pick<TopicRow, "topic_id" | "title"> | null;
}

/**
 * Client Component: mantém o conteúdo como área principal e abre sumário/notas
 * em painéis sobrepostos. O estado persistente continua nos hooks por usuário.
 */
export function StudyPageClient({
  topic,
  sections,
  userId,
  userEmail,
  previousTopic,
  nextTopic,
}: StudyPageClientProps) {
  const [activeSectionId, setActiveSectionId] = useState<string | null>(
    sections[0]?.section_id ?? null
  );
  const [notesOpen, setNotesOpen] = useState(false);
  const [highlighterOpen, setHighlighterOpen] = useState(false);

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
    loading: progressLoading,
    error: progressError,
  } = useSectionProgress(userId, sectionIds);

  const handleSectionClick = useCallback((sectionId: string) => {
    setActiveSectionId(sectionId);
    const element = document.getElementById(`section-${sectionId}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  const activeSection = sections.find(
    (s) => s.section_id === activeSectionId
  );

  const openNotes = () => {
    setHighlighterOpen(false);
    setNotesOpen(true);
  };

  const toggleHighlighter = () => {
    setNotesOpen(false);
    setHighlighterOpen((open) => !open);
  };

  return (
    <>
      {notesOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[1px]"
          onClick={() => {
            setNotesOpen(false);
          }}
          aria-hidden="true"
        />
      )}

      <DashboardNavigation
        userEmail={userEmail}
        mobileOverlay
        studySections={sections}
        progressMap={progressMap}
        activeSectionId={activeSectionId}
        onToggleProgress={toggleProgress}
        onSectionClick={handleSectionClick}
      />

      <main className="min-h-0 min-w-0 w-full flex-1 overflow-y-auto">
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

            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={toggleHighlighter}
                className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition-colors hover:border-[var(--accent)] ${
                  highlighterOpen ? "bg-[var(--accent-soft)]" : ""
                }`}
                style={{
                  borderColor: highlighterOpen ? "var(--accent)" : "var(--border)",
                  color: highlighterOpen ? "var(--accent)" : "var(--text-secondary)",
                }}
                aria-label={highlighterOpen ? "Fechar marca-texto" : "Abrir marca-texto"}
                aria-expanded={highlighterOpen}
              >
                <Highlighter size={18} />
                <span>Realçar</span>
              </button>

              <button
                type="button"
                onClick={openNotes}
                className="flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition-colors hover:border-[var(--accent)]"
                style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
                aria-label="Abrir notas da seção atual"
                aria-expanded={notesOpen}
                aria-controls="study-notes"
              >
                <StickyNote size={18} />
                <span className="hidden sm:inline">Notas</span>
              </button>
            </div>
          </div>
          <div className="absolute inset-x-0 bottom-0 h-0.5" style={{ background: "var(--progress-bg)" }}>
            <div
              className="h-full transition-[width] duration-300"
              style={{ width: `${progressPercent}%`, background: "var(--progress-bar)" }}
            />
          </div>
          {progressError && (
            <p
              className="mx-auto mt-2 max-w-[1280px] text-xs"
              style={{ color: "var(--callout-warning-text)" }}
              role="alert"
            >
              {progressError}
            </p>
          )}
        </header>

        <div className="mx-auto w-full max-w-[1280px] px-5 py-8 pb-20 sm:px-8 lg:px-12 xl:px-16">
          {/* Título do tópico */}
          <section
            className="study-module-hero mb-12"
            aria-labelledby="study-module-title"
          >
            <div className="study-module-kicker">
              <span>{topic.discipline}</span>
              <span>
                {sections.length} {sections.length === 1 ? "seção" : "seções"}
              </span>
            </div>

            <p className="study-module-eyebrow">Módulo de estudo</p>
            <h1 id="study-module-title" className="study-module-title">
              {topic.title}
            </h1>

            <div className="study-module-progress">
              <div>
                <span style={{ color: "var(--text-secondary)" }}>
                  {progressLoading
                    ? "Carregando progresso..."
                    : `${completedCount} de ${totalCount} seções concluídas`}
                </span>
                <strong style={{ color: "var(--accent)" }}>
                  {progressPercent}%
                </strong>
              </div>
              <div
                className="h-1.5 overflow-hidden rounded-full"
                style={{ background: "var(--progress-bg)" }}
                aria-hidden="true"
              >
                <div
                  className="h-full rounded-full transition-[width] duration-300"
                  style={{
                    width: `${progressPercent}%`,
                    background: "var(--progress-bar)",
                  }}
                />
              </div>
            </div>
          </section>

          {/* Renderizar todas as seções */}
          <TextHighlighter
            userId={userId}
            sectionIds={sectionIds}
            panelOpen={highlighterOpen}
            onPanelOpenChange={setHighlighterOpen}
          >
            {sections.map((section, index) => (
              <article
                key={section.section_id}
                id={`section-${section.section_id}`}
                className="mb-16 scroll-mt-20"
                aria-labelledby={`section-title-${section.section_id}`}
              >
              {/* Título da seção */}
              <header className="study-section-heading">
                <span className="study-section-number" aria-hidden="true">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <p>Seção {String(index + 1).padStart(2, "0")}</p>
                  <h2 id={`section-title-${section.section_id}`}>
                    {section.title}
                  </h2>
                  {(section.mermaid_mindmap ||
                    (section.mnemonics && section.mnemonics.length > 0) ||
                    (section.flashcards && section.flashcards.length > 0)) && (
                    <div
                      className="study-section-resources"
                      aria-label="Recursos disponíveis nesta seção"
                    >
                      {section.mermaid_mindmap && (
                        <span>
                          <MapIcon size={12} aria-hidden="true" />
                          Mapa
                        </span>
                      )}
                      {section.mnemonics && section.mnemonics.length > 0 && (
                        <span>
                          <Brain size={12} aria-hidden="true" />
                          {section.mnemonics.length}{" "}
                          {section.mnemonics.length === 1
                            ? "mnemônico"
                            : "mnemônicos"}
                        </span>
                      )}
                      {section.flashcards && section.flashcards.length > 0 && (
                        <span>
                          <Layers3 size={12} aria-hidden="true" />
                          {section.flashcards.length}{" "}
                          {section.flashcards.length === 1
                            ? "flashcard"
                            : "flashcards"}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </header>

              {/* Markdown content */}
              {section.content_markdown && (
                <div data-highlight-section-id={section.section_id}>
                  <MarkdownViewer content={section.content_markdown} />
                </div>
              )}

              {/* Callouts */}
              {section.callouts && section.callouts.length > 0 && (
                <div className="mt-6">
                  <CalloutList callouts={section.callouts} />
                </div>
              )}

              {/* Mermaid mindmap */}
              {section.mermaid_mindmap && (
                <section className="study-resource-block mt-8">
                  <div className="study-resource-heading">
                    <h3>
                      <MapIcon size={17} aria-hidden="true" />
                      Mapa mental
                    </h3>
                    <span>Visão esquemática</span>
                  </div>
                  <div className="study-resource-body">
                    <MermaidViewer chart={section.mermaid_mindmap} />
                  </div>
                </section>
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
                <div className="study-section-divider mt-14" aria-hidden="true">
                  <span />
                </div>
              )}
              </article>
            ))}
          </TextHighlighter>

          {(previousTopic || nextTopic) && (
            <nav
              className="mt-16 grid gap-3 border-t pt-8 sm:grid-cols-2"
              style={{ borderColor: "var(--border)" }}
              aria-label={`Navegação entre módulos de ${topic.discipline}`}
            >
              {previousTopic && (
                <Link
                  href={`/${previousTopic.topic_id}`}
                  className="group flex min-w-0 items-center gap-3 rounded-2xl border p-4 transition-all hover:-translate-y-0.5 hover:border-[var(--accent)] hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] sm:p-5"
                  style={{
                    background: "var(--bg-card)",
                    borderColor: "var(--border)",
                    color: "var(--text-primary)",
                  }}
                  aria-label={`Módulo anterior: ${previousTopic.title}`}
                >
                  <span
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-xl"
                    style={{
                      background: "var(--accent-soft)",
                      color: "var(--accent)",
                    }}
                    aria-hidden="true"
                  >
                    <ArrowLeft size={20} />
                  </span>
                  <span className="min-w-0">
                    <span
                      className="block text-xs font-bold uppercase tracking-[0.12em]"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Módulo anterior
                    </span>
                    <span className="mt-1 block line-clamp-2 text-sm font-bold leading-snug sm:text-base">
                      {previousTopic.title}
                    </span>
                  </span>
                </Link>
              )}

              {nextTopic && (
                <Link
                  href={`/${nextTopic.topic_id}`}
                  className="group flex min-w-0 items-center justify-end gap-3 rounded-2xl border p-4 text-right transition-all hover:-translate-y-0.5 hover:border-[var(--accent)] hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] sm:col-start-2 sm:p-5"
                  style={{
                    background: "var(--bg-card)",
                    borderColor: "var(--border)",
                    color: "var(--text-primary)",
                  }}
                  aria-label={`Próximo módulo: ${nextTopic.title}`}
                >
                  <span className="min-w-0">
                    <span
                      className="block text-xs font-bold uppercase tracking-[0.12em]"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Próximo módulo
                    </span>
                    <span className="mt-1 block line-clamp-2 text-sm font-bold leading-snug sm:text-base">
                      {nextTopic.title}
                    </span>
                  </span>
                  <span
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-xl"
                    style={{
                      background: "var(--accent-soft)",
                      color: "var(--accent)",
                    }}
                    aria-hidden="true"
                  >
                    <ArrowRight size={20} />
                  </span>
                </Link>
              )}
            </nav>
          )}
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
