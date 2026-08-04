import assert from "node:assert/strict";
import test from "node:test";
import {
  normalizeMarkdownMathNotation,
  remarkSafeBreaks,
} from "../src/lib/markdown-display.ts";

test("converte a equação patrimonial em notação legível", () => {
  assert.equal(
    normalizeMarkdownMathNotation(
      "$$\\text{Ativo (A)} = \\text{Passivo (P)} + \\text{Patrimônio Líquido (PL)}$$"
    ),
    "$$Ativo (A) = Passivo (P) + Patrimônio Líquido (PL)$$"
  );
});

test("converte fórmula inline sem interferir na ênfase Markdown", () => {
  assert.equal(
    normalizeMarkdownMathNotation("**Fórmula:** $A > P \\implies PL > 0$"),
    "**Fórmula:** A > P ⇒ PL > 0"
  );
});

test("preserva valor monetário sem par de delimitadores matemáticos", () => {
  assert.equal(
    normalizeMarkdownMathNotation("O saldo é R$ 1.250,00."),
    "O saldo é R$ 1.250,00."
  );
});

test("converte exclusivamente tags br em quebras Markdown", () => {
  const tree = {
    type: "root",
    children: [{
      type: "tableCell",
      children: [
        { type: "text", value: "Ativo" },
        { type: "html", value: "<br>" },
        { type: "html", value: "<strong>não permitido</strong>" },
      ],
    }],
  };

  remarkSafeBreaks()(tree);

  assert.deepEqual(tree.children[0].children[1], { type: "break" });
  assert.equal(tree.children[0].children[2].type, "html");
});
