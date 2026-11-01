// Optional PostgreSQL integration harness. PGlite is installed only under ignored tmp/.
// Run instructions are in docs/questoes-workflow/APRESENTACAO_ID_2026-10-31.md.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "../../tmp/pg-validation/node_modules/@electric-sql/pglite/dist/index.js";

const db = new PGlite();
const userA = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const userB = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const id = (number) => `00000000-0000-4000-8000-${String(number).padStart(12, "0")}`;
let checks = 0;
async function check(name, run) {
  await run();
  checks += 1;
  console.log(`ok ${checks} - ${name}`);
}
async function claims(user, access = true) {
  await db.query("SELECT set_config('request.jwt.claim.sub', $1, false), set_config('test.content_access', $2, false)", [user ?? "", String(access)]);
}
async function list(identifier = null, extra = "", parameters = []) {
  const { rows } = await db.query(`SELECT public.list_questions_filtered_v2(p_question_identifier => $1${extra}) AS result`, [identifier, ...parameters]);
  return rows[0].result;
}

try {
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
    CREATE TABLE public.sections (topic_id text, archived_at timestamptz);
    CREATE TABLE public.question_options (id uuid, question_id uuid, label text, body_markdown text, sort_order integer);
    CREATE TABLE public.user_question_attempts (id uuid, user_id uuid, question_id uuid, is_correct boolean, answered_at timestamptz);
    CREATE TABLE public.user_question_preferences (user_id uuid, question_id uuid, hidden_at timestamptz, marked_for_review_at timestamptz);
    ALTER TABLE public.user_question_attempts ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.user_question_preferences ENABLE ROW LEVEL SECURITY;
    CREATE FUNCTION public.list_questions_filtered(integer DEFAULT 1, uuid DEFAULT NULL, text DEFAULT NULL,
      text DEFAULT NULL, text DEFAULT NULL, text DEFAULT NULL, integer DEFAULT NULL, boolean DEFAULT false)
      RETURNS jsonb LANGUAGE sql AS $$ SELECT '{"legacy":true}'::jsonb $$;
  `);
  for (let number = 1; number <= 6; number += 1) {
    await db.query(`INSERT INTO public.questions
      (id, external_id, status, question_type, statement_markdown, subject, exam_board, exam_year, source_metadata, created_at)
      VALUES ($1, $2, $3, 'multiple_choice', 'As colunas da planilha.', 'Excel', 'Banca', 2021, $4, '2026-10-31T12:00:00Z')`,
    [id(number), number === 4 ? "x".repeat(160) : `pdf:prova:${number}`, number === 5 ? "archived" : number === 6 ? "draft" : "published",
      JSON.stringify({ answer_status: number === 2 ? "unexpected" : "definitivo", private_note: "DO_NOT_EXPOSE" })]);
    await db.query("INSERT INTO public.question_discipline_relations VALUES ($1, $2, true, 0);", [id(number), id(10)]);
    await db.query("INSERT INTO public.question_topic_relations VALUES ($1, 'planilhas', 'primary', 0);", [id(number)]);
  }
  await db.query("INSERT INTO public.disciplines VALUES ($1, 'informatica', 'Informática', 'active')", [id(10)]);
  await db.exec("INSERT INTO public.topics VALUES ('planilhas', 'Planilhas', NULL)");
  await db.query("INSERT INTO public.user_question_preferences VALUES ($1, $2, now(), NULL), ($3, $4, now(), NULL)", [userA, id(2), userB, id(1)]);
  await db.query("INSERT INTO public.user_question_attempts VALUES ($1, $2, $3, true, now()), ($4, $5, $3, false, now())", [id(20), userA, id(1), id(21), userB]);
  const migration = await readFile(new URL("../../supabase/migrations/046_question_identifier_filter.sql", import.meta.url), "utf8");
  await db.exec(migration);
  await db.exec(migration);
  // Reproduce the subtopic tables found in production, without assuming its
  // recorded 047 function definitions were actually installed.
  const hierarchy = await readFile(new URL("../../supabase/migrations/047_create_question_subtopics_and_hierarchy.sql", import.meta.url), "utf8");
  await db.exec(hierarchy.slice(0, hierarchy.indexOf("CREATE OR REPLACE FUNCTION public.list_questions_filtered_v2(")));
  const repair = await readFile(new URL("../../supabase/migrations/050_restore_question_practice_rpc.sql", import.meta.url), "utf8");
  // Upgrade from existing 046, repair the missing-function state, then repeat.
  await db.exec(repair);
  await db.exec("DROP FUNCTION public.list_questions_filtered_v2(integer, uuid, text, text, text, text, integer, boolean, text, text)");
  await db.exec(repair);
  await db.exec(repair);
  await db.exec("INSERT INTO public.subtopics(id, topic_id, title, slug) VALUES ('inserir-colunas', 'planilhas', 'Inserir colunas', 'inserir-colunas')");
  await db.query("INSERT INTO public.question_subtopic_relations(question_id, subtopic_id) VALUES ($1, 'inserir-colunas')", [id(1)]);
  await check("reparo restaura RPC ausente com uma só assinatura e suporta subtópico", async () => {
    const functions = await db.query("SELECT count(*)::integer AS total FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.proname='list_questions_filtered_v2'");
    assert.equal(functions.rows[0].total, 1);
  });
  await check("migration executa e reexecuta sem alterar a RPC anterior", async () => {
    assert.deepEqual((await db.query("SELECT public.list_questions_filtered() AS result")).rows[0].result, { legacy: true });
  });
  await db.exec("SET ROLE authenticated");
  await claims(userA);
  await check("assinatura antiga por nomes e assinatura completa consultam a mesma questão", async () => {
    const legacyArgs = await db.query("SELECT public.list_questions_filtered_v2(p_limit=>1, p_after_id=>NULL, p_search=>NULL, p_discipline_slug=>NULL, p_topic_id=>NULL, p_exam_board=>NULL, p_exam_year=>NULL, p_include_hidden=>false, p_question_identifier=>'pdf:prova:1') AS result");
    assert.equal(legacyArgs.rows[0].result.items[0].id, id(1));
    assert.equal((await list('pdf:prova:1', ", p_subtopic_id => 'inserir-colunas'")).items[0].subtopics[0].id, 'inserir-colunas');
    assert.equal((await list('pdf:prova:1', ", p_subtopic_id => 'inexistente'")).total_count, 0);
    await assert.rejects(list(null, ", p_subtopic_id => $2", ['x'.repeat(201)]), { code: '22023' });
  });
  await check("ID externo exato e UUID encontram o mesmo registro, com trim", async () => {
    assert.equal((await list("  pdf:prova:1  ")).items[0].id, id(1));
    assert.equal((await list(id(1))).items[0].external_id, "pdf:prova:1");
    assert.equal((await list("pdf:prova:")).total_count, 0);
    assert.equal((await list("PDF:PROVA:1")).total_count, 0);
  });
  await check("entrada inexistente, maliciosa e UUID inválido não viram erro nem pesquisa ampla", async () => {
    for (const identifier of ["inexistente", "' OR true --", "00000000-invalid", "1"]) {
      assert.deepEqual(await list(identifier), { items: [], total_count: 0, next_cursor: null });
    }
    assert.equal((await list("x".repeat(160))).total_count, 1);
    await assert.rejects(list("x".repeat(161)), { code: "22023" });
  });
  await check("filtros de busca, ano, banca, disciplina e tópico são cumulativos", async () => {
    assert.equal((await list("pdf:prova:1", ", p_search => 'colunas', p_exam_year => 2021, p_exam_board => 'Banca', p_discipline_slug => 'informatica', p_topic_id => 'planilhas'")).total_count, 1);
    assert.equal((await list("pdf:prova:1", ", p_exam_year => 2020")).total_count, 0);
    assert.equal((await list("pdf:prova:1", ", p_topic_id => 'outro'")).total_count, 0);
  });
  await check("draft e archived não aparecem mesmo por UUID", async () => {
    assert.equal((await list(id(5))).total_count, 0);
    assert.equal((await list(id(6))).total_count, 0);
  });
  await check("ocultações e tentativas não vazam entre dois usuários", async () => {
    assert.equal((await list("pdf:prova:1")).items[0].latest_attempt.is_correct, true);
    assert.equal((await list("pdf:prova:2")).total_count, 0);
    await claims(userB);
    assert.equal((await list("pdf:prova:1")).total_count, 0);
    assert.equal((await list("pdf:prova:1", ", p_include_hidden => true")).items[0].latest_attempt.is_correct, false);
    assert.equal((await list("pdf:prova:2")).total_count, 1);
    await claims(userA);
  });
  await check("ordem estável, total e cursor funcionam com datas iguais", async () => {
    const first = await list(null, ", p_limit => 1");
    assert.equal(first.total_count, 3);
    assert.equal(first.items[0].id, id(4));
    const second = await list(null, ", p_limit => 1, p_after_id => $2::uuid", [first.next_cursor]);
    assert.equal(second.items[0].id, id(3));
    const third = await list(null, ", p_limit => 1, p_after_id => $2::uuid", [second.next_cursor]);
    assert.equal(third.items[0].id, id(1));
    assert.equal(third.next_cursor, null);
  });
  await check("retorno contém somente status permitido e não expõe procedência privada", async () => {
    const result = await list("pdf:prova:1");
    assert.equal(result.items[0].answer_status, "definitivo");
    assert.equal(result.items[0].topics[0].is_navigable, false);
    assert.ok(!JSON.stringify(result).includes("DO_NOT_EXPOSE"));
    assert.equal((await list("pdf:prova:2", ", p_include_hidden => true")).items[0].answer_status, null);
  });
  await check("limites nulos, zero e excessivos são rejeitados", async () => {
    for (const limit of ["NULL", "0", "21"]) {
      await assert.rejects(list(null, `, p_limit => ${limit}`), { code: "22023" });
    }
  });
  await check("sem sessão e sem entitlement não há consulta", async () => {
    await claims(null);
    await assert.rejects(list("pdf:prova:1"), { code: "42501" });
    await claims(userA, false);
    await assert.rejects(list("pdf:prova:1"), { code: "42501" });
    await claims(userA);
  });
  await check("authenticated não lê tabelas diretamente e anon não executa a RPC", async () => {
    await assert.rejects(db.query("SELECT * FROM public.user_question_attempts"), { code: "42501" });
    await assert.rejects(db.query("SELECT * FROM public.questions"), { code: "42501" });
    await db.exec("RESET ROLE; SET ROLE anon");
    await assert.rejects(list("pdf:prova:1"), { code: "42501" });
  });
  console.log(`${checks} verificações PostgreSQL aprovadas (auth/entitlement simulados; sem Supabase remoto).`);
} catch (error) {
  console.error(`${error.code ?? "error"}: ${error.message}`);
  process.exitCode = 1;
} finally {
  await db.close();
}
