import { readFile, writeFile } from "node:fs/promises";
import { parseArgs } from "node:util";
import { resolve } from "node:path";

const { values } = parseArgs({ options: { catalog: { type: "string" }, output: { type: "string" } } });
if (!values.catalog || !values.output) throw new Error("Informe --catalog e --output.");
const catalog = JSON.parse(await readFile(resolve(values.catalog), "utf8"));
const countBy = (rows, key) => rows.reduce((counts, row) => { const name = key(row); counts[name] = (counts[name] ?? 0) + 1; return counts; }, {});
const disciplines = new Map(catalog.disciplines.map((row) => [row.id, row]));
const topics = new Map(catalog.topics.map((row) => [row.topic_id, row]));
const questions = new Map(catalog.questions.map((row) => [row.id, row]));
const active = catalog.questions.filter((row) => row.status === "published");
const activeIds = new Set(active.map((row) => row.id));
const primaryDisciplines = catalog.question_discipline_relations.filter((row) => row.is_primary && activeIds.has(row.question_id));
const primaryTopics = catalog.question_topic_relations.filter((row) => row.relation_type === "primary" && activeIds.has(row.question_id));
const allowedPairs = new Set(catalog.topic_discipline_relations.map((row) => `${row.topic_id}|${row.discipline_id}`));
const disciplineByQuestion = new Map(primaryDisciplines.map((row) => [row.question_id, row.discipline_id]));
const conflicts = primaryTopics.filter((row) => !allowedPairs.has(`${row.topic_id}|${disciplineByQuestion.get(row.question_id)}`));
const combinedSlugs = catalog.disciplines.filter((row) => /matematica/.test(row.slug) && /raciocinio/.test(row.slug)).map((row) => row.slug);
const combinedIds = new Set(catalog.disciplines.filter((row) => combinedSlugs.includes(row.slug)).map((row) => row.id));
const combinedQuestions = new Set(primaryDisciplines.filter((row) => combinedIds.has(row.discipline_id)).map((row) => row.question_id));
const report = {
  captured_at: catalog.captured_at,
  counts: { questions: catalog.questions.length, active: active.length, disciplines: catalog.disciplines.length, topics: catalog.topics.length,
    laws: catalog.laws.length, fragments: catalog.legal_fragments.length, topic_legal_links: catalog.topic_legal_fragment_relations.length },
  status: countBy(catalog.questions, (row) => row.status),
  active_by_discipline: countBy(primaryDisciplines, (row) => disciplines.get(row.discipline_id)?.slug ?? "missing"),
  combined_disciplines: combinedSlugs,
  combined_by_topic: countBy(primaryTopics.filter((row) => combinedQuestions.has(row.question_id)), (row) => row.topic_id),
  combined_questions: primaryTopics.filter((row) => combinedQuestions.has(row.question_id)).map((row) => ({ external_id: questions.get(row.question_id).external_id, topic_id: row.topic_id, subject: questions.get(row.question_id).subject })),
  incompatible_relations: conflicts.map((row) => ({ external_id: questions.get(row.question_id).external_id, topic_id: row.topic_id })),
  inactive_topics: primaryTopics.filter((row) => !topics.has(row.topic_id) || topics.get(row.topic_id).archived_at).length,
  missing_primary_discipline: active.filter((row) => !disciplineByQuestion.has(row.id)).length,
  missing_primary_topic: active.filter((row) => !primaryTopics.some((relation) => relation.question_id === row.id)).length,
  missing_metadata: Object.fromEntries(["exam_board", "institution", "position_name", "exam_year", "source_content_hash"].map((field) => [field, active.filter((row) => !row[field]).length])),
  source_metadata_keys: countBy(active.flatMap((row) => Object.keys(row.source_metadata).map((key) => ({ key }))), (row) => row.key),
  quantitative_catalog: catalog.disciplines.filter((row) => /matemat|racioc|estatis/.test(row.slug)),
  culpability_topics: catalog.topics.filter((row) => /culpabilidade/i.test(row.title)),
};
await writeFile(resolve(values.output), `${JSON.stringify(report, null, 2)}\n`, { flag: "wx" });
console.log(JSON.stringify({ ...report, combined_questions: undefined, source_metadata_keys: undefined, culpability_topics: undefined }, null, 2));
