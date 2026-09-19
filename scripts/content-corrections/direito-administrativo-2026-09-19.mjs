import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { applyCoreCorrections } from "./direito-administrativo-core-2026-09-19.mjs";
import { applyRemainingCorrections } from "./direito-administrativo-remaining-2026-09-19.mjs";

const INPUT_DIR =
  "C:\\PRO\\agente\\direito_administrativo_revisao\\backups\\2026-09-19-pre-revisao";
const OUTPUT_DIR =
  "C:\\PRO\\agente\\direito_administrativo_revisao\\revisado";

const TOPIC_IDS = [
  "conceitos-introdutorios-do-direito-administrativo",
  "disposicoes-gerais",
  "deveres",
  "conceitos",
  "desconcentracao-administracao-direta-orgaos",
  "criterio-de-servico-publico-doutrinario",
  "civil",
  "classificacoes-do-controle",
  "disposicoes-gerais-art-1",
  "classificacao-dos-bens-publicos",
  "intervencao-restritiva",
  "abrangencia-arts-1-e-2",
  "conceito-e-especies",
  "abrangencia",
  "definicoes",
  "objetivos-e-caracteristicas",
  "clausulas-necessarias-art-55",
  "aplicacao-da-lei-14-133-21",
  "improbidade-administrativa",
];

const CORE_TOPIC_IDS = new Set(TOPIC_IDS.slice(0, 9));

function identitySnapshot(payload) {
  return payload.sections.map((section) => ({
    section_id: section.section_id,
    content_unit_id: section.content_unit_id,
    stable_key: section.stable_key,
  }));
}

function flashcardSnapshot(payload) {
  return payload.sections.map((section) => section.flashcards ?? []);
}

function assertEqual(actual, expected, label) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${label} foi alterado indevidamente.`);
  }
}

await mkdir(OUTPUT_DIR, { recursive: true });

const summary = [];

for (const [index, topicId] of TOPIC_IDS.entries()) {
  const inputPath = path.join(INPUT_DIR, `${topicId}.json`);
  const payload = JSON.parse(await readFile(inputPath, "utf8"));

  if (payload.topic_id !== topicId) {
    throw new Error(`topic_id inesperado em ${inputPath}: ${payload.topic_id}`);
  }
  if (payload.discipline !== "Direito Administrativo") {
    throw new Error(`Disciplina inesperada em ${topicId}: ${payload.discipline}`);
  }

  const identitiesBefore = identitySnapshot(payload);
  const flashcardsBefore = flashcardSnapshot(payload);
  const sectionsBefore = payload.sections.map((section) =>
    JSON.stringify({
      title: section.title,
      content_markdown: section.content_markdown,
      callouts: section.callouts,
      mnemonics: section.mnemonics,
      mermaid_mindmap: section.mermaid_mindmap,
    }),
  );

  if (CORE_TOPIC_IDS.has(topicId)) {
    applyCoreCorrections(payload);
  } else {
    applyRemainingCorrections(payload);
  }

  assertEqual(identitySnapshot(payload), identitiesBefore, `${topicId}: identidades`);
  assertEqual(flashcardSnapshot(payload), flashcardsBefore, `${topicId}: flashcards`);

  const changedSections = payload.sections.filter((section, sectionIndex) => {
    const after = JSON.stringify({
      title: section.title,
      content_markdown: section.content_markdown,
      callouts: section.callouts,
      mnemonics: section.mnemonics,
      mermaid_mindmap: section.mermaid_mindmap,
    });
    return after !== sectionsBefore[sectionIndex];
  }).length;

  const outputName = `${String(index + 1).padStart(3, "0")}_${topicId}.json`;
  await writeFile(
    path.join(OUTPUT_DIR, outputName),
    `${JSON.stringify(payload, null, 2)}\n`,
    "utf8",
  );
  summary.push({ topic_id: topicId, sections: payload.sections.length, changedSections });
}

console.log(
  JSON.stringify(
    {
      inputDir: INPUT_DIR,
      outputDir: OUTPUT_DIR,
      topics: summary.length,
      sections: summary.reduce((total, item) => total + item.sections, 0),
      changedSections: summary.reduce((total, item) => total + item.changedSections, 0),
      summary,
    },
    null,
    2,
  ),
);
