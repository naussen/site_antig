import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("webhook Mercado Pago ordena pelo estado consultado e identifica pelo request assinado", async () => {
  const source = await read("src/app/api/payments/webhooks/mercado-pago/route.ts");
  assert.match(source, /eventId:\s*requestId/);
  assert.match(source, /if \(!queryDataId \|\| queryDataId !== resourceId\)/);
  assert.doesNotMatch(source, /date_created/);
  assert.doesNotMatch(source, /parsed\.data\.id/);
  assert.match(source, /getMercadoPagoSubscription/);
});

test("estorno e chargeback exigem vínculo persistido com assinatura e usuário", async () => {
  const source = await read("src/app/api/payments/webhooks/mercado-pago/route.ts");
  assert.match(source, /topic_chargebacks_wh/);
  assert.match(source, /getProviderTransaction\("mercado_pago", paymentId\)/);
  assert.match(source, /assertExpectedSubscription\(mapping\.provider_subscription_id, mapping\.user_id\)/);
  assert.match(source, /status: "past_due"/);
  assert.match(source, /accessUntil: null/);
  assert.match(source, /blockPaymentAccess/);
});

test("estornos dos dois provedores criam bloqueio persistente de acesso", async () => {
  const mercadoPago = await read("src/app/api/payments/webhooks/mercado-pago/route.ts");
  const paypal = await read("src/app/api/payments/webhooks/paypal/route.ts");
  const migration = await read("supabase/migrations/025_persist_adverse_payment_blocks.sql");
  assert.match(mercadoPago, /reason: payment\.status === "charged_back" \? "chargeback" : "refund"/);
  assert.match(paypal, /PAYMENT\.SALE\.REFUNDED/);
  assert.match(paypal, /reason: parsed\.data\.event_type === "PAYMENT\.SALE\.REFUNDED" \? "refund" : "reversal"/);
  assert.match(migration, /CREATE TABLE public\.payment_access_blocks/);
  assert.match(migration, /p_status IN \('active', 'trialing'\)[^;]+payment_access_blocks/s);
  assert.match(migration, /NOT EXISTS \([^;]+payment_access_blocks/s);
});

test("migration bloqueia replay temporal e preserva o período já pago no cancelamento", async () => {
  const source = await read("supabase/migrations/024_harden_payments_and_privacy_requests.sql");
  assert.match(source, /provider_updated_at[^;]+< EXCLUDED\.provider_updated_at/s);
  assert.doesNotMatch(source, /status NOT IN \('active', 'trialing'\)/);
  assert.match(source, /EXCLUDED\.status = 'canceled' AND EXCLUDED\.access_until IS NULL/);
  assert.match(source, /entitlement\.status = 'canceled'/);
});

test("cancelamento é autenticado, same-origin e revalida o provedor", async () => {
  const source = await read("src/app/api/payments/cancel/route.ts");
  assert.match(source, /isSameOriginRequest\(request\)/);
  assert.match(source, /supabase\.auth\.getUser\(\)/);
  assert.match(source, /\.eq\("user_id", user\.id\)/);
  assert.match(source, /cancelMercadoPagoSubscription/);
  assert.match(source, /cancelPayPalSubscription/);
});

test("canal LGPD valida entrada, limita abuso e grava somente no backend", async () => {
  const source = await read("src/app/api/privacy-requests/route.ts");
  assert.match(source, /requestSchema\.safeParse/);
  assert.match(source, /isSameOriginRequest\(request\)/);
  assert.match(source, /createAdminClient\(\)/);
  assert.match(source, />= 3/);
  assert.doesNotMatch(source, /console\.(log|error)/);
});
