import assert from "node:assert/strict";
import test from "node:test";
import {
  getRevisedFileName,
  parseEditableTopicJson,
  serializeEditableTopic,
  validateEditableTopic,
} from "../src/lib/content-editor.ts";

function createValidTopic() {
  return {
    topic_id: "auditoria-interna",
    topic_title: "Auditoria interna",
    discipline: "Auditoria",
    source_metadata: { generator: "LEIAUT" },
    sections: [
      {
        section_id: "auditoria-interna-sec-01",
        title: "Conceitos iniciais",
        content_markdown: "### Finalidade\n\nConteúdo revisável.",
        callouts: [
          {
            type: "info",
            title: "Atenção",
            text: "Texto do callout.",
            source_reference: "NBC TI 01",
          },
        ],
        mnemonics: [],
        flashcards: [],
        mermaid_mindmap: "",
        editorial_note: "campo adicional preservado",
      },
    ],
  };
}

test("aceita o contrato e preserva campos adicionais do LEIAUT", () => {
  const result = validateEditableTopic(createValidTopic());

  assert.equal(result.success, true);
  if (!result.success) return;

  assert.deepEqual(result.data.source_metadata, { generator: "LEIAUT" });
  assert.equal(result.data.sections[0].editorial_note, "campo adicional preservado");
  assert.equal(result.data.sections[0].callouts[0].source_reference, "NBC TI 01");
});

test("recusa seção fora da sequência canônica", () => {
  const topic = createValidTopic();
  topic.sections[0].section_id = "identificador-incorreto";

  const result = validateEditableTopic(topic);

  assert.equal(result.success, false);
  if (result.success) return;
  assert.ok(result.issues.some((issue) => issue.path === "sections[1].section_id"));
});

test("recusa JSON sintaticamente inválido com mensagem amigável", () => {
  const result = parseEditableTopicJson("{ conteúdo inválido }");

  assert.equal(result.success, false);
  if (result.success) return;
  assert.equal(result.issues[0].message, "O arquivo não contém um JSON válido.");
});

test("gera nome revisado sem acumular sufixos", () => {
  assert.equal(getRevisedFileName("auditoria_processado.json"), "auditoria_processado_revisado.json");
  assert.equal(getRevisedFileName("auditoria_revisado.json"), "auditoria_revisado.json");
});

test("serializa JSON identado e com quebra de linha final", () => {
  const result = validateEditableTopic(createValidTopic());
  assert.equal(result.success, true);
  if (!result.success) return;

  const serialized = serializeEditableTopic(result.data);
  assert.ok(serialized.endsWith("\n"));
  assert.deepEqual(JSON.parse(serialized).source_metadata, { generator: "LEIAUT" });
});
