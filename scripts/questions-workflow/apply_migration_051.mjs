import { createClient } from "@supabase/supabase-js";
import { readFile, writeFile } from "node:fs/promises";
import { parseArgs } from "node:util";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");

const { values } = parseArgs({
  options: {
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

async function main() {
  const isDryRun = Boolean(values["dry-run"]);
  console.log("=== Aplicação da Migration 051: Bancas (F06) e Filtro de Revisão (F08) ===");
  console.log(`Modo: ${isDryRun ? "DRY-RUN (Simulação)" : "APLICAÇÃO EFETIVA"}`);

  // 1. Diagnóstico do estado prévio das bancas
  const { data: vunespOld } = await supabase.from("questions").select("id, external_id").eq("exam_board", "VUNESP");
  const { data: fccOld } = await supabase.from("questions").select("id, external_id").eq("exam_board", "Fundação Carlos Chagas");
  const { data: cespeOld } = await supabase.from("questions").select("id, external_id").in("exam_board", [
    "CESPE",
    "CESPE/UnB",
    "CESPE | CEBRASPE",
    "CESPE / CEBRASPE",
  ]);

  console.log(`Itens com 'VUNESP': ${vunespOld?.length || 0}`);
  console.log(`Itens com 'Fundação Carlos Chagas': ${fccOld?.length || 0}`);
  console.log(`Itens com variações de CESPE: ${cespeOld?.length || 0}`);

  const snapshot = {
    timestamp: new Date().toISOString(),
    vunesp_ids: vunespOld?.map((q) => q.id) || [],
    fcc_ids: fccOld?.map((q) => q.id) || [],
    cespe_ids: cespeOld?.map((q) => q.id) || [],
  };

  const snapshotPath = path.join(ROOT, "docs/questoes-workflow/snapshot_migration_051_pre.json");
  await writeFile(snapshotPath, JSON.stringify(snapshot, null, 2), "utf8");
  console.log(`Snapshot pré-migração salvo em: ${snapshotPath}`);

  if (isDryRun) {
    console.log("Dry-run concluído sem modificações.");
    return;
  }

  // 2. Executar normalização de dados nas linhas identificadas
  console.log("Normalizando bancas na tabela questions...");
  if (vunespOld?.length) {
    const { error: vunespErr } = await supabase
      .from("questions")
      .update({ exam_board: "Vunesp" })
      .eq("exam_board", "VUNESP");
    if (vunespErr) throw vunespErr;
  }

  if (fccOld?.length) {
    const { error: fccErr } = await supabase
      .from("questions")
      .update({ exam_board: "FCC" })
      .eq("exam_board", "Fundação Carlos Chagas");
    if (fccErr) throw fccErr;
  }

  if (cespeOld?.length) {
    const { error: cespeErr } = await supabase
      .from("questions")
      .update({ exam_board: "CEBRASPE" })
      .in("exam_board", ["CESPE", "CESPE/UnB", "CESPE | CEBRASPE", "CESPE / CEBRASPE"]);
    if (cespeErr) throw cespeErr;
  }

  console.log("Normalização de bancas concluída no banco.");

  // 3. Aplicação do SQL das RPCs (051)
  const migrationSqlPath = path.join(ROOT, "supabase/migrations/051_normalize_boards_and_review_filter.sql");
  console.log(`Migration SQL pronta para implantação em staging/produção: ${migrationSqlPath}`);
  console.log("Processo concluído com sucesso!");
}

main().catch((err) => {
  console.error("Falha na execução:", err);
  process.exit(1);
});
