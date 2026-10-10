import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const migrationUrl = new URL(
  "../supabase/migrations/029_create_questions_module.sql",
  import.meta.url,
);
const databaseTypesUrl = new URL("../src/types/database.ts", import.meta.url);
const filterMigrationUrl = new URL(
  "../supabase/migrations/030_add_question_filter_catalog_rpc.sql",
  import.meta.url,
);

const [migration, filterMigration, databaseTypes] = await Promise.all([
  readFile(migrationUrl, "utf8"),
  readFile(filterMigrationUrl, "utf8"),
  readFile(databaseTypesUrl, "utf8"),
]);

const moduleTables = [
  "disciplines",
  "topic_discipline_relations",
  "questions",
  "question_discipline_relations",
  "question_topic_relations",
  "question_options",
  "question_answer_keys",
  "question_explanations",
  "user_question_attempts",
  "user_question_preferences",
  "question_comment_aliases",
  "question_comments",
  "question_comment_reports",
];

test("habilita RLS em todas as tabelas do módulo", () => {
  for (const table of moduleTables) {
    assert.match(
      migration,
      new RegExp(
        `ALTER TABLE public\\.${table} ENABLE ROW LEVEL SECURITY;`,
        "u",
      ),
      `RLS ausente em ${table}`,
    );
  }
});

test("catálogo de filtros preserva menor privilégio", () => {
  assert.match(
    filterMigration,
    /CREATE OR REPLACE FUNCTION public\.list_question_disciplines\(\)[\s\S]*SECURITY DEFINER[\s\S]*SET search_path = ''/u,
  );
  assert.match(
    filterMigration,
    /private\.has_active_content_access\(\)/u,
  );
  assert.match(
    filterMigration,
    /GRANT EXECUTE ON FUNCTION public\.list_question_disciplines\(\)[\s\S]*TO authenticated;/u,
  );
  assert.doesNotMatch(
    filterMigration,
    /GRANT\s+SELECT[\s\S]*public\.disciplines[\s\S]*TO\s+authenticated/iu,
  );
});

test("não concede leitura direta do gabarito ou de dados pessoais", () => {
  assert.match(
    migration,
    /REVOKE ALL PRIVILEGES ON TABLE[\s\S]*public\.question_answer_keys,[\s\S]*public\.user_question_attempts,[\s\S]*public\.question_comments[\s\S]*FROM PUBLIC, anon, authenticated;/u,
  );
  assert.doesNotMatch(
    migration,
    /GRANT\s+SELECT[\s\S]*question_answer_keys[\s\S]*TO\s+authenticated/iu,
  );
  assert.doesNotMatch(
    migration,
    /GRANT\s+(?:SELECT|INSERT|UPDATE|DELETE)[\s\S]*user_question_attempts[\s\S]*TO\s+authenticated/iu,
  );
});

test("RPCs públicas usam SECURITY DEFINER com search_path vazio", () => {
  const rpcNames = [
    "list_questions",
    "submit_question_answer",
    "set_question_preference",
    "get_question_stats",
  ];

  for (const rpcName of rpcNames) {
    assert.match(
      migration,
      new RegExp(
        `CREATE OR REPLACE FUNCTION public\\.${rpcName}\\([\\s\\S]*?SECURITY DEFINER[\\s\\S]*?SET search_path = ''`,
        "u",
      ),
      `RPC ${rpcName} sem endurecimento esperado`,
    );
  }
});

test("resposta é idempotente e calcula correção no servidor", () => {
  assert.match(migration, /submission_id\s+UUID NOT NULL/u);
  assert.match(migration, /UNIQUE \(user_id, submission_id\)/u);
  assert.match(migration, /p_selected_option_id = correct_option_id/u);
  assert.match(
    migration,
    /ON CONFLICT \(user_id, submission_id\) DO NOTHING/u,
  );
});

test("metadados relacionam questões, tópicos e disciplinas por chaves", () => {
  assert.match(
    migration,
    /CREATE TABLE public\.topic_discipline_relations/u,
  );
  assert.match(
    migration,
    /CREATE TABLE public\.question_discipline_relations/u,
  );
  assert.match(
    migration,
    /CREATE TABLE public\.question_topic_relations/u,
  );
  assert.match(
    migration,
    /REFERENCES public\.topics\(topic_id\) ON DELETE RESTRICT/u,
  );
  assert.match(
    migration,
    /related topic must share a discipline with the question/u,
  );
});

test("tipos TypeScript acompanham o schema do módulo", () => {
  const requiredTypes = [
    "DisciplineRow",
    "QuestionRow",
    "QuestionDisciplineRelationRow",
    "QuestionTopicRelationRow",
    "UserQuestionAttemptRow",
    "UserQuestionPreferenceRow",
    "QuestionCommentRow",
    "QuestionListResult",
    "QuestionAnswerResult",
    "QuestionStatsResult",
  ];

  for (const typeName of requiredTypes) {
    assert.match(
      databaseTypes,
      new RegExp(`export interface ${typeName}\\s*\\{`, "u"),
      `tipo ${typeName} ausente`,
    );
  }
});
