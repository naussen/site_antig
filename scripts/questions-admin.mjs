import { basename, resolve } from "node:path";
import { readFile, writeFile } from "node:fs/promises";
import { parseArgs } from "node:util";

import { createClient } from "@supabase/supabase-js";

import {
  buildQuestionBatch,
  questionImportBatchSchema,
  selectImportableQuestions,
} from "./lib/question-import-contract.mjs";

function usage() {
  console.log(`Uso:
  npm run questions:admin -- prepare --source <ATUALIZADO.json> --mapping <mapa.json> --output <lote.json> [--ids id1,id2]
  npm run questions:admin -- prepare --source <ATUALIZADO.json> --mapping <mapa.json> --output <lote.json> --limit 100 [--balanced] [--exclude-file <lote-anterior.json>]
  npm run questions:admin -- validate --file <lote.json>
  npm run questions:admin -- import --file <lote.json> [--apply --confirm <batch_key>]
  npm run questions:admin -- verify --file <lote.json>`);
}

function required(value, name) {
  if (!value) throw new Error(`Informe ${name}.`);
  return value;
}

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

function parseLimit(value) {
  if (value === undefined) return null;
  const limit = Number(value);
  if (!Number.isInteger(limit) || limit < 1 || limit > 1_000) {
    throw new Error("--limit deve ser um inteiro entre 1 e 1000.");
  }
  return limit;
}

async function readExcludedSourceIds(path) {
  if (!path) return new Set();
  const previousBatch = questionImportBatchSchema.parse(await readJson(resolve(path)));
  return new Set(previousBatch.questions.map((question) => question.source_id));
}

function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error("Ambiente Supabase administrativo indisponível.");
  }

  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function printSummary(batch, extra = {}) {
  const multipleChoice = batch.questions.filter((question) => question.question_type === "multiple_choice").length;
  const trueFalse = batch.questions.length - multipleChoice;
  console.log(JSON.stringify({
    valid: true,
    schema_version: batch.schema_version,
    batch_key: batch.batch_key,
    source_file: batch.source.file_name,
    discipline: batch.discipline.slug,
    questions: batch.questions.length,
    multiple_choice: multipleChoice,
    true_false: trueFalse,
    topics: [...new Set(batch.questions.flatMap((question) => question.topics.map((topic) => topic.topic_id)))].length,
    ...extra,
  }, null, 2));
}

async function prepare(values) {
  const sourcePath = resolve(required(values.source, "--source"));
  const mappingPath = resolve(required(values.mapping, "--mapping"));
  const outputPath = resolve(required(values.output, "--output"));
  const sourceFile = basename(sourcePath);
  if (!/_ATUALIZADO\.json$/iu.test(sourceFile)) {
    throw new Error("Somente arquivos com _ATUALIZADO no nome podem ser preparados.");
  }

  const [rawText, mapping] = await Promise.all([
    readFile(sourcePath, "utf8"),
    readJson(mappingPath),
  ]);
  const rawQuestions = JSON.parse(rawText);
  let selectedIds = values.ids
    ? values.ids.split(",").map((value) => value.trim()).filter(Boolean)
    : [];
  const limit = parseLimit(values.limit);
  let selectionSummary = null;

  if (selectedIds.length && limit !== null) {
    throw new Error("Use --ids ou --limit, nunca ambos.");
  }
  if (values.balanced && limit === null) {
    throw new Error("--balanced exige --limit.");
  }
  if (values["exclude-file"] && limit === null) {
    throw new Error("--exclude-file exige --limit.");
  }
  if (limit !== null) {
    const excludedSourceIds = await readExcludedSourceIds(values["exclude-file"]);
    const selection = selectImportableQuestions({
      rawQuestions,
      mapping,
      limit,
      excludedSourceIds,
      balanced: values.balanced,
    });
    selectedIds = selection.selected.map((question) => question.id_alfanumerico);
    selectionSummary = {
      strategy: values.balanced ? "balanced_limit" : "limit",
      requested: limit,
      candidates: selection.candidateCount,
      excluded: excludedSourceIds.size,
      rejected: selection.rejected.length,
    };
  }
  const batch = buildQuestionBatch({ rawText, sourceFile, rawQuestions, mapping, selectedIds });
  if (selectionSummary) {
    batch.source.metadata.selection = selectionSummary.strategy;
    batch.source.metadata.selection_limit = selectionSummary.requested;
    batch.source.metadata.selection_candidates = selectionSummary.candidates;
    batch.source.metadata.selection_excluded = selectionSummary.excluded;
    batch.source.metadata.selection_rejected = selectionSummary.rejected;
    questionImportBatchSchema.parse(batch);
  }

  await writeFile(outputPath, `${JSON.stringify(batch, null, 2)}\n`, "utf8");
  printSummary(batch, { output: outputPath, selection: selectionSummary });
}

async function validate(values) {
  const filePath = resolve(required(values.file, "--file"));
  const batch = questionImportBatchSchema.parse(await readJson(filePath));
  printSummary(batch, { file: filePath });
}

async function importBatch(values) {
  const filePath = resolve(required(values.file, "--file"));
  const batch = questionImportBatchSchema.parse(await readJson(filePath));
  if (!values.apply) {
    printSummary(batch, {
      mode: "dry-run",
      next: `Repita com --apply --confirm ${batch.batch_key}`,
    });
    return;
  }
  if (values.confirm !== batch.batch_key) {
    throw new Error(`Confirmação inválida. Use --confirm ${batch.batch_key}.`);
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("import_questions_batch", { p_payload: batch });
  if (error) throw new Error(`Falha na importação atômica: ${error.message}`);
  printSummary(batch, { mode: "apply", result: data });
}

async function countRowsByQuestion(supabase, table, questionIds, filter) {
  let query = supabase.from(table).select("question_id").in("question_id", questionIds);
  if (filter) query = query.eq(filter.column, filter.value);
  const { data, error } = await query;
  if (error) throw new Error(`Falha ao verificar ${table}: ${error.message}`);
  return data.length;
}

async function verifyBatch(values) {
  const filePath = resolve(required(values.file, "--file"));
  const batch = questionImportBatchSchema.parse(await readJson(filePath));
  const supabase = createAdminClient();
  const externalIds = batch.questions.map((question) => question.external_id);
  const expectedByExternalId = new Map(
    batch.questions.map((question) => [question.external_id, question]),
  );

  const { data: importedBatch, error: batchError } = await supabase
    .from("question_import_batches")
    .select("id,question_count,source_sha256")
    .eq("batch_key", batch.batch_key)
    .single();
  if (batchError) throw new Error(`Lote não encontrado: ${batchError.message}`);

  const { data: questions, error: questionsError } = await supabase
    .from("questions")
    .select("id,external_id,status,source_content_hash")
    .in("external_id", externalIds);
  if (questionsError) throw new Error(`Falha ao verificar questões: ${questionsError.message}`);

  const questionIds = questions.map((question) => question.id);
  const expectedOptions = batch.questions.reduce((total, question) => total + question.options.length, 0);
  const [disciplineRelations, topicRelations, options, answerKeys, explanations, importItemsResult] = await Promise.all([
    countRowsByQuestion(supabase, "question_discipline_relations", questionIds),
    countRowsByQuestion(supabase, "question_topic_relations", questionIds),
    countRowsByQuestion(supabase, "question_options", questionIds),
    countRowsByQuestion(supabase, "question_answer_keys", questionIds),
    countRowsByQuestion(supabase, "question_explanations", questionIds, { column: "status", value: "published" }),
    supabase
      .from("question_import_items")
      .select("source_id", { count: "exact", head: true })
      .eq("batch_id", importedBatch.id),
  ]);
  if (importItemsResult.error) {
    throw new Error(`Falha ao verificar itens do lote: ${importItemsResult.error.message}`);
  }

  const invalidQuestion = questions.find((question) => {
    const expected = expectedByExternalId.get(question.external_id);
    return question.status !== "published"
      || !expected
      || question.source_content_hash !== expected.source_content_hash;
  });
  const expectedCount = batch.questions.length;
  const checks = {
    batch_questions: importedBatch.question_count === expectedCount,
    batch_source_hash: importedBatch.source_sha256 === batch.source.sha256,
    questions: questions.length === expectedCount && !invalidQuestion,
    discipline_relations: disciplineRelations === expectedCount,
    topic_relations: topicRelations >= expectedCount,
    options: options === expectedOptions,
    answer_keys: answerKeys === expectedCount,
    published_explanations: explanations === expectedCount,
    import_items: importItemsResult.count === expectedCount,
  };
  const failedChecks = Object.entries(checks).filter(([, passed]) => !passed).map(([name]) => name);
  if (failedChecks.length) {
    throw new Error(`Verificação incompleta: ${failedChecks.join(", ")}.`);
  }

  printSummary(batch, {
    mode: "verify",
    checks,
    records: {
      questions: questions.length,
      discipline_relations: disciplineRelations,
      topic_relations: topicRelations,
      options,
      answer_keys: answerKeys,
      published_explanations: explanations,
      import_items: importItemsResult.count,
    },
  });
}

const { positionals, values } = parseArgs({
  allowPositionals: true,
  options: {
    source: { type: "string" },
    mapping: { type: "string" },
    output: { type: "string" },
    ids: { type: "string" },
    limit: { type: "string" },
    balanced: { type: "boolean", default: false },
    "exclude-file": { type: "string" },
    file: { type: "string" },
    apply: { type: "boolean", default: false },
    confirm: { type: "string" },
  },
});

const command = positionals[0];
try {
  if (command === "prepare") await prepare(values);
  else if (command === "validate") await validate(values);
  else if (command === "import") await importBatch(values);
  else if (command === "verify") await verifyBatch(values);
  else {
    usage();
    process.exitCode = 1;
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
