import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const script = fileURLToPath(new URL("../scripts/check-release-readiness.mjs", import.meta.url));

const readyEnvironment = {
  NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "public-test-value",
  SUPABASE_SERVICE_ROLE_KEY: "private-admin-test-value",
  CONTENT_ADMIN_TOKEN: "private-content-test-value",
  PAYMENTS_APP_URL: "https://example.com/resumos",
  PAYMENTS_MONTHLY_PRICE_BRL: "9.90",
  PAYMENTS_RECONCILIATION_TOKEN: "private-reconciliation-test-value",
  MERCADO_PAGO_ENVIRONMENT: "production",
  MERCADO_PAGO_ACCESS_TOKEN: "private-mercado-pago-test-value",
  MERCADO_PAGO_WEBHOOK_SECRET: "private-mercado-pago-webhook-test-value",
  PAYPAL_ENVIRONMENT: "live",
  PAYPAL_CLIENT_ID: "private-paypal-client-test-value",
  PAYPAL_CLIENT_SECRET: "private-paypal-secret-test-value",
  PAYPAL_PLAN_ID: "private-paypal-plan-test-value",
  PAYPAL_WEBHOOK_ID: "private-paypal-webhook-test-value",
  OPS_ALERT_WEBHOOK_URL: "https://alerts.example.test/hook",
};

function runPreflight(overrides = {}) {
  return spawnSync(process.execPath, [script], {
    cwd: root,
    encoding: "utf8",
    env: { ...readyEnvironment, ...overrides },
    windowsHide: true,
  });
}

test("preflight da aplicação não exige nem expõe segredo do backup", () => {
  const result = runPreflight();
  assert.equal(result.status, 0, result.stderr);
  const output = JSON.parse(result.stdout);
  assert.equal(output.ready, true);
  assert.equal("portable_backup" in output.checks, false);
  for (const value of Object.values(readyEnvironment).filter((item) => item.includes("test-value"))) {
    assert.doesNotMatch(result.stdout, new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});

test("preflight da aplicação falha sem alerta operacional", () => {
  const result = runPreflight({ OPS_ALERT_WEBHOOK_URL: "" });
  assert.equal(result.status, 1);
  const output = JSON.parse(result.stdout);
  assert.equal(output.ready, false);
  assert.equal(output.checks.operations_alert, false);
});

test("preflight do backup valida tarefa, artefatos e cópia sem frase na linha de comando", async () => {
  const source = await readFile(
    new URL("../scripts/check-backup-readiness.ps1", import.meta.url),
    "utf8",
  );
  assert.match(source, /Get-ScheduledTask/u);
  assert.match(source, /encrypted_backup_verified/u);
  assert.match(source, /Test-SameSha256/u);
  assert.doesNotMatch(source, /PRO_BACKUP_RECOVERY_PASSPHRASE/u);
});
