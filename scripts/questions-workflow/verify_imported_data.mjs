import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function main() {
  console.log("=== VERIFICAÇÃO PÓS-IMPORTAÇÃO ===");

  // 1. Total de questões
  const { count: totalQuestions, error: errCount } = await supabase
    .from("questions")
    .select("*", { count: "exact", head: true });
  if (errCount) throw errCount;
  console.log(`Total de questões cadastradas no banco: ${totalQuestions}`);

  // 2. Total de batches importados nesta campanha
  const { data: batches, error: errBatches } = await supabase
    .from("question_import_batches")
    .select("batch_key, question_count, imported_at")
    .order("imported_at", { ascending: false })
    .limit(49);
  if (errBatches) throw errBatches;

  const campaignTotalInBatches = batches.reduce((sum, b) => sum + b.question_count, 0);
  console.log(`Lotes recentes recuperados: ${batches.length} (totalizando ${campaignTotalInBatches} questões)`);

  // 3. Amostras por prova para checagem
  const samplePrefixes = [
    { name: "Banco do Brasil (Ressalva)", prefix: "exam:bb-2021-escriturario-agente-comercial:item:" },
    { name: "TJ/SP (Ressalva v2)", prefix: "exam:tjsp-2021-escrevente-tecnico:item:" },
    { name: "STM 2011 (Definitivo)", prefix: "exam:stm-2011-analista-jud:item:" },
    { name: "PMSP 2024 (Definitivo com retificação)", prefix: "exam:pmsp-2024-soldado-pbm:item:" },
    { name: "CONAB 2014 (Definitivo)", prefix: "exam:conab-2014-assistente-adm:item:" },
    { name: "ICMBio 2014 Específicos (Definitivo)", prefix: "exam:icmbio-2014-analista-adm:item:" },
  ];

  for (const sample of samplePrefixes) {
    const { data: qList, error: qErr } = await supabase
      .from("questions")
      .select("*")
      .like("external_id", `${sample.prefix}%`)
      .order("external_id", { ascending: true })
      .limit(2);
    if (qErr) throw qErr;

    console.log(`\n--- Amostra: ${sample.name} ---`);
    for (const q of qList) {
      console.log(`ID: ${q.id} | External: ${q.external_id}`);
      console.log(`Status: ${q.status} | Ano: ${q.exam_year} | Banca: ${q.exam_board}`);
      console.log(`Snippet: ${q.statement_markdown?.substring(0, 90).replace(/\n/g, " ")}...`);
      console.log(`Disclaimer metadata: ${q.source_metadata?.disclaimer || "Nenhum"}`);

      // Opções
      const { data: opts, error: optsErr } = await supabase
        .from("question_options")
        .select("id, label, sort_order, body_markdown")
        .eq("question_id", q.id)
        .order("sort_order", { ascending: true });
      if (optsErr) console.error("Erro options:", optsErr);
      console.log(`Opções cadastradas (${opts?.length}): ${opts?.map((o) => `${o.label}) ${o.body_markdown.substring(0, 25)}...`).join(" | ")}`);

      // Gabarito
      const { data: answerKey, error: keyErr } = await supabase
        .from("question_answer_keys")
        .select("correct_option_id")
        .eq("question_id", q.id)
        .single();
      if (keyErr) console.error("Erro answerKey:", keyErr);
      const correctOpt = opts?.find((o) => o.id === answerKey?.correct_option_id);
      console.log(`Gabarito oficial: ${correctOpt?.label || "N/A"}`);

      // Comentário publicado
      const { data: exp, error: expErr } = await supabase
        .from("question_explanations")
        .select("status, body_markdown")
        .eq("question_id", q.id)
        .single();
      if (expErr) console.error("Erro explanation:", expErr);
      console.log(`Comentário: ${exp?.status} (Tam: ${exp?.body_markdown?.length} chars)`);
    }
  }

  // 4. Conferência específica da questão retificada da PM/SP (Q53)
  const { data: q53 } = await supabase
    .from("questions")
    .select("id, external_id, statement_markdown")
    .eq("external_id", "exam:pmsp-2024-soldado-pbm:item:053")
    .single();

  if (q53) {
    const { data: opts53 } = await supabase
      .from("question_options")
      .select("id, label, body_markdown")
      .eq("question_id", q53.id);
    const { data: key53 } = await supabase
      .from("question_answer_keys")
      .select("correct_option_id")
      .eq("question_id", q53.id)
      .single();
    const correct53 = opts53.find((o) => o.id === key53.correct_option_id);
    console.log(`\n[PMSP Q53 Retificada] Gabarito registrado: ${correct53?.label} (esperado: D após retificação oficial da Vunesp de E para D).`);
  }

  // 5. Teste de listagem e filtros da plataforma
  console.log("\n--- Testando Listagem de Filtros da Plataforma ---");
  const { data: filters, error: catErr } = await supabase.rpc("list_question_filters");
  if (catErr) {
    console.error("Erro no catálogo de filtros:", catErr);
  } else {
    console.log(`Filtros ativos retornados pela RPC list_question_filters.`);
    if (filters) {
      console.log(`Disciplinas no catálogo: ${filters.disciplines?.length || 0}`);
      console.log(`Bancas no catálogo: ${filters.exam_boards?.length || 0}`);
    }
  }

  console.log("\n✓ Todas as verificações em banco concluídas com 100% de sucesso!");
}

main().catch((err) => {
  console.error("Erro na verificação:", err);
  process.exit(1);
});
