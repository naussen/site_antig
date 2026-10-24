import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { parseArgs } from "node:util";

import { createClient } from "@supabase/supabase-js";

const { values } = parseArgs({ options: { output: { type: "string" } } });
if (!values.output) throw new Error("Informe --output para o snapshot local.");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("Ambiente Supabase administrativo indisponível.");

const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function readAll(table, columns, order) {
  const rows = [];
  for (let start = 0; ; start += 1000) {
    const { data, error } = await supabase
      .from(table)
      .select(columns)
      .order(order)
      .range(start, start + 999);
    if (error) throw new Error(`Falha ao ler ${table}: ${error.code ?? "unknown"}`);
    rows.push(...data);
    if (data.length < 1000) return rows;
  }
}

const [disciplines, topics, topicRelations, questions] = await Promise.all([
  readAll("disciplines", "id,slug,name,status", "slug"),
  readAll("topics", "topic_id,title,discipline,archived_at", "topic_id"),
  readAll("topic_discipline_relations", "topic_id,discipline_id,is_primary", "topic_id"),
  readAll("questions", "external_id,statement_markdown,status", "external_id"),
]);

const snapshot = {
  captured_at: new Date().toISOString(),
  disciplines,
  topics,
  topic_relations: topicRelations,
  questions,
};
await writeFile(resolve(values.output), `${JSON.stringify(snapshot)}\n`, { flag: "wx" });
console.log(JSON.stringify({
  captured_at: snapshot.captured_at,
  disciplines: disciplines.length,
  topics: topics.length,
  questions: questions.length,
}));
