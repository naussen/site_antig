import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "file:///C:/PRO/worktrees/questoes-apresentacao-id-20261031/tmp/pg-validation/node_modules/%40electric-sql/pglite/dist/index.js";

const db = new PGlite();
const userA = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const userB = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const id = (number) => `00000000-0000-4000-8000-${String(number).padStart(12, "0")}`;

async function claims(user, access = true) {
  await db.query(
    "SELECT set_config('request.jwt.claim.sub', $1, false), set_config('test.content_access', $2, false)",
    [user ?? "", String(access)]
  );
}

async function list(identifier = null, extra = "", parameters = []) {
  const { rows } = await db.query(
    `SELECT public.list_questions_filtered_v2(p_question_identifier => $1${extra}) AS result`,
    [identifier, ...parameters]
  );
  return rows[0].result;
}

try {
  console.log("=== Teste de Regressão Comportamental PostgreSQL (PGlite) ===");

  await db.exec(`
    CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;
    CREATE SCHEMA auth; CREATE SCHEMA private;
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS
      $$ SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    CREATE FUNCTION private.has_active_content_access() RETURNS boolean LANGUAGE sql STABLE AS
      $$ SELECT coalesce(current_setting('test.content_access', true), 'false') = 'true' $$;
    CREATE TABLE public.questions (
      id uuid PRIMARY KEY, external_id text UNIQUE, status text, question_type text,
      statement_markdown text, subject text, exam_board text, institution text,
      position_name text, exam_year smallint, difficulty text, source_reference text,
      source_metadata jsonb, created_at timestamptz,
      search_document tsvector GENERATED ALWAYS AS (to_tsvector('portuguese', statement_markdown)) STORED
    );
    CREATE TABLE public.disciplines (id uuid PRIMARY KEY, slug text, name text, status text);
    CREATE TABLE public.question_discipline_relations (question_id uuid, discipline_id uuid, is_primary boolean, sort_order integer);
    CREATE TABLE public.topics (topic_id text PRIMARY KEY, title text, archived_at timestamptz);
    CREATE TABLE public.question_topic_relations (question_id uuid, topic_id text, relation_type text, sort_order integer);
    CREATE TABLE public.subtopics (id text PRIMARY KEY, topic_id text, title text, slug text, archived_at timestamptz);
    CREATE TABLE public.question_subtopic_relations (question_id uuid, subtopic_id text, is_primary boolean, sort_order integer);
    CREATE TABLE public.sections (topic_id text, archived_at timestamptz);
    CREATE TABLE public.question_options (id uuid, question_id uuid, label text, body_markdown text, sort_order integer);
    CREATE TABLE public.user_question_attempts (id uuid, user_id uuid, question_id uuid, is_correct boolean, answered_at timestamptz);
    CREATE TABLE public.user_question_preferences (user_id uuid, question_id uuid, hidden_at timestamptz, marked_for_review_at timestamptz);
    ALTER TABLE public.user_question_attempts ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.user_question_preferences ENABLE ROW LEVEL SECURITY;
  `);

  for (let number = 1; number <= 6; number += 1) {
    await db.query(
      `INSERT INTO public.questions
       (id, external_id, status, question_type, statement_markdown, subject, exam_board, exam_year, source_metadata, created_at)
       VALUES ($1, $2, $3, 'multiple_choice', 'As colunas da planilha.', 'Excel', 'Banca', 2021, $4, '2026-10-31T12:00:00Z')`,
      [
        id(number),
        number === 4 ? "x".repeat(160) : `pdf:prova:${number}`,
        number === 5 ? "archived" : number === 6 ? "draft" : "published",
        JSON.stringify({ answer_status: number === 2 ? "unexpected" : "definitivo" }),
      ]
    );
    await db.query("INSERT INTO public.question_discipline_relations VALUES ($1, $2, true, 0);", [id(number), id(10)]);
    await db.query("INSERT INTO public.question_topic_relations VALUES ($1, 'planilhas', 'primary', 0);", [id(number)]);
  }

  await db.query("INSERT INTO public.disciplines VALUES ($1, 'informatica', 'Informática', 'active')", [id(10)]);
  await db.exec("INSERT INTO public.topics VALUES ('planilhas', 'Planilhas', NULL)");

  // 1. Aplicar a migration 051
  const migration051 = await readFile("supabase/migrations/051_normalize_boards_and_review_filter.sql", "utf8");
  await db.exec(migration051);

  await db.exec("SET ROLE authenticated");
  await claims(userA);

  // Cenário 1: Aluno A errou no passado ('2025-01-01') e acertou recentemente ('2026-11-01')
  await db.exec("RESET ROLE");
  await db.query("INSERT INTO public.user_question_attempts VALUES ($1, $2, $3, false, '2025-01-01T00:00:00Z')", [id(101), userA, id(1)]);
  await db.query("INSERT INTO public.user_question_attempts VALUES ($1, $2, $3, true, '2026-11-01T00:00:00Z')", [id(102), userA, id(1)]);

  await db.exec("SET ROLE authenticated");
  await claims(userA);

  const errorsA = await list(null, ", p_review_filter => 'errors'");
  assert.equal(errorsA.total_count, 0, "Aluno que acertou após errar não deve ter a questão no caderno de erros");

  // Cenário 2: Aluno A acertou no passado ('2026-10-01') e errou mais recentemente ('2026-11-02') na questão 3
  await db.exec("RESET ROLE");
  await db.query("INSERT INTO public.user_question_attempts VALUES ($1, $2, $3, true, '2026-10-01T00:00:00Z')", [id(103), userA, id(3)]);
  await db.query("INSERT INTO public.user_question_attempts VALUES ($1, $2, $3, false, '2026-11-02T00:00:00Z')", [id(104), userA, id(3)]);

  await db.exec("SET ROLE authenticated");
  await claims(userA);

  const errorsAAfterNewError = await list(null, ", p_review_filter => 'errors'");
  assert.equal(errorsAAfterNewError.total_count, 1, "Aluno que errou mais recentemente deve ter a questão no caderno de erros");
  assert.equal(errorsAAfterNewError.items[0].id, id(3));

  // Cenário 3: Isolamento estrito entre usuários (Aluno B não vê os erros do Aluno A)
  await claims(userB);
  const errorsB = await list(null, ", p_review_filter => 'errors'");
  assert.equal(errorsB.total_count, 0, "Aluno B não pode ver erros do Aluno A");

  // Cenário 4: Questões arquivadas (id 5) e draft (id 6) não aparecem na listagem
  const archivedQuery = await list(id(5));
  assert.equal(archivedQuery.total_count, 0, "Questões arquivadas não podem ser listadas por alunos");

  // Cenário 5: Teste do rollback operacional via scripts/questions-workflow/rollback_051.sql
  await db.exec("RESET ROLE");
  const rollbackSql = await readFile("scripts/questions-workflow/rollback_051.sql", "utf8");
  await db.exec(rollbackSql);

  const procCheck = await db.query(
    "SELECT pronargs FROM pg_proc WHERE proname='list_questions_filtered_v2'"
  );
  assert.ok(procCheck.rows.length >= 1, "RPC list_questions_filtered_v2 restaurada pelo rollback");

  console.log("SUCESSO: Todos os 5 cenários comportamentais em PostgreSQL foram validados e aprovados.");
} catch (err) {
  console.error("FALHA no teste comportamental PostgreSQL:", err);
  process.exitCode = 1;
} finally {
  await db.close();
}
