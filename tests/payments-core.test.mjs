import test from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import {
  calculateAccessUntil,
  isAllowedCheckoutUrl,
  mapMercadoPagoStatus,
  mapPayPalStatus,
  resolveMercadoPagoStatus,
  resolvePayPalStatus,
  verifyMercadoPagoSignature,
} from "../src/lib/payments/core.mjs";

test("mapeia estados dos provedores sem conceder acesso a estado desconhecido", () => {
  assert.equal(mapMercadoPagoStatus("authorized"), "active");
  assert.equal(mapMercadoPagoStatus("paused"), "past_due");
  assert.equal(mapMercadoPagoStatus("unexpected"), "pending");
  assert.equal(mapPayPalStatus("ACTIVE"), "active");
  assert.equal(mapPayPalStatus("SUSPENDED"), "past_due");
  assert.equal(mapPayPalStatus("UNKNOWN"), "pending");
});

test("reconciliação exige cobrança confirmada e preserva estados terminais", () => {
  assert.equal(resolveMercadoPagoStatus("authorized"), "pending");
  assert.equal(resolveMercadoPagoStatus("authorized", { paymentStatus: "approved" }), "active");
  assert.equal(resolveMercadoPagoStatus("authorized", { paymentStatus: "rejected", summarized: "pending" }), "pending");
  assert.equal(resolveMercadoPagoStatus("cancelled", { paymentStatus: "approved" }), "canceled");
  assert.equal(resolvePayPalStatus("ACTIVE", 1), "past_due");
  assert.equal(resolvePayPalStatus("CANCELLED", 1), "canceled");
});

test("limita temporalmente um acesso ativo mesmo sem próxima cobrança", () => {
  const eventTime = "2026-08-24T12:00:00.000Z";
  assert.equal(calculateAccessUntil("active", null, eventTime), "2026-10-01T12:00:00.000Z");
  assert.equal(calculateAccessUntil("pending", null, eventTime), null);
});

test("valida assinatura HMAC do Mercado Pago com comparação segura", () => {
  const input = { dataId: "abc123", requestId: "request-1", secret: "webhook-secret", ts: "1704908010" };
  const manifest = `id:${input.dataId};request-id:${input.requestId};ts:${input.ts};`;
  const hash = createHmac("sha256", input.secret).update(manifest).digest("hex");
  assert.equal(verifyMercadoPagoSignature({ ...input, signature: `ts=${input.ts},v1=${hash}` }), true);
  assert.equal(verifyMercadoPagoSignature({ ...input, signature: `ts=${input.ts},v1=${"0".repeat(64)}` }), false);
});

test("aceita redirecionamento somente para hosts HTTPS dos provedores", () => {
  assert.equal(isAllowedCheckoutUrl("https://www.mercadopago.com.br/subscriptions/checkout", "mercado_pago"), true);
  assert.equal(isAllowedCheckoutUrl("https://www.paypal.com/webapps/billing/subscriptions", "paypal"), true);
  assert.equal(isAllowedCheckoutUrl("https://www.paypal.com.evil.example/steal", "paypal"), false);
  assert.equal(isAllowedCheckoutUrl("javascript:alert(1)", "paypal"), false);
});
