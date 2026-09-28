import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const migration = await readFile(
  new URL("../supabase/migrations/034_archive_empty_disciplines.sql", import.meta.url),
  "utf8",
);

test("arquiva somente a disciplina Geral pelo slug canônico", () => {
  assert.match(
    migration,
    /UPDATE public\.disciplines[\s\S]*SET status = 'archived'[\s\S]*WHERE slug = 'geral'[\s\S]*AND name = 'Geral'[\s\S]*AND status = 'active'/u,
  );
  assert.match(migration, /IF affected_rows <> 1 THEN/u);
  assert.equal((migration.match(/UPDATE public\.disciplines/gu) ?? []).length, 1);
});

test("catálogo exige disciplina, tópico e questão publicados ou ativos", () => {
  assert.match(
    migration,
    /CREATE OR REPLACE FUNCTION public\.list_question_disciplines\(\)[\s\S]*SECURITY DEFINER[\s\S]*SET search_path = ''/u,
  );
  assert.match(migration, /discipline\.status = 'active'/u);
  assert.match(migration, /topic\.archived_at IS NULL/u);
  assert.match(migration, /question\.status = 'published'/u);
});

test("preserva o campo legado topics.discipline", () => {
  assert.doesNotMatch(migration, /UPDATE public\.topics/u);
  assert.doesNotMatch(migration, /ALTER TABLE public\.topics/u);
  assert.doesNotMatch(migration, /DROP COLUMN\s+discipline/iu);
});
