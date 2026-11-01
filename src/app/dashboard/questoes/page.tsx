import type { Metadata } from "next";
import { requireContentAccess } from "@/lib/content-access";
import type {
  QuestionFilterOptions,
  QuestionListResult,
  QuestionReviewFilter,
  QuestionStatsResult,
} from "@/types/database";
import { QuestionsClient } from "./questions-client";

export const metadata: Metadata = {
  title: "PROQuestões",
  description: "Resolva questões, acompanhe seus resultados e revise seus erros.",
};

const EMPTY_RESULT: QuestionListResult = {
  items: [],
  next_cursor: null,
  total_count: 0,
};

const EMPTY_FILTERS: QuestionFilterOptions = {
  disciplines: [],
  topics: [],
  boards: [],
  years: [],
};

const EMPTY_STATS: QuestionStatsResult = {
  total_attempts: 0,
  answered_questions: 0,
  first_correct: 0,
  latest_correct: 0,
  error_notebook_count: 0,
  attempts_7d: 0,
  correct_7d: 0,
  attempts_30d: 0,
  correct_30d: 0,
  hidden_questions: 0,
  by_discipline: [],
};

interface PageProps {
  params?: Promise<Record<string, string | string[] | undefined>>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export default async function QuestionsPage(props: PageProps) {
  const { supabase } = await requireContentAccess();
  const searchParams = props.searchParams;
  const rawParams = searchParams ? await searchParams : {};
  const paramVal = (key: string): string => {
    const v = rawParams[key];
    return typeof v === "string" ? v.trim() : "";
  };

  const initialIdentifier = paramVal("id").slice(0, 160) || null;
  const initialSearch = paramVal("busca").slice(0, 200) || null;
  const initialDiscipline = paramVal("disciplina").slice(0, 120) || null;
  const initialTopic = paramVal("topico").slice(0, 200) || null;
  const initialSubtopic = paramVal("subtopico").slice(0, 200) || null;
  const initialBoard = paramVal("banca").slice(0, 120) || null;
  const parsedYear = Number(paramVal("ano"));
  const initialYear =
    Number.isInteger(parsedYear) && parsedYear >= 1900 && parsedYear <= 2200
      ? parsedYear
      : null;
  const initialMode: 1 | 5 = paramVal("modo") === "5" ? 5 : 1;
  const rawReview = paramVal("revisao");
  const initialReview: QuestionReviewFilter =
    rawReview === "errors" ||
    rawReview === "marked" ||
    rawReview === "answered" ||
    rawReview === "unanswered"
      ? rawReview
      : "all";

  const [questionsResponse, statsResponse, filtersResponse] = await Promise.all([
    supabase.rpc("list_questions_filtered_v2", {
      p_question_identifier: initialIdentifier,
      // Contrato: p_limit: 1 (modo individual) ou 5 (modo compacto)
      p_limit: initialMode === 5 ? 5 : 1,
      p_after_id: null,
      p_search: initialSearch,
      p_discipline_slug: initialDiscipline,
      p_topic_id: initialTopic,
      // Contrato: p_subtopic_id: null quando não filtrado
      p_subtopic_id: initialSubtopic ?? null,
      p_exam_board: initialBoard,
      p_exam_year: initialYear,
      p_include_hidden: false,
      p_review_filter: initialReview,
    }),
    supabase.rpc("get_question_stats"),
    supabase.rpc("list_question_filters"),
  ]);

  const initialError = questionsResponse.error
    ? "Não foi possível carregar as questões. Atualize a página para tentar novamente."
    : statsResponse.error || filtersResponse.error
      ? "Alguns dados auxiliares não foram carregados. A resolução de questões continua disponível."
      : null;

  return (
    <QuestionsClient
      initialResult={(questionsResponse.data as QuestionListResult | null) ?? EMPTY_RESULT}
      initialStats={(statsResponse.data as QuestionStatsResult | null) ?? EMPTY_STATS}
      filterOptions={(filtersResponse.data as QuestionFilterOptions | null) ?? EMPTY_FILTERS}
      initialError={initialError}
      initialFilters={{
        identifier: initialIdentifier ?? "",
        search: initialSearch ?? "",
        discipline: initialDiscipline ?? "",
        topic: initialTopic ?? "",
        subtopic: initialSubtopic ?? "",
        board: initialBoard ?? "",
        year: initialYear ? String(initialYear) : "",
        review: initialReview,
      }}
      initialMode={initialMode}
    />
  );
}
