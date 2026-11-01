import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { getAnswerStatusLabel, getQuestionPresentation } from "../src/lib/questions/presentation.mjs";

test("observação preliminar do exemplo vai ao cabeçalho sem mudar o enunciado", () => {
  const statement = "Questão 84 [Gabarito preliminar divulgado]\n\nEm uma planilha do MS-Excel 2016, assinale a alternativa correta.";
  const result = getQuestionPresentation(statement, "multiple_choice");
  assert.equal(result.sourceNumber, "84");
  assert.equal(result.sourceNotice, "Gabarito preliminar divulgado");
  assert.deepEqual(result.sections, [{ kind: "command", content: "Em uma planilha do MS-Excel 2016, assinale a alternativa correta." }]);
  assert.ok(statement.startsWith("Questão 84"));
});

test("metadados na mesma linha do bloco são separados preservando conteúdo", () => {
  const result = getQuestionPresentation("Questão 007 [Gabarito preliminar divulgado]\nEm uma planilha, julgue o item.", "true_false");
  assert.equal(result.sourceNumber, "007");
  assert.equal(result.sections[0].content, "Em uma planilha, julgue o item.");
});

test("texto de apoio real, fonte, assertiva e fórmulas permanecem completos", () => {
  const result = getQuestionPresentation("## Texto-base\n\nUm texto de apoio real.\n\n## Fonte\n\nFonte: Prova oficial.\n\n## Enunciado\n\nCom base no texto, julgue.\n\n## Assertiva\n\n$x^2$ é positivo.", "true_false");
  assert.equal(result.sourceNotice, null);
  assert.deepEqual(result.sections.map((item) => item.content), ["Um texto de apoio real.", "Fonte: Prova oficial.", "Com base no texto, julgue.", "$x^2$ é positivo."]);
});

test("não remove menções na prosa, citações ou número com texto substantivo", () => {
  for (const statement of [
    'O aviso "Gabarito preliminar divulgado" deve ser analisado.',
    "Questão 84 trata da inserção de colunas.",
    "> Questão 84 [Gabarito preliminar divulgado]",
    "O documento contém:\n\nQuestão 84 [Gabarito preliminar divulgado]",
    "Questão 84 [Gabarito preliminar divulgado] texto adicional.",
  ]) {
    const result = getQuestionPresentation(statement, "multiple_choice");
    assert.equal(result.sourceNumber, null);
    assert.equal(result.sourceNotice, null);
    assert.equal(result.sections.map((item) => item.content).join("\n\n"), statement);
  }
});

test("observação isolada e número sem observação não inventam status atual", () => {
  const notice = getQuestionPresentation("[Gabarito preliminar divulgado]\n\nEnunciado real.", "multiple_choice");
  assert.equal(notice.sourceNotice, "Gabarito preliminar divulgado");
  assert.equal(notice.sourceNumber, null);
  const numbered = getQuestionPresentation("Questão 84\n\nEnunciado real.", "multiple_choice");
  assert.equal(numbered.sourceNumber, "84");
  assert.equal(numbered.sourceNotice, null);
  assert.equal(getAnswerStatusLabel("definitivo"), "Gabarito definitivo");
  for (const status of [undefined, null, "", "sem_status", "inventado", "__proto__", "constructor"]) {
    assert.equal(getAnswerStatusLabel(status), null);
  }
});

test("nova consulta mantém autorização, paginação e identificação exata sem expor metadados", async () => {
  const sql = await readFile(new URL("../supabase/migrations/046_question_identifier_filter.sql", import.meta.url), "utf8");
  assert.match(sql, /CREATE OR REPLACE FUNCTION public\.list_questions_filtered_v2\(/u);
  assert.match(sql, /SECURITY DEFINER\s+SET search_path = ''/u);
  assert.match(sql, /current_user_id IS NULL OR NOT private\.has_active_content_access\(\)/u);
  assert.match(sql, /char_length\(identifier\) > 160/u);
  assert.match(sql, /question\.external_id = identifier OR question\.id = identifier_uuid/u);
  assert.match(sql, /question\.status = 'published'/u);
  assert.match(sql, /preference\.user_id = current_user_id/u);
  assert.match(sql, /attempt\.user_id = current_user_id/u);
  assert.match(sql, /'total_count', \(SELECT count\(\*\) FROM filtered\)/u);
  assert.match(sql, /'is_navigable', topic\.archived_at IS NULL AND EXISTS/u);
  assert.match(sql, /FROM PUBLIC, anon;/u);
  assert.match(sql, /TO authenticated;/u);
  assert.doesNotMatch(sql, /question_answer_keys|question_explanations|'source_metadata'|UPDATE public|ALTER TABLE|DROP FUNCTION/u);
});
