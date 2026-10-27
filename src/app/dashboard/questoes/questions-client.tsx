"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import {
  BarChart3,
  Bookmark,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  EyeOff,
  Filter,
  Loader2,
  RotateCcw,
  Search,
  XCircle,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { ProQuestionsLogo } from "@/components/brand/pro-questions-logo";
import { createClient } from "@/lib/supabase/client";
import { parseStatementSections } from "@/lib/questions/statement-sections.mjs";
import type {
  QuestionAnswerResult,
  QuestionFilterOptions,
  QuestionListItem,
  QuestionListResult,
  QuestionRevealResult,
  QuestionStatsResult,
} from "@/types/database";

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

const EMPTY_FILTERS: QuestionFilters = {
  search: "",
  discipline: "",
  topic: "",
  board: "",
  year: "",
};

interface QuestionPreferenceResult {
  hidden: boolean;
  marked_for_review: boolean;
}

function QuestionMarkdown({
  children,
  compact = false,
}: {
  children: string;
  compact?: boolean;
}) {
  return (
    <div className={`markdown-content ${compact ? "question-option-markdown" : "question-statement-markdown"} [&_a]:break-words [&_a]:[overflow-wrap:anywhere] [&_.katex-display]:max-w-full [&_.katex-display]:overflow-x-auto`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[[rehypeKatex, { strict: "ignore", trust: false }]]}
        components={{
          img: ({ src, alt }) => typeof src === "string" && /^\/resumos\/questions\/calculations\/pdf_[a-z0-9_]+\.png$/iu.test(src)
            ? <img src={src} alt={alt ?? "Memória de cálculo"} loading="lazy" className="my-3 max-w-full rounded-lg" />
            : <span>{alt ?? "Imagem indisponível"}</span>,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}

function QuestionStatement({ markdown, questionType }: { markdown: string; questionType: string }) {
  const sections = parseStatementSections(markdown, questionType);
  return (
    <div className="mx-auto max-w-4xl space-y-4">
      {sections.map((section, index) => {
        if (section.kind === "title") {
          return <h3 key={index} className="text-sm font-semibold tracking-wide text-[var(--accent)]">{section.content}</h3>;
        }
        if (section.kind === "source") {
          return <div key={index} aria-label="Fonte do texto" className="border-l-2 border-[var(--border-strong)] pl-3 text-sm text-[var(--text-muted)]"><QuestionMarkdown>{section.content}</QuestionMarkdown></div>;
        }
        const label = section.kind === "base" ? "Texto-base" : section.kind === "assertion" ? "Assertiva" : "Enunciado";
        const style = section.kind === "base"
          ? "rounded-r-lg border-l-2 border-[var(--border-strong)] bg-[var(--bg-primary)] px-4 py-3"
          : section.kind === "assertion"
            ? "border-l-2 border-[var(--accent)] bg-[var(--accent-soft)] px-4 py-3"
            : "border-t border-[var(--border)] pt-4";
        return (
          <section key={index} aria-label={label} className={style}>
            <p className="mb-2 text-xs font-semibold text-[var(--text-muted)]">{label}</p>
            <QuestionMarkdown>{section.content}</QuestionMarkdown>
          </section>
        );
      })}
    </div>
  );
}

function accuracy(correct: number, total: number) {
  return total > 0 ? Math.round((correct / total) * 100) : 0;
}

export function QuestionsClient({
  initialResult,
  initialStats,
  filterOptions,
  initialError = null,
}: QuestionsClientProps) {
  const [question, setQuestion] = useState<QuestionListItem | null>(
    initialResult.items[0] ?? null,
  );
  const [stats, setStats] = useState(initialStats);
  const [draftFilters, setDraftFilters] = useState<QuestionFilters>(EMPTY_FILTERS);
  const [activeFilters, setActiveFilters] = useState<QuestionFilters>(EMPTY_FILTERS);
  const [resultCount, setResultCount] = useState(initialResult.total_count);
  const requestId = useRef(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [answer, setAnswer] = useState<QuestionAnswerResult | null>(null);
  const [revealedAnswer, setRevealedAnswer] = useState<QuestionRevealResult | null>(null);
  const [markedForReview, setMarkedForReview] = useState(
    initialResult.items[0]?.preference?.marked_for_review ?? false,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(initialError);
  const [questionHistory, setQuestionHistory] = useState<QuestionListItem[]>([]);
  const [reachedEnd, setReachedEnd] = useState(initialResult.next_cursor === null);

  const showQuestion = (nextQuestion: QuestionListItem, hasMore: boolean) => {
    setQuestion(nextQuestion);
    setSelectedOptionId(null);
    setAnswer(null);
    setRevealedAnswer(null);
    setMarkedForReview(nextQuestion.preference?.marked_for_review ?? false);
    setReachedEnd(!hasMore);
  };

  const loadQuestion = async ({
    afterId = null,
    filters = activeFilters,
    replaceFilters = false,
    rememberCurrent = false,
    preserveCurrentOnEmpty = false,
  }: {
    afterId?: string | null;
    filters?: QuestionFilters;
    replaceFilters?: boolean;
    rememberCurrent?: boolean;
    preserveCurrentOnEmpty?: boolean;
  } = {}) => {
    const currentRequest = ++requestId.current;
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data, error: requestError } = await supabase.rpc("list_questions_filtered", {
        p_limit: 1,
        p_after_id: afterId,
        p_search: filters.search || null,
        p_discipline_slug: filters.discipline || null,
        p_topic_id: filters.topic || null,
        p_exam_board: filters.board || null,
        p_exam_year: filters.year ? Number(filters.year) : null,
        p_include_hidden: false,
      });

      if (requestError) throw requestError;
      if (currentRequest !== requestId.current) return undefined;

      const result = data as QuestionListResult;
      const nextQuestion = result.items[0] ?? null;
      setResultCount(result.total_count);

      if (replaceFilters) {
        setActiveFilters(filters);
        setQuestionHistory([]);
      }

      if (nextQuestion) {
        if (rememberCurrent && question) {
          setQuestionHistory((history) => [...history, question]);
        }
        showQuestion(nextQuestion, result.next_cursor !== null);
      } else if (preserveCurrentOnEmpty) {
        setReachedEnd(true);
      } else {
        setQuestion(null);
        setSelectedOptionId(null);
        setAnswer(null);
        setRevealedAnswer(null);
        setMarkedForReview(false);
        setReachedEnd(false);
      }

      return nextQuestion;
    } catch {
      if (currentRequest === requestId.current) {
        setError("Não foi possível carregar as questões. Os filtros anteriores continuam ativos.");
      }
      return undefined;
    } finally {
      if (currentRequest === requestId.current) setLoading(false);
    }
  };

  const refreshStats = async () => {
    const supabase = createClient();
    const { data, error: statsError } = await supabase.rpc("get_question_stats");
    if (!statsError && data) setStats(data as QuestionStatsResult);
  };

  const submitAnswer = async () => {
    if (!question || !selectedOptionId || answer || revealedAnswer) return;
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data, error: requestError } = await supabase.rpc(
        "submit_question_answer",
        {
          p_submission_id: crypto.randomUUID(),
          p_question_id: question.id,
          p_selected_option_id: selectedOptionId,
          p_duration_ms: null,
        },
      );

      if (requestError) throw requestError;
      setAnswer(data as QuestionAnswerResult);
      await refreshStats();
    } catch {
      setError("Não foi possível registrar sua resposta. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const revealAnswer = async () => {
    if (!question || answer || revealedAnswer) return;
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data, error: requestError } = await supabase.rpc("get_question_answer", {
        p_question_id: question.id,
      });
      if (requestError) throw requestError;
      setSelectedOptionId(null);
      setRevealedAnswer(data as QuestionRevealResult);
    } catch {
      setError("Não foi possível mostrar o gabarito. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const updatePreference = async ({
    hidden,
    review,
  }: {
    hidden?: boolean;
    review?: boolean;
  }) => {
    if (!question) return;
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data, error: requestError } = await supabase.rpc(
        "set_question_preference",
        {
          p_question_id: question.id,
          p_hidden: hidden ?? null,
          p_marked_for_review: review ?? null,
          p_hidden_reason: hidden ? "not_relevant" : null,
        },
      );

      if (requestError) throw requestError;
      const preference = data as QuestionPreferenceResult;
      setMarkedForReview(preference.marked_for_review);

      if (preference.hidden) {
        const nextQuestion = await loadQuestion({ afterId: question.id });
        if (nextQuestion === null) {
          await loadQuestion();
        }
        await refreshStats();
      }
    } catch {
      setError("Não foi possível atualizar esta questão. Tente novamente.");
      setLoading(false);
    } finally {
      if (!hidden) setLoading(false);
    }
  };

  const applyFilters = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await loadQuestion({
      filters: { ...draftFilters, search: draftFilters.search.trim() },
      replaceFilters: true,
    });
  };

  const showPreviousQuestion = () => {
    const previousQuestion = questionHistory.at(-1);
    if (!previousQuestion || loading) return;

    setQuestionHistory((history) => history.slice(0, -1));
    setError(null);
    showQuestion(previousQuestion, true);
  };

  const showNextQuestion = async () => {
    if (!question || loading || reachedEnd) return;

    await loadQuestion({
      afterId: question.id,
      rememberCurrent: true,
      preserveCurrentOnEmpty: true,
    });
  };

  const latestAccuracy = accuracy(stats.latest_correct, stats.answered_questions);
  const explanationMarkdown = answer?.explanation_markdown ?? revealedAnswer?.explanation_markdown;

  return (
    <main className="pro-questions-shell min-h-screen bg-[var(--bg-primary)] px-3 py-6 sm:px-6 sm:py-8 md:px-10 lg:py-8">
      <div className="mx-auto max-w-6xl xl:max-w-[1500px]">
        <header className="questions-hero relative overflow-hidden rounded-[1.6rem] border p-5 text-white shadow-[var(--shadow-lg)] sm:p-6">
          <CircleHelp className="pointer-events-none absolute -right-8 -top-10 h-44 w-44 text-white/[0.045] sm:h-56 sm:w-56" strokeWidth={0.75} aria-hidden="true" />
          <div className="relative flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div>
              <ProQuestionsLogo tone="dark" />
              <p className="mt-4 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--questions-signal)]">
                Prática direcionada · correção imediata
              </p>
              <h1 className="mt-2 max-w-2xl text-2xl font-black tracking-tight text-white sm:text-3xl">
                Uma questão por vez. Evolução todos os dias.
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-5 text-white/70 sm:leading-6">
                Filtre o acervo, responda com foco e use o comentário didático para revisar o ponto cobrado.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:min-w-[500px]">
              {[
                ["Respondidas", stats.answered_questions],
                ["Aproveitamento", `${latestAccuracy}%`],
                ["Caderno de erros", stats.error_notebook_count],
                ["Últimos 7 dias", stats.attempts_7d],
              ].map(([label, value]) => (
                <div key={label} className="questions-stat rounded-xl border p-2.5 backdrop-blur-sm">
                  <strong className="block text-lg text-white">{value}</strong>
                  <span className="mt-1 block text-[11px] leading-tight text-white/65">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </header>

        <form
          onSubmit={applyFilters}
          className="mt-4 grid gap-3 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-3 shadow-[var(--shadow)] sm:grid-cols-2 sm:p-4 xl:grid-cols-4"
          aria-label="Filtros de questões"
        >
          <label className="block sm:col-span-2 xl:col-span-2">
            <span className="text-xs font-semibold text-[var(--text-secondary)]">Buscar</span>
            <span className="relative mt-1 block">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={17} />
              <input
                value={draftFilters.search}
                onChange={(event) => setDraftFilters((current) => ({ ...current, search: event.target.value }))}
                disabled={loading}
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
              disabled={loading}
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
              disabled={loading || !draftFilters.discipline}
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
              disabled={loading}
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
              disabled={loading}
              className="mt-1 h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] px-3 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
            >
              <option value="">Todos os anos</option>
              {filterOptions.years.map((year) => <option key={year} value={year}>{year}</option>)}
            </select>
          </label>
          <div className="flex items-end gap-2 sm:col-span-2">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-5 text-sm font-bold text-white transition hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-60"
            >
              {loading ? <Loader2 size={17} className="animate-spin" /> : <Filter size={17} />}
              Filtrar
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => {
                setDraftFilters(EMPTY_FILTERS);
                void loadQuestion({ filters: EMPTY_FILTERS, replaceFilters: true });
              }}
              className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl border border-[var(--border)] px-3 text-sm font-semibold text-[var(--text-secondary)] hover:border-[var(--accent)] disabled:opacity-60"
            >
              <RotateCcw size={16} /> Limpar
            </button>
          </div>
        </form>

        <p className="mt-2 text-sm text-[var(--text-secondary)]" aria-live="polite">
          {resultCount === 1 ? "1 questão encontrada" : `${resultCount} questões encontradas`}
        </p>

        {error && (
          <p role="alert" className="mt-4 rounded-xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-[var(--text-primary)]">
            {error}
          </p>
        )}

        {!question ? (
          <section className="mt-6 rounded-3xl border border-dashed border-[var(--border)] bg-[var(--bg-card)] px-6 py-16 text-center">
            <ProQuestionsLogo className="justify-center" />
            <h2 className="mt-6 text-xl font-black text-[var(--text-primary)]">Nenhuma questão encontrada</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--text-secondary)]">
              Tente outros termos ou limpe os filtros para explorar o acervo.
            </p>
            <button
              type="button"
              onClick={() => {
                setDraftFilters(EMPTY_FILTERS);
                void loadQuestion({ filters: EMPTY_FILTERS, replaceFilters: true });
              }}
              className="mt-6 inline-flex items-center gap-2 rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm font-bold text-[var(--text-primary)]"
            >
              <RotateCcw size={16} /> Limpar filtros
            </button>
          </section>
        ) : (
          <article className="question-card mt-4 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] shadow-[var(--shadow-lg)] sm:rounded-3xl">
            <div className="border-b border-[var(--border)] p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex flex-wrap gap-2">
                  {question.disciplines.map((item) => (
                    <span key={item.slug} className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-bold text-[var(--accent)]">
                      {item.name}
                    </span>
                  ))}
                  {question.exam_board && (
                    <span className="rounded-full border border-[var(--border)] px-3 py-1 text-xs font-semibold text-[var(--text-secondary)]">
                      {question.exam_board}{question.exam_year ? ` · ${question.exam_year}` : ""}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => void updatePreference({ review: !markedForReview })}
                    className={`grid h-11 w-11 place-items-center rounded-xl border transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] sm:h-10 sm:w-10 ${markedForReview ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]" : "border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--accent)]"}`}
                    aria-label={markedForReview ? "Remover da revisão" : "Marcar para revisão"}
                    title={markedForReview ? "Remover da revisão" : "Marcar para revisão"}
                  >
                    <Bookmark size={18} fill={markedForReview ? "currentColor" : "none"} />
                  </button>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => void updatePreference({ hidden: true })}
                    className="inline-flex h-11 items-center gap-2 rounded-xl border border-[var(--border)] px-3 text-xs font-bold text-[var(--text-secondary)] transition hover:border-[var(--accent)] hover:text-[var(--accent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] sm:h-10"
                  >
                    <EyeOff size={17} /> Não mostrar mais
                  </button>
                </div>
              </div>

              <div className="mt-5 text-base text-[var(--text-primary)] sm:text-[1.05rem]">
                <QuestionStatement markdown={question.statement_markdown} questionType={question.question_type} />
              </div>
              {question.topics.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2 text-xs text-[var(--text-muted)]">
                  {question.topics.map((topic) => topic.is_navigable ? (
                    <Link key={topic.topic_id} href={`/${topic.topic_id}`} className="font-semibold text-[var(--accent)] hover:underline">
                      {topic.title}
                    </Link>
                  ) : <span key={topic.topic_id}>{topic.title}</span>)}
                </div>
              )}
            </div>

            <fieldset className={`${question.question_type === "true_false" ? "grid gap-2 sm:grid-cols-2" : "space-y-2"} p-3 sm:p-5`} disabled={Boolean(answer || revealedAnswer) || loading}>
              <legend className="sr-only">Alternativas</legend>
              {question.options.map((option) => {
                const selected = selectedOptionId === option.id;
                const correct = (answer?.correct_option_id ?? revealedAnswer?.correct_option_id) === option.id;
                const wrongSelection = Boolean(answer) && selected && !correct;

                return (
                  <label
                    key={option.id}
                    className={`question-option flex min-h-11 cursor-pointer items-start gap-2.5 rounded-xl border px-3 py-2.5 transition sm:px-3.5 ${correct ? "border-emerald-500 bg-emerald-500/10" : wrongSelection ? "border-red-500 bg-red-500/10" : selected ? "border-[var(--accent)] bg-[var(--accent-soft)]" : "border-[var(--border)] hover:border-[var(--border-strong)]"}`}
                  >
                    <input
                      type="radio"
                      name="answer"
                      value={option.id}
                      checked={selected}
                      onChange={() => setSelectedOptionId(option.id)}
                      className="mt-1 accent-[var(--accent)]"
                    />
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-[var(--bg-primary)] text-[11px] font-black text-[var(--text-primary)]">
                      {option.label}
                    </span>
                    <div className="min-w-0 flex-1 text-sm text-[var(--text-primary)]">
                      <QuestionMarkdown compact>{option.body_markdown}</QuestionMarkdown>
                    </div>
                    {correct && <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-500" />}
                    {wrongSelection && <XCircle size={18} className="mt-0.5 shrink-0 text-red-500" />}
                  </label>
                );
              })}
            </fieldset>

            {(answer || revealedAnswer) && (
              <section className="mx-3 mb-3 rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] p-4 sm:mx-5 sm:mb-5" aria-labelledby="question-explanation-title">
                <div className="flex items-center gap-2">
                  {revealedAnswer || answer?.is_correct ? <CheckCircle2 className="text-emerald-500" size={21} /> : <XCircle className="text-red-500" size={21} />}
                  <h2 id="question-explanation-title" className="font-black text-[var(--text-primary)]">
                    {revealedAnswer ? "Gabarito — sem resposta registrada" : answer?.is_correct ? "Resposta correta" : "Resposta incorreta"}
                  </h2>
                </div>
                <p className="mt-4 text-xs font-black uppercase tracking-[0.16em] text-[var(--accent)]">Comentário didático</p>
                <div className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                  {explanationMarkdown ? (
                    <QuestionMarkdown>{explanationMarkdown}</QuestionMarkdown>
                  ) : (
                    <p>O comentário editorial desta questão ainda não foi publicado.</p>
                  )}
                </div>
              </section>
            )}

            <footer className="flex flex-col gap-3 border-t border-[var(--border)] bg-[var(--bg-primary)] p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <span className="inline-flex items-center gap-2 text-xs text-[var(--text-muted)]">
                <BarChart3 size={15} />
                {revealedAnswer ? "Gabarito exibido sem alterar seu resultado." : reachedEnd ? "Você chegou ao fim das questões deste filtro." : "Seu resultado é atualizado após cada resposta."}
              </span>
              <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap">
                <button
                  type="button"
                  disabled={questionHistory.length === 0 || loading}
                  onClick={showPreviousQuestion}
                  aria-label="Questão anterior"
                  className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-xl border border-[var(--border)] px-3 text-sm font-bold text-[var(--text-primary)] transition hover:border-[var(--accent)] hover:text-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-40 sm:flex-none"
                >
                  <ChevronLeft size={17} /> Anterior
                </button>
                {!answer && !revealedAnswer && (
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => void revealAnswer()}
                    className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[var(--border)] px-3 text-sm font-semibold text-[var(--text-secondary)] transition hover:border-[var(--accent)] hover:text-[var(--accent)] disabled:opacity-50"
                  >
                    Ver resposta
                  </button>
                )}
                {!answer && !revealedAnswer && (
                  <button
                    type="button"
                    disabled={!selectedOptionId || loading}
                    onClick={() => void submitAnswer()}
                    className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-5 text-sm font-bold text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
                  >
                    {loading && <Loader2 size={17} className="animate-spin" />}
                    Responder
                  </button>
                )}
                <button
                  type="button"
                  disabled={loading || reachedEnd}
                  onClick={() => void showNextQuestion()}
                  aria-label="Próxima questão"
                  className={`inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-xl px-3 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-40 sm:flex-none ${answer || revealedAnswer ? "bg-[var(--accent)] text-white hover:-translate-y-0.5" : "border border-[var(--border)] text-[var(--text-primary)] hover:border-[var(--accent)] hover:text-[var(--accent)]"}`}
                >
                  Próxima <ChevronRight size={17} />
                </button>
              </div>
            </footer>
          </article>
        )}
      </div>
    </main>
  );
}
