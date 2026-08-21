import assert from "node:assert/strict";
import test from "node:test";
import { readJsonBodyLimited, RequestBodyError } from "../src/lib/request-body.mjs";
import { isSameOriginRequest } from "../src/lib/same-origin.mjs";

function request(headers = {}, url = "http://internal-runtime/resumos/api/highlights") {
  return new Request(url, { headers });
}

test("aceita origem pública preservada pelo proxy", () => {
  assert.equal(isSameOriginRequest(request({
    origin: "https://proconcursos.com.br",
    "sec-fetch-site": "same-origin",
    "x-forwarded-host": "proconcursos.com.br",
    "x-forwarded-proto": "https",
  })), true);
});

test("rejeita origem cruzada e headers ambíguos", () => {
  const base = { "sec-fetch-site": "same-origin", "x-forwarded-proto": "https" };
  assert.equal(isSameOriginRequest(request({ ...base, origin: "https://evil.example", "x-forwarded-host": "proconcursos.com.br" })), false);
  assert.equal(isSameOriginRequest(request({ ...base, origin: "https://evil.example", "x-forwarded-host": "evil.example, proconcursos.com.br" })), false);
});

test("rejeita mutação sem sinal same-origin do navegador", () => {
  assert.equal(isSameOriginRequest(request({
    origin: "https://proconcursos.com.br",
    "x-forwarded-host": "proconcursos.com.br",
    "x-forwarded-proto": "https",
  })), false);
});

test("limita e valida o JSON antes de processar um realce", async () => {
  const valid = new Request("https://proconcursos.com.br/resumos/api/highlights", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ color: "yellow" }),
  });
  assert.deepEqual(await readJsonBodyLimited(valid, 1_024), { color: "yellow" });

  const oversized = new Request("https://proconcursos.com.br/resumos/api/highlights", {
    method: "POST",
    headers: { "content-type": "application/json", "content-length": "2048" },
    body: "{}",
  });
  await assert.rejects(() => readJsonBodyLimited(oversized, 1_024), RequestBodyError);
});
