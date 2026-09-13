import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { RequestBodyError, readJsonBodyLimited } from "../src/lib/request-body.mjs";
import { MAX_WEBHOOK_BODY_BYTES } from "../src/lib/payments/webhook-request.mjs";

test("webhooks usam leitura limitada antes do parse e não carregam o corpo inteiro", async () => {
  for (const route of ["mercado-pago", "paypal"]) {
    const source = await readFile(
      new URL(`../src/app/api/payments/webhooks/${route}/route.ts`, import.meta.url),
      "utf8"
    );
    assert.doesNotMatch(source, /request\.text\(|request\.json\(|JSON\.parse\(/);
    assert.match(source, /readWebhookJson\(request\)/);
    assert.ok(source.indexOf("readWebhookJson") < source.indexOf("eventSchema.safeParse"));
  }
  assert.equal(MAX_WEBHOOK_BODY_BYTES, 256 * 1024);
});

test("rejeita Content-Length declarado acima de 256 KiB antes de consumir o stream", async () => {
  let readerRequested = false;
  const request = {
    headers: new Headers({
      "Content-Type": "application/json",
      "Content-Length": String(MAX_WEBHOOK_BODY_BYTES + 1),
    }),
    body: {
      getReader() {
        readerRequested = true;
        throw new Error("o stream não deveria ser lido");
      },
    },
  };

  await assert.rejects(
    () => readJsonBodyLimited(request, MAX_WEBHOOK_BODY_BYTES),
    (error) => error instanceof RequestBodyError && error.status === 413
  );
  assert.equal(readerRequested, false);
});

test("interrompe stream segmentado quando os bytes efetivos excedem o limite", async () => {
  let cancelled = false;
  const request = new Request("https://example.test/webhook", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: new ReadableStream({
      start(controller) {
        controller.enqueue(new Uint8Array(200_000));
        controller.enqueue(new Uint8Array(70_000));
      },
      cancel() {
        cancelled = true;
      },
    }),
    duplex: "half",
  });

  await assert.rejects(
    () => readJsonBodyLimited(request, MAX_WEBHOOK_BODY_BYTES),
    (error) => error instanceof RequestBodyError && error.status === 413
  );
  assert.equal(cancelled, true);
});

test("exige application/json e rejeita UTF-8 inválido", async () => {
  const wrongType = new Request("https://example.test/webhook", {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: "{}",
  });
  await assert.rejects(
    () => readJsonBodyLimited(wrongType, MAX_WEBHOOK_BODY_BYTES),
    (error) => error instanceof RequestBodyError && error.status === 415
  );

  const misleadingType = new Request("https://example.test/webhook", {
    method: "POST",
    headers: { "Content-Type": "application/jsonp" },
    body: "{}",
  });
  await assert.rejects(
    () => readJsonBodyLimited(misleadingType, MAX_WEBHOOK_BODY_BYTES),
    (error) => error instanceof RequestBodyError && error.status === 415
  );

  const invalidUtf8 = new Request("https://example.test/webhook", {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: Uint8Array.from([0xc3, 0x28]),
  });
  await assert.rejects(
    () => readJsonBodyLimited(invalidUtf8, MAX_WEBHOOK_BODY_BYTES),
    (error) => error instanceof RequestBodyError && error.status === 400
  );
});

test("aceita JSON válido dentro do limite com MIME parametrizado", async () => {
  const payload = { id: "evt-1", data: { id: "subscription-1" } };
  const request = new Request("https://example.test/webhook", {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify(payload),
  });
  assert.deepEqual(await readJsonBodyLimited(request, MAX_WEBHOOK_BODY_BYTES), payload);
});
