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
import { getFlashcardContentIssue } from "../src/lib/content/flashcard.mjs";
import { repairMermaidTransportNoise } from "../src/lib/mermaid/repair-transport-noise.mjs";
import {
  buildPortugueseFlashcards,
  classifyPortugueseFlashcard,
  normalizeAttachedFlashcard,
  parseTwoColumnCsv,
} from "../src/lib/content/portuguese-flashcard-import.mjs";
import { buildAccountingFlashcards, classifyAccountingFlashcard } from "../src/lib/content/accounting-flashcard-import.mjs";

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

test("rejeita flashcard sem questão rastreável e aceita C/E com fonte válida", () => {
  const invalid = validPayload();
  invalid.sections[0].flashcards = [{
    question: "[CERTO/ERRADO] Uma análise estatística define o conteúdo da disciplina.",
    answer: "Gabarito: ERRADO. Justificativa: Não é questão de concurso.",
  }];
  assert.throws(() => validateImportPayload(invalid), /source|fonte/i);

  const valid = validPayload();
  valid.sections[0].flashcards = [{
    question: "[CERTO/ERRADO] A assertiva foi adaptada ao modelo C/E sem alterar o ponto cobrado.",
    answer: "Gabarito: CERTO. Justificativa: A adaptação preserva o conteúdo da questão.",
    source: {
      board: "CEBRASPE",
      year: 2025,
      exam: "Concurso de teste",
      question_id: "Q-17",
      status: "valid",
    },
  }];
  assert.doesNotThrow(() => validateImportPayload(valid));
});

test("identifica análise estatística sem excluir flashcard C/E de conteúdo", () => {
  assert.match(
    getFlashcardContentIssue({
      question: "[CERTO/ERRADO] A análise estatística das bancas indica 20% de cobrança.",
      answer: "Gabarito: ERRADO. Justificativa: O percentual não reforça o tópico.",
    }),
    /análise estatística/i,
  );
  assert.equal(getFlashcardContentIssue({
    question: "[CERTO/ERRADO] O sujeito pode estar oculto.",
    answer: "Gabarito: CERTO. Justificativa: A desinência verbal pode identificá-lo.",
  }), null);
});

test("repara somente o ruído Mermaid repetido observado no log", () => {
  const marker = "-->--->--->>-->";
  const valid = "flowchart TB\n  A[Início] --> B[Fim]";
  const corrupted = [...valid].map((character) => `${marker}${character}`).join("");
  assert.equal(repairMermaidTransportNoise(corrupted), valid);
  assert.equal(repairMermaidTransportNoise("flowchart TB\n  A --> B"), "flowchart TB\n  A --> B");
});

test("lê CSV de duas colunas com vírgulas e aspas escapadas", () => {
  assert.deepEqual(parseTwoColumnCsv('"Questão, com vírgula","Resposta com ""aspas"""\n'), [{
    question: "Questão, com vírgula",
    answer: 'Resposta com "aspas"',
  }]);
});

test("converte pergunta e assertiva anexadas para o padrão C/E", () => {
  assert.deepEqual(normalizeAttachedFlashcard({
    question: "Qual é a regra?",
    answer: "A regra correta.",
  }), {
    question: "[CERTO/ERRADO] A resposta correta para “Qual é a regra?” é “A regra correta.”.",
    answer: "Gabarito: CERTO. Justificativa: A regra correta.",
  });
  assert.deepEqual(normalizeAttachedFlashcard({
    question: "Julgue a assertiva: Usa-se hífen neste caso.",
    answer: "Gabarito: ERRADO. Comentário: O hífen não é empregado.",
  }), {
    question: "[CERTO/ERRADO] Usa-se hífen neste caso.",
    answer: "Gabarito: ERRADO. Justificativa: O hífen não é empregado.",
  });
  assert.deepEqual(normalizeAttachedFlashcard({
    question: "Julgue a assertiva: A prudência apoia a neutralidade.",
    answer: "Gabarito: CERTO. Comentário do Professor: A cautela não autoriza viés deliberado.",
  }), {
    question: "[CERTO/ERRADO] A prudência apoia a neutralidade.",
    answer: "Gabarito: CERTO. Justificativa: A cautela não autoriza viés deliberado.",
  });
});

test("classifica flashcards de Português em seções temáticas", () => {
  assert.equal(classifyPortugueseFlashcard({ question: "O prefixo exige hífen.", answer: "Certo." }), "fonetica-sec-04");
  assert.equal(classifyPortugueseFlashcard({ question: "O verbo intervir deriva de vir.", answer: "Certo." }), "morfologia-sec-05");
  assert.equal(classifyPortugueseFlashcard({ question: "A crase é facultativa antes de possessivo.", answer: "Certo." }), "sintaxe-sec-07");
  assert.equal(classifyPortugueseFlashcard({ question: "Em Redação Oficial, deve haver impessoalidade.", answer: "Certo." }), "redacao-oficial-sec-02");
  assert.equal(classifyPortugueseFlashcard({ question: "Qual é a forma da terceira pessoa do plural do verbo deter?", answer: "Detiveram." }), "morfologia-sec-05");
  assert.equal(classifyPortugueseFlashcard({ question: "Como se forma o plural de salário-família?", answer: "Salários-família." }), "morfologia-sec-03");
  assert.equal(classifyPortugueseFlashcard({ question: "O uso da vírgula é obrigatório e altera o sentido se for omitida.", answer: "Certo." }), "sintaxe-sec-01");
  assert.equal(classifyPortugueseFlashcard({ question: "Em Sabe-se que haverá prova, o vocábulo que é pronome relativo.", answer: "Errado." }), "sintaxe-sec-11");
  assert.equal(classifyPortugueseFlashcard({ question: "Por que as proparoxítonas são acentuadas?", answer: "Regra geral." }), "fonetica-sec-02");
  assert.equal(classifyPortugueseFlashcard({ question: "O uso do por que ocorre em frases interrogativas.", answer: "Certo." }), "outros-topicos-sec-03");
  assert.equal(buildPortugueseFlashcards([{
    fileName: "anexo.csv",
    content: '"O pronome relativo cujo indica posse.","Gabarito: CERTO. Cujo relaciona dois substantivos."\n',
  }]).length, 1);
});

test("classifica flashcards de Contabilidade nas seções temáticas", () => {
  assert.equal(classifyAccountingFlashcard({ question: "O CPC 00 exige neutralidade.", answer: "Certo." }), "cpc-00-estrutura-conceitual-sec-02");
  assert.equal(classifyAccountingFlashcard({ question: "O valor recuperável do CPC 01 considera valor em uso.", answer: "Certo." }), "cpc-01-teste-de-recuperabilidade-sec-01");
  assert.equal(classifyAccountingFlashcard({ question: "O método de equivalência patrimonial reconhece dividendos.", answer: "Certo." }), "cpc-18-investimento-em-coligada-controlada-e-empreendimento-controlado-em-conjunto-ecc-sec-02");
  assert.equal(classifyAccountingFlashcard({ question: "A DVA demonstra o valor adicionado.", answer: "Certo." }), "cpc-26-demonstracoes-contabeis-sec-11");
  assert.equal(buildAccountingFlashcards([{ fileName: "anexo.csv", content: '"O CPC 16 trata de estoques.","Gabarito: CERTO. Justificativa: O CPC 16 disciplina os estoques."\n' }]).length, 1);
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
