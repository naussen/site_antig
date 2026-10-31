import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import { questionImportBatchSchema, questionImportItemSchema, sha256, stableStringify } from "../lib/question-import-contract.mjs";

const stages = ["extraction", "answer_pairing", "taxonomy", "explanation"];
const combinedDiscipline = /raciocinio.*matematica|matematica.*estatistica/u;
const normalized = (value) => value.normalize("NFC").toLocaleLowerCase("pt-BR").replace(/\s+/gu, " ").trim();
const contentSignature = (question) => stableStringify({
  statement: normalized(question.statement_markdown),
  options: question.options.map((option) => ({ label: option.label, body: normalized(option.body_markdown) })).sort((a, b) => a.label.localeCompare(b.label)),
});

export function composeStatement(parts, questionType) {
  const paragraphs = [];
  if (parts.title) paragraphs.push(parts.title.trim());
  if (parts.context) paragraphs.push(`## Texto-base\n\n${parts.context.trim()}`);
  if (parts.source) paragraphs.push(`## Fonte\n\n${parts.source.trim()}`);
  const command = [parts.introduction, parts.command].filter(Boolean).map((value) => value.trim()).join("\n\n");
  if (command) paragraphs.push(`## Enunciado\n\n${command}`);
  if (parts.assertion) {
    if (questionType !== "true_false") throw new Error("Múltipla escolha usa options, não assertiva separada.");
    paragraphs.push(`## Assertiva\n\n${parts.assertion.trim()}`);
  }
  if (!command && !parts.assertion) throw new Error("Falta comando/enunciado ou assertiva.");
  return paragraphs.join("\n\n");
}

export function gateBatch({ batch: rawBatch, catalog, ledger, intake, sourceBytes, now = Date.now(), allowUnverified = false }) {
  const batch = questionImportBatchSchema.parse(rawBatch);
  const failures = [];
  const fail = (id, code) => failures.push({ external_id: id, code });
  if (catalog.schema_version !== "pro-questions/catalog-snapshot/v1"
    || intake.schema_version !== "pro-questions/intake-v1"
    || ledger.schema_version !== "pro-questions/editorial-manifest/v1") fail(null, "evidence_schema_mismatch");
  const age = now - Date.parse(catalog.captured_at);
  if (!Number.isFinite(age) || age < -60_000 || age > 24 * 60 * 60 * 1000) fail(null, "catalog_missing_or_stale");
  if (sha256(sourceBytes) !== batch.source.sha256) fail(null, "source_hash_mismatch");
  let sourceQuestions = [];
  try {
    const document = JSON.parse(sourceBytes.toString("utf8"));
    sourceQuestions = Array.isArray(document) ? document : document.questions;
    if (!Array.isArray(sourceQuestions)) throw new Error("Fonte sem questões.");
  } catch { fail(null, "source_json_invalid"); sourceQuestions = []; }
  const discipline = catalog.disciplines.find((row) => row.slug === batch.discipline.slug);
  if (!discipline || discipline.status !== "active" || discipline.name !== batch.discipline.name) fail(null, "discipline_missing_inactive_or_renamed");
  if (combinedDiscipline.test(batch.discipline.slug)) fail(null, "combined_discipline_forbidden");
  const records = new Map();
  for (const record of ledger.questions) {
    if (records.has(record.external_id)) fail(record.external_id, "duplicate_editorial_record");
    records.set(record.external_id, record);
  }
  const sourceFiles = new Map(intake.files.map((file) => [file.sha256, file]));
  const existing = new Map(catalog.questions.map((row) => [row.external_id, row]));
  const existingOptions = new Map();
  for (const option of catalog.question_options) {
    const group = existingOptions.get(option.question_id) ?? [];
    group.push(option);
    existingOptions.set(option.question_id, group);
  }
  const signatures = new Map(catalog.questions.map((row) => [contentSignature({ ...row, options: existingOptions.get(row.id) ?? [] }), row.external_id]));
  for (const question of batch.questions) {
    const id = question.external_id;
    const sourceMatches = sourceQuestions.filter((row) => row?.external_id === id);
    const sourceMatch = sourceMatches.length === 1 ? questionImportItemSchema.safeParse(sourceMatches[0]) : null;
    if (!sourceMatch?.success || stableStringify(sourceMatch.data) !== stableStringify(question)) fail(id, "source_question_mismatch");
    const { source_content_hash: hash, ...withoutHash } = question;
    if (hash !== sha256(stableStringify(withoutHash))) fail(id, "item_hash_mismatch");
    if (existing.has(id) && existing.get(id).source_content_hash !== hash) fail(id, "existing_identity_changed");
    const signature = contentSignature(question);
    const duplicate = signatures.get(signature);
    if (duplicate && duplicate !== id) fail(id, "possible_duplicate_requires_reconciliation");
    signatures.set(signature, id);
    const text = [question.statement_markdown, question.explanation.body_markdown, ...question.options.map((row) => row.body_markdown)].join("\n");
    if (/<\/?[a-z][a-z0-9-]*(?:\s[^>]*|\/?)>/iu.test(text)
      || /\b(?:javascript|vbscript|file):|data:(?:image|text|application|audio|video|[;,])|[a-z]:[\\/]/iu.test(text)) fail(id, "unsafe_markup_or_local_resource");
    if (/\[ileg[ií]vel\]|\(cid:\d+\)|\ufffd/iu.test(text)) fail(id, "incomplete_transcription");
    for (const relation of question.topics) {
      const topic = catalog.topics.find((row) => row.topic_id === relation.topic_id);
      if (!topic || topic.archived_at) fail(id, "topic_missing_or_archived");
      if (!catalog.topic_discipline_relations.some((row) => row.topic_id === relation.topic_id && row.discipline_id === discipline?.id)) fail(id, "topic_discipline_mismatch");
    }
    const record = records.get(id);
    if (!record) { fail(id, "editorial_record_missing"); continue; }
    if (record.artifact_sha256 !== hash || record.disposition !== "ready") fail(id, "editorial_record_not_ready_or_stale");
    const origin = record.origin ?? {};
    const answer = record.answer ?? {};
    if (!origin.exam_id || !origin.exam_code || !origin.booklet || !Number.isInteger(origin.item_number) || origin.item_number < 1) fail(id, "origin_identity_incomplete");
    for (const [side, field] of [[origin, "exam_sha256"], [answer, "answer_sha256"]]) {
      const file = sourceFiles.get(side[field]);
      if (!file || !Number.isInteger(side.page) || side.page < 1 || side.page > file.pages || file.error) fail(id, "source_evidence_missing_or_page_invalid");
    }
    if (!["definitivo", "definitivo_alterado"].includes(answer.status) && !allowUnverified) fail(id, "answer_not_definitive");
    if (["exam_id", "exam_code", "booklet", "item_number"].some((field) => !origin[field] || origin[field] !== answer[field])) fail(id, "answer_pairing_not_proven");
    if (answer.label !== question.correct_option_label) fail(id, "answer_label_mismatch");
    const metadata = question.source_metadata;
    if (metadata.editorial_record_id !== id || metadata.answer_status !== answer.status) fail(id, "editorial_metadata_mismatch");
    if (answer.status === "definitivo_alterado" && (!answer.previous_label || answer.previous_label === answer.label || !answer.change_evidence)) fail(id, "answer_history_missing");
    if (metadata.statement_parts) {
      try {
        if (composeStatement(metadata.statement_parts, question.question_type) !== question.statement_markdown) fail(id, "statement_parts_mismatch");
      } catch { fail(id, "statement_parts_invalid"); }
    } else fail(id, "statement_parts_missing");
    for (const stage of stages) {
      const reviews = (record.reviews ?? []).filter((row) => row.stage === stage);
      const review = reviews[0];
      if (reviews.length !== 1 || review.verdict !== "pass" || review.artifact_sha256 !== hash
        || !["ai", "human"].includes(review.reviewer?.kind) || !review.reviewer?.id
        || !Array.isArray(review.evidence) || !review.evidence.length) fail(id, `review_${stage}_missing_or_stale`);
    }
    const explanationReview = (record.reviews ?? []).find((row) => row.stage === "explanation");
    if (!record.explanation_author || explanationReview?.reviewer?.id === record.explanation_author) fail(id, "explanation_review_not_independent");
    if (!record.taxonomy?.concept_key || !Object.hasOwn(record.taxonomy, "subtopic_key")) fail(id, "taxonomy_identity_missing");
    if (record.taxonomy?.discipline_slug !== batch.discipline.slug
      || record.taxonomy?.topic_id !== question.topics.find((row) => row.relation_type === "primary")?.topic_id) fail(id, "editorial_taxonomy_mismatch");
  }
  return { ok: failures.length === 0, batch_key: batch.batch_key, checked_batch_sha256: sha256(stableStringify(batch)), questions: batch.questions.length,
    failures, publication_executed: false,
    limitation: "Gate técnico: atesta consistência de evidências declaradas, não a veracidade de uma revisão de IA." };
}

async function main() {
  const options = Object.fromEntries(["batch", "catalog", "ledger", "intake", "source", "output"].map((name) => [name, { type: "string" }]));
  options["allow-unverified"] = { type: "boolean" };
  const { values } = parseArgs({ options: { ...options, help: { type: "boolean" } } });
  if (values.help) {
    console.log("Uso: node scripts/questions-workflow/gate.mjs --batch lote.json --catalog catalog.json --ledger manifesto.json --intake intake.json --source PROVA_ATUALIZADO.json --output gate.json [--allow-unverified]");
    return;
  }
  for (const field of ["batch", "catalog", "ledger", "intake", "source", "output"]) if (!values[field]) throw new Error(`Informe --${field}.`);
  const read = async (field) => JSON.parse(await readFile(resolve(values[field]), "utf8"));
  const [batch, catalog, ledger, intake, sourceBytes] = await Promise.all([read("batch"), read("catalog"), read("ledger"), read("intake"), readFile(resolve(values.source))]);
  const result = gateBatch({ batch, catalog, ledger, intake, sourceBytes, allowUnverified: Boolean(values["allow-unverified"]) });
  await writeFile(resolve(values.output), `${JSON.stringify(result, null, 2)}\n`, { flag: "wx" });
  console.log(JSON.stringify(result));
  if (!result.ok) process.exitCode = 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch(() => { console.error("Gate interrompido: entrada inválida ou saída existente; nenhuma publicação executada."); process.exitCode = 1; });
}
