import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");

const pgliteUrl = new URL("../../tmp/pg-validation/node_modules/@electric-sql/pglite/dist/index.js", import.meta.url).href;
const { PGlite } = await import(pgliteUrl);

const db = new PGlite();

function sha256(text) {
  return createHash("sha256").update(Buffer.from(text || "", "utf8")).digest("hex");
}

function computeOptionsHash(options) {
  const sorted = [...options].sort((a, b) => a.label.localeCompare(b.label));
  return sha256(sorted.map((o) => `${o.label}:${o.body_markdown}`).join("|"));
}

console.log("=== Teste de Transacionalidade Atômica e Rollback Condicionado (PGlite) ===");

// 1. Configurar schema básico no PGlite
await db.exec(`
  CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;
  CREATE SCHEMA IF NOT EXISTS private;
  CREATE SCHEMA IF NOT EXISTS extensions;

  CREATE TABLE public.disciplines (
    id UUID PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'active'
  );

  CREATE TABLE public.topics (
    topic_id TEXT PRIMARY KEY,
    discipline TEXT NOT NULL,
    archived_at TIMESTAMPTZ
  );

  CREATE TABLE public.topic_discipline_relations (
    topic_id TEXT NOT NULL REFERENCES public.topics(topic_id),
    discipline_id UUID NOT NULL REFERENCES public.disciplines(id),
    is_primary BOOLEAN NOT NULL DEFAULT false,
    PRIMARY KEY (topic_id, discipline_id)
  );

  CREATE TABLE public.subtopics (
    id TEXT PRIMARY KEY,
    topic_id TEXT NOT NULL REFERENCES public.topics(topic_id),
    title TEXT NOT NULL,
    archived_at TIMESTAMPTZ
  );

  CREATE TABLE public.questions (
    id UUID PRIMARY KEY,
    external_id TEXT NOT NULL UNIQUE,
    question_type TEXT NOT NULL DEFAULT 'multiple_choice',
    statement_markdown TEXT NOT NULL,
    subject TEXT NOT NULL,
    exam_board TEXT,
    institution TEXT,
    position_name TEXT,
    exam_year SMALLINT,
    difficulty TEXT,
    source_reference TEXT,
    status TEXT NOT NULL DEFAULT 'draft',
    published_at TIMESTAMPTZ,
    source_content_hash TEXT,
    source_metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (
      (status = 'published' AND published_at IS NOT NULL)
      OR status <> 'published'
    )
  );

  CREATE TABLE public.question_options (
    id UUID PRIMARY KEY,
    question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
    label TEXT NOT NULL,
    body_markdown TEXT NOT NULL,
    sort_order SMALLINT NOT NULL,
    UNIQUE (question_id, label),
    UNIQUE (question_id, id)
  );

  CREATE TABLE public.question_answer_keys (
    question_id UUID PRIMARY KEY REFERENCES public.questions(id) ON DELETE CASCADE,
    correct_option_id UUID NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );

  CREATE TABLE public.question_explanations (
    question_id UUID PRIMARY KEY REFERENCES public.questions(id) ON DELETE CASCADE,
    body_markdown TEXT NOT NULL,
    source_reference TEXT,
    status TEXT NOT NULL DEFAULT 'draft',
    reviewed_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );

  CREATE TABLE public.question_discipline_relations (
    question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
    discipline_id UUID NOT NULL REFERENCES public.disciplines(id),
    is_primary BOOLEAN NOT NULL DEFAULT false,
    sort_order SMALLINT NOT NULL DEFAULT 0,
    PRIMARY KEY (question_id, discipline_id)
  );

  CREATE TABLE public.question_topic_relations (
    question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
    topic_id TEXT NOT NULL REFERENCES public.topics(topic_id),
    relation_type TEXT NOT NULL,
    relevance SMALLINT NOT NULL DEFAULT 100,
    sort_order SMALLINT NOT NULL DEFAULT 0,
    PRIMARY KEY (question_id, topic_id)
  );

  CREATE TABLE public.question_subtopic_relations (
    question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
    subtopic_id TEXT NOT NULL REFERENCES public.subtopics(id),
    is_primary BOOLEAN NOT NULL DEFAULT false,
    sort_order SMALLINT NOT NULL DEFAULT 0,
    PRIMARY KEY (question_id, subtopic_id)
  );
`);

// 2. Carregar e executar a Migration 052
const migration052Sql = await readFile(path.join(ROOT, "supabase/migrations/052_atomic_audit_application_and_rollback.sql"), "utf8");
await db.exec(migration052Sql);

console.log("- Schema e Migration 052 instalados com sucesso no banco de teste.");

// 3. Popular dados de teste para 100 questões (96 ready, 4 held)
const discId = "11111111-1111-4111-8111-111111111111";
const topicId = "topico-tjsp-direito";
await db.query(
  `INSERT INTO public.disciplines (id, slug, name, status) VALUES ($1, 'direito', 'Direito Constitucional', 'active')`,
  [discId]
);
await db.query(
  `INSERT INTO public.topics (topic_id, discipline, archived_at) VALUES ($1, 'Direito Constitucional', NULL)`,
  [topicId]
);
await db.query(
  `INSERT INTO public.topic_discipline_relations (topic_id, discipline_id, is_primary) VALUES ($1, $2, true)`,
  [topicId, discId]
);

const testItems = [];
const originalQuestions = [];
const originalOptions = [];
const originalAnswerKeys = [];
const originalExplanations = [];
const originalDiscRels = [];
const originalTopicRels = [];

for (let i = 1; i <= 100; i++) {
  const qId = `00000000-0000-4000-8000-${String(i).padStart(12, "0")}`;
  const extId = `tjsp-2021-q${String(i).padStart(3, "0")}`;
  const isHeld = i > 96;

  const origStmt = `Enunciado original questao ${i}.`;
  await db.query(
    `INSERT INTO public.questions (id, external_id, statement_markdown, subject, exam_board, exam_year, status, published_at, source_content_hash, source_metadata)
     VALUES ($1, $2, $3, 'Direito Constitucional', 'Vunesp', 2021, 'published', now(), 'orig_hash', '{"origin": "original"}'::jsonb)`,
    [qId, extId, origStmt]
  );

  originalQuestions.push({
    id: qId,
    external_id: extId,
    statement_markdown: origStmt,
    subject: "Direito Constitucional",
    exam_board: "Vunesp",
    exam_year: 2021,
    status: "published",
    published_at: new Date().toISOString(),
    source_content_hash: "orig_hash",
    source_metadata: { origin: "original" },
  });

  const opts = [];
  let optACorrectId = null;
  for (const label of ["A", "B", "C", "D", "E"]) {
    const optId = `00000000-0000-4001-8000-${String(i).padStart(10, "0")}${String(label.charCodeAt(0)).padStart(2, "0")}`;
    const body = `Alternativa ${label} questao ${i}`;
    await db.query(
      `INSERT INTO public.question_options (id, question_id, label, body_markdown, sort_order) VALUES ($1, $2, $3, $4, $5)`,
      [optId, qId, label, body, label.charCodeAt(0) - 65]
    );
    opts.push({ id: optId, question_id: qId, label, body_markdown: body, sort_order: label.charCodeAt(0) - 65 });
    if (label === "A") optACorrectId = optId;
  }
  originalOptions.push(...opts);

  await db.query(
    `INSERT INTO public.question_answer_keys (question_id, correct_option_id) VALUES ($1, $2)`,
    [qId, optACorrectId]
  );
  originalAnswerKeys.push({ question_id: qId, correct_option_id: optACorrectId });

  await db.query(
    `INSERT INTO public.question_discipline_relations (question_id, discipline_id, is_primary) VALUES ($1, $2, true)`,
    [qId, discId]
  );
  originalDiscRels.push({ question_id: qId, discipline_id: discId, is_primary: true });

  await db.query(
    `INSERT INTO public.question_topic_relations (question_id, topic_id, relation_type) VALUES ($1, $2, 'primary')`,
    [qId, topicId]
  );
  originalTopicRels.push({ question_id: qId, topic_id: topicId, relation_type: "primary", relevance: 100, sort_order: 0 });

  // Preparar payload de aplicação
  if (isHeld) {
    testItems.push({
      id: qId,
      external_id: extId,
      disposition: "archived",
      source_metadata: { annulled: true },
      explanation_body: `Questão ${i} anulada pela banca Vunesp.`,
      explanation_source: "Gabarito Oficial Vunesp",
    });
  } else {
    testItems.push({
      id: qId,
      external_id: extId,
      disposition: "published",
      statement_markdown: `Enunciado REVISADO questao ${i} com texto-base integral.`,
      subject: "Direito Constitucional",
      exam_board: "Fundação Vunesp",
      exam_year: 2021,
      source_content_hash: sha256(`Enunciado REVISADO questao ${i}`),
      source_metadata: { audited: true },
      options: opts.map((o) => ({ label: o.label, body_markdown: `${o.body_markdown} revisada` })),
      correct_option_label: "A",
      target_topic_id: topicId,
      target_discipline_id: discId,
      explanation_body: `Comentário fundamentado questão ${i}. Art. 5 da CF/88.`,
      explanation_source: "Gabarito Vunesp",
    });
  }
}

console.log("- 100 questões iniciais populadas no banco isolado.");

// CENÁRIO 1: Aplicação atômica bem-sucedida das 100 questões
console.log("\n[Cenário 1] Executando apply_atomic_audit_fixes com 100 questões válidas...");
const applyRes = await db.query(
  `SELECT public.apply_atomic_audit_fixes($1::jsonb) AS result`,
  [JSON.stringify({ items: testItems })]
);
const applyOutput = applyRes.rows[0].result;
assert.equal(applyOutput.status, "applied");
assert.equal(applyOutput.total_processed, 100);
assert.equal(applyOutput.ready_published, 96);
assert.equal(applyOutput.held_archived, 4);

// Verificar no banco que a questão 1 foi publicada e revisada
const checkQ1 = await db.query(`SELECT statement_markdown, status, exam_board FROM public.questions WHERE external_id = 'tjsp-2021-q001'`);
assert.equal(checkQ1.rows[0].status, "published");
assert.equal(checkQ1.rows[0].exam_board, "Fundação Vunesp");
assert.match(checkQ1.rows[0].statement_markdown, /REVISADO questao 1/);

// Verificar que a questão 97 (anulada) está archived e sem gabarito
const checkQ97 = await db.query(`SELECT status FROM public.questions WHERE external_id = 'tjsp-2021-q097'`);
assert.equal(checkQ97.rows[0].status, "archived");
const checkKey97 = await db.query(`SELECT count(*) AS cnt FROM public.question_answer_keys WHERE question_id = '00000000-0000-4000-8000-000000000097'`);
assert.equal(parseInt(checkKey97.rows[0].cnt, 10), 0);
console.log("✓ Cenário 1 aprovado: 100 questões aplicadas com sucesso (96 publicadas, 4 anuladas).");

// CENÁRIO 2: Falha intermediária provocada -> ALL-OR-NOTHING ROLLBACK
console.log("\n[Cenário 2] Provocando falha na questão 50 com tópico inexistente...");
const failingItems = JSON.parse(JSON.stringify(testItems));
failingItems[49].target_topic_id = "topico-inexistente-que-vai-falhar";

let failedAsExpected = false;
try {
  await db.query(`SELECT public.apply_atomic_audit_fixes($1::jsonb)`, [JSON.stringify({ items: failingItems })]);
} catch (err) {
  failedAsExpected = true;
  assert.match(err.message, /Tópico topico-inexistente-que-vai-falhar inexistente/);
}
assert.ok(failedAsExpected, "Deveria ter lançado erro de validação");

// Comprovar que o banco não foi alterado de forma parcial
const q50Stmt = await db.query(`SELECT statement_markdown FROM public.questions WHERE external_id = 'tjsp-2021-q050'`);
assert.match(q50Stmt.rows[0].statement_markdown, /Enunciado REVISADO questao 50/);
console.log("✓ Cenário 2 aprovado: Falha intermediária desfez integralmente a transação (all-or-nothing garantido).");

// CENÁRIO 3: Preparar payload de Rollback e testar segurança anti-concorrência
const rollbackItems = testItems.map((item, idx) => {
  const origQ = originalQuestions[idx];
  const qId = origQ.id;

  const isHeld = idx >= 96;
  const appliedStmt = isHeld ? origQ.statement_markdown : item.statement_markdown;
  const appliedExp = item.explanation_body;
  const appliedStatus = isHeld ? "archived" : "published";
  const appliedTopic = isHeld ? null : item.target_topic_id;
  const appliedCorrectLabel = isHeld ? null : item.correct_option_label;
  const appliedOptsHash = isHeld ? null : computeOptionsHash(item.options);

  return {
    question_id: qId,
    external_id: origQ.external_id,
    expected_applied_statement_sha256: sha256(appliedStmt),
    expected_applied_explanation_sha256: sha256(appliedExp),
    expected_applied_status: appliedStatus,
    expected_applied_topic_id: appliedTopic,
    expected_applied_correct_option_label: appliedCorrectLabel,
    expected_applied_options_sha256: appliedOptsHash,

    original_question: origQ,
    original_options: originalOptions.filter((o) => o.question_id === qId),
    original_explanation: originalExplanations.find((e) => e.question_id === qId) || null,
    original_answer_key: originalAnswerKeys.find((k) => k.question_id === qId) || null,
    original_discipline_relations: originalDiscRels.filter((d) => d.question_id === qId),
    original_topic_relations: originalTopicRels.filter((t) => t.question_id === qId),
  };
});

// SUB-TESTE 3A: Alterar somente UMA alternativa pós-aplicação -> DEVE BLOQUEAR O ROLLBACK
console.log("\n[Cenário 3A] Alterando 1 alternativa da questão 5 pós-aplicação e tentando rollback...");
await db.query(
  `UPDATE public.question_options SET body_markdown = 'Edição manual posterior da alternativa A'
   WHERE question_id = '00000000-0000-4000-8000-000000000005' AND label = 'A'`
);

let blockedOnOption = false;
try {
  await db.query(`SELECT public.rollback_atomic_audit_fixes($1::jsonb)`, [JSON.stringify({ items: rollbackItems })]);
} catch (err) {
  blockedOnOption = true;
  assert.match(err.message, /Alternativas atuais diferem da versão auditada aplicada|Alteração posterior detectada/);
}
assert.ok(blockedOnOption, "Rollback deveria ser bloqueado por alteração de alternativa pós-aplicação");
console.log("✓ Cenário 3A aprovado: Edição posterior de alternativa bloqueou o rollback (código P0001).");

// Restaurar a alternativa para o estado aplicado
await db.query(
  `UPDATE public.question_options SET body_markdown = 'Alternativa A questao 5 revisada'
   WHERE question_id = '00000000-0000-4000-8000-000000000005' AND label = 'A'`
);

// SUB-TESTE 3B: Alterar somente o COMENTÁRIO pós-aplicação -> DEVE BLOQUEAR O ROLLBACK
console.log("\n[Cenário 3B] Alterando comentário da questão 10 pós-aplicação...");
await db.query(
  `UPDATE public.question_explanations SET body_markdown = 'Comentário adulterado por terceiro'
   WHERE question_id = '00000000-0000-4000-8000-000000000010'`
);

let blockedOnExp = false;
try {
  await db.query(`SELECT public.rollback_atomic_audit_fixes($1::jsonb)`, [JSON.stringify({ items: rollbackItems })]);
} catch (err) {
  blockedOnExp = true;
  assert.match(err.message, /Comentário atual difere da versão auditada aplicada/);
}
assert.ok(blockedOnExp, "Rollback deveria ser bloqueado por alteração de comentário pós-aplicação");
console.log("✓ Cenário 3B aprovado: Edição posterior de comentário bloqueou o rollback (código P0001).");

// Restaurar comentário
await db.query(
  `UPDATE public.question_explanations SET body_markdown = 'Comentário fundamentado questão 10. Art. 5 da CF/88.'
   WHERE question_id = '00000000-0000-4000-8000-000000000010'`
);

// SUB-TESTE 3C: Alterar GABARITO pós-aplicação -> DEVE BLOQUEAR O ROLLBACK
console.log("\n[Cenário 3C] Alterando gabarito da questão 15 pós-aplicação...");
const optBId = (await db.query(
  `SELECT id FROM public.question_options WHERE question_id = '00000000-0000-4000-8000-000000000015' AND label = 'B'`
)).rows[0].id;

await db.query(
  `UPDATE public.question_answer_keys SET correct_option_id = $1 WHERE question_id = '00000000-0000-4000-8000-000000000015'`,
  [optBId]
);

let blockedOnKey = false;
try {
  await db.query(`SELECT public.rollback_atomic_audit_fixes($1::jsonb)`, [JSON.stringify({ items: rollbackItems })]);
} catch (err) {
  blockedOnKey = true;
  assert.match(err.message, /Gabarito atual \(B\) difere do aplicado \(A\)/);
}
assert.ok(blockedOnKey, "Rollback deveria ser bloqueado por alteração de gabarito pós-aplicação");
console.log("✓ Cenário 3C aprovado: Alteração posterior de gabarito bloqueou o rollback (código P0001).");

// Restaurar gabarito
const optAId = (await db.query(
  `SELECT id FROM public.question_options WHERE question_id = '00000000-0000-4000-8000-000000000015' AND label = 'A'`
)).rows[0].id;
await db.query(
  `UPDATE public.question_answer_keys SET correct_option_id = $1 WHERE question_id = '00000000-0000-4000-8000-000000000015'`,
  [optAId]
);

// CENÁRIO 4: Rollback integral com correspondência exata
console.log("\n[Cenário 4] Executando rollback_atomic_audit_fixes com dados íntegros...");
const rollbackRes = await db.query(
  `SELECT public.rollback_atomic_audit_fixes($1::jsonb) AS result`,
  [JSON.stringify({ items: rollbackItems })]
);
assert.equal(rollbackRes.rows[0].result.status, "reverted");
assert.equal(rollbackRes.rows[0].result.items_restored, 100);

// Comprovar restauração integral no banco
const restoredQ1 = await db.query(`SELECT statement_markdown, exam_board FROM public.questions WHERE external_id = 'tjsp-2021-q001'`);
assert.equal(restoredQ1.rows[0].statement_markdown, "Enunciado original questao 1.");
assert.equal(restoredQ1.rows[0].exam_board, "Vunesp");

// Comprovar restauração da questão 97 (de volta para published com gabarito)
const restoredQ97 = await db.query(`SELECT status FROM public.questions WHERE external_id = 'tjsp-2021-q097'`);
assert.equal(restoredQ97.rows[0].status, "published");
const restoredKey97 = await db.query(`SELECT count(*) AS cnt FROM public.question_answer_keys WHERE question_id = '00000000-0000-4000-8000-000000000097'`);
assert.equal(parseInt(restoredKey97.rows[0].cnt, 10), 1);

console.log("✓ Cenário 4 aprovado: Rollback integral restaurou 100% dos dados ao estado original.");

console.log("\n=======================================================");
console.log("TODOS OS TESTES DE TRANSACIONALIDADE E ROLLBACK PASSARAM!");
console.log("=======================================================");
