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

const OLD_DISC_SLUG = "raciocinio-logico-matematica-estatistica-e-matematica-financeira";
const TARGET_DISCIPLINES = [
  { slug: "matematica", name: "Matemática" },
  { slug: "raciocinio-logico", name: "Raciocínio Lógico" },
  { slug: "estatistica", name: "Estatística" },
  { slug: "matematica-financeira", name: "Matemática Financeira" },
];

export async function runMigration({ apply = false, rollback = false } = {}) {
  console.log(`\n==================================================`);
  console.log(`Operação Migration 042: ${rollback ? "ROLLBACK" : apply ? "APPLY (PRODUÇÃO)" : "DRY-RUN (VALIDAÇÃO)"}`);
  console.log(`==================================================\n`);

  // 1. Obter snapshot das disciplinas
  const { data: allDiscs, error: dErr } = await supabase.from("disciplines").select("id, slug, name, status");
  if (dErr) throw new Error("Erro ao buscar disciplinas: " + dErr.message);

  const discMap = new Map(allDiscs.map((d) => [d.slug, d]));
  const oldDisc = discMap.get(OLD_DISC_SLUG);

  if (!rollback) {
    if (!oldDisc) {
      throw new Error(`Disciplina de origem '${OLD_DISC_SLUG}' não encontrada.`);
    }

    // 2. Obter questões na disciplina de origem
    const { data: qdr, error: qdrErr } = await supabase
      .from("question_discipline_relations")
      .select("question_id, is_primary, sort_order")
      .eq("discipline_id", oldDisc.id);
    if (qdrErr) throw new Error("Erro ao buscar question_discipline_relations: " + qdrErr.message);

    console.log(`Questões encontradas na disciplina de origem (${oldDisc.slug}): ${qdr.length}`);
    const qIds = qdr.map((r) => r.question_id);

    // 3. Obter tópicos primários dessas questões
    const { data: qtr, error: qtrErr } = await supabase
      .from("question_topic_relations")
      .select("question_id, topic_id, relation_type")
      .in("question_id", qIds)
      .eq("relation_type", "primary");
    if (qtrErr) throw new Error("Erro ao buscar question_topic_relations: " + qtrErr.message);

    const topicByQ = new Map(qtr.map((t) => [t.question_id, t.topic_id]));

    // Obter dados das questões para relatório
    const { data: questions, error: qErr } = await supabase
      .from("questions")
      .select("id, external_id, subject, statement_markdown, status, source_content_hash")
      .in("id", qIds);
    if (qErr) throw new Error("Erro ao buscar questions: " + qErr.message);

    const questionsById = new Map(questions.map((q) => [q.id, q]));

    // Distribuir questões por tópico
    const distribution = {
      matematica: [],
      "raciocinio-logico": [],
      estatistica: [],
      "matematica-financeira": [],
      desconhecido: [],
    };

    for (const rel of qdr) {
      const topId = topicByQ.get(rel.question_id);
      const q = questionsById.get(rel.question_id);
      const item = {
        question_id: rel.question_id,
        external_id: q?.external_id,
        subject: q?.subject,
        topic_id: topId,
        hash: q?.source_content_hash,
      };

      if (topId === "matematica") distribution.matematica.push(item);
      else if (topId === "raciocinio-logico") distribution["raciocinio-logico"].push(item);
      else if (topId === "estatistica") distribution.estatistica.push(item);
      else if (topId === "matematica-financeira") distribution["matematica-financeira"].push(item);
      else distribution.desconhecido.push(item);
    }

    console.log("Distribuição das 82 questões por disciplina de destino:");
    console.log(`- Matemática: ${distribution.matematica.length}`);
    console.log(`- Raciocínio Lógico: ${distribution["raciocinio-logico"].length}`);
    console.log(`- Estatística: ${distribution.estatistica.length}`);
    console.log(`- Matemática Financeira: ${distribution["matematica-financeira"].length}`);
    if (distribution.desconhecido.length > 0) {
      console.error(`ALERTA: ${distribution.desconhecido.length} questões com tópico não reconhecido!`);
      throw new Error("Questões com tópico não reconhecido detectadas. Abortando.");
    }

    if (!apply) {
      console.log("\n[DRY-RUN] Nenhuma alteração persistida no banco.");
      return { success: true, distribution, applied: false };
    }

    // ====== EXECUÇÃO REAL EM PRODUÇÃO ======
    console.log("\nExecutando migração no banco de dados...");

    // 1. Garantir que as 4 disciplinas existem e estão ativas
    for (const td of TARGET_DISCIPLINES) {
      const existing = discMap.get(td.slug);
      if (existing) {
        if (existing.status !== "active" || existing.name !== td.name) {
          const { error } = await supabase.from("disciplines").update({ status: "active", name: td.name }).eq("id", existing.id);
          if (error) throw new Error(`Falha ao reativar disciplina ${td.slug}: ${error.message}`);
        }
      } else {
        const { error } = await supabase.from("disciplines").insert({ slug: td.slug, name: td.name, status: "active" });
        if (error) throw new Error(`Falha ao criar disciplina ${td.slug}: ${error.message}`);
      }
    }

    // Recarregar disciplinas
    const { data: updatedDiscs } = await supabase.from("disciplines").select("id, slug, name, status");
    const freshDiscMap = new Map(updatedDiscs.map((d) => [d.slug, d]));

    // 2. Atualizar campo textual legado em topics
    for (const td of TARGET_DISCIPLINES) {
      const { error } = await supabase
        .from("topics")
        .update({ discipline: td.name, archived_at: null })
        .eq("topic_id", td.slug);
      if (error) throw new Error(`Falha ao atualizar topics.discipline para ${td.slug}: ${error.message}`);
    }

    // 3. Atualizar topic_discipline_relations
    console.log("Removendo relações antigas dos 4 tópicos com a disciplina composta...");
    const { error: delTdrErr } = await supabase
      .from("topic_discipline_relations")
      .delete()
      .eq("discipline_id", oldDisc.id)
      .in("topic_id", ["matematica", "raciocinio-logico", "estatistica", "matematica-financeira"]);
    if (delTdrErr) throw new Error("Falha ao remover topic_discipline_relations antiga: " + delTdrErr.message);

    console.log("Criando/atualizando relações dos 4 tópicos com suas disciplinas canônicas...");
    for (const td of TARGET_DISCIPLINES) {
      const targetDisc = freshDiscMap.get(td.slug);
      const { error: insTdrErr } = await supabase
        .from("topic_discipline_relations")
        .upsert(
          {
            topic_id: td.slug,
            discipline_id: targetDisc.id,
            is_primary: true,
          },
          { onConflict: "topic_id,discipline_id" }
        );
      if (insTdrErr) throw new Error(`Falha ao vincular tópico ${td.slug} à disciplina ${td.name}: ${insTdrErr.message}`);
    }

    // 4. Reclassificar as 82 questões em question_discipline_relations
    console.log("Reclassificando as 82 questões em question_discipline_relations...");
    let reclassifiedCount = 0;
    const reclassificationLog = [];

    for (const targetSlug of Object.keys(distribution)) {
      const targetDisc = freshDiscMap.get(targetSlug);
      const items = distribution[targetSlug];

      for (const item of items) {
        const { error: updErr } = await supabase
          .from("question_discipline_relations")
          .update({ discipline_id: targetDisc.id })
          .eq("question_id", item.question_id)
          .eq("discipline_id", oldDisc.id);

        if (updErr) {
          throw new Error(`Falha ao reclassificar questão ${item.external_id} (${item.question_id}): ${updErr.message}`);
        }

        reclassifiedCount++;
        reclassificationLog.push({
          id: item.question_id,
          external_id: item.external_id,
          topic_id: item.topic_id,
          from_discipline_slug: oldDisc.slug,
          to_discipline_slug: targetDisc.slug,
          to_discipline_name: targetDisc.name,
        });
      }
    }

    console.log(`Reclassificadas com sucesso: ${reclassifiedCount} questões.`);

    // 5. Verificar que nenhuma questão restou na disciplina antiga
    const { count: remainingCount, error: remErr } = await supabase
      .from("question_discipline_relations")
      .select("question_id", { count: "exact", head: true })
      .eq("discipline_id", oldDisc.id);
    if (remErr) throw new Error("Erro ao verificar questões restantes: " + remErr.message);

    if (remainingCount > 0) {
      throw new Error(`Integridade comprometida: restam ${remainingCount} questões na disciplina composta!`);
    }

    // 6. Arquivar disciplina antiga
    console.log("Arquivando disciplina composta legada...");
    const { error: arcErr } = await supabase
      .from("disciplines")
      .update({ status: "archived" })
      .eq("id", oldDisc.id);
    if (arcErr) throw new Error("Falha ao arquivar disciplina composta: " + arcErr.message);

    // Salvar relatório pós-aplicação
    if (!fs.existsSync("scratch")) fs.mkdirSync("scratch", { recursive: true });
    fs.writeFileSync(
      "scratch/relatorio_reclassificacao_executada.json",
      JSON.stringify(
        {
          timestamp: new Date().toISOString(),
          total_reclassified: reclassifiedCount,
          counts_by_discipline: {
            matematica: distribution.matematica.length,
            "raciocinio-logico": distribution["raciocinio-logico"].length,
            estatistica: distribution.estatistica.length,
            "matematica-financeira": distribution["matematica-financeira"].length,
          },
          reclassificationLog,
        },
        null,
        2
      )
    );

    console.log("Migração aplicada com 100% de integridade e relatório salvo em scratch/relatorio_reclassificacao_executada.json.");
    return { success: true, reclassifiedCount, distribution, applied: true };
  } else {
    // ====== ROLLBACK ======
    console.log("Executando rollback no banco...");
    if (!oldDisc) throw new Error("Disciplina antiga não encontrada para restaurar.");

    // 1. Reativar disciplina antiga
    await supabase.from("disciplines").update({ status: "active" }).eq("id", oldDisc.id);

    // 2. Reverter questões para a disciplina antiga
    for (const td of TARGET_DISCIPLINES) {
      const disc = discMap.get(td.slug);
      if (disc) {
        await supabase
          .from("question_discipline_relations")
          .update({ discipline_id: oldDisc.id })
          .eq("discipline_id", disc.id);
      }
    }

    // 3. Reverter relações dos 4 tópicos com a disciplina antiga
    for (const td of TARGET_DISCIPLINES) {
      const disc = discMap.get(td.slug);
      if (disc) {
        await supabase.from("topic_discipline_relations").delete().eq("discipline_id", disc.id).eq("topic_id", td.slug);
      }
      await supabase.from("topic_discipline_relations").upsert(
        {
          topic_id: td.slug,
          discipline_id: oldDisc.id,
          is_primary: true,
        },
        { onConflict: "topic_id,discipline_id" }
      );
      await supabase.from("topics").update({ discipline: oldDisc.name }).eq("topic_id", td.slug);
    }

    console.log("Rollback executado com sucesso.");
    return { success: true, rollback: true };
  }
}

if (process.argv[1]?.endsWith("apply_migration_042.mjs")) {
  const isApply = process.argv.includes("--apply");
  const isRollback = process.argv.includes("--rollback");
  runMigration({ apply: isApply, rollback: isRollback }).catch((err) => {
    console.error("Erro na execução da migration 042:", err);
    process.exit(1);
  });
}
