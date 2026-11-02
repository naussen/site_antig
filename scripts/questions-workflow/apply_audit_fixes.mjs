import { createClient } from "@supabase/supabase-js";
import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { parseArgs } from "node:util";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");

const { values } = parseArgs({
  options: {
    batch: {
      type: "string",
      default: path.join(ROOT, "docs/questoes-workflow/tjsp_2021_revisado_20261031.json"),
    },
    manifest: {
      type: "string",
      default: path.join(ROOT, "docs/questoes-workflow/tjsp_2021_manifesto_20261031.json"),
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

function sha256(text) {
  return createHash("sha256").update(Buffer.from(text || "", "utf8")).digest("hex");
}

function safeTimestamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function computeOptionsHash(options) {
  const sorted = [...options].sort((a, b) => a.label.localeCompare(b.label));
  return sha256(sorted.map((o) => `${o.label}:${o.body_markdown}`).join("|"));
}

async function main() {
  const isDryRun = Boolean(values["dry-run"]);
  console.log("=== Aplicação Editorial Atômica Transacional TJSP 2021 ===");
  console.log(`Modo: ${isDryRun ? "DRY-RUN (Simulação)" : "APLICAÇÃO EFETIVA (Transação plpgsql)"}`);

  // 1. Leitura e validação dos arquivos canônicos
  const batchRaw = await readFile(values.batch, "utf8");
  const batchQuestions = JSON.parse(batchRaw);
  const manifestRaw = await readFile(values.manifest, "utf8");
  const manifestParsed = JSON.parse(manifestRaw);
  const manifestRecords = Array.isArray(manifestParsed) ? manifestParsed : manifestParsed.questions;

  const batchHash = sha256(batchRaw);
  const manifestHash = sha256(manifestRaw);

  console.log(`Lote: ${batchQuestions.length} questões prontas (SHA-256: ${batchHash.slice(0, 16)}...)`);
  console.log(`Manifesto: ${manifestRecords.length} registros (SHA-256: ${manifestHash.slice(0, 16)}...)`);

  if (manifestRecords.length !== 100) {
    throw new Error(`O manifesto deve conter exatamente 100 registros do caderno. Encontrados: ${manifestRecords.length}`);
  }

  const heldRecords = manifestRecords.filter((m) => m.disposition === "held");
  const readyRecords = manifestRecords.filter((m) => m.disposition === "ready");

  if (heldRecords.length !== 4 || readyRecords.length !== 96) {
    throw new Error(
      `Esperadas 4 questões anuladas (held) e 96 prontas (ready). Encontradas: ${heldRecords.length} held, ${readyRecords.length} ready.`
    );
  }

  const allExternalIds = manifestRecords.map((m) => m.external_id);

  // 2. Carregar estado completo do banco para as 100 questões (para backup e integridade)
  const { data: dbQuestions, error: qErr } = await supabase
    .from("questions")
    .select(
      "id, external_id, question_type, statement_markdown, subject, exam_board, institution, position_name, exam_year, difficulty, source_reference, status, published_at, source_content_hash, source_metadata, created_at, updated_at"
    )
    .in("external_id", allExternalIds);

  if (qErr) throw new Error(`Falha ao buscar questões no banco: ${qErr.message}`);
  if (!dbQuestions || dbQuestions.length !== 100) {
    throw new Error(`Esperadas 100 questões persistidas no banco, mas foram localizadas: ${dbQuestions?.length || 0}`);
  }

  const dbQuestionIds = dbQuestions.map((q) => q.id);

  const { data: dbOptions, error: optErr } = await supabase
    .from("question_options")
    .select("id, question_id, label, body_markdown, sort_order")
    .in("question_id", dbQuestionIds);
  if (optErr) throw new Error(`Falha ao buscar alternativas: ${optErr.message}`);

  const { data: dbExplanations, error: expErr } = await supabase
    .from("question_explanations")
    .select("question_id, body_markdown, source_reference, status, reviewed_by, reviewed_at, updated_at")
    .in("question_id", dbQuestionIds);
  if (expErr) throw new Error(`Falha ao buscar explicações: ${expErr.message}`);

  const { data: dbAnswerKeys, error: keyErr } = await supabase
    .from("question_answer_keys")
    .select("question_id, correct_option_id, updated_at")
    .in("question_id", dbQuestionIds);
  if (keyErr) throw new Error(`Falha ao buscar gabaritos: ${keyErr.message}`);

  const { data: dbDiscRelations, error: discRelErr } = await supabase
    .from("question_discipline_relations")
    .select("question_id, discipline_id, is_primary, sort_order")
    .in("question_id", dbQuestionIds);
  if (discRelErr) throw new Error(`Falha ao buscar relações de disciplina: ${discRelErr.message}`);

  const { data: dbTopicRelations, error: topicRelErr } = await supabase
    .from("question_topic_relations")
    .select("question_id, topic_id, relation_type, relevance, sort_order")
    .in("question_id", dbQuestionIds);
  if (topicRelErr) throw new Error(`Falha ao buscar relações de tópico: ${topicRelErr.message}`);

  // 3. Carregar catálogo para validação taxonômica
  const { error: cDiscErr } = await supabase
    .from("disciplines")
    .select("id, slug, name, status");
  if (cDiscErr) throw new Error(`Falha ao carregar catálogo de disciplinas: ${cDiscErr.message}`);

  const { error: cTopicErr } = await supabase
    .from("topics")
    .select("topic_id, discipline, archived_at");
  if (cTopicErr) throw new Error(`Falha ao carregar catálogo de tópicos: ${cTopicErr.message}`);

  const { data: catTopicDisc, error: cTdrErr } = await supabase
    .from("topic_discipline_relations")
    .select("topic_id, discipline_id, is_primary");
  if (cTdrErr) throw new Error(`Falha ao carregar relações tópico-disciplina: ${cTdrErr.message}`);

  const topicToDisciplineMap = new Map();
  for (const tdr of catTopicDisc) {
    if (tdr.is_primary) {
      topicToDisciplineMap.set(tdr.topic_id, tdr.discipline_id);
    }
  }

  // 4. Montar o payload transacional atômico e calcular hashes de pré-condição
  const questionMap = new Map(dbQuestions.map((q) => [q.external_id, q]));
  const batchMap = new Map(batchQuestions.map((q) => [q.external_id, q]));

  const payloadItems = [];
  const plannedReceiptItems = [];

  for (const manifestRec of manifestRecords) {
    const existing = questionMap.get(manifestRec.external_id);
    if (!existing) {
      throw new Error(`Questão ${manifestRec.external_id} não encontrada no banco.`);
    }

    if (manifestRec.disposition === "held") {
      const expBody = `QUESTÃO ANULADA PELA BANCA EXAMINADORA (Fundação Vunesp).

Razão oficial: ${manifestRec.reason || "Critério da banca examinadora após fase recursal oficial."}

Conforme o edital e o gabarito oficial definitivo, os pontos desta questão foram atribuídos a todos os candidatos.`;

      const appliedMetadata = {
        ...existing.source_metadata,
        annulled: true,
        annulment_reason: manifestRec.reason || "Anulação oficial Vunesp",
        audit_applied_at: new Date().toISOString(),
        manifest_origin: manifestRec.origin,
      };

      payloadItems.push({
        id: existing.id,
        external_id: manifestRec.external_id,
        disposition: "archived",
        source_metadata: appliedMetadata,
        explanation_body: expBody,
        explanation_source: "Fundação Vunesp - Gabarito Oficial Definitivo pós-recursos",
      });

      plannedReceiptItems.push({
        id: existing.id,
        external_id: manifestRec.external_id,
        disposition: "archived",
        status_before: existing.status,
        status_after: "archived",
        statement_sha256: sha256(existing.statement_markdown),
        explanation_sha256: sha256(expBody),
        correct_option_label: null,
        topic_id: null,
      });
    } else {
      const batchItem = batchMap.get(manifestRec.external_id);
      if (!batchItem) {
        throw new Error(`Questão pronta ${manifestRec.external_id} não localizada no lote JSON.`);
      }

      const primaryTopic = batchItem.topics.find((t) => t.relation_type === "primary");
      if (!primaryTopic) {
        throw new Error(`Questão ${batchItem.external_id} sem tópico primário.`);
      }

      const targetDisciplineId = topicToDisciplineMap.get(primaryTopic.topic_id);
      if (!targetDisciplineId) {
        throw new Error(
          `Tópico ${primaryTopic.topic_id} da questão ${batchItem.external_id} não possui disciplina primária mapeada no catálogo.`
        );
      }

      const appliedMetadata = {
        ...existing.source_metadata,
        ...batchItem.source_metadata,
        audit_applied_at: new Date().toISOString(),
        manifest_origin: manifestRec.origin,
        manifest_answer: manifestRec.answer,
      };

      const expBody = batchItem.explanation?.body_markdown;
      if (!expBody) {
        throw new Error(`Questão pronta ${batchItem.external_id} sem comentário didático.`);
      }

      payloadItems.push({
        id: existing.id,
        external_id: manifestRec.external_id,
        disposition: "published",
        statement_markdown: batchItem.statement_markdown,
        subject: batchItem.subject,
        exam_board: batchItem.exam_board,
        exam_year: batchItem.exam_year,
        source_content_hash: batchItem.source_content_hash,
        source_metadata: appliedMetadata,
        options: batchItem.options,
        correct_option_label: batchItem.correct_option_label,
        target_topic_id: primaryTopic.topic_id,
        target_discipline_id: targetDisciplineId,
        explanation_body: expBody,
        explanation_source: batchItem.explanation.source_reference || "Fundação Vunesp - Gabarito Oficial Definitivo",
      });

      plannedReceiptItems.push({
        id: existing.id,
        external_id: manifestRec.external_id,
        disposition: "published",
        status_before: existing.status,
        status_after: "published",
        statement_sha256: sha256(batchItem.statement_markdown),
        options_sha256: computeOptionsHash(batchItem.options),
        explanation_sha256: sha256(expBody),
        correct_option_label: batchItem.correct_option_label,
        topic_id: primaryTopic.topic_id,
        discipline_id: targetDisciplineId,
      });
    }
  }

  // 5. Gerar Backup Completo e Imutável antes de qualquer alteração
  const timestamp = safeTimestamp();
  const backupFileName = `backup_tjsp_pre_audit_${timestamp}.json`;
  const backupPath = path.join(ROOT, "docs/questoes-workflow", backupFileName);

  const fullSnapshot = {
    schema_version: "pro-questions/audit-backup/v1",
    timestamp: new Date().toISOString(),
    batch_sha256: batchHash,
    manifest_sha256: manifestHash,
    item_count: dbQuestions.length,
    questions: dbQuestions,
    options: dbOptions || [],
    explanations: dbExplanations || [],
    answer_keys: dbAnswerKeys || [],
    discipline_relations: dbDiscRelations || [],
    topic_relations: dbTopicRelations || [],
    applied_verification_plan: plannedReceiptItems,
  };

  const backupBytes = JSON.stringify(fullSnapshot, null, 2);
  const backupSha256 = sha256(backupBytes);
  await writeFile(backupPath, backupBytes, "utf8");
  console.log(`Backup de segurança COMPLETO gravado em: ${backupPath} (SHA-256: ${backupSha256.slice(0, 16)}...)`);

  console.log(`\nResumo do Plano Transacional:`);
  console.log(`- Total de itens na transação: ${payloadItems.length}`);
  console.log(`- Prontas para publicação com revisão integral: ${plannedReceiptItems.filter((i) => i.disposition === "published").length}`);
  console.log(`- Anuladas oficialmente (arquivamento + explicação): ${plannedReceiptItems.filter((i) => i.disposition === "archived").length}`);

  if (isDryRun) {
    console.log("\n[DRY-RUN] Simulação concluída com sucesso. Nenhuma alteração foi persistida no banco.");
    return;
  }

  // 6. Execução atômica no servidor via RPC plpgsql
  console.log("\nInvocando RPC public.apply_atomic_audit_fixes no PostgreSQL...");
  const { data: rpcResult, error: rpcErr } = await supabase.rpc("apply_atomic_audit_fixes", {
    p_payload: { items: payloadItems },
  });

  if (rpcErr) {
    console.error(`\n[ABORT] Falha na aplicação atômica: ${rpcErr.message}`);
    console.error("A transação plpgsql garantiu ROLLBACK IMEDIATO de 100% das alterações. Banco permanece no estado original.");
    throw new Error(`Falha transacional: ${rpcErr.message}`);
  }

  console.log("Aplicação atômica no servidor concluída com sucesso!");
  console.log(`- Processados: ${rpcResult.total_processed}`);
  console.log(`- Publicadas: ${rpcResult.ready_published}`);
  console.log(`- Arquivadas: ${rpcResult.held_archived}`);

  // 7. Persistir recibo atômico de aplicação com hashes antes/depois
  const receiptFileName = `recibo_aplicacao_editorial_${timestamp}.json`;
  const receiptPath = path.join(ROOT, "docs/questoes-workflow", receiptFileName);

  const receipt = {
    schema_version: "pro-questions/audit-receipt/v1",
    applied_at: rpcResult.applied_at || new Date().toISOString(),
    backup_file: backupFileName,
    backup_sha256: backupSha256,
    batch_sha256: batchHash,
    manifest_sha256: manifestHash,
    total_processed: rpcResult.total_processed,
    ready_published: rpcResult.ready_published,
    held_archived: rpcResult.held_archived,
    items: plannedReceiptItems,
  };

  await writeFile(receiptPath, JSON.stringify(receipt, null, 2), "utf8");
  console.log(`Recibo atômico gravado em: ${receiptPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
