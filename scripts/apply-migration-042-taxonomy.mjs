import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  throw new Error("Ambiente Supabase administrativo indisponível.");
}

const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const NEW_DISCIPLINES = [
  { slug: "matematica", name: "Matemática", status: "active" },
  { slug: "raciocinio-logico", name: "Raciocínio Lógico", status: "active" },
  { slug: "estatistica", name: "Estatística", status: "active" },
  { slug: "matematica-financeira", name: "Matemática Financeira", status: "active" },
  { slug: "direito-penal-militar", name: "Direito Penal Militar", status: "active" },
  { slug: "direito-processual-penal-militar", name: "Direito Processual Penal Militar", status: "active" },
];

const NEW_TOPICS = [
  { topic_id: "aritmetica-e-algebra", title: "Aritmética e Álgebra", discipline: "Matemática" },
  { topic_id: "geometria-plana-e-espacial", title: "Geometria Plana e Espacial", discipline: "Matemática" },
  { topic_id: "porcentagem-e-proporcionalidade", title: "Porcentagem e Proporcionalidade", discipline: "Matemática" },
  { topic_id: "proposicoes-e-conectivos-logicos", title: "Proposições e Conectivos Lógicos", discipline: "Raciocínio Lógico" },
  { topic_id: "estruturas-logicas-e-diagramas-logicos", title: "Estruturas Lógicas e Diagramas Lógicos", discipline: "Raciocínio Lógico" },
  { topic_id: "tabelas-verdade-e-equivalencias-logicas", title: "Tabelas-Verdade e Equivalências Lógicas", discipline: "Raciocínio Lógico" },
  { topic_id: "estatistica-descritiva", title: "Estatística Descritiva", discipline: "Estatística" },
  { topic_id: "probabilidade-e-distribuicoes", title: "Probabilidade e Distribuições", discipline: "Estatística" },
  { topic_id: "amostragem-e-inferencia-estatistica", title: "Amostragem e Inferência Estatística", discipline: "Estatística" },
  { topic_id: "juros-simples-e-compostos", title: "Juros Simples e Compostos", discipline: "Matemática Financeira" },
  { topic_id: "sistemas-de-amortizacao", title: "Sistemas de Amortização", discipline: "Matemática Financeira" },
  { topic_id: "taxas-de-juros-e-inflacao", title: "Taxas de Juros e Inflação", discipline: "Matemática Financeira" },
  { topic_id: "aplicacao-da-lei-penal-militar", title: "Aplicação da Lei Penal Militar (CPM)", discipline: "Direito Penal Militar" },
  { topic_id: "crimes-militares-em-tempo-de-paz", title: "Crimes Militares em Tempo de Paz", discipline: "Direito Penal Militar" },
  { topic_id: "crimes-contra-a-autoridade-ou-disciplina-militar", title: "Crimes contra a Autoridade ou Disciplina Militar", discipline: "Direito Penal Militar" },
  { topic_id: "penas-e-medidas-de-seguranca-no-cpm", title: "Penas e Medidas de Segurança no CPM", discipline: "Direito Penal Militar" },
  { topic_id: "processo-penal-militar-inquerito-policial-militar", title: "Inquérito Policial Militar (IPM)", discipline: "Direito Processual Penal Militar" },
  { topic_id: "acao-penal-militar-e-processo-ordinario", title: "Ação Penal Militar e Processo Ordinário", discipline: "Direito Processual Penal Militar" },
  { topic_id: "jurisdicao-e-competencia-da-justica-militar", title: "Jurisdição e Competência da Justiça Militar", discipline: "Direito Processual Penal Militar" },
  { topic_id: "recursos-no-processo-penal-militar", title: "Recursos no Processo Penal Militar (CPPM)", discipline: "Direito Processual Penal Militar" },
  { topic_id: "politicas-publicas-e-abastecimento-agricola-conab", title: "Políticas Públicas e Abastecimento Agrícola (CONAB)", discipline: "Administração Pública" },
  { topic_id: "organizacao-e-legislacao-da-justica-militar-da-uniao", title: "Organização e Legislação da Justiça Militar da União", discipline: "Administração Pública" },
  { topic_id: "regimento-interno-do-superior-tribunal-militar", title: "Regimento Interno do Superior Tribunal Militar (STM)", discipline: "Administração Pública" },
];

export async function applyMigration042() {
  console.log("Iniciando Migration 042: Separação quantitativa e expansão taxonômica...");

  // 1. Inserir ou atualizar disciplinas
  console.log(`Inserindo/sincronizando ${NEW_DISCIPLINES.length} disciplinas...`);
  for (const d of NEW_DISCIPLINES) {
    const { data: existing } = await supabase.from("disciplines").select("id, slug, status").eq("slug", d.slug).maybeSingle();
    if (existing) {
      if (existing.status !== "active") {
        await supabase.from("disciplines").update({ status: "active", name: d.name }).eq("id", existing.id);
      }
    } else {
      await supabase.from("disciplines").insert({ slug: d.slug, name: d.name, status: "active" });
    }
  }

  // Obter mapa completo de disciplinas
  const { data: disciplines } = await supabase.from("disciplines").select("id, slug, name, status");
  const discBySlug = new Map(disciplines.map(d => [d.slug, d]));
  const discByName = new Map(disciplines.map(d => [d.name, d]));

  // 2. Inserir novos tópicos
  console.log(`Inserindo/sincronizando ${NEW_TOPICS.length} tópicos...`);
  const topicsToUpsert = NEW_TOPICS.map(t => ({
    topic_id: t.topic_id,
    title: t.title,
    discipline: t.discipline,
    archived_at: null,
  }));
  const { error: tErr } = await supabase.from("topics").upsert(topicsToUpsert, { onConflict: "topic_id" });
  if (tErr) throw new Error(`Falha ao inserir tópicos: ${tErr.message}`);

  // 3. Atualizar relações para os 4 tópicos quantitativos preexistentes
  console.log("Remanejando tópicos quantitativos existentes para suas novas disciplinas...");
  const oldDisc = discBySlug.get("raciocinio-logico-matematica-estatistica-e-matematica-financeira");
  const quantTopics = [
    { topic_id: "matematica", target_slug: "matematica" },
    { topic_id: "raciocinio-logico", target_slug: "raciocinio-logico" },
    { topic_id: "estatistica", target_slug: "estatistica" },
    { topic_id: "matematica-financeira", target_slug: "matematica-financeira" },
  ];

  for (const qt of quantTopics) {
    const targetDisc = discBySlug.get(qt.target_slug);
    if (!targetDisc) throw new Error(`Disciplina destino não encontrada: ${qt.target_slug}`);

    // Excluir relação com disciplina composta antiga para não violar idx_topic_discipline_one_primary
    if (oldDisc) {
      await supabase.from("topic_discipline_relations").delete().eq("topic_id", qt.topic_id).eq("discipline_id", oldDisc.id);
    }
    await supabase.from("topic_discipline_relations").upsert({
      topic_id: qt.topic_id,
      discipline_id: targetDisc.id,
      is_primary: true
    }, { onConflict: "topic_id,discipline_id" });
  }

  // Sincronizar relações dos novos tópicos
  console.log("Inserindo relações dos novos tópicos...");
  const newRelations = [
    { topic_id: "aritmetica-e-algebra", discipline_slug: "matematica" },
    { topic_id: "geometria-plana-e-espacial", discipline_slug: "matematica" },
    { topic_id: "porcentagem-e-proporcionalidade", discipline_slug: "matematica" },
    { topic_id: "proposicoes-e-conectivos-logicos", discipline_slug: "raciocinio-logico" },
    { topic_id: "estruturas-logicas-e-diagramas-logicos", discipline_slug: "raciocinio-logico" },
    { topic_id: "tabelas-verdade-e-equivalencias-logicas", discipline_slug: "raciocinio-logico" },
    { topic_id: "estatistica-descritiva", discipline_slug: "estatistica" },
    { topic_id: "probabilidade-e-distribuicoes", discipline_slug: "estatistica" },
    { topic_id: "amostragem-e-inferencia-estatistica", discipline_slug: "estatistica" },
    { topic_id: "juros-simples-e-compostos", discipline_slug: "matematica-financeira" },
    { topic_id: "sistemas-de-amortizacao", discipline_slug: "matematica-financeira" },
    { topic_id: "taxas-de-juros-e-inflacao", discipline_slug: "matematica-financeira" },
    { topic_id: "aplicacao-da-lei-penal-militar", discipline_slug: "direito-penal-militar" },
    { topic_id: "crimes-militares-em-tempo-de-paz", discipline_slug: "direito-penal-militar" },
    { topic_id: "crimes-contra-a-autoridade-ou-disciplina-militar", discipline_slug: "direito-penal-militar" },
    { topic_id: "penas-e-medidas-de-seguranca-no-cpm", discipline_slug: "direito-penal-militar" },
    { topic_id: "processo-penal-militar-inquerito-policial-militar", discipline_slug: "direito-processual-penal-militar" },
    { topic_id: "acao-penal-militar-e-processo-ordinario", discipline_slug: "direito-processual-penal-militar" },
    { topic_id: "jurisdicao-e-competencia-da-justica-militar", discipline_slug: "direito-processual-penal-militar" },
    { topic_id: "recursos-no-processo-penal-militar", discipline_slug: "direito-processual-penal-militar" },
    { topic_id: "politicas-publicas-e-abastecimento-agricola-conab", discipline_slug: "administracao-publica" },
    { topic_id: "organizacao-e-legislacao-da-justica-militar-da-uniao", discipline_slug: "administracao-publica" },
    { topic_id: "regimento-interno-do-superior-tribunal-militar", discipline_slug: "administracao-publica" },
  ];

  for (const nr of newRelations) {
    const disc = discBySlug.get(nr.discipline_slug);
    if (!disc) throw new Error(`Disciplina destino não encontrada: ${nr.discipline_slug}`);
    await supabase.from("topic_discipline_relations").upsert({
      topic_id: nr.topic_id,
      discipline_id: disc.id,
      is_primary: true
    }, { onConflict: "topic_id,discipline_id" });
  }

  // 4. Reclassificar as 82 questões quantitativas
  if (oldDisc) {
    console.log("Reclassificando questões da disciplina composta...");
    const { data: qDiscs } = await supabase.from("question_discipline_relations").select("question_id, discipline_id, is_primary").eq("discipline_id", oldDisc.id);
    console.log(`Encontradas ${qDiscs?.length || 0} questões ligadas à disciplina composta.`);

    if (qDiscs && qDiscs.length > 0) {
      const qIds = qDiscs.map(q => q.question_id);
      const { data: qTopics } = await supabase.from("question_topic_relations").select("question_id, topic_id, relation_type").in("question_id", qIds).eq("relation_type", "primary");
      const topicByQ = new Map(qTopics.map(qt => [qt.question_id, qt.topic_id]));

      let reclassified = 0;
      for (const qd of qDiscs) {
        const topId = topicByQ.get(qd.question_id);
        let targetSlug = "raciocinio-logico";
        if (topId === "matematica") targetSlug = "matematica";
        else if (topId === "estatistica") targetSlug = "estatistica";
        else if (topId === "matematica-financeira") targetSlug = "matematica-financeira";
        else if (topId === "raciocinio-logico") targetSlug = "raciocinio-logico";

        const targetDisc = discBySlug.get(targetSlug);
        if (!targetDisc) throw new Error(`Disciplina de destino não encontrada: ${targetSlug}`);

        const { error: updErr } = await supabase
          .from("question_discipline_relations")
          .update({ discipline_id: targetDisc.id })
          .eq("question_id", qd.question_id)
          .eq("discipline_id", oldDisc.id);
        if (updErr) throw new Error(`Falha ao reclassificar questão ${qd.question_id}: ${updErr.message}`);
        reclassified++;
      }
      console.log(`Reclassificadas com sucesso ${reclassified} questões.`);
    }

    // 5. Arquivar a disciplina composta
    console.log("Arquivando disciplina composta legada...");
    await supabase.from("disciplines").update({ status: "archived" }).eq("id", oldDisc.id);
  }

  console.log("Migration 042 concluída com sucesso!");
}

if (process.argv[1]?.endsWith("apply-migration-042-taxonomy.mjs")) {
  applyMigration042().catch(err => {
    console.error("Erro na Migration 042:", err);
    process.exitCode = 1;
  });
}
