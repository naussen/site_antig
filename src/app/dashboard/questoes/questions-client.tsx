"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BarChart3,
  Bookmark,
  CheckCircle2,
  ChevronRight,
  EyeOff,
  Filter,
  Loader2,
  RotateCcw,
  Search,
  XCircle,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ProQuestionsLogo } from "@/components/brand/pro-questions-logo";
import { createClient } from "@/lib/supabase/client";
import type {
  QuestionAnswerResult,
  QuestionListItem,
  QuestionListResult,
  QuestionStatsResult,
} from "@/types/database";

interface QuestionsClientProps {
  initialResult: QuestionListResult;
  initialStats: QuestionStatsResult;
  disciplines: Array<{ slug: string; name: string }>;
  initialError?: string | null;
}

interface QuestionPreferenceResult {
  hidden: boolean;
  marked_for_review: boolean;
}

function QuestionMarkdown({ children }: { children: string }) {
  return (
    <div className="markdown-content [&_a]:break-words [&_a]:[overflow-wrap:anywhere]">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>
    </div>
  );
}

function accuracy(correct: number, total: number) {
  return total > 0 ? Math.round((correct / total) * 100) : 0;
}

export function QuestionsClient({
  initialResult,
  initialStats,
  disciplines,
  initialError = null,
}: QuestionsClientProps) {
  const [question, setQuestion] = useState<QuestionListItem | null>(
    initialResult.items[0] ?? null,
  );
  const [stats, setStats] = useState(initialStats);
  const [search, setSearch] = useState("");
  const [discipline, setDiscipline] = useState("");
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [answer, setAnswer] = useState<QuestionAnswerResult | null>(null);
  const [markedForReview, setMarkedForReview] = useState(
    initialResult.items[0]?.preference?.marked_for_review ?? false,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(initialError);

  const loadQuestion = async ({
    afterId = null,
    searchValue = search,
    disciplineValue = discipline,
  }: {
    afterId?: string | null;
    searchValue?: string;
    disciplineValue?: string;
  } = {}) => {
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data, error: requestError } = await supabase.rpc("list_questions", {
        p_limit: 1,
        p_after_id: afterId,
        p_search: searchValue.trim() || null,
        p_discipline_slug: disciplineValue || null,
        p_topic_id: null,
        p_include_hidden: false,
      });

      if (requestError) throw requestError;

      const result = data as QuestionListResult;
      const nextQuestion = result.items[0] ?? null;
      setQuestion(nextQuestion);
      setSelectedOptionId(null);
      setAnswer(null);
      setMarkedForReview(nextQuestion?.preference?.marked_for_review ?? false);
    } catch {
      setError("Não foi possível carregar a questão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const refreshStats = async () => {
    const supabase = createClient();
    const { data, error: statsError } = await supabase.rpc("get_question_stats");
    if (!statsError && data) setStats(data as QuestionStatsResult);
  };

  const submitAnswer = async () => {
    if (!question || !selectedOptionId || answer) return;
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
        await loadQuestion({ afterId: question.id });
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
    await loadQuestion();
  };

  const latestAccuracy = accuracy(stats.latest_correct, stats.answered_questions);

  return (
    <main className="min-h-screen bg-[var(--bg-primary)] px-4 py-6 sm:px-6 md:px-10 md:py-10">
      <div className="mx-auto max-w-6xl">
        <header className="relative overflow-hidden rounded-[2rem] border border-white/15 bg-[linear-gradient(135deg,var(--catalog-hero-start),var(--catalog-hero-end))] p-6 text-white shadow-[var(--shadow-lg)] sm:p-8">
          <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-[var(--catalog-hero-glow)] blur-3xl" aria-hidden="true" />
          <div className="relative flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
            <div>
              <ProQuestionsLogo tone="dark" />
              <h1 className="mt-6 text-3xl font-black tracking-tight text-white sm:text-4xl">
                Uma questão por vez. Evolução todos os dias.
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/75 sm:text-base">
                Filtre o acervo, responda com foco e use o comentário didático para revisar o ponto cobrado.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:min-w-[520px]">
              {[
                ["Respondidas", stats.answered_questions],
                ["Aproveitamento", `${latestAccuracy}%`],
                ["Caderno de erros", stats.error_notebook_count],
                ["Últimos 7 dias", stats.attempts_7d],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-white/15 bg-white/10 p-3 backdrop-blur-sm">
                  <strong className="block text-xl text-white">{value}</strong>
                  <span className="mt-1 block text-[11px] leading-tight text-white/65">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </header>

        <form
          onSubmit={applyFilters}
          className="mt-6 grid gap-3 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4 shadow-[var(--shadow)] md:grid-cols-[minmax(0,1fr)_minmax(180px,0.45fr)_auto]"
          aria-label="Filtros de questões"
        >
          <label className="relative block">
            <span className="sr-only">Buscar no enunciado</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={17} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              maxLength={200}
              placeholder="Buscar por assunto ou termo"
              className="h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] pl-10 pr-3 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
            />
          </label>
          <label>
            <span className="sr-only">Disciplina</span>
            <select
              value={discipline}
              onChange={(event) => setDiscipline(event.target.value)}
              className="h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] px-3 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
            >
              <option value="">Todas as disciplinas</option>
              {disciplines.map((item) => (
                <option key={item.slug} value={item.slug}>{item.name}</option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-5 text-sm font-bold text-white transition hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-60"
          >
            {loading ? <Loader2 size={17} className="animate-spin" /> : <Filter size={17} />}
            Filtrar
          </button>
        </form>

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
              Ajuste os filtros ou aguarde a publicação do primeiro lote revisado.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setDiscipline("");
                void loadQuestion({ searchValue: "", disciplineValue: "" });
              }}
              className="mt-6 inline-flex items-center gap-2 rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm font-bold text-[var(--text-primary)]"
            >
              <RotateCcw size={16} /> Limpar filtros
            </button>
          </section>
        ) : (
          <article className="mt-6 overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--bg-card)] shadow-[var(--shadow-lg)]">
            <div className="border-b border-[var(--border)] p-5 sm:p-7">
              <div className="flex flex-wrap items-start justify-between gap-4">
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
                    className={`grid h-10 w-10 place-items-center rounded-xl border transition ${markedForReview ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]" : "border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--accent)]"}`}
                    aria-label={markedForReview ? "Remover da revisão" : "Marcar para revisão"}
                    title={markedForReview ? "Remover da revisão" : "Marcar para revisão"}
                  >
                    <Bookmark size={18} fill={markedForReview ? "currentColor" : "none"} />
                  </button>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => void updatePreference({ hidden: true })}
                    className="inline-flex h-10 items-center gap-2 rounded-xl border border-[var(--border)] px-3 text-xs font-bold text-[var(--text-secondary)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
                  >
                    <EyeOff size={17} /> Não mostrar mais
                  </button>
                </div>
              </div>

              <div className="mt-7 text-base leading-7 text-[var(--text-primary)] sm:text-lg">
                <QuestionMarkdown>{question.statement_markdown}</QuestionMarkdown>
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

            <fieldset className="space-y-3 p-5 sm:p-7" disabled={Boolean(answer) || loading}>
              <legend className="sr-only">Alternativas</legend>
              {question.options.map((option) => {
                const selected = selectedOptionId === option.id;
                const correct = answer?.correct_option_id === option.id;
                const wrongSelection = Boolean(answer) && selected && !correct;

                return (
                  <label
                    key={option.id}
                    className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition ${correct ? "border-emerald-500 bg-emerald-500/10" : wrongSelection ? "border-red-500 bg-red-500/10" : selected ? "border-[var(--accent)] bg-[var(--accent-soft)]" : "border-[var(--border)] hover:border-[var(--border-strong)]"}`}
                  >
                    <input
                      type="radio"
                      name="answer"
                      value={option.id}
                      checked={selected}
                      onChange={() => setSelectedOptionId(option.id)}
                      className="mt-1 accent-[var(--accent)]"
                    />
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-[var(--bg-primary)] text-xs font-black text-[var(--text-primary)]">
                      {option.label}
                    </span>
                    <div className="min-w-0 flex-1 text-sm leading-6 text-[var(--text-primary)]">
                      <QuestionMarkdown>{option.body_markdown}</QuestionMarkdown>
                    </div>
                    {correct && <CheckCircle2 size={20} className="mt-1 shrink-0 text-emerald-500" />}
                    {wrongSelection && <XCircle size={20} className="mt-1 shrink-0 text-red-500" />}
                  </label>
                );
              })}
            </fieldset>

            {answer && (
              <section className="mx-5 mb-5 rounded-2xl border border-[var(--border)] bg-[var(--bg-primary)] p-5 sm:mx-7 sm:mb-7 sm:p-6" aria-labelledby="question-explanation-title">
                <div className="flex items-center gap-2">
                  {answer.is_correct ? <CheckCircle2 className="text-emerald-500" size={21} /> : <XCircle className="text-red-500" size={21} />}
                  <h2 id="question-explanation-title" className="font-black text-[var(--text-primary)]">
                    {answer.is_correct ? "Resposta correta" : "Resposta incorreta"}
                  </h2>
                </div>
                <p className="mt-4 text-xs font-black uppercase tracking-[0.16em] text-[var(--accent)]">Comentário didático</p>
                <div className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                  {answer.explanation_markdown ? (
                    <QuestionMarkdown>{answer.explanation_markdown}</QuestionMarkdown>
                  ) : (
                    <p>O comentário editorial desta questão ainda não foi publicado.</p>
                  )}
                </div>
              </section>
            )}

            <footer className="flex flex-col gap-3 border-t border-[var(--border)] bg-[var(--bg-primary)] p-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
              <span className="inline-flex items-center gap-2 text-xs text-[var(--text-muted)]">
                <BarChart3 size={15} /> Seu resultado é atualizado após cada resposta.
              </span>
              <div className="flex gap-2">
                {!answer ? (
                  <button
                    type="button"
                    disabled={!selectedOptionId || loading}
                    onClick={() => void submitAnswer()}
                    className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-5 text-sm font-bold text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
                  >
                    {loading && <Loader2 size={17} className="animate-spin" />}
                    Responder
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => void loadQuestion({ afterId: question.id })}
                    className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-5 text-sm font-bold text-white transition hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-50 sm:flex-none"
                  >
                    Próxima questão <ChevronRight size={17} />
                  </button>
                )}
              </div>
            </footer>
          </article>
        )}
      </div>
    </main>
  );
}
