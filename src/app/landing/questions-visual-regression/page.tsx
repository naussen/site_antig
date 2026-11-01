import { notFound } from "next/navigation";
import { QuestionsClient } from "@/app/dashboard/questoes/questions-client";
import type { QuestionListItem } from "@/types/database";

const question: QuestionListItem = {
  id: "11111111-1111-4111-8111-111111111111",
  external_id: "visual:planilhas:084",
  question_type: "multiple_choice",
  statement_markdown: "Questão 84 [Gabarito preliminar divulgado]\n\nEm uma planilha do MS-Excel 2016, em português e na sua configuração padrão, as colunas C e D foram selecionadas. Em seguida, na guia Página Inicial, grupo Células, clicou-se sobre o botão Inserir, selecionando-se no menu que aparece a opção Inserir Colunas na Planilha. Assinale a alternativa que apresenta a ação decorrente da operação realizada.",
  subject: "Inserção de colunas no Excel",
  exam_board: "Banca de exemplo",
  institution: "Órgão de exemplo",
  position_name: "Cargo de exemplo",
  exam_year: 2021,
  difficulty: null,
  source_reference: null,
  answer_status: "preliminar",
  disciplines: [{ slug: "informatica", name: "Informática", is_primary: true }],
  topics: [{ topic_id: "planilhas", title: "Planilhas eletrônicas", relation_type: "primary", is_navigable: false }],
  options: [
    { id: "22222222-2222-4222-8222-222222222222", label: "A", body_markdown: "A coluna B foi eliminada, sendo criada no seu lugar uma nova coluna vazia.", sort_order: 0 },
    { id: "33333333-3333-4333-8333-333333333333", label: "B", body_markdown: "Duas colunas novas foram criadas entre as colunas B e C originais. As colunas C e D originais passaram a ser as colunas E e F, respectivamente.", sort_order: 1 },
  ],
  latest_attempt: null,
  preference: null,
};

export default function QuestionsVisualRegressionPage() {
  if (process.env.NODE_ENV === "production") notFound();

  return <QuestionsClient
    initialResult={{ items: [question], next_cursor: null, total_count: 1 }}
    initialStats={{ total_attempts: 0, answered_questions: 0, first_correct: 0, latest_correct: 0, error_notebook_count: 0, attempts_7d: 0, correct_7d: 0, attempts_30d: 0, correct_30d: 0, hidden_questions: 0, by_discipline: [] }}
    filterOptions={{ disciplines: [{ slug: "informatica", name: "Informática" }], topics: [{ topic_id: "planilhas", title: "Planilhas eletrônicas", discipline_slug: "informatica" }], boards: ["Banca de exemplo"], years: [2021] }}
  />;
}
