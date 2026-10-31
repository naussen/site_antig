import { readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve, join } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

async function main() {
  const batchesDir = resolve("scratch/workflow-campanha-20261030/batches");
  const receiptsDir = resolve("scratch/workflow-campanha-20261030/receipts");
  await mkdir(receiptsDir, { recursive: true });

  const files = (await readdir(batchesDir))
    .filter((f) => f.endsWith(".json"))
    .sort();

  console.log(`Encontrados ${files.length} lotes para importar.`);

  const summary = {
    started_at: new Date().toISOString(),
    total_batches: files.length,
    success_count: 0,
    failed_count: 0,
    total_questions: 0,
    receipts: [],
  };

  const adminScript = resolve("scripts/questions-admin.mjs");
  const envFile = "C:\\PRO\\site\\.env.local";

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const filePath = join(batchesDir, file);
    const batchData = JSON.parse(await readFile(filePath, "utf8"));
    const batchKey = batchData.batch_key;
    const qCount = batchData.questions.length;

    console.log(`[${i + 1}/${files.length}] Importando ${file} (${batchKey}, ${qCount} questões)...`);

    try {
      // 1. Import Apply
      const importCmd = await execFileAsync("node", [
        `--env-file=${envFile}`,
        adminScript,
        "import",
        "--file",
        filePath,
        "--apply",
        "--confirm",
        batchKey,
      ]);

      const importOutput = JSON.parse(importCmd.stdout.trim());

      // 2. Verify
      const verifyCmd = await execFileAsync("node", [
        `--env-file=${envFile}`,
        adminScript,
        "verify",
        "--file",
        filePath,
      ]);

      const verifyOutput = JSON.parse(verifyCmd.stdout.trim());

      const receipt = {
        batch_file: file,
        batch_key: batchKey,
        question_count: qCount,
        imported_at: new Date().toISOString(),
        import_result: importOutput.result,
        verification_checks: verifyOutput.checks,
        records: verifyOutput.records,
        status: "SUCCESS",
      };

      await writeFile(
        join(receiptsDir, `${batchKey}.json`),
        JSON.stringify(receipt, null, 2),
        "utf8"
      );

      summary.success_count++;
      summary.total_questions += qCount;
      summary.receipts.push({
        batch_key: batchKey,
        questions: qCount,
        status: "SUCCESS",
      });

      console.log(`  ✓ Sucesso: ${batchKey} verificado com êxito.`);
    } catch (err) {
      console.error(`  ✗ Erro em ${file}: ${err.message}`);
      if (err.stderr) console.error(err.stderr);
      if (err.stdout) console.log(err.stdout);
      summary.failed_count++;
      summary.receipts.push({
        batch_key: batchKey,
        questions: qCount,
        status: "FAILED",
        error: err.message,
      });
      break; // parar em caso de erro para não corromper lote
    }
  }

  summary.finished_at = new Date().toISOString();
  await writeFile(
    join(receiptsDir, "_summary_importacao.json"),
    JSON.stringify(summary, null, 2),
    "utf8"
  );

  console.log("\n==========================================");
  console.log(`Total de lotes processados com sucesso: ${summary.success_count}/${summary.total_batches}`);
  console.log(`Total de questões importadas: ${summary.total_questions}`);
  console.log(`Falhas: ${summary.failed_count}`);
  console.log("==========================================");

  if (summary.failed_count > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Erro fatal no importador:", err);
  process.exit(1);
});
