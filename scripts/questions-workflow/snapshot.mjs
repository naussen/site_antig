// Leitura administrativa: somente conteúdo editorial e relações, sem dados de alunos.
import { createClient } from "@supabase/supabase-js";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { parseArgs } from "node:util";

const { values } = parseArgs({ options: { output: { type: "string" } } });
if (!values.output) throw new Error("Informe --output; o arquivo não será sobrescrito.");
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("Ambiente administrativo indisponível.");
const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

const tables = {
  disciplines: ["id,slug,name,status", "id"],
  topics: ["topic_id,title,discipline,archived_at", "topic_id"],
  topic_discipline_relations: ["topic_id,discipline_id,is_primary", "topic_id,discipline_id"],
  questions: ["id,external_id,question_type,statement_markdown,subject,exam_board,institution,position_name,exam_year,status,source_content_hash,source_metadata", "id"],
  question_discipline_relations: ["question_id,discipline_id,is_primary", "question_id,discipline_id"],
  question_topic_relations: ["question_id,topic_id,relation_type", "question_id,topic_id"],
  question_options: ["id,question_id,label,body_markdown,sort_order", "id"],
  question_answer_keys: ["question_id,correct_option_id", "question_id"],
  question_explanations: ["question_id,body_markdown,status,source_reference", "question_id"],
  laws: ["id,slug,name,current_version_id,status", "id"],
  legal_fragments: ["id,law_version_id,stable_key,reference", "id"],
  topic_legal_fragment_relations: ["topic_id,section_id,legal_fragment_id,relation_type", "topic_id,legal_fragment_id"],
};

async function readTable(table, [columns, ordering]) {
  const rows = [];
  for (let offset = 0; ; offset += 500) {
    let query = client.from(table).select(columns);
    for (const column of ordering.split(",")) query = query.order(column);
    const { data, error } = await query.range(offset, offset + 499);
    if (error) throw new Error(`Falha de leitura ${table}: ${error.code ?? "unknown"}`);
    rows.push(...data);
    if (data.length < 500) return rows;
  }
}

const snapshot = { schema_version: "pro-questions/catalog-snapshot/v1", captured_at: new Date().toISOString() };
// Sequencial para limitar carga. Snapshot é observacional, não transação PostgreSQL.
for (const [table, specification] of Object.entries(tables)) {
  snapshot[table] = await readTable(table, specification);
}
const output = resolve(values.output);
await mkdir(dirname(output), { recursive: true });
await writeFile(output, `${JSON.stringify(snapshot, null, 2)}\n`, { flag: "wx" });
console.log(JSON.stringify({ captured_at: snapshot.captured_at, counts: Object.fromEntries(Object.keys(tables).map((table) => [table, snapshot[table].length])) }));
