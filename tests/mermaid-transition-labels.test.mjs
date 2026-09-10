import assert from "node:assert/strict";
import test from "node:test";
import { stripMermaidTransitionLabels } from "../src/lib/mermaid/strip-transition-labels.mjs";

test("remove rótulos redundantes de arestas Mermaid", () => {
  const source = [
    "flowchart TD",
    "  A -->|Inicia em| B",
    "  B -->|\"prossegue para\"| C",
    "  C -- Prossegue para --> D",
    "  D -->|Prazo legal| E",
  ].join("\n");

  assert.equal(
    stripMermaidTransitionLabels(source),
    [
      "flowchart TD",
      "  A --> B",
      "  B --> C",
      "  C --> D",
      "  D -->|Prazo legal| E",
    ].join("\n"),
  );
});
