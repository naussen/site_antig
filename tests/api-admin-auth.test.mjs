import assert from "node:assert/strict";
import test from "node:test";

import { isAdminApiRequest } from "../src/lib/api-admin-auth.mjs";

const ADMIN_TOKEN = "a".repeat(32);

test("aceita somente o bearer token administrativo exato", () => {
  const request = new Request("https://example.com/api/import", {
    headers: { authorization: `Bearer ${ADMIN_TOKEN}` },
  });

  assert.equal(isAdminApiRequest(request, ADMIN_TOKEN), true);
  assert.equal(isAdminApiRequest(request, "b".repeat(32)), false);
});

test("mantém a rota fechada sem chave ou sem autorização", () => {
  const request = new Request("https://example.com/api/import");

  assert.equal(isAdminApiRequest(request, ADMIN_TOKEN), false);
  assert.equal(isAdminApiRequest(request, undefined), false);
});

test("rejeita token administrativo curto mesmo quando coincide", () => {
  const request = new Request("https://example.com/api/import", {
    headers: { authorization: "Bearer segredo-curto" },
  });

  assert.equal(isAdminApiRequest(request, "segredo-curto"), false);
});
