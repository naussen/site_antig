import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("migration 051 normaliza bancas (F06) e implementa filtro de revisão (F08)", async () => {
  const [migration051, rollback051] = await Promise.all([
    read("supabase/migrations/051_normalize_boards_and_review_filter.sql"),
    read("scripts/questions-workflow/rollback_051.sql"),
  ]);

  // F06 - Normalização atômica de bancas
  assert.match(migration051, /UPDATE public\.questions\s+SET exam_board = 'Vunesp'\s+WHERE exam_board = 'VUNESP';/);
  assert.match(migration051, /UPDATE public\.questions\s+SET exam_board = 'FCC'\s+WHERE exam_board = 'Fundação Carlos Chagas';/);
  assert.match(migration051, /UPDATE public\.questions\s+SET exam_board = 'CEBRASPE'\s+WHERE exam_board IN \('CESPE', 'CESPE\/UnB', 'CESPE \| CEBRASPE', 'CESPE \/ CEBRASPE'\);/);

  // F06 - Aliases na RPC
  assert.match(migration051, /lower\(btrim\(p_exam_board\)\) = 'vunesp'/);
  assert.match(migration051, /lower\(btrim\(p_exam_board\)\) IN \('fcc', 'fundação carlos chagas', 'fundacao carlos chagas'\)/);
  assert.match(migration051, /lower\(btrim\(p_exam_board\)\) IN \('cebraspe', 'cespe', 'cespe\/unb', 'cespe \| cebraspe', 'cespe \/ cebraspe'\)/);

  // F08 - 11º parâmetro e validação segura
  assert.match(migration051, /p_review_filter TEXT DEFAULT 'all'/);
  assert.match(migration051, /v_review_filter NOT IN \('all', 'errors', 'marked', 'answered', 'unanswered'\)/);

  // F08 - Isolamento rigoroso por auth.uid()
  assert.match(migration051, /current_user_id UUID := auth\.uid\(\);/);
  assert.match(migration051, /attempt\.user_id = current_user_id[\s\S]*attempt\.is_correct = false/);
  assert.match(migration051, /preference\.user_id = current_user_id[\s\S]*preference\.marked_for_review_at IS NOT NULL/);

  // Segurança e Privilégio
  assert.match(migration051, /REVOKE ALL ON FUNCTION public\.list_questions_filtered_v2[\s\S]*FROM PUBLIC, anon;/);
  assert.match(migration051, /GRANT EXECUTE ON FUNCTION public\.list_questions_filtered_v2[\s\S]*TO authenticated;/);
  assert.match(migration051, /REVOKE ALL ON FUNCTION public\.list_question_filters\(\) FROM PUBLIC, anon;/);
  assert.match(migration051, /GRANT EXECUTE ON FUNCTION public\.list_question_filters\(\) TO authenticated;/);

  // Rollback presente e correspondente
  assert.match(rollback051, /CREATE OR REPLACE FUNCTION public\.list_questions_filtered_v2/);
  assert.doesNotMatch(rollback051, /p_review_filter/);
});

test("page.tsx lê searchParams assíncronos e propaga filtros para o servidor e cliente (F07)", async () => {
  const pageSource = await read("src/app/dashboard/questoes/page.tsx");

  assert.match(pageSource, /searchParams\?: Promise<Record<string, string \| string\[\] \| undefined>>/);
  assert.match(pageSource, /await searchParams/);
  assert.match(pageSource, /initialIdentifier/);
  assert.match(pageSource, /initialSearch/);
  assert.match(pageSource, /initialDiscipline/);
  assert.match(pageSource, /initialTopic/);
  assert.match(pageSource, /initialSubtopic/);
  assert.match(pageSource, /initialBoard/);
  assert.match(pageSource, /initialYear/);
  assert.match(pageSource, /initialReview/);
  assert.match(pageSource, /p_review_filter:\s*initialReview/);
  assert.match(pageSource, /initialFilters=\{\{\s*identifier:/);
  assert.match(pageSource, /initialMode=\{initialMode\}/);
});

test("questions-client.tsx sincroniza URL (F07) e possui card interativo de Caderno de Erros (F08)", async () => {
  const clientSource = await read("src/app/dashboard/questoes/questions-client.tsx");

  // F07 - sincronização de URL
  assert.match(clientSource, /function syncUrlWithFilters/);
  assert.match(clientSource, /window\.history\.replaceState/);
  assert.match(clientSource, /syncUrlWithFilters\(filters, pageSize\)/);

  // F08 - Card interativo com a11y
  assert.match(clientSource, /toggleErrorNotebook/);
  assert.match(clientSource, /aria-pressed=\{activeFilters\.review === "errors"\}/);
  assert.match(clientSource, /aria-label=\{`Caderno de erros:/);

  // F08 - Opções do seletor de revisão
  assert.match(clientSource, /<option value="all">Todas as questões<\/option>/);
  assert.match(clientSource, /<option value="errors">Caderno de erros \(questões com erro\)<\/option>/);
  assert.match(clientSource, /<option value="marked">Marcadas para revisão<\/option>/);
  assert.match(clientSource, /<option value="answered">Já resolvidas<\/option>/);
  assert.match(clientSource, /<option value="unanswered">Ainda não resolvidas<\/option>/);

  // F08 - Estado vazio específico do caderno de erros
  assert.match(clientSource, /Seu Caderno de Erros está limpo!/);
});
