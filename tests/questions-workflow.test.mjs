import assert from "node:assert/strict";
import test from "node:test";
import { composeStatement, gateBatch } from "../scripts/questions-workflow/gate.mjs";
import { sha256, stableStringify } from "../scripts/lib/question-import-contract.mjs";

function fixture() {
  const parts = { title: null, context: null, source: null, introduction: null, command: "Julgue o item.", assertion: "Afirmação de teste." };
  const question = {
    external_id: "exam:identity:001", source_id: "identity:001", question_type: "true_false",
    statement_markdown: composeStatement(parts, "true_false"), subject: "Tema", exam_board: "Banca", institution: "Órgão", position_name: "Cargo", exam_year: 2026,
    difficulty: null, source_reference: "Prova de teste", source_metadata: { statement_parts: parts, editorial_record_id: "exam:identity:001", answer_status: "definitivo" },
    topics: [{ topic_id: "tema", relation_type: "primary", relevance: 100, sort_order: 0 }],
    options: [{ label: "C", body_markdown: "Certo", sort_order: 0 }, { label: "E", body_markdown: "Errado", sort_order: 1 }],
    correct_option_label: "C", explanation: { body_markdown: "Comentário para teste de integridade.", source_reference: null },
  };
  question.source_content_hash = sha256(stableStringify(question));
  const sourceBytes = Buffer.from(JSON.stringify({ questions: [question] }));
  const record = {
    external_id: question.external_id, artifact_sha256: question.source_content_hash, disposition: "ready",
    origin: { exam_id: "exam-2026", exam_code: "001", booklet: "A", item_number: 1, exam_sha256: "a".repeat(64), page: 2 },
    answer: { exam_id: "exam-2026", exam_code: "001", booklet: "A", item_number: 1, answer_sha256: "b".repeat(64), page: 1, label: "C", status: "definitivo" },
    taxonomy: { concept_key: "pro:disciplina:tema", subtopic_key: null, discipline_slug: "disciplina", topic_id: "tema" },
    explanation_author: "writer-run-1",
    reviews: ["extraction", "answer_pairing", "taxonomy", "explanation"].map((stage) => ({ stage, verdict: "pass", artifact_sha256: question.source_content_hash,
      reviewer: { kind: "ai", id: `reviewer-${stage}-run-2` }, evidence: ["evidência de teste"] })),
  };
  return {
    batch: { schema_version: "pro-questions/v1", batch_key: "test-001", source: { file_name: "TESTE_ATUALIZADO.json", sha256: sha256(sourceBytes), metadata: {} }, discipline: { slug: "disciplina", name: "Disciplina" }, questions: [question] },
    catalog: { schema_version: "pro-questions/catalog-snapshot/v1", captured_at: "2026-10-30T12:00:00Z", disciplines: [{ id: "d1", slug: "disciplina", name: "Disciplina", status: "active" }], topics: [{ topic_id: "tema", archived_at: null }], topic_discipline_relations: [{ topic_id: "tema", discipline_id: "d1" }], questions: [], question_options: [] },
    ledger: { schema_version: "pro-questions/editorial-manifest/v1", questions: [record] }, intake: { schema_version: "pro-questions/intake-v1", files: [{ sha256: "a".repeat(64), pages: 10 }, { sha256: "b".repeat(64), pages: 1 }] }, sourceBytes,
    now: Date.parse("2026-10-30T13:00:00Z"),
  };
}

test("aceita evidências coerentes sem executar publicação", () => {
  const result = gateBatch(fixture());
  assert.equal(result.ok, true);
  assert.equal(result.publication_executed, false);
});

for (const [description, mutate, code] of [
  ["gabarito de outro caderno", (f) => { f.ledger.questions[0].answer.booklet = "B"; }, "answer_pairing_not_proven"],
  ["gabarito preliminar", (f) => { f.ledger.questions[0].answer.status = "preliminar"; }, "answer_not_definitive"],
  ["página fora do PDF", (f) => { f.ledger.questions[0].answer.page = 2; }, "source_evidence_missing_or_page_invalid"],
  ["disciplina nova ainda não cadastrada", (f) => { f.catalog.disciplines = []; }, "discipline_missing_inactive_or_renamed"],
  ["tópico sem relação com a disciplina", (f) => { f.catalog.topic_discipline_relations = []; }, "topic_discipline_mismatch"],
  ["catálogo antigo", (f) => { f.catalog.captured_at = "2026-10-28T12:00:00Z"; }, "catalog_missing_or_stale"],
  ["comentário modificado após revisão", (f) => { f.batch.questions[0].explanation.body_markdown = "Outro comentário"; }, "item_hash_mismatch"],
  ["revisão obsoleta", (f) => { f.ledger.questions[0].reviews[0].artifact_sha256 = "c".repeat(64); }, "review_extraction_missing_or_stale"],
  ["autor aprova o próprio comentário", (f) => { f.ledger.questions[0].reviews[3].reviewer.id = f.ledger.questions[0].explanation_author; }, "explanation_review_not_independent"],
  ["fonte alterada", (f) => { f.sourceBytes = Buffer.from("outros bytes"); }, "source_hash_mismatch"],
  ["fonte sem a questão publicada", (f) => { f.sourceBytes = Buffer.from('{"questions":[]}'); f.batch.source.sha256 = sha256(f.sourceBytes); }, "source_question_mismatch"],
  ["identidade existente com conteúdo diferente", (f) => { f.catalog.questions = [{ ...f.batch.questions[0], id: "q1", source_content_hash: "d".repeat(64) }]; }, "existing_identity_changed"],
  ["duplicata editorial", (f) => { f.ledger.questions.push(structuredClone(f.ledger.questions[0])); }, "duplicate_editorial_record"],
  ["HTML ativo", (f) => { f.batch.questions[0].explanation.body_markdown = '<img src="x" onerror="alert(1)">'; }, "unsafe_markup_or_local_resource"],
  ["imagem local", (f) => { f.batch.questions[0].explanation.body_markdown = "![figura](C:/privado/img.png)"; }, "unsafe_markup_or_local_resource"],
  ["trecho ilegível", (f) => { f.batch.questions[0].statement_markdown = "Texto [ilegível]."; }, "incomplete_transcription"],
]) {
  test(`retém ${description}`, () => {
    const data = fixture(); mutate(data);
    const result = gateBatch(data);
    assert.equal(result.ok, false);
    assert.ok(result.failures.some((failure) => failure.code === code), JSON.stringify(result.failures));
  });
}

test("recusa disciplina composta", () => {
  const data = fixture();
  data.batch.discipline.slug = "raciocinio-logico-matematica-estatistica";
  assert.ok(gateBatch(data).failures.some((failure) => failure.code === "combined_discipline_forbidden"));
});

test("identifica duplicata com outro ID apesar de espaços/capitalização", () => {
  const data = fixture();
  const question = data.batch.questions[0];
  data.catalog.questions = [{ ...question, id: "q2", external_id: "old:identity", statement_markdown: question.statement_markdown.toUpperCase().replaceAll(" ", "  ") }];
  data.catalog.question_options = question.options.map((option) => ({ ...option, question_id: "q2" }));
  assert.ok(gateBatch(data).failures.some((failure) => failure.code === "possible_duplicate_requires_reconciliation"));
});

test("mantém alternativas fora do enunciado e não cria blocos ausentes", () => {
  assert.equal(composeStatement({ command: "Escolha a alternativa." }, "multiple_choice"), "## Enunciado\n\nEscolha a alternativa.");
  assert.throws(() => composeStatement({ assertion: "Não permitido" }, "multiple_choice"));
  assert.throws(() => composeStatement({ context: "Apenas texto-base" }, "true_false"));
});
