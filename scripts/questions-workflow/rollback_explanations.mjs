import { createClient } from "@supabase/supabase-js";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { parseArgs } from "node:util";

const { values } = parseArgs({
  options: {
    backup: { type: "string", default: "docs/questoes-workflow/backup_explanations_20261031.json" },
    receipt: { type: "string", default: "docs/questoes-workflow/atualizacao_memorias_calculo_20261031.json" },
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
  console.log(`=== Rollback Condicionado e Atômico de Explicações ===`);
  console.log(`Modo: ${isDryRun ? "DRY-RUN (Simulação)" : "PRODUÇÃO"} | Unidade: ${atomicUnit.toUpperCase()}`);

  const backupData = JSON.parse(await readFile(values.backup, "utf8"));
  const receiptData = JSON.parse(await readFile(values.receipt, "utf8"));

  const backupMap = new Map(backupData.items.map((b) => [b.question_id, b]));

  // Preparar itens de reversão com o hash que se pretende desfazer
  const rollbackItems = [];
  for (const rItem of receiptData.items) {
    const original = backupMap.get(rItem.question_id);
    if (!original) {
      throw new Error(`Registro original não encontrado no backup para ${rItem.external_id}`);
    }

    rollbackItems.push({
      question_id: rItem.question_id,
      applied_sha256: rItem.new_sha256, // O estado no banco DEVE ser exatamente este
      restore_body_markdown: original.body_markdown,
      reason: `Rollback da operação ${receiptData.operation || "apply_atomic_explanation_patches"}`,
    });
  }

  console.log(`Itens a reverter: ${rollbackItems.length}`);

  if (isDryRun) {
    console.log("Simulação (dry-run): verificando se hashes no banco conferem com a versão aplicada...");
    const qIds = rollbackItems.map((i) => i.question_id);
    const { data: currentRows, error: cErr } = await supabase
      .from("question_explanations")
      .select("question_id, body_markdown")
      .in("question_id", qIds);
    if (cErr) throw cErr;

    for (const item of rollbackItems) {
      const cur = currentRows.find((r) => r.question_id === item.question_id);
      const curHash = cur ? sha256(cur.body_markdown) : null;
      if (curHash !== item.applied_sha256) {
        console.warn(`[AVISO] Questão ${item.question_id}: hash atual (${curHash}) diverge do aplicado (${item.applied_sha256}). Rollback seria abortado.`);
      } else {
        console.log(`[OK] Questão ${item.question_id}: hash atual confere com a versão aplicada.`);
      }
    }
    console.log("Simulação concluída. Nenhuma alteração realizada.");
    return;
  }

  // Execução Server-Side Atômica com verificação de pré-condição
  console.log("\nExecutando reversão via RPC 045...");
  const { data: rbResult, error: rbErr } = await supabase.rpc("rollback_atomic_explanation_patches", {
    p_payload: {
      atomic_unit: atomicUnit,
      items: rollbackItems,
    },
  });

  if (rbErr) {
    throw new Error(`Falha no rollback atômico: ${rbErr.message}`);
  }

  if (!rbResult.success) {
    throw new Error(`Rollback reportou falha em um ou mais itens: ${JSON.stringify(rbResult)}`);
  }

  console.log(`Rollback server-side concluído com sucesso. Itens revertidos: ${rbResult.reverted_count}`);
}

main().catch((err) => {
  console.error("Erro no rollback:", err);
  process.exit(1);
});
