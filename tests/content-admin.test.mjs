import test from "node:test";
import assert from "node:assert/strict";
import {
  assertBatchMode,
  assertConfirmation,
  buildTopicRow,
  getBatchSortOrder,
  requireText,
  validateBatchEntries,
  validateImportPayload,
} from "../scripts/content-admin.mjs";
import { TOPIC_ID_REDIRECTS } from "../src/lib/content/topic-id.mjs";

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

test("rejeita topic_id com palavras fragmentadas por hífens", () => {
  const payload = validPayload();
  payload.topic_id = "d-ef-in-i-co-es-e-ti-p-o-s-d-e-g-a-sto-s";
  payload.topic_title = "Definições e Tipos de Gastos";
  payload.sections[0].section_id = `${payload.topic_id}-sec-01`;

  assert.throws(() => validateImportPayload(payload), /fragmenta palavras do título/);
});

test("preserva topic_id legado coerente mesmo quando difere do título", () => {
  const payload = validPayload();
  payload.topic_id = "abrangencia-arts-1-e-2";
  payload.topic_title = "Acesso à Informação";
  payload.sections[0].section_id = `${payload.topic_id}-sec-01`;

  assert.doesNotThrow(() => validateImportPayload(payload));
});

test("não infere fragmentação a partir de título legado com mojibake", () => {
  const payload = validPayload();
  payload.topic_id = "conceitos-basicos-da-contabilidade";
  payload.topic_title = "Conceitos bÃƒÂ¡sicos da contabilidade";
  payload.sections[0].section_id = `${payload.topic_id}-sec-01`;

  assert.doesNotThrow(() => validateImportPayload(payload));
});

test("mantém os 30 redirects de topic_id únicos e inclui o caso reportado", () => {
  assert.equal(TOPIC_ID_REDIRECTS.length, 30);
  assert.equal(new Set(TOPIC_ID_REDIRECTS.map((item) => item.oldTopicId)).size, 30);
  assert.equal(new Set(TOPIC_ID_REDIRECTS.map((item) => item.newTopicId)).size, 30);
  assert.deepEqual(
    TOPIC_ID_REDIRECTS.find((item) => item.oldTopicId.startsWith("d-ef-in-i")),
    {
      oldTopicId: "d-ef-in-i-co-es-e-ti-p-o-s-d-e-g-a-sto-s",
      newTopicId: "definicoes-e-tipos-de-gastos",
    }
  );
});

test("aplica valores opcionais compatíveis com a API", () => {
  const payload = validPayload();
  delete payload.discipline;
  delete payload.sections[0].mermaid_mindmap;

  const parsed = validateImportPayload(payload);
  assert.equal(parsed.discipline, "Geral");
  assert.equal(parsed.sections[0].mermaid_mindmap, "");
});

test("aceita Mermaid estático e preserva quebra visual permitida", () => {
  const payload = validPayload();
  payload.sections[0].mermaid_mindmap = [
    "flowchart TD",
    '  A["Regra<br/>principal"] --> B[Exceção]',
  ].join("\n");

  assert.doesNotThrow(() => validateImportPayload(payload));
});

test("rejeita interações, protocolos executáveis e HTML em Mermaid", () => {
  const maliciousSources = [
    'flowchart TD\n  A[Material]\n  click A "javascript:alert(document.domain)"',
    'flowchart TD; A[Material]; click A "https://example.com"',
    '%%{init: {"securityLevel": "loose"}}%%\nflowchart TD\n  A --> B',
    '---\nconfig:\n  htmlLabels: true\n---\nflowchart TD\n  A --> B',
    'flowchart TD\n  A[Raiz] --> B[Ramo]\n  classDef destaque fill:#001a4d,color:#ffffff',
    'flowchart TD\n  A["<img src=x onerror=alert(1)>"] --> B',
  ];

  for (const source of maliciousSources) {
    const payload = validPayload();
    payload.sections[0].mermaid_mindmap = source;
    assert.throws(() => validateImportPayload(payload), /Mermaid|permitid|Protocolos|Tags HTML/);
  }
});

test("rejeita section_id duplicado no mesmo arquivo", () => {
  const payload = validPayload();
  payload.sections.push({ ...payload.sections[0] });

  assert.throws(() => validateImportPayload(payload), /section_id duplicado/);
});

test("rejeita section_id fora da sequência canônica", () => {
  const payload = validPayload();
  payload.sections[0].section_id = "direito-constitucional-sec-09";

  assert.throws(() => validateImportPayload(payload), /ID fora do padrão sequencial/);
});

test("rejeita título de seção duplicado sem diferenciar caixa ou acento", () => {
  const payload = validPayload();
  payload.sections.push({
    ...payload.sections[0],
    section_id: "direito-constitucional-sec-02",
    title: "introducao",
  });

  assert.throws(() => validateImportPayload(payload), /Título de seção duplicado/);
});

test("rejeita título descritivo em caixa alta e preserva siglas", () => {
  const payload = validPayload();
  payload.sections[0].title = "AUDITORIA INTERNA (NBC TI 01)";
  assert.throws(() => validateImportPayload(payload), /capitalização editorial/);

  payload.sections[0].title = "ICMS";
  assert.doesNotThrow(() => validateImportPayload(payload));

  payload.sections[0].title = "IPVA";
  payload.sections[0].content_markdown = "O IPVA é um imposto estadual.";
  assert.doesNotThrow(() => validateImportPayload(payload));

  payload.sections[0].title = "ERRO";
  payload.sections[0].content_markdown = "O erro é uma distorção não intencional.";
  assert.throws(() => validateImportPayload(payload), /capitalização editorial/);
});

test("rejeita DOUTINA e seção sem conteúdo útil", () => {
  const typoPayload = validPayload();
  typoPayload.sections[0].title = "Princípios de controle interno (DOUTINA)";
  assert.throws(() => validateImportPayload(typoPayload), /doutrina/);

  const emptyPayload = validPayload();
  emptyPayload.sections[0].content_markdown = "";
  assert.throws(() => validateImportPayload(emptyPayload), /não possui conteúdo/);
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

test("lote preserva o prefixo numérico do arquivo, inclusive com lacunas", () => {
  assert.equal(getBatchSortOrder("008_modulo.json", 8), 8);
  assert.equal(getBatchSortOrder("010_modulo.json", 9), 10);
  assert.equal(getBatchSortOrder("modulo-sem-prefixo.json", 3), 3);
});

test("monta tópico com ordem apenas quando fornecida pelo lote", () => {
  assert.deepEqual(buildTopicRow(validPayload(), 10), {
    topic_id: "direito-constitucional",
    discipline: "Direito Constitucional",
    title: "Direito Constitucional",
    sort_order: 10,
  });
  assert.equal("sort_order" in buildTopicRow(validPayload()), false);
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

test("lote rejeita ordem repetida dentro da mesma disciplina", () => {
  const first = validPayload();
  const second = validPayload();
  second.topic_id = "outro-modulo";
  second.sections[0].section_id = "outro-modulo-sec-01";

  assert.throws(
    () =>
      validateBatchEntries([
        { filePath: "001_a.json", sortOrder: 1, payload: first },
        { filePath: "001_b.json", sortOrder: 1, payload: second },
      ]),
    /ordem 1 .* aparece em 001_a\.json e 001_b\.json/
  );
});
