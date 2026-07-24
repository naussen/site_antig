import test from "node:test";
import assert from "node:assert/strict";
import {
  assertBatchMode,
  assertConfirmation,
  requireText,
  validateBatchEntries,
  validateImportPayload,
} from "../scripts/content-admin.mjs";

function validPayload() {
  return {
    topic_id: "direito-constitucional",
    discipline: "Direito Constitucional",
    topic_title: "Direito Constitucional",
    sections: [
      {
        section_id: "direito-constitucional-sec-01",
        title: "Introdução",
        content_markdown: "Conteúdo",
        callouts: [],
        mnemonics: [],
        flashcards: [],
        mermaid_mindmap: "",
      },
    ],
  };
}

test("aceita o mesmo contrato básico da API de importação", () => {
  const parsed = validateImportPayload(validPayload());
  assert.equal(parsed.topic_id, "direito-constitucional");
  assert.equal(parsed.sections.length, 1);
});

test("aplica valores opcionais compatíveis com a API", () => {
  const payload = validPayload();
  delete payload.discipline;
  delete payload.sections[0].mermaid_mindmap;

  const parsed = validateImportPayload(payload);
  assert.equal(parsed.discipline, "Geral");
  assert.equal(parsed.sections[0].mermaid_mindmap, "");
});

test("rejeita section_id duplicado no mesmo arquivo", () => {
  const payload = validPayload();
  payload.sections.push({ ...payload.sections[0] });

  assert.throws(() => validateImportPayload(payload), /section_id duplicado/);
});

test("rejeita payload sem seções", () => {
  const payload = validPayload();
  payload.sections = [];

  assert.throws(() => validateImportPayload(payload), /Pelo menos uma seção/);
});

test("normaliza argumentos textuais e rejeita vazio", () => {
  assert.equal(requireText("  Novo título  ", "título"), "Novo título");
  assert.throws(() => requireText("   ", "título"), /título é obrigatório/);
});

test("operações destrutivas exigem confirmação literal", () => {
  assert.doesNotThrow(() => assertConfirmation("modulo-1", "modulo-1"));
  assert.throws(() => assertConfirmation("modulo-1", undefined), /Confirmação inválida/);
  assert.throws(() => assertConfirmation("modulo-1", "modulo-2"), /Confirmação inválida/);
});

test("lote exige exatamente um entre dry-run e apply", () => {
  assert.doesNotThrow(() => assertBatchMode(true, false));
  assert.doesNotThrow(() => assertBatchMode(false, true));
  assert.throws(() => assertBatchMode(false, false), /exatamente um modo/);
  assert.throws(() => assertBatchMode(true, true), /exatamente um modo/);
});

test("lote rejeita topic_id repetido entre arquivos", () => {
  const payload = validPayload();
  assert.throws(
    () =>
      validateBatchEntries([
        { filePath: "01.json", payload },
        { filePath: "02.json", payload: { ...validPayload() } },
      ]),
    /topic_id .* aparece em 01\.json e 02\.json/
  );
});

test("lote rejeita section_id repetido entre módulos", () => {
  const first = validPayload();
  const second = validPayload();
  second.topic_id = "outro-modulo";

  assert.throws(
    () =>
      validateBatchEntries([
        { filePath: "01.json", payload: first },
        { filePath: "02.json", payload: second },
      ]),
    /section_id .* aparece em 01\.json .* e 02\.json/
  );
});
