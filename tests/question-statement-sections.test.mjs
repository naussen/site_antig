import assert from "node:assert/strict";
import test from "node:test";
import { parseStatementSections } from "../src/lib/questions/statement-sections.mjs";

const kinds = (sections) => sections.map((section) => section.kind);
const originalText = (sections) => sections.map((section) => section.content).join("\n\n");

test("separa título colado ao texto e chamada de múltipla escolha", () => {
  const input = "Texto 2 O professor tenta explicar o conteúdo.\n\n— Fica de boa. A característica que NÃO está presente é:";
  const sections = parseStatementSections(input, "multiple_choice");
  assert.deepEqual(kinds(sections), ["title", "base", "command"]);
  assert.equal(sections[0].content, "Texto 2");
  assert.equal(originalText(sections.slice(1)), "O professor tenta explicar o conteúdo.\n\n— Fica de boa. A característica que NÃO está presente é:");
});

test("separa texto, fonte, chamada e assertiva C/E", () => {
  const input = "Texto CB1A1-I\n\nAs pessoas estão trabalhando.\n\nInternet: <www.exemplo.org.br> (com adaptações).\n\nEm relação às ideias do texto, julgue os seguintes itens.\n\nNo texto, os dados são usados como argumento.";
  const sections = parseStatementSections(input, "true_false");
  assert.deepEqual(kinds(sections), ["title", "base", "source", "command", "assertion"]);
  assert.equal(sections[2].content, "Internet: <www.exemplo.org.br> (com adaptações).");
});

test("preserva comando e assertiva sem texto-base", () => {
  const sections = parseStatementSections("Sobre a importância das cortes, julgue o item abaixo.\n\nRecentemente, a Suprema Corte declarou a lei inconstitucional.", "true_false");
  assert.deepEqual(kinds(sections), ["command", "assertion"]);
});

test("preserva enunciado simples sem classificação inventada", () => {
  const input = "Uma questão direta com um único parágrafo e fórmula $x^2$.";
  const sections = parseStatementSections(input, "multiple_choice");
  assert.deepEqual(kinds(sections), ["command"]);
  assert.equal(sections[0].content, input);
});

test("aceita seções explícitas para novas importações", () => {
  const input = "## Texto-base\n\nTrecho do livro.\n\n## Fonte\n\nMaria Silva. Livro Exemplo, 2020.\n\n## Enunciado\n\nCom base no texto, assinale a opção correta.";
  const sections = parseStatementSections(input, "multiple_choice");
  assert.deepEqual(kinds(sections), ["base", "source", "command"]);
  assert.equal(sections[1].content, "Maria Silva. Livro Exemplo, 2020.");
});

test("reconhece autor com fonte na mesma linha e separação por quebra simples", () => {
  const input = "Texto da reportagem.\nFrei Betto. Internet: <www.exemplo.org.br>.\nNo que se refere ao texto, julgue os itens seguintes.\n\nA informação é correta.";
  const sections = parseStatementSections(input, "true_false");
  assert.deepEqual(kinds(sections), ["base", "source", "command", "assertion"]);
  assert.equal(sections[1].content, "Frei Betto. Internet: <www.exemplo.org.br>.");
});
