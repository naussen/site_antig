import assert from "node:assert/strict";
import test from "node:test";
import {
  parseStartPageSelection,
  resolveUserStartPath,
} from "../src/lib/user-start-page.mjs";

test("resolve somente as páginas iniciais permitidas", () => {
  assert.equal(resolveUserStartPath({ start_module: "legis" }), "/legis");
  assert.equal(resolveUserStartPath({ start_module: "notas" }), "/dashboard/notas");
  assert.equal(resolveUserStartPath({ start_module: "configuracoes" }), "/dashboard/configuracoes");
  assert.equal(resolveUserStartPath({ start_module: "resumos", start_discipline: "Direito Constitucional" }), "/resumos/dashboard");
  assert.equal(resolveUserStartPath({ start_module: "toString" }), "/resumos/dashboard");
  assert.equal(resolveUserStartPath({ start_module: "externo" }), "/resumos/dashboard");
});

test("aceita somente destinos de página inicial ao salvar", () => {
  assert.deepEqual(parseStartPageSelection("notas"), {
    startModule: "notas",
    startDiscipline: null,
  });
  assert.deepEqual(parseStartPageSelection("configuracoes"), {
    startModule: "configuracoes",
    startDiscipline: null,
  });
  assert.deepEqual(parseStartPageSelection("disciplina:Português"), {
    startModule: "resumos",
    startDiscipline: null,
  });
  assert.deepEqual(parseStartPageSelection("toString"), {
    startModule: "resumos",
    startDiscipline: null,
  });
});
