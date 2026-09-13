import assert from "node:assert/strict";
import test from "node:test";
import {
  ChangeManifestSchema,
  assertDestructiveImportAllowed,
  buildChangeManifestRecord,
  buildContentImpact,
  getManifestIssues,
  summarizeContentImpact,
} from "../src/lib/content/import-governance.mjs";

const oldHomicide = {
  section_id: "penal-sec-01",
  content_unit_id: "00000000-0000-4000-8000-000000000001",
  stable_key: "homicidio",
  title: "Homicídio",
  content_markdown: "Texto anterior",
  callouts: [], mnemonics: [], flashcards: [], mermaid_mindmap: "",
  sort_order: 0,
  archived_at: null,
};

function strategy() {
  return {
    notes: "move",
    progress: "recalculate",
    highlights: "reanchor",
  };
}

test("alteração editorial preserva identidade e não exige manifesto", () => {
  const incoming = { ...oldHomicide, content_markdown: "Texto revisado" };
  const impact = buildContentImpact([oldHomicide], [incoming], { replace: true });
  assert.equal(impact.destructive, false);
  assert.equal(impact.updated.length, 1);
  assert.doesNotThrow(() => assertDestructiveImportAllowed({
    impact, topicId: "penal", replace: true,
  }));
});

test("arquivamento é bloqueado sem manifesto", () => {
  const impact = buildContentImpact([oldHomicide], [], { replace: true });
  assert.equal(impact.removed.length, 1);
  assert.throws(
    () => assertDestructiveImportAllowed({ impact, topicId: "penal", replace: true }),
    /informe um manifesto/,
  );
});

test("manifesto de divisão cobre origem, destinos e estratégia pessoal", () => {
  const destinations = ["homicidio-simples", "homicidio-qualificado"].map((stableKey, index) => ({
    ...oldHomicide,
    section_id: `penal-novo-${index + 1}`,
    content_unit_id: `00000000-0000-4000-8000-00000000000${index + 2}`,
    stable_key: stableKey,
  }));
  const impact = buildContentImpact([oldHomicide], destinations, { replace: true });
  const manifest = {
    schema_version: 1,
    topic_id: "penal",
    reason: "Separação dos crimes em unidades permanentes.",
    operations: [{
      type: "split",
      from: ["homicidio"],
      to: destinations.map((item) => item.stable_key),
      rationale: "Cada crime terá uma unidade própria.",
      personal_data_strategy: strategy(),
    }],
  };
  assert.deepEqual(getManifestIssues(manifest, "penal", impact), []);
  assert.doesNotThrow(() => assertDestructiveImportAllowed({
    impact, manifest, topicId: "penal", replace: true,
  }));
  assert.equal(buildChangeManifestRecord(manifest).operation, "split");
  assert.match(buildChangeManifestRecord(manifest).manifest_hash, /^[a-f0-9]{64}$/);
});

test("manifesto rejeita destino não declarado e estratégia ausente", () => {
  const newSection = {
    ...oldHomicide,
    section_id: "penal-sec-02",
    content_unit_id: "00000000-0000-4000-8000-000000000002",
    stable_key: "feminicidio",
  };
  const impact = buildContentImpact([oldHomicide], [newSection], { replace: true });
  const malformed = {
    schema_version: 1,
    topic_id: "penal",
    reason: "Substituição estrutural do conteúdo penal.",
    operations: [{
      type: "remap",
      from: ["homicidio"],
      to: ["outro-crime"],
      rationale: "Destino deliberadamente incorreto.",
    }],
  };
  assert.equal(ChangeManifestSchema.safeParse(malformed).success, false);
  assert.ok(getManifestIssues({
    ...malformed,
    operations: [{ ...malformed.operations[0], personal_data_strategy: strategy() }],
  }, "penal", impact).some((issue) => /Destino/.test(issue)));
});

test("relatório inclui dados pessoais afetados e restauração", () => {
  const archived = { ...oldHomicide, archived_at: "2026-09-01T00:00:00.000Z" };
  const impact = buildContentImpact([archived], [{ ...oldHomicide }], { replace: true });
  const summary = summarizeContentImpact(impact, { progress: 2, notes: 3, highlights: 4 });
  assert.equal(summary.restores, 1);
  assert.deepEqual(summary.affected_personal_records, {
    progress: 2, notes: 3, highlights: 4,
  });
});
