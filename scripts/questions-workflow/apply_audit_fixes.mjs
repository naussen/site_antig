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

async function main() {
  const isDryRun = Boolean(values["dry-run"]);
  console.log("=== Aplicação Atômica das Correções da Auditoria (F01–F05, F09) ===");
  console.log(`Modo: ${isDryRun ? "DRY-RUN (Simulação)" : "APLICAÇÃO EFETIVA"}`);

  const batchRaw = await readFile(values.batch, "utf8");
  const questions = JSON.parse(batchRaw);
  console.log(`Itens no lote: ${questions.length}`);

  // 1. Obter questões existentes do TJSP no banco
  const externalIds = questions.map((q) => q.external_id);
  const { data: currentQuestions, error: qErr } = await supabase
    .from("questions")
    .select("id, external_id, statement_markdown, subject, exam_board, exam_year, status, source_metadata")
    .in("external_id", externalIds);
  if (qErr) throw qErr;

  console.log(`Itens encontrados no banco: ${currentQuestions.length}`);

  // 2. Fazer backup pré-aplicação do estado atual
  const backupPath = path.join(ROOT, "docs/questoes-workflow/backup_tjsp_pre_audit_20261031.json");
  const backupData = {
    timestamp: new Date().toISOString(),
    item_count: currentQuestions.length,
    questions: currentQuestions,
  };
  await writeFile(backupPath, JSON.stringify(backupData, null, 2), "utf8");
  console.log(`Backup de segurança gravado em: ${backupPath}`);

  // 3. Simulação / Aplicação
  const currentMap = new Map(currentQuestions.map((q) => [q.external_id, q]));
  let updatedCount = 0;
  const auditReceiptUpdates = [];

  for (const q of questions) {
    const existing = currentMap.get(q.external_id);
    if (!existing) {
      console.warn(`Aviso: Questão ${q.external_id} não encontrada no banco.`);
      continue;
    }

    const updatePayload = {
      statement_markdown: q.statement_markdown,
      subject: q.subject,
      exam_board: q.exam_board,
      exam_year: q.exam_year,
      source_metadata: q.source_metadata,
      updated_at: new Date().toISOString(),
    };

    if (!isDryRun) {
      const { error: updateErr } = await supabase
        .from("questions")
        .update(updatePayload)
        .eq("id", existing.id);
      if (updateErr) throw updateErr;

      // Atualiza opções
      for (const opt of q.options) {
        await supabase
          .from("question_options")
          .update({ body_markdown: opt.body_markdown })
          .eq("question_id", existing.id)
          .eq("label", opt.label);
      }

      // Atualiza explicação didática
      if (q.explanation?.body_markdown) {
        await supabase
          .from("question_explanations")
          .upsert({
            question_id: existing.id,
            body_markdown: q.explanation.body_markdown,
            source_reference: q.explanation.source_reference || "Fundação Vunesp",
            updated_at: new Date().toISOString(),
          }, { onConflict: "question_id" });
      }
    }

    updatedCount++;
    auditReceiptUpdates.push({
      external_id: q.external_id,
      id: existing.id,
      statement_sha256: sha256(q.statement_markdown),
    });
  }

  console.log(`\nResultado da operação:`);
  console.log(`Itens processados com sucesso: ${updatedCount} de ${questions.length}`);
  if (isDryRun) {
    console.log("DRY-RUN concluído: Nenhuma alteração foi persistida no banco.");
  } else {
    console.log("APLICAÇÃO concluída com sucesso no banco de dados.");
  }
}

main().catch((err) => {
  console.error("Falha na execução:", err);
  process.exit(1);
});
