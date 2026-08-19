import assert from "node:assert/strict";
import test from "node:test";

import {
  SITE_BASE_PATH,
  withSiteBasePath,
} from "../src/lib/site-paths.mjs";

test("expõe o site no prefixo público configurado", () => {
  assert.equal(SITE_BASE_PATH, "/resumos");
  assert.equal(withSiteBasePath("/"), "/resumos");
  assert.equal(withSiteBasePath("/login"), "/resumos/login");
  assert.equal(
    withSiteBasePath("/auth/callback?next=%2Fdashboard"),
    "/resumos/auth/callback?next=%2Fdashboard"
  );
});

test("não duplica o prefixo e rejeita destinos externos", () => {
  assert.equal(withSiteBasePath("/resumos/login"), "/resumos/login");
  assert.throws(() => withSiteBasePath("https://example.com"), TypeError);
  assert.throws(() => withSiteBasePath("//example.com"), TypeError);
});
