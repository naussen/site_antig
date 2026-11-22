"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Filter, Loader2, RotateCcw, Search, X } from "lucide-react";
import { ProQuestionsLogo } from "@/components/brand/pro-questions-logo";
import { createClient } from "@/lib/supabase/client";
import type {
  QuestionFilterOptions,
  QuestionListResult,
  QuestionReviewFilter,
  QuestionStatsResult,
} from "@/types/database";
import { QuestionCard } from "./question-card";

interface QuestionsClientProps {
  initialResult: QuestionListResult;
  initialStats: QuestionStatsResult;
  filterOptions: QuestionFilterOptions;
  initialError?: string | null;
  initialFilters?: QuestionFilters;
  initialMode?: 1 | 5;
}

export interface QuestionFilters {
  identifier: string;
  search: string;
  discipline: string;
  topic: string;
  subtopic: string;
  board: string;
  year: string;
  review: QuestionReviewFilter;
}

interface PageSnapshot {
  result: QuestionListResult;
  start: number;
}

interface BrowserSnapshot extends PageSnapshot {
  filters: QuestionFilters;
  mode: 1 | 5;
  pages: PageSnapshot[];
}

const EMPTY_FILTERS: QuestionFilters = {
  identifier: "",
  search: "",
  discipline: "",
  topic: "",
  subtopic: "",
  board: "",
  year: "",
  review: "all",
};

const REVIEW_OPTIONS = [
  { value: "all", label: "Todas" },
  { value: "unanswered", label: "Não respondidas" },
  { value: "errors", label: "Caderno de erros" },
  { value: "marked", label: "Marcadas" },
  { value: "routine", label: "Revisão do dia" },
] as const;

function accuracy(correct: number, total: number) {
  return total > 0 ? Math.round((correct / total) * 100) : 0;
}

function filtersUrl(filters: QuestionFilters, currentMode: 1 | 5, start: number) {
  const params = new URLSearchParams();
  if (filters.identifier) params.set("id", filters.identifier);
  if (filters.search) params.set("busca", filters.search);
  if (filters.discipline) params.set("disciplina", filters.discipline);
  if (filters.topic) params.set("topico", filters.topic);
  if (filters.subtopic) params.set("subtopico", filters.subtopic);
  if (filters.board) params.set("banca", filters.board);
  if (filters.year) params.set("ano", filters.year);
  if (filters.review && filters.review !== "all") params.set("revisao", filters.review);
  if (currentMode === 5) params.set("modo", "5");
  if (start > 0) params.set("posicao", String(start + 1));

  const query = params.toString();
  return query ? `${window.location.pathname}?${query}` : window.location.pathname;
}

export function QuestionsClient({
  initialResult,
  initialStats,
  filterOptions,
  initialError = null,
  initialFilters = EMPTY_FILTERS,
  initialMode = 1,
}: QuestionsClientProps) {
  const [result, setResult] = useState(initialResult);
  const [stats, setStats] = useState(initialStats);
  const [draftFilters, setDraftFilters] = useState<QuestionFilters>(initialFilters);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<QuestionFilters>(initialFilters);
  const [mode, setMode] = useState<1 | 5>(initialMode);
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
  const browserPages = useRef(new Map<string, BrowserSnapshot>());

  useEffect(() => {
    browserPages.current.set(window.location.href, {
      filters: activeFilters, mode, result, start: pageStart, pages: history,
    });
  }, [activeFilters, mode, result, pageStart, history]);

  useEffect(() => {
    const restorePage = () => {
      const snapshot = browserPages.current.get(window.location.href);
      if (!snapshot) return;
      requestId.current++;
      setLoading(false);
      setError(null);
      setDraftFilters(snapshot.filters);
      setActiveFilters(snapshot.filters);
      setMode(snapshot.mode);
      setResult(snapshot.result);
      setPageStart(snapshot.start);
      setHistory(snapshot.pages);
    };
    window.addEventListener("popstate", restorePage);
    return () => window.removeEventListener("popstate", restorePage);
  }, []);

  function recordPage(filters: QuestionFilters, pageSize: 1 | 5, start: number) {
    const url = filtersUrl(filters, pageSize, start);
    if (new URL(url, window.location.href).href !== window.location.href) {
      window.history.pushState(null, "", url);
    }
  }


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
    record = false,
    slide = "next",
  }: {
    cursor?: string | null;
    filters?: QuestionFilters;
    pageSize?: 1 | 5;
    start?: number;
    reset?: boolean;
    remember?: boolean;
    record?: boolean;
    slide?: "next" | "previous";
  } = {}) => {
    const currentRequest = ++requestId.current;
    setLoading(true);
    setError(null);
    try {
      const { data, error: requestError } = await createClient().rpc("list_questions_filtered_v2", {
        p_question_identifier: filters.identifier || null,
        p_limit: pageSize,
        p_after_id: cursor,
        p_search: filters.search || null,
        p_discipline_slug: filters.discipline || null,
        p_topic_id: filters.topic || null,
        p_subtopic_id: filters.subtopic || null,
        p_exam_board: filters.board || null,
        p_exam_year: filters.year ? Number(filters.year) : null,
        p_include_hidden: false,
        ...(filters.review && filters.review !== "all" && { p_review_filter: filters.review }),
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
      if (record) recordPage(filters, pageSize, start);
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
    recordPage(activeFilters, mode, previous.start);
    setHistory((current) => current.slice(0, -1));
    setResult(previous.result);
    setPageStart(previous.start);
    setDirection("previous");
    setError(null);
  };

  const showNext = async () => {
    if (busy || !result.next_cursor) return;
    await fetchPage({ cursor: result.next_cursor, start: pageStart + result.items.length, remember: true, record: true });
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
    const cleanFilters: QuestionFilters = {
      ...draftFilters,
      identifier: draftFilters.identifier.trim(),
      search: draftFilters.search.trim(),
    };
    const loaded = await fetchPage({
      filters: cleanFilters,
      pageSize: cleanFilters.review === "routine" ? 5 : mode,
      reset: true,
      record: true,
    });
    if (loaded) setFiltersOpen(false);
  };

  const clearFilters = () => {
    setDraftFilters(EMPTY_FILTERS);
    setFiltersOpen(false);
    void fetchPage({ filters: EMPTY_FILTERS, reset: true, record: true });
  };

  const applyQuickFilters = async (filters: QuestionFilters) => {
    if (busy) return;
    const loaded = await fetchPage({ filters, pageSize: filters.review === "routine" ? 5 : mode, reset: true, record: true });
    if (loaded) setDraftFilters(filters);
  };

  const toggleErrorNotebook = () => {
    const review = activeFilters.review === "errors" ? "all" : "errors";
    void applyQuickFilters({ ...activeFilters, review });
  };

  const removeFilter = (key: Exclude<keyof QuestionFilters, "review">) => {
    const filters = { ...activeFilters, [key]: "" };
    if (key === "discipline") filters.topic = "";
    if (key === "discipline" || key === "topic") filters.subtopic = "";
    void applyQuickFilters(filters);
  };

  const latestAccuracy = accuracy(stats.latest_correct, stats.answered_questions);
  const filterLabels = {
    identifier: "Questão do link",
    search: "Busca",
    discipline: "Disciplina",
    topic: "Tópico",
    subtopic: "Subtópico",
    board: "Banca",
    year: "Ano",
  } as const;
  const activeValues = {
    ...activeFilters,
    discipline: filterOptions.disciplines.find(({ slug }) => slug === activeFilters.discipline)?.name ?? activeFilters.discipline,
    topic: filterOptions.topics.find(({ topic_id }) => topic_id === activeFilters.topic)?.title ?? activeFilters.topic,
    subtopic: filterOptions.subtopics?.find(({ id }) => id === activeFilters.subtopic)?.title ?? activeFilters.subtopic,
  };
  const appliedFilters = (Object.keys(filterLabels) as Array<keyof typeof filterLabels>)
    .filter((key) => activeFilters[key])
    .map((key) => ({ key, label: key === "identifier" ? filterLabels.identifier : `${filterLabels[key]}: ${activeValues[key]}` }));
  const activeFilterCount = appliedFilters.length + Number(activeFilters.review !== "all");

  const positionLabel = result.items.length === 0
    ? "Nenhuma questão neste filtro"
    : mode === 1
      ? `Questão ${pageStart + 1} de ${result.total_count}`
      : `Questões ${pageStart + 1}–${pageStart + result.items.length} de ${result.total_count}`;

  const navigation = (
    <nav aria-label="Navegação entre questões" className="flex items-center gap-2">
      <button
        type="button"
        disabled={history.length === 0 || busy}
        onClick={showPrevious}
        aria-label={mode === 1 ? "Questão anterior" : "Página anterior"}
        className="inline-flex min-h-11 items-center justify-center gap-1 rounded-xl border border-[var(--border)] px-3 text-sm font-semibold text-[var(--text-primary)] transition hover:border-[var(--accent)] disabled:opacity-40"
      >
        <ChevronLeft size={17} /> Anterior
      </button>
      <button
        type="button"
        disabled={!result.next_cursor || busy}
        onClick={() => void showNext()}
        aria-label={mode === 1 ? "Próxima questão" : "Próxima página"}
        className="inline-flex min-h-11 items-center justify-center gap-1 rounded-xl border border-[var(--border)] px-3 text-sm font-semibold text-[var(--text-primary)] transition hover:border-[var(--accent)] disabled:opacity-40"
      >
        Próxima <ChevronRight size={17} />
      </button>
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
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <div className="questions-stat rounded-lg border px-2.5 py-1.5">
                <strong className="block text-sm text-white">{stats.answered_questions}</strong>
                <span className="block text-[11px] leading-tight text-white/70">Respondidas</span>
              </div>
              <div className="questions-stat rounded-lg border px-2.5 py-1.5">
                <strong className="block text-sm text-white">{latestAccuracy}%</strong>
                <span className="block text-[11px] leading-tight text-white/70">Aproveitamento</span>
              </div>
              <button
                type="button"
                disabled={busy}
                onClick={toggleErrorNotebook}
                aria-pressed={activeFilters.review === "errors"}
                aria-label={`Caderno de erros: ${stats.error_notebook_count} questões com erro. Clique para ${activeFilters.review === "errors" ? "desativar" : "ativar"} o filtro.`}
                className={`questions-stat rounded-lg border px-2.5 py-1.5 text-left transition ${
                  activeFilters.review === "errors"
                    ? "border-amber-300 bg-amber-400/25 ring-2 ring-amber-300/50"
                    : "hover:border-white/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                }`}
              >
                <strong className="block text-sm text-white">{stats.error_notebook_count}</strong>
                <span className="block text-[11px] leading-tight text-white/70">
                  Caderno de erros {activeFilters.review === "errors" ? "✓" : ""}
                </span>
              </button>
              <div className="questions-stat rounded-lg border px-2.5 py-1.5">
                <strong className="block text-sm text-white">{stats.attempts_7d}</strong>
                <span className="block text-[11px] leading-tight text-white/70">Últimos 7 dias</span>
              </div>
            </div>
          </div>
        </header>

        <button
          type="button"
          aria-expanded={filtersOpen}
          aria-controls="question-filters"
          onClick={() => setFiltersOpen((value) => !value)}
          className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] text-sm font-semibold text-[var(--text-primary)] sm:hidden"
        >
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
              onChange={(event) => setDraftFilters((current) => ({ ...current, discipline: event.target.value, topic: "", subtopic: "" }))}
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
              onChange={(event) => setDraftFilters((current) => ({ ...current, topic: event.target.value, subtopic: "" }))}
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
            <span className="text-xs font-semibold text-[var(--text-secondary)]">Subtópico</span>
            <select
              value={draftFilters.subtopic}
              onChange={(event) => setDraftFilters((current) => ({ ...current, subtopic: event.target.value }))}
              disabled={busy || !draftFilters.topic}
              className="mt-1 h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] px-3 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)] disabled:opacity-60"
            >
              <option value="">{draftFilters.topic ? "Todos os subtópicos" : "Selecione o tópico"}</option>
              {(filterOptions.subtopics ?? [])
                .filter((item) => item.topic_id === draftFilters.topic)
                .map((item) => (
                  <option key={item.id} value={item.id}>{item.title}</option>
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
          <label className="block">
            <span className="text-xs font-semibold text-[var(--text-secondary)]">Situação / Caderno</span>
            <select
              value={draftFilters.review}
              onChange={(event) => setDraftFilters((current) => ({ ...current, review: event.target.value as QuestionReviewFilter }))}
              disabled={busy}
              className="mt-1 h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] px-3 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
            >
              <option value="all">Todas as questões</option>
              <option value="errors">Caderno de erros (questões com erro)</option>
              <option value="marked">Marcadas para revisão</option>
              <option value="answered">Já resolvidas</option>
              <option value="unanswered">Ainda não resolvidas</option>
              <option value="routine">Revisão do dia</option>
            </select>
          </label>
          <div className="flex items-end gap-2 sm:col-span-2">
            <button
              type="submit"
              disabled={busy}
              className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-5 text-sm font-bold text-[var(--accent-contrast)] transition hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-60"
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

        <div className="mt-3 space-y-2">
          <div role="group" aria-label="Atalhos de prática e revisão" className="flex flex-wrap gap-2">
            {REVIEW_OPTIONS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                aria-pressed={activeFilters.review === value}
                disabled={busy}
                onClick={() => void applyQuickFilters({ ...activeFilters, review: value })}
                className={`min-h-10 rounded-lg border px-3 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] disabled:opacity-60 ${activeFilters.review === value ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--text-primary)]" : "border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-secondary)] hover:border-[var(--accent)]"}`}
              >
                {label}
              </button>
            ))}
          </div>
          {activeFilters.review === "routine" && (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2">
              <p className="text-sm text-[var(--text-secondary)]">Até cinco questões cujo último erro ocorreu há pelo menos 24 horas.</p>
              <Link href="/dashboard" className="inline-flex min-h-10 items-center text-sm font-semibold text-[var(--accent)] hover:underline">
                Revisar mais tarde
              </Link>
            </div>
          )}
          {appliedFilters.length > 0 && (
            <ul aria-label="Filtros aplicados" className="flex flex-wrap gap-2">
              {appliedFilters.map(({ key, label }) => (
                <li key={key} className="min-w-0 max-w-full">
                  <button
                    type="button"
                    aria-label={`Remover filtro ${label}`}
                    title={label}
                    disabled={busy}
                    onClick={() => removeFilter(key)}
                    className="inline-flex min-h-9 max-w-full items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--bg-card)] px-3 text-xs font-semibold text-[var(--text-secondary)] hover:border-[var(--accent)] focus-visible:outline-2 focus-visible:outline-[var(--accent)] disabled:opacity-60"
                  >
                    <span className="truncate">{label}</span><X size={14} className="shrink-0" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-3 flex flex-col gap-3 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-3 sm:flex-row sm:items-center sm:justify-between">
          <div role="group" aria-label="Modo de visualização" className="inline-flex w-full rounded-xl border border-[var(--border)] p-1 sm:w-auto">
            <button
              type="button"
              aria-pressed={mode === 1}
              disabled={busy || activeFilters.review === "routine"}
              onClick={() => void fetchPage({ pageSize: 1, reset: true, record: true })}
              className={`min-h-10 flex-1 rounded-lg px-3 text-sm font-semibold transition sm:flex-none ${mode === 1 ? "bg-[var(--accent)] text-[var(--accent-contrast)]" : "text-[var(--text-secondary)] hover:bg-[var(--accent-soft)]"}`}
            >
              Uma por vez
            </button>
            <button
              type="button"
              aria-pressed={mode === 5}
              disabled={busy}
              onClick={() => void fetchPage({ pageSize: 5, reset: true, record: true })}
              className={`min-h-10 flex-1 rounded-lg px-3 text-sm font-semibold transition sm:flex-none ${mode === 5 ? "bg-[var(--accent)] text-[var(--accent-contrast)]" : "text-[var(--text-secondary)] hover:bg-[var(--accent-soft)]"}`}
            >
              5 por página
            </button>
          </div>
          <p aria-live="polite" className="text-sm font-semibold text-[var(--text-secondary)]">{positionLabel}</p>
          {navigation}
        </div>

        {error && <p role="alert" className="mt-4 rounded-xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-[var(--text-primary)]">{error}</p>}

        {result.items.length === 0 ? (
          <section className="mt-4 rounded-3xl border border-dashed border-[var(--border)] bg-[var(--bg-card)] px-6 py-12 text-center">
            {activeFilters.review === "routine" ? (
              <h2 className="text-xl font-semibold text-[var(--text-primary)]">Nenhuma questão pronta para revisão</h2>
            ) : activeFilters.review === "errors" ? (
              <>
                <h2 className="text-xl font-semibold text-[var(--text-primary)]">Seu Caderno de Erros está limpo!</h2>
                <p className="mx-auto mt-2 max-w-md text-sm text-[var(--text-secondary)]">
                  Você não tem nenhum erro registrado para os filtros selecionados. Continue resolvendo questões para que seus eventuais erros fiquem disponíveis aqui para revisão.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    const nextFilters = { ...activeFilters, review: "all" as const };
                    setDraftFilters(nextFilters);
                    void fetchPage({ filters: nextFilters, reset: true, record: true });
                  }}
                  className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[var(--accent)] px-4 text-sm font-bold text-[var(--accent-contrast)]"
                >
                  Ver todas as questões
                </button>
              </>
            ) : (
              <>
                <h2 className="text-xl font-semibold text-[var(--text-primary)]">Nenhuma questão encontrada</h2>
                <p className="mx-auto mt-2 max-w-md text-sm text-[var(--text-secondary)]">Tente outros termos ou limpe os filtros para explorar o acervo.</p>
                <button type="button" onClick={clearFilters} className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--border)] px-4 text-sm font-semibold text-[var(--text-primary)]">
                  <RotateCcw size={16} /> Limpar filtros
                </button>
              </>
            )}
          </section>
        ) : (
          <div ref={contentRef} key={mode === 1 ? `${result.items[0].id}-${direction}` : "five-mode"} className={`mt-4 space-y-5 scroll-mt-4 ${mode === 1 ? direction === "next" ? "motion-safe:animate-[question-enter-next_220ms_ease-out_both]" : "motion-safe:animate-[question-enter-previous_220ms_ease-out_both]" : ""}`}>
            {result.items.map((question, index) => (
              <QuestionCard
                key={question.id}
                question={question}
                position={pageStart + index + 1}
                onAnswered={() => void refreshStats()}
                onHidden={refreshAfterHide}
                onBusyChange={(isBusy) => setCardOperations((count) => Math.max(0, count + (isBusy ? 1 : -1)))}
              />
            ))}
          </div>
        )}

        {result.items.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-3">
            <span className="text-sm text-[var(--text-secondary)]">{positionLabel}</span>
            {navigation}
          </div>
        )}
      </div>
    </main>
  );
}
