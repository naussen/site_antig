import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const providersSource = await readFile(
  new URL("../src/lib/payments/providers.ts", import.meta.url),
  "utf8"
);

test("não registra respostas brutas nem payloads dos provedores", () => {
  assert.doesNotMatch(providersSource, /console\.(?:debug|error|info|log|warn)/);
  assert.doesNotMatch(providersSource, /body\.slice\s*\(/);
  assert.doesNotMatch(providersSource, /Checkout payload/i);
});
