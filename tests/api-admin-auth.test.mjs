import assert from "node:assert/strict";
import test from "node:test";

import { isServiceRoleRequest } from "../src/lib/api-admin-auth.mjs";

test("aceita somente o bearer token administrativo exato", () => {
  const request = new Request("https://example.com/api/import", {
    headers: { authorization: "Bearer segredo" },
  });

  assert.equal(isServiceRoleRequest(request, "segredo"), true);
  assert.equal(isServiceRoleRequest(request, "outro-segredo"), false);
});

test("mantém a rota fechada sem chave ou sem autorização", () => {
  const request = new Request("https://example.com/api/import");

  assert.equal(isServiceRoleRequest(request, "segredo"), false);
  assert.equal(isServiceRoleRequest(request, undefined), false);
});
