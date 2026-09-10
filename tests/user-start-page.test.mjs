import assert from "node:assert/strict";
import test from "node:test";
import {
  parseStartPageSelection,
  resolveUserStartPath,
} from "../src/lib/user-start-page.mjs";

test("resolve módulo e disciplina inicial por allowlist", () => {
  assert.equal(resolveUserStartPath({ start_module: "legis" }), "/legis");
  assert.equal(
    resolveUserStartPath({ start_module: "resumos", start_discipline: "Direito Constitucional" }),
    "/resumos/dashboard?disciplina=Direito%20Constitucional",
  );
  assert.equal(resolveUserStartPath({ start_module: "externo" }), "/resumos/dashboard");
});

test("aceita somente disciplina disponível ao salvar", () => {
  const available = ["Direito Constitucional", "Português"];
  assert.deepEqual(parseStartPageSelection("disciplina:Português", available), {
    startModule: "resumos",
    startDiscipline: "Português",
  });
  assert.deepEqual(parseStartPageSelection("disciplina:Inexistente", available), {
    startModule: "resumos",
    startDiscipline: null,
  });
});
