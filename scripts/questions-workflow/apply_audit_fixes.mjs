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

async function main() {
  const isDryRun = Boolean(values["dry-run"]);
  console.log("=== Aplicação Editorial Segura e Reconciliação Taxonômica TJSP 2021 ===");
  console.log(`Modo: ${isDryRun ? "DRY-RUN (Simulação)" : "APLICAÇÃO EFETIVA"}`);

  // 1. Leitura e validação dos arquivos de entrada
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
    throw new Error(`Esperadas 4 questões anuladas (held) e 96 prontas (ready). Encontradas: ${heldRecords.length} held, ${readyRecords.length} ready.`);
  }

  // Mapa de todas as 100 questões por external_id
  const allExternalIds = manifestRecords.map((m) => m.external_id);

  // 2. Carregar estado completo do banco para as 100 questões (para backup e pré-condições)
  const { data: dbQuestions, error: qErr } = await supabase
    .from("questions")
    .select("id, external_id, statement_markdown, subject, exam_board, institution, position_name, exam_year, difficulty, source_reference, status, source_metadata, updated_at")
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
    .select("question_id, discipline_id, is_primary")
    .in("question_id", dbQuestionIds);
  if (discRelErr) throw new Error(`Falha ao buscar relações de disciplina: ${discRelErr.message}`);

  const { data: dbTopicRelations, error: topicRelErr } = await supabase
    .from("question_topic_relations")
    .select("question_id, topic_id, relation_type, relevance, sort_order")
    .in("question_id", dbQuestionIds);
  if (topicRelErr) throw new Error(`Falha ao buscar relações de tópico: ${topicRelErr.message}`);

  // 3. Gerar Backup Completo e Imutável com carimbo de tempo único
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
  };

  const backupBytes = JSON.stringify(fullSnapshot, null, 2);
  const backupSha256 = sha256(backupBytes);
  await writeFile(backupPath, backupBytes, "utf8");
  console.log(`Backup de segurança COMPLETO gravado em: ${backupPath} (SHA-256: ${backupSha256.slice(0, 16)}...)`);

  // 4. Carregar catálogo de disciplinas e tópicos para validação taxonômica
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

  // 5. Planejar alterações e validar integridade taxonômica
  const questionMap = new Map(dbQuestions.map((q) => [q.external_id, q]));
  const batchMap = new Map(batchQuestions.map((q) => [q.external_id, q]));

  const plannedUpdates = [];
  const annulledUpdates = [];

  for (const manifestRec of manifestRecords) {
    const existing = questionMap.get(manifestRec.external_id);
    if (!existing) {
      throw new Error(`Questão ${manifestRec.external_id} não encontrada no banco.`);
    }

    if (manifestRec.disposition === "held") {
      annulledUpdates.push({
        external_id: manifestRec.external_id,
        id: existing.id,
        manifest: manifestRec,
        existing,
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
        throw new Error(`Tópico ${primaryTopic.topic_id} da questão ${batchItem.external_id} não possui disciplina primária mapeada no catálogo.`);
      }

      plannedUpdates.push({
        external_id: manifestRec.external_id,
        id: existing.id,
        batchItem,
        manifest: manifestRec,
        targetTopicId: primaryTopic.topic_id,
        targetDisciplineId,
        existing,
      });
    }
  }

  console.log(`\nPlano de Execução:`);
  console.log(`- Questões a publicar com revisão integral: ${plannedUpdates.length}`);
  console.log(`- Questões a arquivar/anular oficialmente: ${annulledUpdates.length}`);

  // 6. Execução atômica por item com verificação estrita de erros
  const receiptItems = [];

  // A. Processamento das 96 questões prontas
  for (const plan of plannedUpdates) {
    const q = plan.batchItem;
    const existingId = plan.id;

    const beforeHash = sha256(plan.existing.statement_markdown);
    const afterHash = sha256(q.statement_markdown);

    if (!isDryRun) {
      // 1. Atualizar questions
      const { error: updQErr } = await supabase
        .from("questions")
        .update({
          statement_markdown: q.statement_markdown,
          subject: q.subject,
          exam_board: q.exam_board,
          institution: q.institution,
          position_name: q.position_name,
          exam_year: q.exam_year,
          status: "published",
          source_metadata: {
            ...plan.existing.source_metadata,
            ...q.source_metadata,
            audit_applied_at: new Date().toISOString(),
            manifest_origin: plan.manifest.origin,
            manifest_answer: plan.manifest.answer,
          },
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingId);

      if (updQErr) {
        throw new Error(`[ABORT] Falha ao atualizar questão ${q.external_id} (${existingId}): ${updQErr.message}`);
      }

      // 2. Atualizar opções
      for (const opt of q.options) {
        const { error: updOptErr } = await supabase
          .from("question_options")
          .update({ body_markdown: opt.body_markdown })
          .eq("question_id", existingId)
          .eq("label", opt.label);

        if (updOptErr) {
          throw new Error(`[ABORT] Falha ao atualizar opção ${opt.label} da questão ${q.external_id}: ${updOptErr.message}`);
        }
      }

      // 3. Atualizar/Inserir explicação didática
      if (q.explanation?.body_markdown) {
        const { error: updExpErr } = await supabase
          .from("question_explanations")
          .upsert(
            {
              question_id: existingId,
              body_markdown: q.explanation.body_markdown,
              source_reference: q.explanation.source_reference || "Fundação Vunesp - Gabarito Oficial Definitivo",
              status: "published",
              reviewed_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            { onConflict: "question_id" }
          );

        if (updExpErr) {
          throw new Error(`[ABORT] Falha ao gravar explicação da questão ${q.external_id}: ${updExpErr.message}`);
        }
      }

      // 4. Garantir gabarito em question_answer_keys
      const { data: correctOpt, error: findOptErr } = await supabase
        .from("question_options")
        .select("id")
        .eq("question_id", existingId)
        .eq("label", q.correct_option_label)
        .single();

      if (findOptErr || !correctOpt) {
        throw new Error(`[ABORT] Opção correta ${q.correct_option_label} não encontrada para questão ${q.external_id}`);
      }

      const { error: updKeyErr } = await supabase
        .from("question_answer_keys")
        .upsert(
          {
            question_id: existingId,
            correct_option_id: correctOpt.id,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "question_id" }
        );

      if (updKeyErr) {
        throw new Error(`[ABORT] Falha ao atualizar question_answer_keys da questão ${q.external_id}: ${updKeyErr.message}`);
      }

      // 5. Reconciliar question_topic_relations (primário)
      // Remover relações existentes para garantir unicidade e integridade
      const { error: delTopicRelErr } = await supabase
        .from("question_topic_relations")
        .delete()
        .eq("question_id", existingId);
      if (delTopicRelErr) {
        throw new Error(`[ABORT] Falha ao limpar tópicos da questão ${q.external_id}: ${delTopicRelErr.message}`);
      }

      const { error: insTopicRelErr } = await supabase
        .from("question_topic_relations")
        .insert({
          question_id: existingId,
          topic_id: plan.targetTopicId,
          relation_type: "primary",
          relevance: 100,
          sort_order: 0,
        });
      if (insTopicRelErr) {
        throw new Error(`[ABORT] Falha ao associar tópico ${plan.targetTopicId} à questão ${q.external_id}: ${insTopicRelErr.message}`);
      }

      // 6. Reconciliar question_discipline_relations (primário)
      const { error: delDiscRelErr } = await supabase
        .from("question_discipline_relations")
        .delete()
        .eq("question_id", existingId);
      if (delDiscRelErr) {
        throw new Error(`[ABORT] Falha ao limpar disciplinas da questão ${q.external_id}: ${delDiscRelErr.message}`);
      }

      const { error: insDiscRelErr } = await supabase
        .from("question_discipline_relations")
        .insert({
          question_id: existingId,
          discipline_id: plan.targetDisciplineId,
          is_primary: true,
        });
      if (insDiscRelErr) {
        throw new Error(`[ABORT] Falha ao associar disciplina ${plan.targetDisciplineId} à questão ${q.external_id}: ${insDiscRelErr.message}`);
      }
    }

    receiptItems.push({
      external_id: q.external_id,
      id: existingId,
      disposition: "published",
      before_statement_sha256: beforeHash,
      after_statement_sha256: afterHash,
      topic_id: plan.targetTopicId,
      discipline_id: plan.targetDisciplineId,
    });
  }

  // B. Processamento das 4 questões anuladas (Q30, Q78, Q87, Q97)
  for (const ann of annulledUpdates) {
    const existingId = ann.id;
    const beforeHash = sha256(ann.existing.statement_markdown);

    const explanationBody = (
      `Questão do TJSP (Escrevente Técnico Judiciário - Caderno Versão 2):\n\n` +
      `- **Status Oficial:** Questão ANULADA pela Fundação Vunesp no Gabarito Oficial Definitivo pós-recursos.\n` +
      `- Motivo da anulação: Decisão da banca examinadora publicada no Diário da Justiça Eletrônico de SP. ` +
      `A pontuação foi atribuída a todos os candidatos.\n` +
      `- Esta questão está arquivada no sistema e não aceita novas resoluções.`
    );

    if (!isDryRun) {
      // 1. Atualizar status para archived e gravar metadata com answer_status = 'anulada'
      const { error: updQErr } = await supabase
        .from("questions")
        .update({
          status: "archived",
          source_metadata: {
            ...ann.existing.source_metadata,
            answer_status: "anulada",
            disclaimer: "Questão anulada pela banca",
            official_annulment: true,
            publication: "DJE SP - Gabarito Oficial Definitivo pós-recursos",
            audit_applied_at: new Date().toISOString(),
            manifest_origin: ann.manifest.origin,
            manifest_answer: ann.manifest.answer,
          },
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingId);

      if (updQErr) {
        throw new Error(`[ABORT] Falha ao arquivar questão anulada ${ann.external_id}: ${updQErr.message}`);
      }

      // 2. Remover chave de gabarito para não permitir envio de respostas válidas
      const { error: delKeyErr } = await supabase
        .from("question_answer_keys")
        .delete()
        .eq("question_id", existingId);

      if (delKeyErr) {
        throw new Error(`[ABORT] Falha ao remover gabarito da questão anulada ${ann.external_id}: ${delKeyErr.message}`);
      }

      // 3. Cadastrar explicação didática registrando a anulação
      const { error: updExpErr } = await supabase
        .from("question_explanations")
        .upsert(
          {
            question_id: existingId,
            body_markdown: explanationBody,
            source_reference: "Fundação Vunesp - Gabarito Oficial Definitivo pós-recursos (DJE SP)",
            status: "published",
            reviewed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          { onConflict: "question_id" }
        );

      if (updExpErr) {
        throw new Error(`[ABORT] Falha ao gravar explicação de anulação da questão ${ann.external_id}: ${updExpErr.message}`);
      }
    }

    receiptItems.push({
      external_id: ann.external_id,
      id: existingId,
      disposition: "archived",
      before_statement_sha256: beforeHash,
      after_statement_sha256: beforeHash,
      reason: ann.manifest.reason,
    });
  }

  // 7. Persistência do recibo detalhado da operação
  const receiptFileName = `recibo_aplicacao_editorial_${timestamp}.json`;
  const receiptPath = path.join(ROOT, "docs/questoes-workflow", receiptFileName);

  const receipt = {
    schema_version: "pro-questions/audit-receipt/v1",
    applied_at: new Date().toISOString(),
    is_dry_run: isDryRun,
    batch_file: values.batch,
    batch_sha256: batchHash,
    manifest_file: values.manifest,
    manifest_sha256: manifestHash,
    backup_file: backupFileName,
    backup_sha256: backupSha256,
    summary: {
      total_items: receiptItems.length,
      published_ready: plannedUpdates.length,
      archived_annulled: annulledUpdates.length,
    },
    items: receiptItems,
  };

  await writeFile(receiptPath, JSON.stringify(receipt, null, 2), "utf8");
  console.log(`\nRecibo de auditoria persistido em: ${receiptPath}`);
  console.log(`Itens processados: ${receiptItems.length} (Publicadas: ${plannedUpdates.length}, Arquivadas/Anuladas: ${annulledUpdates.length})`);
  console.log(isDryRun ? "DRY-RUN concluído com sucesso." : "APLICAÇÃO EFETIVADA com sucesso no banco de dados.");
}

main().catch((err) => {
  console.error("ERRO CRÍTICO na aplicação editorial:", err);
  process.exit(1);
});
