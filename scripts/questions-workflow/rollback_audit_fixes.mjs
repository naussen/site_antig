import { createClient } from "@supabase/supabase-js";
import { readFile } from "node:fs/promises";
import { parseArgs } from "node:util";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");

const { values } = parseArgs({
  options: {
    backup: {
      type: "string",
      default: path.join(ROOT, "docs/questoes-workflow/backup_tjsp_pre_audit_20261031.json"),
    },
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

async function main() {
  const isDryRun = Boolean(values["dry-run"]);
  console.log("=== Rollback de Correções da Auditoria TJSP ===");
  console.log(`Modo: ${isDryRun ? "DRY-RUN (Simulação)" : "REVERSÃO EFETIVA"}`);

  const backupRaw = await readFile(values.backup, "utf8");
  const backup = JSON.parse(backupRaw);
  console.log(`Itens no backup: ${backup.questions.length} (gerado em ${backup.timestamp})`);

  let restoredCount = 0;
  for (const q of backup.questions) {
    if (!isDryRun) {
      const { error: err } = await supabase
        .from("questions")
        .update({
          statement_markdown: q.statement_markdown,
          subject: q.subject,
          exam_board: q.exam_board,
          exam_year: q.exam_year,
          source_metadata: q.source_metadata,
          updated_at: new Date().toISOString(),
        })
        .eq("id", q.id);
      if (err) throw err;
    }
    restoredCount++;
  }

  console.log(`\nReversão concluída: ${restoredCount} itens restaurados ao estado anterior.`);
}

main().catch((err) => {
  console.error("Erro no rollback:", err);
  process.exit(1);
});
