import assert from "node:assert/strict";
import test from "node:test";
import { isAllowedReturnPath, resolveReturnUrl, sanitizeReturnPath } from "../src/lib/return-paths.mjs";

test("aceita retornos das duas zonas e preserva a query", () => {
  assert.equal(isAllowedReturnPath("/legis/amostra?fragment=cf-88.art-5.inciso-1"), true);
  assert.equal(isAllowedReturnPath("/resumos/dashboard"), true);
  assert.equal(resolveReturnUrl("/legis/amostra?fragment=cf-88.art-5.inciso-1", "https://preview.example/login").toString(), "https://proconcursos.com.br/legis/amostra?fragment=cf-88.art-5.inciso-1");
  assert.equal(resolveReturnUrl("/resumos/dashboard", "https://preview.example/login").toString(), "https://preview.example/resumos/dashboard");
});

test("rejeita open redirect e prefixos parecidos", () => {
  assert.equal(isAllowedReturnPath("//evil.example/legis"), false);
  assert.equal(isAllowedReturnPath("/legisioso"), false);
  assert.equal(isAllowedReturnPath("/legis/%2f%2fevil.example"), false);
  assert.equal(sanitizeReturnPath("https://evil.example", "/resumos/dashboard"), "/resumos/dashboard");
});
