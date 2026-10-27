"use client";

import { useState } from "react";
import Link from "next/link";
import { Bookmark, CheckCircle2, ChevronDown, ChevronUp, EyeOff, Loader2, XCircle } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { createClient } from "@/lib/supabase/client";
import { parseStatementSections } from "@/lib/questions/statement-sections.mjs";
import type { QuestionAnswerResult, QuestionListItem, QuestionRevealResult } from "@/types/database";

interface QuestionCardProps {
  question: QuestionListItem;
  position: number;
  onAnswered: () => void;
  onHidden: () => Promise<void>;
  onBusyChange: (busy: boolean) => void;
}

function QuestionMarkdown({ children, compact = false }: { children: string; compact?: boolean }) {
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

function QuestionStatement({ question }: { question: QuestionListItem }) {
  const [baseCollapsed, setBaseCollapsed] = useState(false);
  const sections = parseStatementSections(question.statement_markdown, question.question_type);
  const hasLongBase = sections.filter((section) => section.kind === "base").reduce((length, section) => length + section.content.length, 0) > 700;
  const firstBaseIndex = sections.findIndex((section) => section.kind === "base");

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
        const showToggle = index === firstBaseIndex && hasLongBase;
        return (
          <section key={index} aria-label={label} className={style}>
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-xs font-semibold text-[var(--text-muted)]">{label}</p>
              {showToggle && (
                <button type="button" onClick={() => setBaseCollapsed((value) => !value)} aria-expanded={!baseCollapsed} className="inline-flex min-h-9 items-center gap-1 rounded-lg px-2 text-xs font-semibold text-[var(--accent)] hover:bg-[var(--accent-soft)] focus-visible:outline-2 focus-visible:outline-[var(--accent)]">
                  {baseCollapsed ? <ChevronDown size={15} /> : <ChevronUp size={15} />}
                  {baseCollapsed ? "Expandir texto" : "Recolher texto"}
                </button>
              )}
            </div>
            {section.kind === "base" && baseCollapsed ? <p className="text-sm text-[var(--text-muted)]">Texto-base recolhido.</p> : <QuestionMarkdown>{section.content}</QuestionMarkdown>}
          </section>
        );
      })}
    </div>
  );
}

export function QuestionCard({ question, position, onAnswered, onHidden, onBusyChange }: QuestionCardProps) {
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [answer, setAnswer] = useState<QuestionAnswerResult | null>(null);
  const [revealedAnswer, setRevealedAnswer] = useState<QuestionRevealResult | null>(null);
  const [markedForReview, setMarkedForReview] = useState(question.preference?.marked_for_review ?? false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const explanationMarkdown = answer?.explanation_markdown ?? revealedAnswer?.explanation_markdown;

  const submitAnswer = async () => {
    if (!selectedOptionId || answer || revealedAnswer || loading) return;
    setLoading(true);
    onBusyChange(true);
    setError(null);
    try {
      const { data, error: requestError } = await createClient().rpc("submit_question_answer", {
        p_submission_id: crypto.randomUUID(),
        p_question_id: question.id,
        p_selected_option_id: selectedOptionId,
        p_duration_ms: null,
      });
      if (requestError) throw requestError;
      setAnswer(data as QuestionAnswerResult);
      onAnswered();
    } catch {
      setError("Não foi possível registrar sua resposta. Tente novamente.");
    } finally {
      setLoading(false);
      onBusyChange(false);
    }
  };

  const revealAnswer = async () => {
    if (answer || revealedAnswer || loading) return;
    setLoading(true);
    onBusyChange(true);
    setError(null);
    try {
      const { data, error: requestError } = await createClient().rpc("get_question_answer", { p_question_id: question.id });
      if (requestError) throw requestError;
      setSelectedOptionId(null);
      setRevealedAnswer(data as QuestionRevealResult);
    } catch {
      setError("Não foi possível mostrar o gabarito. Tente novamente.");
    } finally {
      setLoading(false);
      onBusyChange(false);
    }
  };

  const updatePreference = async (action: "hide" | "review") => {
    if (loading) return;
    setLoading(true);
    onBusyChange(true);
    setError(null);
    try {
      const { data, error: requestError } = await createClient().rpc("set_question_preference", {
        p_question_id: question.id,
        p_hidden: action === "hide" ? true : null,
        p_marked_for_review: action === "review" ? !markedForReview : null,
        p_hidden_reason: action === "hide" ? "not_relevant" : null,
      });
      if (requestError) throw requestError;
      if (action === "hide") await onHidden();
      else setMarkedForReview((data as { marked_for_review: boolean }).marked_for_review);
    } catch {
      setError("Não foi possível atualizar esta questão. Tente novamente.");
    } finally {
      setLoading(false);
      onBusyChange(false);
    }
  };

  return (
    <article aria-label={`Questão ${position}`} className="question-card overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] shadow-[var(--shadow-lg)] sm:rounded-3xl">
      <div className="border-b border-[var(--border)] p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[var(--bg-primary)] px-3 py-1 text-xs font-semibold text-[var(--text-secondary)]">Questão {position}</span>
            {question.disciplines.map((item) => <span key={item.slug} className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-bold text-[var(--accent)]">{item.name}</span>)}
            {question.exam_board && <span className="rounded-full border border-[var(--border)] px-3 py-1 text-xs font-semibold text-[var(--text-secondary)]">{question.exam_board}{question.exam_year ? ` · ${question.exam_year}` : ""}</span>}
          </div>
          <div className="flex items-center gap-2">
            <button type="button" disabled={loading} onClick={() => void updatePreference("review")} aria-label={markedForReview ? "Remover da revisão" : "Marcar para revisão"} title={markedForReview ? "Remover da revisão" : "Marcar para revisão"} className={`grid h-11 w-11 place-items-center rounded-xl border transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] sm:h-10 sm:w-10 ${markedForReview ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]" : "border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--accent)]"}`}><Bookmark size={18} fill={markedForReview ? "currentColor" : "none"} /></button>
            <button type="button" disabled={loading} onClick={() => void updatePreference("hide")} className="inline-flex h-11 items-center gap-2 rounded-xl border border-[var(--border)] px-3 text-xs font-bold text-[var(--text-secondary)] transition hover:border-[var(--accent)] hover:text-[var(--accent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] sm:h-10"><EyeOff size={17} /> Não mostrar mais</button>
          </div>
        </div>
        <div className="mt-5 text-base text-[var(--text-primary)] sm:text-[1.05rem]"><QuestionStatement question={question} /></div>
        {question.topics.length > 0 && <div className="mt-4 flex flex-wrap gap-2 text-xs text-[var(--text-muted)]">{question.topics.map((topic) => topic.is_navigable ? <Link key={topic.topic_id} href={`/${topic.topic_id}`} className="font-semibold text-[var(--accent)] hover:underline">{topic.title}</Link> : <span key={topic.topic_id}>{topic.title}</span>)}</div>}
      </div>

      <fieldset className={`${question.question_type === "true_false" ? "grid gap-2 sm:grid-cols-2" : "space-y-2"} p-3 sm:p-5`} disabled={Boolean(answer || revealedAnswer) || loading}>
        <legend className="sr-only">Alternativas da questão {position}</legend>
        {question.options.map((option) => {
          const selected = selectedOptionId === option.id;
          const correct = (answer?.correct_option_id ?? revealedAnswer?.correct_option_id) === option.id;
          const wrongSelection = Boolean(answer) && selected && !correct;
          return <label key={option.id} className={`question-option flex min-h-11 cursor-pointer items-start gap-2.5 rounded-xl border px-3 py-2.5 transition sm:px-3.5 ${correct ? "border-emerald-500 bg-emerald-500/10" : wrongSelection ? "border-red-500 bg-red-500/10" : selected ? "border-[var(--accent)] bg-[var(--accent-soft)]" : "border-[var(--border)] hover:border-[var(--border-strong)]"}`}>
            <input type="radio" name={`answer-${question.id}`} value={option.id} checked={selected} onChange={() => setSelectedOptionId(option.id)} className="mt-1 accent-[var(--accent)]" />
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-[var(--bg-primary)] text-[11px] font-black text-[var(--text-primary)]">{option.label}</span>
            <div className="min-w-0 flex-1 text-sm text-[var(--text-primary)]"><QuestionMarkdown compact>{option.body_markdown}</QuestionMarkdown></div>
            {correct && <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-500" />}
            {wrongSelection && <XCircle size={18} className="mt-0.5 shrink-0 text-red-500" />}
          </label>;
        })}
      </fieldset>

      {(answer || revealedAnswer) && <section className="mx-3 mb-3 rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] p-4 sm:mx-5 sm:mb-5" aria-labelledby={`question-explanation-${question.id}`}>
        <div className="flex items-center gap-2">
          {revealedAnswer || answer?.is_correct ? <CheckCircle2 className="text-emerald-500" size={21} /> : <XCircle className="text-red-500" size={21} />}
          <h2 id={`question-explanation-${question.id}`} className="font-bold text-[var(--text-primary)]">{revealedAnswer ? "Gabarito — sem resposta registrada" : answer?.is_correct ? "Resposta correta" : "Resposta incorreta"}</h2>
        </div>
        <p className="mt-4 text-xs font-semibold text-[var(--accent)]">Comentário didático</p>
        <div className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{explanationMarkdown ? <QuestionMarkdown>{explanationMarkdown}</QuestionMarkdown> : <p>O comentário editorial desta questão ainda não foi publicado.</p>}</div>
      </section>}

      <footer className="flex flex-col gap-3 border-t border-[var(--border)] bg-[var(--bg-primary)] p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <span className="text-xs text-[var(--text-muted)]">{revealedAnswer ? "Gabarito exibido sem alterar seu resultado." : "Seu resultado é atualizado após cada resposta."}</span>
        <div className="flex flex-wrap gap-2">
          {!answer && !revealedAnswer && <button type="button" disabled={loading} onClick={() => void revealAnswer()} className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl border border-[var(--border)] px-3 text-sm font-semibold text-[var(--text-secondary)] transition hover:border-[var(--accent)] hover:text-[var(--accent)] disabled:opacity-50 sm:flex-none">Ver resposta</button>}
          {!answer && !revealedAnswer && <button type="button" disabled={!selectedOptionId || loading} onClick={() => void submitAnswer()} className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-5 text-sm font-bold text-white transition hover:-translate-y-0.5 disabled:opacity-50 sm:flex-none">{loading && <Loader2 size={17} className="animate-spin" />} Responder</button>}
        </div>
        {error && <p role="alert" className="w-full text-sm text-red-600">{error}</p>}
      </footer>
    </article>
  );
}
