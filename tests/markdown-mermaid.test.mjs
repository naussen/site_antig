import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const markdownViewerPath = new URL(
  "../src/components/study/markdown-viewer.tsx",
  import.meta.url,
);
const markdownMermaidPath = new URL(
  "../src/components/study/markdown-mermaid.tsx",
  import.meta.url,
);

test("blocos Mermaid do Markdown usam o visualizador client-only", async () => {
  const [markdownViewer, markdownMermaid] = await Promise.all([
    readFile(markdownViewerPath, "utf8"),
    readFile(markdownMermaidPath, "utf8"),
  ]);

  assert.match(markdownViewer, /className === "language-mermaid"/);
  assert.match(markdownViewer, /<MarkdownMermaid source=\{codeBlock\.source\}/);
  assert.match(markdownMermaid, /^"use client";/);
  assert.match(markdownMermaid, /import\("@\/components\/study\/mermaid-viewer"\)/);
  assert.match(markdownMermaid, /ssr: false/);
});

test("Mermaid cercado reutiliza a validação compartilhada e preserva fallback textual", async () => {
  const markdownMermaid = await readFile(markdownMermaidPath, "utf8");

  assert.match(markdownMermaid, /getMermaidSecurityIssue\(source\)/);
  assert.match(markdownMermaid, /Este diagrama não pôde ser exibido com segurança/);
  assert.match(markdownMermaid, /<code className="language-mermaid">\{source\}<\/code>/);
  assert.doesNotMatch(markdownMermaid, /dangerouslySetInnerHTML|innerHTML\s*=/);
});
