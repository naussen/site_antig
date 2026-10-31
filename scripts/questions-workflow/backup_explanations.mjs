import { createClient } from "@supabase/supabase-js";
import { mkdir, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Variáveis de ambiente do Supabase ausentes.");
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const targetQuestionIds = [
  "c4ea8714-26cc-4af1-9c1d-3553c1697063", // BB 16
  "f2ea3977-ad14-43be-8b99-c55409d6aea0", // BB 26
  "b460d264-06c4-40b2-8ca4-5af2bc5531a7", // BB 28
  "b55d96d1-19dc-40df-aa04-7c34fa965a51", // BB 29
  "bea0886c-e104-4a42-b0f4-645af6445c47", // CONAB 14
  "e9f7c337-4f6e-458c-95e9-0998b857da7f", // PF 41
  "2d2ddaec-6e15-45f7-9f55-0a55cd3bbfea", // PF 42
];

function sha256(text) {
  return createHash("sha256").update(Buffer.from(text, "utf8")).digest("hex");
}

async function main() {
  console.log("Criando backup verificável das explicações alvo...");
  const { data: explanations, error } = await supabase
    .from("question_explanations")
    .select("*")
    .in("question_id", targetQuestionIds);

  if (error) throw error;
  if (explanations.length !== targetQuestionIds.length) {
    throw new Error(`Esperadas ${targetQuestionIds.length} explicações, encontradas ${explanations.length}`);
  }

  const { data: questions, error: qErr } = await supabase
    .from("questions")
    .select("id, external_id, statement_markdown")
    .in("id", targetQuestionIds);
  if (qErr) throw qErr;

  const qMap = new Map(questions.map((q) => [q.id, q]));

  const backupData = {
    timestamp: new Date().toISOString(),
    item_count: explanations.length,
    items: explanations.map((exp) => ({
      question_id: exp.question_id,
      external_id: qMap.get(exp.question_id)?.external_id,
      body_markdown: exp.body_markdown,
      body_sha256: sha256(exp.body_markdown),
      status: exp.status,
      source_reference: exp.source_reference,
      reviewed_by: exp.reviewed_by,
      reviewed_at: exp.reviewed_at,
      created_at: exp.created_at,
      updated_at: exp.updated_at,
    })),
  };

  const backupPath = "docs/questoes-workflow/backup_explanations_20261031.json";
  await writeFile(backupPath, JSON.stringify(backupData, null, 2), "utf8");
  console.log(`Backup salvo com sucesso em ${backupPath}: ${backupData.items.length} itens.`);
}

main().catch((err) => {
  console.error("Erro no backup:", err);
  process.exit(1);
});
