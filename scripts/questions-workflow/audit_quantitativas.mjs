import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Variáveis de ambiente ausentes.");
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const oldDiscId = "3abf6bc4-ea86-4cd4-8762-a69dcf2aedb2";

async function main() {
  try {
    const { data: qdr, error: qdrErr } = await supabase
      .from("question_discipline_relations")
      .select("question_id, is_primary")
      .eq("discipline_id", oldDiscId);
    if (qdrErr) throw new Error("qdrErr: " + JSON.stringify(qdrErr));

    const qIds = qdr.map((r) => r.question_id);
    console.log(`Encontradas ${qIds.length} relações de disciplina.`);

    const { data: questions, error: qErr } = await supabase
      .from("questions")
      .select("id, external_id, statement_markdown, subject, status, source_content_hash, exam_board, institution, position_name, exam_year")
      .in("id", qIds);
    if (qErr) throw new Error("qErr: " + JSON.stringify(qErr));

    const { data: qtr, error: trErr } = await supabase
      .from("question_topic_relations")
      .select("question_id, topic_id, relation_type")
      .in("question_id", qIds);
    if (trErr) throw new Error("trErr: " + JSON.stringify(trErr));

    const topicByQ = new Map(qtr.map((t) => [t.question_id, t.topic_id]));

    const proposalRaw = JSON.parse(
      fs.readFileSync("docs/questoes-workflow/separacao-quantitativas-20261030.json", "utf8")
    );
    const proposalByExtId = new Map(
      proposalRaw.questions.map((p) => [p.external_id, p])
    );

    const records = questions.map((q) => {
      const topicId = topicByQ.get(q.id);
      const proposal = proposalByExtId.get(q.external_id);
      return {
        id: q.id,
        external_id: q.external_id,
        subject: q.subject,
        exam_board: q.exam_board,
        institution: q.institution,
        position_name: q.position_name,
        exam_year: q.exam_year,
        topic_id: topicId,
        proposed_slug: proposal ? proposal.target_discipline_slug : null,
        proposed_topic: proposal ? proposal.topic_id : null,
        statement_markdown: q.statement_markdown,
        hash: q.source_content_hash,
        status: q.status,
      };
    });

    if (!fs.existsSync("scratch")) fs.mkdirSync("scratch", { recursive: true });
    fs.writeFileSync(
      "scratch/snapshot_quantitativas_82.json",
      JSON.stringify(records, null, 2)
    );

    console.log(`Snapshot salvo com ${records.length} questões.`);

    let matchCount = 0;
    let missingInProposal = 0;
    let topicMismatch = 0;

    for (const r of records) {
      if (!r.proposed_slug) {
        missingInProposal++;
        console.warn(`Ausente na proposta: ${r.external_id}`);
      } else {
        if (r.topic_id === r.proposed_topic) {
          matchCount++;
        } else {
          topicMismatch++;
          console.warn(
            `Divergência tópico: ${r.external_id} | atual: ${r.topic_id} | proposta: ${r.proposed_topic}`
          );
        }
      }
    }

    console.log({
      total: records.length,
      matchCount,
      missingInProposal,
      topicMismatch,
    });
  } catch (err) {
    console.error("Erro na auditoria:", err);
    process.exit(1);
  }
}

main();
