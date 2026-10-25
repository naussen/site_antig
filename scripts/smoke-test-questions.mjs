import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("Ambiente indisponível.");

const supabase = createClient(url, key, { auth: { persistSession: false } });

async function smoke() {
  console.log("=== EXECUTANDO SMOKE TEST DE QUESTÕES NO SUPABASE ===");

  // 1. Contagem total de questões no banco
  const { count: qCount, error: qErr } = await supabase
    .from("questions")
    .select("*", { count: "exact", head: true });
  if (qErr) throw qErr;
  console.log(`1. Total de questões publicadas no banco: ${qCount}`);

  // 2. Contagem de questões por disciplina
  const { data: rels, error: rErr } = await supabase
    .from("question_discipline_relations")
    .select("discipline_id, disciplines(slug, name)");
  if (rErr) throw rErr;

  const countByDisc = {};
  for (const r of rels) {
    const slug = r.disciplines?.slug || "desconhecido";
    countByDisc[slug] = (countByDisc[slug] || 0) + 1;
  }

  console.log(`\n2. Disciplinas com questões ativas (${Object.keys(countByDisc).length} disciplinas):`);
  for (const [slug, cnt] of Object.entries(countByDisc).sort((a, b) => b[1] - a[1])) {
    console.log(`   - ${slug}: ${cnt} questões`);
  }

  // 3. Teste RPC list_question_disciplines
  const { data: rpcDisc, error: rpcErr } = await supabase.rpc("list_question_disciplines");
  if (rpcErr) {
    console.warn("Aviso na RPC list_question_disciplines:", rpcErr.message);
  } else {
    console.log(`\n3. RPC list_question_disciplines retornou ${rpcDisc?.length || 0} disciplinas ativas.`);
  }

  console.log("\nSMOKE TEST CONCLUÍDO COM SUCESSO!");
}

smoke().catch(err => {
  console.error("ERRO NO SMOKE:", err);
  process.exitCode = 1;
});
