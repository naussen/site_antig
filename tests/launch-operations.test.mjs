import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("reconciliação persiste heartbeat e roda a cada seis horas", async () => {
  const reconciliation = await read("src/lib/payments/reconciliation.ts");
  const scheduled = await read("netlify/functions/reconcile-payments.mjs");
  assert.match(reconciliation, /startJobRun\("payment_reconciliation"\)/);
  assert.match(reconciliation, /finishJobRun/);
  assert.match(scheduled, /schedule: "0 \*\/6 \* \* \*"/);
  assert.match(scheduled, /OPS_ALERT_WEBHOOK_URL/);
  assert.doesNotMatch(scheduled, /console\.error\([^)]*error/);
});

test("health check não expõe métricas ou erros internos", async () => {
  const health = await read("src/app/api/health/route.ts");
  assert.match(health, /Cache-Control": "no-store"/);
  assert.match(health, /RECONCILIATION_MAX_AGE_MS/);
  assert.doesNotMatch(health, /serviceRoleKey|SUPABASE_SERVICE_ROLE_KEY/);
  assert.doesNotMatch(health, /message: error|String\(error\)/);
});

test("backup alerta falhas sem enviar conteúdo ou credenciais", async () => {
  const backup = await read("scripts/backup-supabase.mjs");
  assert.match(backup, /o backup diário do Supabase falhou/);
  assert.match(backup, /OPS_ALERT_WEBHOOK_URL/);
  assert.doesNotMatch(backup, /body: JSON\.stringify\(\{[^}]*error/s);
});
