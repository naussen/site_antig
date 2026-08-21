import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import { findAnchoredOffsets } from "../src/lib/text-highlight-anchors.mjs";

const baseHighlight = {
  start_offset: 6,
  end_offset: 11,
  selected_text: "regra",
  prefix: "Antes ",
  suffix: " depois",
};

test("preserva offsets quando o texto permanece idêntico", () => {
  assert.deepEqual(
    findAnchoredOffsets("Antes regra depois", baseHighlight),
    { start: 6, end: 11 },
  );
});

test("reancora pelo contexto quando o conteúdo anterior muda", () => {
  assert.deepEqual(
    findAnchoredOffsets("Introdução. Antes regra depois", baseHighlight),
    { start: 18, end: 23 },
  );
});

test("não escolhe silenciosamente entre ocorrências ambíguas", () => {
  assert.equal(
    findAnchoredOffsets("regra e outra regra", {
      ...baseHighlight,
      start_offset: 50,
      end_offset: 55,
      prefix: "",
      suffix: "",
    }),
    null,
  );
});

test("migration isola os realces por usuário com RLS", () => {
  const migration = fs.readFileSync(
    new URL("../supabase/migrations/014_create_user_text_highlights.sql", import.meta.url),
    "utf8",
  );

  assert.match(migration, /ENABLE ROW LEVEL SECURITY/);
  assert.match(migration, /REVOKE ALL PRIVILEGES[\s\S]+FROM anon, authenticated/);
  assert.equal((migration.match(/\(SELECT auth\.uid\(\)\) = user_id/g) ?? []).length, 5);
  assert.doesNotMatch(migration, /GRANT[\s\S]+TO anon/);
});
