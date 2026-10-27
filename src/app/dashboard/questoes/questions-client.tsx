"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Filter, Loader2, RotateCcw, Search } from "lucide-react";
import { ProQuestionsLogo } from "@/components/brand/pro-questions-logo";
import { createClient } from "@/lib/supabase/client";
import type { QuestionFilterOptions, QuestionListResult, QuestionStatsResult } from "@/types/database";
import { QuestionCard } from "./question-card";

interface QuestionsClientProps {
  initialResult: QuestionListResult;
  initialStats: QuestionStatsResult;
  filterOptions: QuestionFilterOptions;
  initialError?: string | null;
}
interface QuestionFilters {
  search: string;
  discipline: string;
  topic: string;
  board: string;
  year: string;
}
interface PageSnapshot {
  result: QuestionListResult;
  start: number;
}
const EMPTY_FILTERS: QuestionFilters = { search: "", discipline: "", topic: "", board: "", year: "" };
function accuracy(correct: number, total: number) {
  return total > 0 ? Math.round((correct / total) * 100) : 0;
}

export function QuestionsClient({
  initialResult,
  initialStats,
  filterOptions,
  initialError = null,
}: QuestionsClientProps) {
  const [result, setResult] = useState(initialResult);
  const [stats, setStats] = useState(initialStats);
  const [draftFilters, setDraftFilters] = useState<QuestionFilters>(EMPTY_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<QuestionFilters>(EMPTY_FILTERS);
  const [mode, setMode] = useState<1 | 5>(1);
  const [pageStart, setPageStart] = useState(0);
  const [history, setHistory] = useState<PageSnapshot[]>([]);
  const [direction, setDirection] = useState<"next" | "previous">("next");
  const [loading, setLoading] = useState(false);
  const [cardOperations, setCardOperations] = useState(0);
  const [error, setError] = useState<string | null>(initialError);
  const requestId = useRef(0);
  const contentRef = useRef<HTMLDivElement>(null);
  const initialPage = useRef(true);
  const busy = loading || cardOperations > 0;

  useEffect(() => {
    if (initialPage.current) {
      initialPage.current = false;
      return;
    }
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    contentRef.current?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
  }, [pageStart, mode, direction]);

  const refreshStats = async () => {
    const { data, error: statsError } = await createClient().rpc("get_question_stats");
    if (!statsError && data) setStats(data as QuestionStatsResult);
  };

  const fetchPage = async ({
    cursor = null,
    filters = activeFilters,
    pageSize = mode,
    start = 0,
    reset = false,
    remember = false,
    slide = "next",
  }: {
    cursor?: string | null;
    filters?: QuestionFilters;
    pageSize?: 1 | 5;
    start?: number;
    reset?: boolean;
    remember?: boolean;
    slide?: "next" | "previous";
  } = {}) => {
    const currentRequest = ++requestId.current;
    setLoading(true);
    setError(null);
    try {
      const { data, error: requestError } = await createClient().rpc("list_questions_filtered", {
        p_limit: pageSize,
        p_after_id: cursor,
        p_search: filters.search || null,
        p_discipline_slug: filters.discipline || null,
        p_topic_id: filters.topic || null,
        p_exam_board: filters.board || null,
        p_exam_year: filters.year ? Number(filters.year) : null,
        p_include_hidden: false,
      });
      if (requestError) throw requestError;
      if (currentRequest !== requestId.current) return null;
      const nextResult = data as QuestionListResult;
      if (remember && nextResult.items.length === 0) {
        setResult((current) => ({ ...current, next_cursor: null }));
        return null;
      }
      if (remember) setHistory((current) => [...current, { result, start: pageStart }]);
      if (reset) {
        setHistory([]);
        setActiveFilters(filters);
      }
      setResult(nextResult);
      setPageStart(start);
      setMode(pageSize);
      setDirection(slide);
      return nextResult;
    } catch {
      if (currentRequest === requestId.current) setError("Não foi possível carregar as questões. Tente novamente.");
      return null;
    } finally {
      if (currentRequest === requestId.current) setLoading(false);
    }
  };

  const showPrevious = () => {
    const previous = history.at(-1);
    if (!previous || busy) return;
    setHistory((current) => current.slice(0, -1));
    setResult(previous.result);
    setPageStart(previous.start);
    setDirection("previous");
    setError(null);
  };

  const showNext = async () => {
    if (busy || !result.next_cursor) return;
    await fetchPage({ cursor: result.next_cursor, start: pageStart + result.items.length, remember: true });
  };

  const refreshAfterHide = async () => {
    const cursor = history.at(-1)?.result.next_cursor ?? null;
    const refreshed = await fetchPage({ cursor, start: pageStart });
    if (refreshed && refreshed.items.length === 0 && history.length > 0) {
      await fetchPage({ reset: true });
    }
    await refreshStats();
  };

  const applyFilters = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const loaded = await fetchPage({ filters: { ...draftFilters, search: draftFilters.search.trim() }, reset: true });
    if (loaded) setFiltersOpen(false);
  };

  const clearFilters = () => {
    setDraftFilters(EMPTY_FILTERS);
    setFiltersOpen(false);
    void fetchPage({ filters: EMPTY_FILTERS, reset: true });
  };

  const latestAccuracy = accuracy(stats.latest_correct, stats.answered_questions);
  const activeFilterCount = Object.values(activeFilters).filter(Boolean).length;
  const positionLabel = result.items.length === 0
    ? "Nenhuma questão neste filtro"
    : mode === 1
      ? `Questão ${pageStart + 1} de ${result.total_count}`
      : `Questões ${pageStart + 1}–${pageStart + result.items.length} de ${result.total_count}`;
  const navigation = (
    <nav aria-label="Navegação entre questões" className="flex items-center gap-2">
      <button type="button" disabled={history.length === 0 || busy} onClick={showPrevious} aria-label={mode === 1 ? "Questão anterior" : "Página anterior"} className="inline-flex min-h-11 items-center justify-center gap-1 rounded-xl border border-[var(--border)] px-3 text-sm font-semibold text-[var(--text-primary)] transition hover:border-[var(--accent)] disabled:opacity-40"><ChevronLeft size={17} /> Anterior</button>
      <button type="button" disabled={!result.next_cursor || busy} onClick={() => void showNext()} aria-label={mode === 1 ? "Próxima questão" : "Próxima página"} className="inline-flex min-h-11 items-center justify-center gap-1 rounded-xl border border-[var(--border)] px-3 text-sm font-semibold text-[var(--text-primary)] transition hover:border-[var(--accent)] disabled:opacity-40">Próxima <ChevronRight size={17} /></button>
    </nav>
  );

  return (
    <main className="pro-questions-shell min-h-screen bg-[var(--bg-primary)] px-3 py-6 sm:px-6 sm:py-8 md:px-10 lg:py-8">
      <div className="mx-auto max-w-6xl xl:max-w-[1500px]">
        <header className="questions-hero rounded-2xl border p-3 text-white shadow-[var(--shadow)] sm:p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <ProQuestionsLogo tone="dark" />
              <h1 className="sr-only">Questões para praticar</h1>
              <div className="hidden border-l border-white/20 pl-3 sm:block">
                <p className="text-sm font-semibold text-white">Pratique com foco</p>
                <p className="text-xs text-white/70">Resolva no seu ritmo e revise cada comentário.</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                ["Respondidas", stats.answered_questions],
                ["Aproveitamento", `${latestAccuracy}%`],
                ["Caderno de erros", stats.error_notebook_count],
                ["Últimos 7 dias", stats.attempts_7d],
              ].map(([label, value]) => (
                <div key={label} className="questions-stat rounded-lg border px-2.5 py-1.5">
                  <strong className="block text-sm text-white">{value}</strong>
                  <span className="block text-[11px] leading-tight text-white/70">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </header>

        <button type="button" aria-expanded={filtersOpen} aria-controls="question-filters" onClick={() => setFiltersOpen((value) => !value)} className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] text-sm font-semibold text-[var(--text-primary)] sm:hidden">
          <Filter size={17} /> {filtersOpen ? "Ocultar filtros" : activeFilterCount > 0 ? `Filtros ativos (${activeFilterCount})` : "Mostrar filtros"}
        </button>

        <form
          id="question-filters"
          onSubmit={applyFilters}
          className={`${filtersOpen ? "grid" : "hidden"} mt-3 gap-3 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-3 shadow-[var(--shadow)] sm:grid sm:grid-cols-2 sm:p-4 xl:grid-cols-4`}
          aria-label="Filtros de questões"
        >
          <label className="block sm:col-span-2 xl:col-span-2">
            <span className="text-xs font-semibold text-[var(--text-secondary)]">Buscar</span>
            <span className="relative mt-1 block">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={17} />
              <input
                value={draftFilters.search}
                onChange={(event) => setDraftFilters((current) => ({ ...current, search: event.target.value }))}
                disabled={busy}
                maxLength={200}
                placeholder="Enunciado, assunto, órgão ou cargo"
                className="h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] pl-10 pr-3 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
              />
            </span>
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-[var(--text-secondary)]">Disciplina</span>
            <select
              value={draftFilters.discipline}
              onChange={(event) => setDraftFilters((current) => ({ ...current, discipline: event.target.value, topic: "" }))}
              disabled={busy}
              className="mt-1 h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] px-3 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
            >
              <option value="">Todas as disciplinas</option>
              {filterOptions.disciplines.map((item) => (
                <option key={item.slug} value={item.slug}>{item.name}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-[var(--text-secondary)]">Tópico</span>
            <select
              value={draftFilters.topic}
              onChange={(event) => setDraftFilters((current) => ({ ...current, topic: event.target.value }))}
              disabled={busy || !draftFilters.discipline}
              className="mt-1 h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] px-3 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)] disabled:opacity-60"
            >
              <option value="">{draftFilters.discipline ? "Todos os tópicos" : "Selecione a disciplina"}</option>
              {filterOptions.topics.filter((item) => item.discipline_slug === draftFilters.discipline).map((item) => (
                <option key={item.topic_id} value={item.topic_id}>{item.title}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-[var(--text-secondary)]">Banca</span>
            <select
              value={draftFilters.board}
              onChange={(event) => setDraftFilters((current) => ({ ...current, board: event.target.value }))}
              disabled={busy}
              className="mt-1 h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] px-3 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
            >
              <option value="">Todas as bancas</option>
              {filterOptions.boards.map((board) => <option key={board} value={board}>{board}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-[var(--text-secondary)]">Ano</span>
            <select
              value={draftFilters.year}
              onChange={(event) => setDraftFilters((current) => ({ ...current, year: event.target.value }))}
              disabled={busy}
              className="mt-1 h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] px-3 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
            >
              <option value="">Todos os anos</option>
              {filterOptions.years.map((year) => <option key={year} value={year}>{year}</option>)}
            </select>
          </label>
          <div className="flex items-end gap-2 sm:col-span-2">
            <button
              type="submit"
              disabled={busy}
              className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-5 text-sm font-bold text-white transition hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-60"
            >
              {loading ? <Loader2 size={17} className="animate-spin" /> : <Filter size={17} />}
              Filtrar
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={clearFilters}
              className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl border border-[var(--border)] px-3 text-sm font-semibold text-[var(--text-secondary)] hover:border-[var(--accent)] disabled:opacity-60"
            >
              <RotateCcw size={16} /> Limpar
            </button>
          </div>
        </form>

        <div className="mt-3 flex flex-col gap-3 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-3 sm:flex-row sm:items-center sm:justify-between">
          <div role="group" aria-label="Modo de visualização" className="inline-flex w-full rounded-xl border border-[var(--border)] p-1 sm:w-auto">
            <button type="button" aria-pressed={mode === 1} disabled={busy} onClick={() => void fetchPage({ pageSize: 1, reset: true })} className={`min-h-10 flex-1 rounded-lg px-3 text-sm font-semibold transition sm:flex-none ${mode === 1 ? "bg-[var(--accent)] text-white" : "text-[var(--text-secondary)] hover:bg-[var(--accent-soft)]"}`}>Uma por vez</button>
            <button type="button" aria-pressed={mode === 5} disabled={busy} onClick={() => void fetchPage({ pageSize: 5, reset: true })} className={`min-h-10 flex-1 rounded-lg px-3 text-sm font-semibold transition sm:flex-none ${mode === 5 ? "bg-[var(--accent)] text-white" : "text-[var(--text-secondary)] hover:bg-[var(--accent-soft)]"}`}>5 por página</button>
          </div>
          <p aria-live="polite" className="text-sm font-semibold text-[var(--text-secondary)]">{positionLabel}</p>
          {navigation}
        </div>

        {error && <p role="alert" className="mt-4 rounded-xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-[var(--text-primary)]">{error}</p>}

        {result.items.length === 0 ? (
          <section className="mt-4 rounded-3xl border border-dashed border-[var(--border)] bg-[var(--bg-card)] px-6 py-12 text-center">
            <h2 className="text-xl font-semibold text-[var(--text-primary)]">Nenhuma questão encontrada</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-[var(--text-secondary)]">Tente outros termos ou limpe os filtros para explorar o acervo.</p>
            <button type="button" onClick={clearFilters} className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--border)] px-4 text-sm font-semibold text-[var(--text-primary)]"><RotateCcw size={16} /> Limpar filtros</button>
          </section>
        ) : (
          <div ref={contentRef} key={mode === 1 ? `${result.items[0].id}-${direction}` : "five-mode"} className={`mt-4 space-y-5 scroll-mt-4 ${mode === 1 ? direction === "next" ? "motion-safe:animate-[question-enter-next_220ms_ease-out_both]" : "motion-safe:animate-[question-enter-previous_220ms_ease-out_both]" : ""}`}>
            {result.items.map((question, index) => (
              <QuestionCard key={question.id} question={question} position={pageStart + index + 1} onAnswered={() => void refreshStats()} onHidden={refreshAfterHide} onBusyChange={(isBusy) => setCardOperations((count) => Math.max(0, count + (isBusy ? 1 : -1)))} />
            ))}
          </div>
        )}

        {result.items.length > 0 && <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-3">
          <span className="text-sm text-[var(--text-secondary)]">{positionLabel}</span>
          {navigation}
        </div>}
      </div>
    </main>
  );
}
