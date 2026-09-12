import assert from "node:assert/strict";
import test from "node:test";

import { SECURITY_HEADERS } from "../src/lib/security-headers.mjs";

const headers = new Map(
  SECURITY_HEADERS.map(({ key, value }) => [key.toLowerCase(), value])
);

test("define o baseline defensivo do PRO Resumos", () => {
  assert.equal(headers.get("x-content-type-options"), "nosniff");
  assert.equal(headers.get("x-frame-options"), "DENY");
  assert.equal(
    headers.get("referrer-policy"),
    "strict-origin-when-cross-origin"
  );
  assert.equal(
    headers.get("permissions-policy"),
    "camera=(), geolocation=(), microphone=()"
  );
});

test("aplica CSP estrutural sem restringir recursos da aplicação", () => {
  const contentSecurityPolicy = headers.get("content-security-policy");

  assert.equal(
    contentSecurityPolicy,
    "base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'"
  );
  assert.doesNotMatch(contentSecurityPolicy, /(?:script|style|connect|img)-src/);
});
