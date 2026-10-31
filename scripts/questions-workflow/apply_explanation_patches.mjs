import { createClient } from "@supabase/supabase-js";
import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { parseArgs } from "node:util";
import { validateExplanationQuality } from "./explanation_validator.mjs";

const { values } = parseArgs({
  options: {
    proposal: { type: "string", default: "scripts/questions-workflow/proposals_20261031.json" },
    "dry-run": { type: "boolean", default: false },
    "atomic-unit": { type: "string", default: "batch" },
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
  return createHash("sha256").update(Buffer.from(text || "", "utf8")).digest("hex");
}

async function main() {
  const isDryRun = Boolean(values["dry-run"]);
  const atomicUnit = values["atomic-unit"] === "individual" ? "individual" : "batch";
  console.log(`=== Aplicação Atômica de Patches Editoriais ===`);
  console.log(`Modo: ${isDryRun ? "DRY-RUN (Simulação)" : "PRODUÇÃO"} | Unidade Atômica: ${atomicUnit.toUpperCase()}`);

  const proposals = JSON.parse(await readFile(values.proposal, "utf8"));
  console.log(`Propostas carregadas: ${proposals.length} itens.`);

  // 1. Ler estado atual no banco para validação semântica e pré-auditoria
  const questionIds = proposals.map((p) => p.question_id);
  const { data: currentExplanations, error: expErr } = await supabase
    .from("question_explanations")
    .select("question_id, body_markdown, status, source_reference, updated_at")
    .in("question_id", questionIds);
  if (expErr) throw expErr;

  const currentMap = new Map(currentExplanations.map((e) => [e.question_id, e]));

  const { data: questions, error: qErr } = await supabase
    .from("questions")
    .select("id, external_id, statement_markdown")
    .in("id", questionIds);
  if (qErr) throw qErr;
  const qMap = new Map(questions.map((q) => [q.id, q]));

  // 2. Conferir pré-condições locais e validar semanticamente cada item
  console.log("\nVerificando pré-condições locais e qualidade semântica...");
  const validationFailures = [];
  const patchesPayload = [];

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
    const stmtHash = q ? sha256(q.statement_markdown) : null;

    const mockQuestion = {
      statement_markdown: q?.statement_markdown || "",
      explanation: { body_markdown: prop.new_body_markdown },
      source_metadata: { discipline_slug: prop.discipline_slug },
    };

    const valResult = validateExplanationQuality(mockQuestion, { disciplineSlug: prop.discipline_slug });
    if (!valResult.valid) {
      validationFailures.push(
        `${prop.external_id}: falha na validação semântica da proposta: ${JSON.stringify(valResult.errors)}`
      );
      continue;
    }

    patchesPayload.push({
      question_id: prop.question_id,
      expected_explanation_sha256: prop.expected_sha256,
      expected_statement_sha256: stmtHash,
      new_body_markdown: prop.new_body_markdown,
      reason: prop.reason || "Auditoria de memória de cálculo didática",
    });
  }

  if (validationFailures.length > 0) {
    console.error("Aborte preventivo por falha de pré-condição ou validação semântica:");
    for (const f of validationFailures) console.error(" - " + f);
    process.exit(1);
  }

  console.log("Pré-condições e validações semânticas aprovadas para todos os itens.");

  if (isDryRun) {
    console.log("\nSimulação (dry-run) concluída com sucesso. Nenhuma alteração persistida no banco.");
    return;
  }

  // 3. Execução Server-Side Atômica com Row Locking (RPC 045)
  console.log(`\nDisparando transação atômica server-side (${atomicUnit})...`);
  const { data: rpcResult, error: rpcErr } = await supabase.rpc("apply_atomic_explanation_patches", {
    p_payload: {
      atomic_unit: atomicUnit,
      patches: patchesPayload,
    },
  });

  if (rpcErr) {
    throw new Error(`Falha na transação atômica de gravação: ${rpcErr.message}`);
  }

  if (!rpcResult.success) {
    throw new Error(`A transação reportou falha em um ou mais itens: ${JSON.stringify(rpcResult)}`);
  }

  console.log(`Transação server-side executada com sucesso! Itens alterados: ${rpcResult.applied_count}`);

  // 4. Verificação pós-gravação (releitura 100% dos dados diretamente no banco)
  console.log("\nExecutando releitura pós-gravação e auditoria de integridade...");
  const { data: verifiedRows, error: vErr } = await supabase
    .from("question_explanations")
    .select("question_id, body_markdown, updated_at")
    .in("question_id", questionIds);
  if (vErr) throw vErr;

  const verifiedMap = new Map(verifiedRows.map((r) => [r.question_id, r]));
  const receiptItems = [];

  for (const prop of proposals) {
    const verified = verifiedMap.get(prop.question_id);
    if (!verified || verified.body_markdown !== prop.new_body_markdown) {
      throw new Error(`Falha de integridade na releitura pós-gravação em ${prop.external_id}`);
    }
    const appliedHash = sha256(verified.body_markdown);
    receiptItems.push({
      question_id: prop.question_id,
      external_id: prop.external_id,
      discipline_slug: prop.discipline_slug,
      previous_sha256: prop.expected_sha256,
      new_sha256: appliedHash,
      reason: prop.reason,
      applied_at: verified.updated_at,
    });
  }

  const receipt = {
    captured_at: new Date().toISOString(),
    operation: "apply_atomic_explanation_patches",
    atomic_unit: atomicUnit,
    item_count: receiptItems.length,
    items: receiptItems,
  };

  const receiptPath = "docs/questoes-workflow/atualizacao_memorias_calculo_20261031.json";
  await writeFile(receiptPath, JSON.stringify(receipt, null, 2), "utf8");
  console.log(`Recibo auditável atualizado com sucesso em ${receiptPath}.`);
}

main().catch((err) => {
  console.error("Erro na execução:", err);
  process.exit(1);
});
