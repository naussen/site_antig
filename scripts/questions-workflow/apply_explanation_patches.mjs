import { createClient } from "@supabase/supabase-js";
import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { parseArgs } from "node:util";
import { validateExplanationQuality } from "./explanation_validator.mjs";

const { values } = parseArgs({
  options: {
    proposal: { type: "string", default: "scripts/questions-workflow/proposals_20261031.json" },
    "dry-run": { type: "boolean", default: false },
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

function sha256(text) {
  return createHash("sha256").update(Buffer.from(text, "utf8")).digest("hex");
}

async function main() {
  const isDryRun = Boolean(values["dry-run"]);
  console.log(`=== Aplicação de Correções Editoriais (Modo: ${isDryRun ? "DRY-RUN (Simulação)" : "PRODUÇÃO"}) ===`);

  const proposals = JSON.parse(await readFile(values.proposal, "utf8"));
  console.log(`Propostas carregadas: ${proposals.length} itens.`);

  // 1. Ler estado atual no banco de dados
  const questionIds = proposals.map((p) => p.question_id);
  const { data: currentExplanations, error: expErr } = await supabase
    .from("question_explanations")
    .select("question_id, body_markdown, status, source_reference, updated_at")
    .in("question_id", questionIds);
  if (expErr) throw expErr;

  const currentMap = new Map(currentExplanations.map((e) => [e.question_id, e]));

  // Buscar enunciados para validação semântica
  const { data: questions, error: qErr } = await supabase
    .from("questions")
    .select("id, external_id, statement_markdown")
    .in("id", questionIds);
  if (qErr) throw qErr;
  const qMap = new Map(questions.map((q) => [q.id, q]));

  // 2. Verificar pré-condições de hash e validar novas explicações
  console.log("\nVerificando pré-condições e validando semanticamente cada item...");
  const validationFailures = [];

  for (const prop of proposals) {
    const current = currentMap.get(prop.question_id);
    if (!current) {
      validationFailures.push(`${prop.external_id}: registro não encontrado no banco.`);
      continue;
    }

    const currentHash = sha256(current.body_markdown);
    if (currentHash !== prop.expected_sha256) {
      validationFailures.push(
        `${prop.external_id}: hash pré-condição diverge! Atual: ${currentHash}, Esperado: ${prop.expected_sha256}`
      );
      continue;
    }

    const q = qMap.get(prop.question_id);
    const mockQuestion = {
      statement_markdown: q.statement_markdown,
      explanation: { body_markdown: prop.new_body_markdown },
      source_metadata: { discipline_slug: prop.discipline_slug },
    };

    const valResult = validateExplanationQuality(mockQuestion, { disciplineSlug: prop.discipline_slug });
    if (!valResult.valid) {
      validationFailures.push(
        `${prop.external_id}: falha na validação semântica da proposta: ${JSON.stringify(valResult.errors)}`
      );
    }
  }

  if (validationFailures.length > 0) {
    console.error("Aborte preventivo por falha de pré-condição ou validação semântica:");
    for (const f of validationFailures) console.error(" - " + f);
    process.exit(1);
  }

  console.log("Pré-condições de integridade e qualidade semântica aprovadas para todos os itens.");

  if (isDryRun) {
    console.log("\nSimulação concluída com sucesso. Nenhuma alteração gravada.");
    return;
  }

  // 3. Atualizar explicações no banco
  console.log("\nExecutando atualizações transacionais por registro...");
  const receiptItems = [];

  for (const prop of proposals) {
    const current = currentMap.get(prop.question_id);
    const nowIso = new Date().toISOString();

    const { error: updErr } = await supabase
      .from("question_explanations")
      .update({
        body_markdown: prop.new_body_markdown,
        updated_at: nowIso,
      })
      .eq("question_id", prop.question_id);

    if (updErr) {
      throw new Error(`Falha ao atualizar ${prop.external_id}: ${updErr.message}`);
    }

    receiptItems.push({
      question_id: prop.question_id,
      external_id: prop.external_id,
      discipline_slug: prop.discipline_slug,
      previous_sha256: prop.expected_sha256,
      new_sha256: sha256(prop.new_body_markdown),
      reason: prop.reason,
      applied_at: nowIso,
    });
    console.log(` - Atualizado com sucesso: ${prop.external_id}`);
  }

  // 4. Verificação pós-gravação
  console.log("\nConferindo verificação pós-gravação diretamente no banco...");
  const { data: verifiedRows, error: vErr } = await supabase
    .from("question_explanations")
    .select("question_id, body_markdown, updated_at")
    .in("question_id", questionIds);
  if (vErr) throw vErr;

  for (const prop of proposals) {
    const verified = verifiedRows.find((r) => r.question_id === prop.question_id);
    if (!verified || verified.body_markdown !== prop.new_body_markdown) {
      throw new Error(`Falha de verificação pós-gravação em ${prop.external_id}`);
    }
  }

  const receipt = {
    captured_at: new Date().toISOString(),
    operation: "apply_explanation_patches",
    item_count: receiptItems.length,
    items: receiptItems,
  };

  const receiptPath = "docs/questoes-workflow/atualizacao_memorias_calculo_20261031.json";
  await writeFile(receiptPath, JSON.stringify(receipt, null, 2), "utf8");
  console.log(`\nRecibo de atualização auditável salvo em ${receiptPath}.`);
}

main().catch((err) => {
  console.error("Erro na execução:", err);
  process.exit(1);
});
