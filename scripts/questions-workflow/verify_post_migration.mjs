import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Variáveis de ambiente do Supabase ausentes.");
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const backup = JSON.parse(fs.readFileSync("scratch/backup_quantitativas_pre_migration.json", "utf8"));
const oldDiscId = backup.old_discipline_id;
const targetSlugs = ["matematica", "raciocinio-logico", "estatistica", "matematica-financeira"];

async function verify() {
  console.log("=================================================");
  console.log("VERIFICAÇÃO PÓS-MIGRAÇÃO NO BANCO DE DADOS");
  console.log("=================================================\n");

  let hasError = false;

  // 1. Disciplina composta legada
  const { data: oldDisc, error: odErr } = await supabase.from("disciplines").select("*").eq("id", oldDiscId).single();
  if (odErr) throw odErr;
  console.log(`1. Disciplina legada (${oldDisc.slug}):`);
  console.log(`   - Status: ${oldDisc.status} (esperado: archived)`);
  if (oldDisc.status !== "archived") {
    console.error("   ERRO: Disciplina legada não está com status archived!");
    hasError = true;
  }

  const { count: oldQCount } = await supabase
    .from("question_discipline_relations")
    .select("question_id", { count: "exact", head: true })
    .eq("discipline_id", oldDiscId);
  console.log(`   - Questões ainda vinculadas: ${oldQCount} (esperado: 0)`);
  if (oldQCount !== 0) {
    console.error("   ERRO: Ainda há questões ligadas à disciplina legada!");
    hasError = true;
  }

  // 2. Novas disciplinas individuais
  console.log(`\n2. Novas disciplinas ativas e contagens:`);
  const expectedCounts = {
    matematica: 39,
    "raciocinio-logico": 20,
    estatistica: 10,
    "matematica-financeira": 13,
  };

  const { data: newDiscs, error: ndErr } = await supabase.from("disciplines").select("*").in("slug", targetSlugs);
  if (ndErr) throw ndErr;

  const actualCounts = {};
  for (const d of newDiscs) {
    const { count } = await supabase
      .from("question_discipline_relations")
      .select("question_id", { count: "exact", head: true })
      .eq("discipline_id", d.id);
    actualCounts[d.slug] = count;
    console.log(`   - ${d.name} (${d.slug}): status=${d.status}, questões vinculadas=${count} (esperado: ${expectedCounts[d.slug]})`);
    if (d.status !== "active") {
      console.error(`   ERRO: Disciplina ${d.slug} não está ativa!`);
      hasError = true;
    }
    if (count !== expectedCounts[d.slug]) {
      console.error(`   ERRO: Contagem de questões divergente para ${d.slug}!`);
      hasError = true;
    }
  }

  // 3. Tópicos e relações topic_discipline_relations
  console.log(`\n3. Verificação de tópicos e topic_discipline_relations:`);
  const { data: topics, error: tErr } = await supabase.from("topics").select("topic_id, title, discipline, archived_at").in("topic_id", targetSlugs);
  if (tErr) throw tErr;
  for (const t of topics) {
    console.log(`   - Tópico '${t.topic_id}': discipline='${t.discipline}', archived=${t.archived_at}`);
  }

  const { data: tdr, error: tdrErr } = await supabase.from("topic_discipline_relations").select("topic_id, discipline_id, is_primary").in("topic_id", targetSlugs);
  if (tdrErr) throw tdrErr;
  console.log(`   - Relações primárias tópicos-disciplinas: ${tdr.length} (esperado: 4)`);
  for (const r of tdr) {
    const disc = newDiscs.find((d) => d.id === r.discipline_id);
    console.log(`     Tópico '${r.topic_id}' -> Disciplina '${disc?.slug}' (is_primary: ${r.is_primary})`);
    if (disc?.slug !== r.topic_id) {
      console.error(`     ERRO: Incompatibilidade entre tópico e disciplina!`);
      hasError = true;
    }
  }

  // 4. Integridade das 82 questões em relação ao backup
  console.log(`\n4. Integridade das 82 questões vs Backup:`);
  const qIds = backup.questions.map((q) => q.id);
  const { data: currentQuestions, error: cqErr } = await supabase
    .from("questions")
    .select("id, external_id, source_content_hash, status")
    .in("id", qIds);
  if (cqErr) throw cqErr;

  if (currentQuestions.length !== 82) {
    console.error(`   ERRO: Número de questões no banco (${currentQuestions.length}) difere do backup (82)!`);
    hasError = true;
  }

  let hashMismatch = 0;
  for (const bq of backup.questions) {
    const cur = currentQuestions.find((c) => c.id === bq.id);
    if (!cur) {
      console.error(`   ERRO: Questão ${bq.external_id} (${bq.id}) ausente no banco!`);
      hasError = true;
    } else if (cur.source_content_hash !== bq.source_content_hash) {
      console.error(`   ERRO: Hash alterado para questão ${bq.external_id}!`);
      hashMismatch++;
      hasError = true;
    }
  }
  console.log(`   - 82 questões conferidas. Divergências de hash: ${hashMismatch}`);

  // 5. Integridade de opções e gabaritos
  const { count: curOptCount } = await supabase
    .from("question_options")
    .select("id", { count: "exact", head: true })
    .in("question_id", qIds);
  console.log(`   - Opções de alternativas: ${curOptCount} (backup: ${backup.counts.question_options})`);
  if (curOptCount !== backup.counts.question_options) {
    console.error("   ERRO: Quantidade de opções divergente do backup!");
    hasError = true;
  }

  const { count: curAnsCount } = await supabase
    .from("question_answer_keys")
    .select("question_id", { count: "exact", head: true })
    .in("question_id", qIds);
  console.log(`   - Gabaritos de respostas: ${curAnsCount} (backup: ${backup.counts.question_answer_keys})`);
  if (curAnsCount !== backup.counts.question_answer_keys) {
    console.error("   ERRO: Quantidade de gabaritos divergente do backup!");
    hasError = true;
  }

  // 6. Teste da RPC de busca / contagem por disciplina
  console.log(`\n5. Teste de contagem via busca por disciplina:`);
  for (const slug of targetSlugs) {
    const { count } = await supabase
      .from("questions")
      .select("id, question_discipline_relations!inner(discipline_id, disciplines!inner(slug))", { count: "exact", head: true })
      .eq("status", "published")
      .eq("question_discipline_relations.disciplines.slug", slug);
    console.log(`   - Query questions com slug '${slug}': ${count} questões`);
  }

  const { count: oldSearchCount } = await supabase
    .from("questions")
    .select("id, question_discipline_relations!inner(discipline_id, disciplines!inner(slug))", { count: "exact", head: true })
    .eq("status", "published")
    .eq("question_discipline_relations.disciplines.slug", oldDisc.slug);
  console.log(`   - Query questions com slug antigo: ${oldSearchCount} questões (esperado: 0)`);

  if (!hasError) {
    console.log("\n=================================================");
    console.log("RESULTADO: TODAS AS VERIFICAÇÕES TÉCNICAS APROVADAS!");
    console.log("=================================================\n");
  } else {
    throw new Error("Falhas detectadas na verificação pós-migração!");
  }
}

verify().catch((err) => {
  console.error("Erro na verificação:", err);
  process.exit(1);
});
