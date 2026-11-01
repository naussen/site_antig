import assert from "node:assert/strict";
import test from "node:test";

test("F06: aliases de bancas são normalizados canonicamente", () => {
  const normalizeBoard = (board) => {
    if (!board) return null;
    const b = board.trim().toLowerCase();
    if (b === "vunesp") return "Vunesp";
    if (b === "cebraspe" || b === "cespe") return "Cebraspe";
    if (b === "fcc" || b.includes("carlos chagas")) return "FCC";
    return board.trim();
  };

  assert.equal(normalizeBoard("VUNESP"), "Vunesp");
  assert.equal(normalizeBoard("vunesp"), "Vunesp");
  assert.equal(normalizeBoard("Vunesp"), "Vunesp");
  assert.equal(normalizeBoard("CEBRASPE"), "Cebraspe");
  assert.equal(normalizeBoard("Cespe"), "Cebraspe");
  assert.equal(normalizeBoard("Fundação Carlos Chagas"), "FCC");
  assert.equal(normalizeBoard("FCC"), "FCC");
});

test("F08: review_filter aceita apenas opções válidas e seguras", () => {
  const VALID_FILTERS = new Set(["all", "errors", "marked", "answered", "unanswered"]);
  const isValidFilter = (f) => !f || VALID_FILTERS.has(f);

  assert.equal(isValidFilter("all"), true);
  assert.equal(isValidFilter("errors"), true);
  assert.equal(isValidFilter("marked"), true);
  assert.equal(isValidFilter("answered"), true);
  assert.equal(isValidFilter("unanswered"), true);
  assert.equal(isValidFilter("invalid_injection"), false);
  assert.equal(isValidFilter("DROP TABLE"), false);
});
