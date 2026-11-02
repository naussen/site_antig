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

  const parsedPos = Number(paramVal("pos"));
  const requestedPos = Number.isInteger(parsedPos) && parsedPos >= 1 && parsedPos <= 20 ? parsedPos : 1;

  // Se não houver filtro explícito por ID, p_limit carrega até a posição solicitada
  // para permitir que o histórico de navegação (anterior/próxima) seja reconstruído
  // sem colapsar o conjunto filtrado para um único item.
  const limitToFetch = initialIdentifier
    ? initialMode === 5 ? 5 : 1
    : initialMode === 1
      ? Math.max(1, requestedPos)
      : 5;

  const [questionsResponse, statsResponse, filtersResponse] = await Promise.all([
    supabase.rpc("list_questions_filtered_v2", {
      p_question_identifier: initialIdentifier,
      // Contrato: p_limit: 1 (modo individual) ou 5 (modo compacto)
      p_limit: limitToFetch,
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

  const rawData = questionsResponse.data as QuestionListResult | null;
  let finalResult: QuestionListResult = rawData ?? EMPTY_RESULT;
  let finalPageStart = 0;
  const reconstructedHistory: Array<{ result: QuestionListResult; start: number }> = [];

  // Se navegando no modo individual sem filtro por ID e requestedPos > 1:
  // reconstrói a pilha de histórico com as questões anteriores para que o botão 'Anterior' funcione
  if (!initialIdentifier && initialMode === 1 && rawData && rawData.items.length > 1) {
    const targetIdx = Math.min(requestedPos - 1, rawData.items.length - 1);
    for (let i = 0; i < targetIdx; i++) {
      reconstructedHistory.push({
        result: {
          items: [rawData.items[i]],
          next_cursor: rawData.items[i].id,
          total_count: rawData.total_count,
        },
        start: i,
      });
    }
    finalPageStart = targetIdx;
    finalResult = {
      items: [rawData.items[targetIdx]],
      next_cursor: rawData.next_cursor,
      total_count: rawData.total_count,
    };
  }

  const initialError = questionsResponse.error
    ? "Não foi possível carregar as questões. Atualize a página para tentar novamente."
    : initialIdentifier && rawData?.total_count === 0
      ? `A questão solicitada ("${initialIdentifier}") não foi encontrada ou não está disponível com os filtros atuais.`
      : statsResponse.error || filtersResponse.error
        ? "Alguns dados auxiliares não foram carregados. A resolução de questões continua disponível."
        : null;

  return (
    <QuestionsClient
      initialResult={finalResult}
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
      initialPageStart={finalPageStart}
      initialHistory={reconstructedHistory}
    />
  );
}
