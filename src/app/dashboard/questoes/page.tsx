import type { Metadata } from "next";
import { requireContentAccess } from "@/lib/content-access";
import type {
  QuestionFilterDiscipline,
  QuestionListResult,
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

export default async function QuestionsPage() {
  const { supabase } = await requireContentAccess();
  const [questionsResponse, statsResponse, disciplinesResponse] = await Promise.all([
    supabase.rpc("list_questions", {
      p_limit: 1,
      p_after_id: null,
      p_search: null,
      p_discipline_slug: null,
      p_topic_id: null,
      p_include_hidden: false,
    }),
    supabase.rpc("get_question_stats"),
    supabase.rpc("list_question_disciplines"),
  ]);

  const initialError = questionsResponse.error
    ? "Não foi possível carregar as questões. Atualize a página para tentar novamente."
    : statsResponse.error || disciplinesResponse.error
      ? "Alguns dados auxiliares não foram carregados. A resolução de questões continua disponível."
      : null;

  return (
    <QuestionsClient
      initialResult={(questionsResponse.data as QuestionListResult | null) ?? EMPTY_RESULT}
      initialStats={(statsResponse.data as QuestionStatsResult | null) ?? EMPTY_STATS}
      disciplines={(disciplinesResponse.data as QuestionFilterDiscipline[] | null) ?? []}
      initialError={initialError}
    />
  );
}
