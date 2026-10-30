import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";
import crypto from "node:crypto";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Variáveis de ambiente do Supabase ausentes.");
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const oldDiscId = "3abf6bc4-ea86-4cd4-8762-a69dcf2aedb2";
const targetSlugs = ["matematica", "raciocinio-logico", "estatistica", "matematica-financeira"];

async function backup() {
  console.log("Iniciando backup verificável das tabelas e vínculos afetados...");

  // 1. Disciplinas envolvidas
  const { data: disciplines, error: dErr } = await supabase
    .from("disciplines")
    .select("*")
    .or(`id.eq.${oldDiscId},slug.in.(${targetSlugs.join(",")})`);
  if (dErr) throw dErr;

  // 2. Relações de disciplinas das questões
  const { data: qdr, error: qdrErr } = await supabase
    .from("question_discipline_relations")
    .select("*")
    .eq("discipline_id", oldDiscId);
  if (qdrErr) throw qdrErr;
  const qIds = qdr.map((r) => r.question_id);

  // 3. Questões completas
  const { data: questions, error: qErr } = await supabase
    .from("questions")
    .select("*")
    .in("id", qIds);
  if (qErr) throw qErr;

  // 4. Relações com tópicos
  const { data: qtr, error: trErr } = await supabase
    .from("question_topic_relations")
    .select("*")
    .in("question_id", qIds);
  if (trErr) throw trErr;

  // 5. Tópicos envolvidos
  const { data: topics, error: tErr } = await supabase
    .from("topics")
    .select("*")
    .in("topic_id", targetSlugs);
  if (tErr) throw tErr;

  // 6. Relações tópicos-disciplinas
  const { data: tdr, error: tdrErr } = await supabase
    .from("topic_discipline_relations")
    .select("*")
    .in("topic_id", targetSlugs);
  if (tdrErr) throw tdrErr;

  // 7. Alternativas, gabaritos e tentativas (para conferência de integridade)
  const { data: options, error: optErr } = await supabase
    .from("question_options")
    .select("id, question_id, label, sort_order")
    .in("question_id", qIds);
  if (optErr) throw optErr;

  const { data: answers, error: ansErr } = await supabase
    .from("question_answer_keys")
    .select("*")
    .in("question_id", qIds);
  if (ansErr) throw ansErr;

  const { data: attempts, error: attErr } = await supabase
    .from("user_question_attempts")
    .select("id, question_id, user_id")
    .in("question_id", qIds);
  if (attErr) throw attErr;

  const { data: prefs, error: prefErr } = await supabase
    .from("user_question_preferences")
    .select("question_id, user_id")
    .in("question_id", qIds);
  if (prefErr) throw prefErr;

  const payload = {
    timestamp: new Date().toISOString(),
    old_discipline_id: oldDiscId,
    target_slugs: targetSlugs,
    counts: {
      disciplines: disciplines.length,
      questions: questions.length,
      question_discipline_relations: qdr.length,
      question_topic_relations: qtr.length,
      topics: topics.length,
      topic_discipline_relations: tdr.length,
      question_options: options.length,
      question_answer_keys: answers.length,
      user_question_attempts: attempts.length,
      user_question_preferences: prefs.length,
    },
    disciplines,
    topics,
    topic_discipline_relations: tdr,
    question_discipline_relations: qdr,
    question_topic_relations: qtr,
    questions,
    question_options: options,
    question_answer_keys: answers,
    user_question_attempts: attempts,
    user_question_preferences: prefs,
  };

  const jsonStr = JSON.stringify(payload, null, 2);
  const hash = crypto.createHash("sha256").update(jsonStr).digest("hex");

  if (!fs.existsSync("scratch")) fs.mkdirSync("scratch", { recursive: true });
  const backupPath = "scratch/backup_quantitativas_pre_migration.json";
  fs.writeFileSync(backupPath, jsonStr, "utf8");

  console.log(`Backup salvo com sucesso em ${backupPath}`);
  console.log(`SHA-256 do backup: ${hash}`);
  console.log("Contagens do backup:", payload.counts);
}

backup().catch((err) => {
  console.error("Erro ao gerar backup:", err);
  process.exit(1);
});
