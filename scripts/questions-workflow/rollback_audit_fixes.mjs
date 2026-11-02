import { createClient } from "@supabase/supabase-js";
import { readFile, writeFile } from "node:fs/promises";
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
    force: { type: "boolean", default: false },
  },
});

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Variáveis de ambiente do Supabase ausentes.");
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function safeTimestamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

async function main() {
  const isDryRun = Boolean(values["dry-run"]);
  const isForce = Boolean(values.force);

  console.log("=== Rollback Seguro das Correções Editoriais TJSP 2021 ===");
  console.log(`Modo: ${isDryRun ? "DRY-RUN (Simulação)" : "REVERSÃO EFETIVA"}`);

  if (!values.backup) {
    throw new Error("Parâmetro obrigatório: --backup <caminho_do_arquivo_de_backup>");
  }

  const backupRaw = await readFile(values.backup, "utf8");
  const backup = JSON.parse(backupRaw);

  if (backup.schema_version !== "pro-questions/audit-backup/v1") {
    throw new Error(`Schema de backup desconhecido: ${backup.schema_version}. Esperado: pro-questions/audit-backup/v1`);
  }

  const snapshotQuestions = backup.questions || [];
  console.log(`Itens no backup: ${snapshotQuestions.length} (Gerado em: ${backup.timestamp})`);

  const externalIds = snapshotQuestions.map((q) => q.external_id);

  // 1. Carregar estado atual no banco para verificação de pré-condição anti-concorrência
  const { data: currentDbQuestions, error: qErr } = await supabase
    .from("questions")
    .select("id, external_id, statement_markdown, status, source_metadata, updated_at")
    .in("external_id", externalIds);

  if (qErr) throw new Error(`Falha ao ler questões atuais no banco: ${qErr.message}`);

  const currentMap = new Map((currentDbQuestions || []).map((q) => [q.external_id, q]));

  // 2. Validação da pré-condição de permanência do estado aplicado
  // Impede que edições posteriores legítimas sejam destruídas cegamente por um rollback atrasado
  const concurrentModifications = [];
  for (const snapQ of snapshotQuestions) {
    const curr = currentMap.get(snapQ.external_id);
    if (!curr) {
      concurrentModifications.push({
        external_id: snapQ.external_id,
        reason: "Item não existe mais no banco de dados.",
      });
      continue;
    }

    // Se o item foi editado posteriormente sem a marcação da auditoria
    const auditAppliedAt = curr.source_metadata?.audit_applied_at;
    if (!auditAppliedAt && !isForce) {
      concurrentModifications.push({
        external_id: snapQ.external_id,
        reason: "Item não possui metadados da aplicação da auditoria (possível alteração concorrente ou não aplicado).",
      });
    }
  }

  if (concurrentModifications.length > 0 && !isForce) {
    console.error("ERRO DE PRÉ-CONDIÇÃO: Foram detectadas discrepâncias que impedem o rollback automático:");
    for (const mod of concurrentModifications.slice(0, 5)) {
      console.error(`- ${mod.external_id}: ${mod.reason}`);
    }
    if (concurrentModifications.length > 5) {
      console.error(`... e mais ${concurrentModifications.length - 5} discrepâncias.`);
    }
    throw new Error("Rollback abortado para proteger integridade contra edições concorrentes. Use --force se tiver certeza.");
  }

  // 3. Mapeamentos do snapshot para restauração fiel
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

  let restoredCount = 0;
  const rollbackReceiptItems = [];

  for (const snapQ of snapshotQuestions) {
    const qId = snapQ.id;

    if (!isDryRun) {
      // A. Restaurar questions
      const { error: rQErr } = await supabase
        .from("questions")
        .update({
          statement_markdown: snapQ.statement_markdown,
          subject: snapQ.subject,
          exam_board: snapQ.exam_board,
          institution: snapQ.institution,
          position_name: snapQ.position_name,
          exam_year: snapQ.exam_year,
          difficulty: snapQ.difficulty,
          source_reference: snapQ.source_reference,
          status: snapQ.status,
          source_metadata: snapQ.source_metadata,
          updated_at: new Date().toISOString(),
        })
        .eq("id", qId);
      if (rQErr) throw new Error(`[ROLLBACK ABORT] Falha ao restaurar questão ${snapQ.external_id}: ${rQErr.message}`);

      // B. Restaurar opções
      const prevOpts = optionsByQuestion.get(qId) || [];
      for (const opt of prevOpts) {
        const { error: rOptErr } = await supabase
          .from("question_options")
          .update({ body_markdown: opt.body_markdown })
          .eq("question_id", qId)
          .eq("label", opt.label);
        if (rOptErr) throw new Error(`[ROLLBACK ABORT] Falha ao restaurar opção ${opt.label} de ${snapQ.external_id}: ${rOptErr.message}`);
      }

      // C. Restaurar explicação
      const prevExp = explanationsByQuestion.get(qId);
      if (prevExp) {
        const { error: rExpErr } = await supabase
          .from("question_explanations")
          .upsert(
            {
              question_id: qId,
              body_markdown: prevExp.body_markdown,
              source_reference: prevExp.source_reference,
              status: prevExp.status,
              reviewed_by: prevExp.reviewed_by,
              reviewed_at: prevExp.reviewed_at,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "question_id" }
          );
        if (rExpErr) throw new Error(`[ROLLBACK ABORT] Falha ao restaurar explicação de ${snapQ.external_id}: ${rExpErr.message}`);
      }

      // D. Restaurar question_answer_keys
      const prevKey = answerKeysByQuestion.get(qId);
      if (prevKey && prevKey.correct_option_id) {
        const { error: rKeyErr } = await supabase
          .from("question_answer_keys")
          .upsert(
            {
              question_id: qId,
              correct_option_id: prevKey.correct_option_id,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "question_id" }
          );
        if (rKeyErr) throw new Error(`[ROLLBACK ABORT] Falha ao restaurar gabarito de ${snapQ.external_id}: ${rKeyErr.message}`);
      } else {
        await supabase.from("question_answer_keys").delete().eq("question_id", qId);
      }

      // E. Restaurar question_discipline_relations
      const prevDiscRels = discRelsByQuestion.get(qId) || [];
      await supabase.from("question_discipline_relations").delete().eq("question_id", qId);
      if (prevDiscRels.length > 0) {
        const { error: rDiscErr } = await supabase
          .from("question_discipline_relations")
          .insert(
            prevDiscRels.map((d) => ({
              question_id: qId,
              discipline_id: d.discipline_id,
              is_primary: d.is_primary,
            }))
          );
        if (rDiscErr) throw new Error(`[ROLLBACK ABORT] Falha ao restaurar disciplinas de ${snapQ.external_id}: ${rDiscErr.message}`);
      }

      // F. Restaurar question_topic_relations
      const prevTopicRels = topicRelsByQuestion.get(qId) || [];
      await supabase.from("question_topic_relations").delete().eq("question_id", qId);
      if (prevTopicRels.length > 0) {
        const { error: rTopicErr } = await supabase
          .from("question_topic_relations")
          .insert(
            prevTopicRels.map((t) => ({
              question_id: qId,
              topic_id: t.topic_id,
              relation_type: t.relation_type,
              relevance: t.relevance,
              sort_order: t.sort_order,
            }))
          );
        if (rTopicErr) throw new Error(`[ROLLBACK ABORT] Falha ao restaurar tópicos de ${snapQ.external_id}: ${rTopicErr.message}`);
      }
    }

    restoredCount++;
    rollbackReceiptItems.push({
      external_id: snapQ.external_id,
      id: qId,
      status_restored: snapQ.status,
    });
  }

  // 4. Salvar recibo de reversão
  const timestamp = safeTimestamp();
  const receiptFileName = `recibo_rollback_editorial_${timestamp}.json`;
  const receiptPath = path.join(ROOT, "docs/questoes-workflow", receiptFileName);

  const rollbackReceipt = {
    schema_version: "pro-questions/rollback-receipt/v1",
    reverted_at: new Date().toISOString(),
    is_dry_run: isDryRun,
    backup_file_used: values.backup,
    items_restored: restoredCount,
    items: rollbackReceiptItems,
  };

  await writeFile(receiptPath, JSON.stringify(rollbackReceipt, null, 2), "utf8");
  console.log(`\nRecibo de rollback gravado em: ${receiptPath}`);
  console.log(`Total de itens restaurados: ${restoredCount}`);
  console.log(isDryRun ? "DRY-RUN concluído: Nenhuma alteração gravada." : "ROLLBACK CONCLUÍDO com sucesso.");
}

main().catch((err) => {
  console.error("ERRO no rollback:", err);
  process.exit(1);
});
