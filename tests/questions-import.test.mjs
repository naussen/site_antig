import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  buildQuestionBatch,
  questionImportBatchSchema,
} from "../scripts/lib/question-import-contract.mjs";

const migration = await readFile(
  new URL("../supabase/migrations/031_add_atomic_question_import.sql", import.meta.url),
  "utf8",
);

const mapping = {
  batch_key: "teste-direito-administrativo",
  source_label: "QPYGEM revisado",
  review_report: "RELATORIO.md",
  discipline: { slug: "direito-administrativo", name: "Direito Administrativo" },
  topics: { "I. Organização": "topico-existente" },
};

const rawQuestion = {
  id: 1,
  disciplina: "DIREITO ADMINISTRATIVO",
  topico: "I. Organização",
  assunto: "Organização",
  banca: "CESPE",
  ano: 2024,
  orgao: "Órgão",
  cargo: "Analista",
  estado: "Federal",
  tipo: "certo_errado",
  enunciado: "Julgue o item.",
  alternativas: null,
  comentario: { texto_completo: "A assertiva está correta.", itens: null },
  gabarito: "Certo",
  id_alfanumerico: "abc12",
  status_revisao: "VALIDA",
  justificativa_revisao: "Compatível.",
};

test("transforma fonte ATUALIZADO no contrato canônico", () => {
  const rawText = JSON.stringify([rawQuestion]);
  const batch = buildQuestionBatch({
    rawText,
    sourceFile: "01_DIREITO_ADMINISTRATIVO_ATUALIZADO.json",
    rawQuestions: [rawQuestion],
    mapping,
    selectedIds: ["abc12"],
  });

  assert.equal(batch.questions[0].external_id, "qpygem:direito-administrativo:abc12");
  assert.deepEqual(batch.questions[0].options.map(({ label }) => label), ["C", "E"]);
  assert.equal(batch.questions[0].topics[0].topic_id, "topico-existente");
  assert.match(batch.questions[0].source_content_hash, /^[a-f0-9]{64}$/u);
  assert.doesNotThrow(() => questionImportBatchSchema.parse(batch));
});

test("recusa fonte sem ATUALIZADO e questão não validada", () => {
  assert.throws(
    () => buildQuestionBatch({
      rawText: "[]",
      sourceFile: "questoes.json",
      rawQuestions: [rawQuestion],
      mapping,
      selectedIds: [],
    }),
    /ATUALIZADO/u,
  );
  assert.throws(
    () => buildQuestionBatch({
      rawText: "[]",
      sourceFile: "questoes_ATUALIZADO.json",
      rawQuestions: [{ ...rawQuestion, status_revisao: "ADAPTADA" }],
      mapping,
      selectedIds: [],
    }),
    /somente status VALIDA/u,
  );
});

test("migration mantém importação privada, transacional e sem sobrescrita", () => {
  assert.match(migration, /CREATE TABLE public\.question_import_batches/u);
  assert.match(migration, /CREATE TABLE public\.question_import_items/u);
  assert.match(migration, /CREATE OR REPLACE FUNCTION public\.import_questions_batch\(p_payload JSONB\)[\s\S]*SECURITY DEFINER[\s\S]*SET search_path = ''/u);
  assert.match(migration, /question .* already exists with different content/u);
  assert.match(migration, /REVOKE ALL ON FUNCTION public\.import_questions_batch\(JSONB\)[\s\S]*FROM PUBLIC, anon, authenticated/u);
  assert.match(migration, /GRANT EXECUTE ON FUNCTION public\.import_questions_batch\(JSONB\)[\s\S]*TO service_role/u);
  assert.doesNotMatch(migration, /GRANT EXECUTE[\s\S]*TO authenticated/u);
});
