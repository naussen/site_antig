import { createClient } from "@supabase/supabase-js";
import { readFile } from "node:fs/promises";
import { parseArgs } from "node:util";

const { values } = parseArgs({
  options: {
    backup: { type: "string", default: "docs/questoes-workflow/backup_explanations_20261031.json" },
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
  console.log(`Revertendo explicações para o estado registrado no backup: ${values.backup}...`);
  const backup = JSON.parse(await readFile(values.backup, "utf8"));

  for (const item of backup.items) {
    const { error } = await supabase
      .from("question_explanations")
      .update({
        body_markdown: item.body_markdown,
        updated_at: new Date().toISOString(),
      })
      .eq("question_id", item.question_id);

    if (error) {
      throw new Error(`Falha ao reverter ${item.external_id}: ${error.message}`);
    }
    console.log(` - Revertido: ${item.external_id}`);
  }

  console.log("Reversão concluída com sucesso.");
}

main().catch((err) => {
  console.error("Erro no rollback:", err);
  process.exit(1);
});
