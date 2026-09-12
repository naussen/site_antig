import assert from "node:assert/strict";
import test from "node:test";

import {
  isStudyPath,
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

test("reconhece somente páginas raiz de tópicos como rotas de estudo", () => {
  assert.equal(isStudyPath("/resumos/despesa-publica"), true);
  assert.equal(isStudyPath("/despesa-publica"), true);

  for (const pathname of [
    "/resumos",
    "/resumos/",
    "/resumos/login",
    "/resumos/dashboard",
    "/resumos/api/import",
    "/resumos/auth/callback",
    "/resumos/contato",
    "/resumos/topico/secao",
    "/resumos/favicon.ico",
  ]) {
    assert.equal(isStudyPath(pathname), false, pathname);
  }
});
