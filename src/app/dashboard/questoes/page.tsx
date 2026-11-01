import type { Metadata } from "next";
import { requireContentAccess } from "@/lib/content-access";
import type {
  QuestionFilterOptions,
  QuestionListResult,
  QuestionStatsResult,
} from "@/types/database";
import { QuestionsClient, type QuestionFilters } from "./questions-client";

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
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function QuestionsPage({ searchParams }: PageProps) {
  const params = await searchParams;

  const search = typeof params.busca === "string" ? params.busca.slice(0, 200) : null;
  const discipline = typeof params.disciplina === "string" ? params.disciplina.slice(0, 120) : null;
  const topic = typeof params.topico === "string" ? params.topico.slice(0, 200) : null;
  const board = typeof params.banca === "string" ? params.banca.slice(0, 120) : null;
  const year = typeof params.ano === "string" && /^\d{4}$/.test(params.ano) ? Number(params.ano) : null;
  const mode: 1 | 5 = params.modo === "5" ? 5 : 1;
  const rawReview = typeof params.caderno === "string" ? params.caderno : "all";
  const reviewFilter: QuestionFilters["review"] = ["all", "errors", "marked", "answered", "unanswered"].includes(rawReview)
    ? (rawReview as QuestionFilters["review"])
    : "all";

  const { supabase } = await requireContentAccess();
  const [questionsResponse, statsResponse, filtersResponse] = await Promise.all([
    supabase.rpc("list_questions_filtered", {
      p_limit: mode, // p_limit: 1
      p_after_id: null,
      p_search: search,
      p_discipline_slug: discipline,
      p_topic_id: topic,
      p_exam_board: board,
      p_exam_year: year,
      p_include_hidden: false,
      p_review_filter: reviewFilter,
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
        search: search ?? "",
        discipline: discipline ?? "",
        topic: topic ?? "",
        board: board ?? "",
        year: year ? String(year) : "",
        review: reviewFilter,
      }}
      initialMode={mode}
    />
  );
}
