import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const providersSource = await readFile(
  new URL("../src/lib/payments/providers.ts", import.meta.url),
  "utf8"
);
const auditSource = await readFile(new URL("../src/lib/payments/audit.ts", import.meta.url), "utf8");
const checkoutSource = await readFile(
  new URL("../src/app/api/payments/checkout/[provider]/route.ts", import.meta.url),
  "utf8"
);
const cancelSource = await readFile(
  new URL("../src/app/api/payments/cancel/route.ts", import.meta.url),
  "utf8"
);
const migrationSource = await readFile(
  new URL("../supabase/migrations/027_create_payment_audit_events.sql", import.meta.url),
  "utf8"
);

test("não registra respostas brutas nem payloads dos provedores", () => {
  assert.doesNotMatch(providersSource, /console\.(?:debug|error|info|log|warn)/);
  assert.doesNotMatch(providersSource, /body\.slice\s*\(/);
  assert.doesNotMatch(providersSource, /Checkout payload/i);
});

test("auditoria financeira é persistente, mínima e não bloqueia o fluxo principal", () => {
  assert.match(auditSource, /payment_audit_events/);
  assert.match(auditSource, /return false/);
  assert.match(auditSource, /try\s*\{/);
  assert.match(auditSource, /catch\s*\{/);
  assert.match(auditSource, /SAFE_REASON_CODE/);
  assert.doesNotMatch(auditSource, /payload|token|email|card|cookie/i);
  assert.match(checkoutSource, /action: "checkout_created"/);
  assert.match(checkoutSource, /action: "checkout_failed"/);
  assert.match(cancelSource, /action: "cancellation_confirmed"/);
  assert.match(cancelSource, /action: "cancellation_failed"/);
  assert.match(migrationSource, /REVOKE ALL PRIVILEGES[^;]+PUBLIC, anon, authenticated/s);
  assert.match(migrationSource, /GRANT SELECT, INSERT[^;]+service_role/s);
  assert.doesNotMatch(migrationSource, /^\s*(?:payload|email|token|card|cookie)[a-z_]*\s+/imu);
});
