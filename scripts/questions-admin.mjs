import { basename, resolve } from "node:path";
import { readFile, writeFile } from "node:fs/promises";
import { parseArgs } from "node:util";

import { createClient } from "@supabase/supabase-js";

import {
  buildQuestionBatch,
  questionImportBatchSchema,
} from "./lib/question-import-contract.mjs";

function usage() {
  console.log(`Uso:
  npm run questions:admin -- prepare --source <ATUALIZADO.json> --mapping <mapa.json> --output <lote.json> [--ids id1,id2]
  npm run questions:admin -- validate --file <lote.json>
  npm run questions:admin -- import --file <lote.json> [--apply --confirm <batch_key>]`);
}

function required(value, name) {
  if (!value) throw new Error(`Informe ${name}.`);
  return value;
}

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
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
  const selectedIds = values.ids
    ? values.ids.split(",").map((value) => value.trim()).filter(Boolean)
    : [];
  const batch = buildQuestionBatch({ rawText, sourceFile, rawQuestions, mapping, selectedIds });

  await writeFile(outputPath, `${JSON.stringify(batch, null, 2)}\n`, "utf8");
  printSummary(batch, { output: outputPath });
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

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error("Ambiente Supabase administrativo indisponível.");
  }

  const supabase = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data, error } = await supabase.rpc("import_questions_batch", { p_payload: batch });
  if (error) throw new Error(`Falha na importação atômica: ${error.message}`);
  printSummary(batch, { mode: "apply", result: data });
}

const { positionals, values } = parseArgs({
  allowPositionals: true,
  options: {
    source: { type: "string" },
    mapping: { type: "string" },
    output: { type: "string" },
    ids: { type: "string" },
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
  else {
    usage();
    process.exitCode = 1;
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
