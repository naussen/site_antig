import { createClient } from "@supabase/supabase-js";
import { readFile, writeFile, readdir } from "node:fs/promises";
import { parseArgs } from "node:util";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");

const { values } = parseArgs({
  options: {
    backup: {
      type: "string",
    },
    "dry-run": { type: "boolean", default: false },
  },
});

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Variáveis de ambiente do Supabase ausentes (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY).");
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function safeTimestamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

async function findLatestBackup() {
  const workflowDir = path.join(ROOT, "docs/questoes-workflow");
  const files = await readdir(workflowDir);
  const backups = files.filter((f) => f.startsWith("backup_tjsp_pre_audit_") && f.endsWith(".json")).sort();
  if (backups.length === 0) return null;
  return path.join(workflowDir, backups[backups.length - 1]);
}

async function main() {
  const isDryRun = Boolean(values["dry-run"]);
  console.log("=== Rollback Atômico Condicionado TJSP 2021 (Transação plpgsql) ===");
  console.log(`Modo: ${isDryRun ? "DRY-RUN (Simulação)" : "REVERSÃO ATÔMICA EFETIVA"}`);

  let backupFilePath = values.backup;
  if (!backupFilePath) {
    backupFilePath = await findLatestBackup();
    if (!backupFilePath) {
      throw new Error("Nenhum backup encontrado. Especifique com --backup <caminho_do_arquivo>.");
    }
    console.log(`Backup selecionado automaticamente: ${backupFilePath}`);
  }

  const backupRaw = await readFile(backupFilePath, "utf8");
  const backup = JSON.parse(backupRaw);

  if (backup.schema_version !== "pro-questions/audit-backup/v1") {
    throw new Error(`Schema de backup desconhecido: ${backup.schema_version}. Esperado: pro-questions/audit-backup/v1`);
  }

  const snapshotQuestions = backup.questions || [];
  if (snapshotQuestions.length !== 100) {
    throw new Error(`Backup deve conter exatamente 100 questões. Encontradas: ${snapshotQuestions.length}`);
  }

  const appliedPlan = backup.applied_verification_plan || [];
  const planMap = new Map(appliedPlan.map((p) => [p.external_id, p]));

  // Indexar relacionamentos originais do backup
  const optionsByQuestion = new Map();
  for (const opt of backup.options || []) {
    if (!optionsByQuestion.has(opt.question_id)) optionsByQuestion.set(opt.question_id, []);
    optionsByQuestion.get(opt.question_id).push(opt);
  }

  const explanationsByQuestion = new Map();
  for (const exp of backup.explanations || []) {
    explanationsByQuestion.set(exp.question_id, exp);
  }

  const answerKeysByQuestion = new Map();
  for (const key of backup.answer_keys || []) {
    answerKeysByQuestion.set(key.question_id, key);
  }

  const discRelsByQuestion = new Map();
  for (const dRel of backup.discipline_relations || []) {
    if (!discRelsByQuestion.has(dRel.question_id)) discRelsByQuestion.set(dRel.question_id, []);
    discRelsByQuestion.get(dRel.question_id).push(dRel);
  }

  const topicRelsByQuestion = new Map();
  for (const tRel of backup.topic_relations || []) {
    if (!topicRelsByQuestion.has(tRel.question_id)) topicRelsByQuestion.set(tRel.question_id, []);
    topicRelsByQuestion.get(tRel.question_id).push(tRel);
  }

  // Montar payload para RPC de rollback no servidor
  const rollbackItems = [];

  for (const origQ of snapshotQuestions) {
    const qId = origQ.id;
    const plan = planMap.get(origQ.external_id);

    rollbackItems.push({
      question_id: qId,
      external_id: origQ.external_id,
      expected_applied_statement_sha256: plan ? plan.statement_sha256 : null,
      expected_applied_explanation_sha256: plan ? plan.explanation_sha256 : null,
      expected_applied_status: plan ? plan.status_after : origQ.status,
      expected_applied_topic_id: plan ? plan.topic_id : null,
      expected_applied_correct_option_label: plan ? plan.correct_option_label : null,
      expected_applied_options_sha256: plan ? plan.options_sha256 : null,

      original_question: origQ,
      original_options: optionsByQuestion.get(qId) || [],
      original_explanation: explanationsByQuestion.get(qId) || null,
      original_answer_key: answerKeysByQuestion.get(qId) || null,
      original_discipline_relations: discRelsByQuestion.get(qId) || [],
      original_topic_relations: topicRelsByQuestion.get(qId) || [],
    });
  }

  console.log(`Itens montados para validação e restauração transacional: ${rollbackItems.length}`);

  if (isDryRun) {
    console.log("\n[DRY-RUN] Simulação de rollback concluída com sucesso. Nenhuma alteração foi persistida.");
    return;
  }

  console.log("\nInvocando RPC public.rollback_atomic_audit_fixes no PostgreSQL...");
  const { data: rollbackResult, error: rpcErr } = await supabase.rpc("rollback_atomic_audit_fixes", {
    p_payload: { items: rollbackItems },
  });

  if (rpcErr) {
    console.error(`\n[ABORT] Rollback abortado pelo servidor: ${rpcErr.message}`);
    console.error("Motivo: Alteração posterior ou concorrente detectada (ou falha de integridade).");
    console.error("Nenhuma tabela foi alterada parcialmente. Integridade preservada.");
    throw new Error(`Falha no rollback: ${rpcErr.message}`);
  }

  console.log("Rollback atômico concluído com sucesso!");
  console.log(`- Itens restaurados ao estado original: ${rollbackResult.items_restored}`);

  // Persistir recibo atômico de rollback
  const timestamp = safeTimestamp();
  const receiptFileName = `recibo_rollback_editorial_${timestamp}.json`;
  const receiptPath = path.join(ROOT, "docs/questoes-workflow", receiptFileName);

  const receipt = {
    schema_version: "pro-questions/rollback-receipt/v1",
    reverted_at: rollbackResult.reverted_at || new Date().toISOString(),
    backup_file_used: path.basename(backupFilePath),
    items_restored: rollbackResult.items_restored,
  };

  await writeFile(receiptPath, JSON.stringify(receipt, null, 2), "utf8");
  console.log(`Recibo de reversão gravado em: ${receiptPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
