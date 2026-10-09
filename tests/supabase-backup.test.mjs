import test from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  createTemporaryDirectory,
  decryptArchive,
  discoverPublicTables,
  encryptArchive,
  protectKeyWithPassphrase,
  removeTemporaryDirectory,
  unprotectKeyWithPassphrase,
} from "../scripts/supabase-backup-core.mjs";

test("backup criptografado restaura os mesmos bytes e rejeita chave incorreta", async () => {
  const directory = await createTemporaryDirectory("pro-backup-test-");
  const source = join(directory, "source.tar");
  const encrypted = join(directory, "backup.probackup");
  const restored = join(directory, "restored.tar");
  const invalid = join(directory, "invalid.tar");
  const key = randomBytes(32);
  const payload = randomBytes(128 * 1024);

  try {
    await writeFile(source, payload);
    await encryptArchive(source, encrypted, key);
    await decryptArchive(encrypted, restored, key);
    assert.deepEqual(await readFile(restored), payload);
    await assert.rejects(decryptArchive(encrypted, invalid, randomBytes(32)));
  } finally {
    key.fill(0);
    await removeTemporaryDirectory(directory);
  }
});

test("chave de recuperação portável exige frase forte e recupera a chave original", async () => {
  const directory = await createTemporaryDirectory("pro-backup-key-test-");
  const keyPath = join(directory, "backup.key.recovery");
  const key = randomBytes(32);
  try {
    await assert.rejects(protectKeyWithPassphrase(key, "curta", keyPath), /20 caracteres/);
    await protectKeyWithPassphrase(key, "frase de recuperacao longa para teste", keyPath);
    assert.deepEqual(
      await unprotectKeyWithPassphrase(keyPath, "frase de recuperacao longa para teste"),
      key
    );
    await assert.rejects(
      unprotectKeyWithPassphrase(keyPath, "frase incorreta mas longa para teste"),
    );
  } finally {
    key.fill(0);
    await removeTemporaryDirectory(directory);
  }
});

test("inventário do backup deriva todas as tabelas das migrations", async () => {
  const directory = await createTemporaryDirectory("pro-backup-schema-test-");
  try {
    await mkdir(directory, { recursive: true });
    await writeFile(join(directory, "001.sql"), [
      "CREATE TABLE topics (id uuid);",
      "CREATE TABLE IF NOT EXISTS public.questions (id uuid);",
      "CREATE VIEW public.ignored AS SELECT 1;",
    ].join("\n"));
    assert.deepEqual(await discoverPublicTables(directory), ["questions", "topics"]);
  } finally {
    await removeTemporaryDirectory(directory);
  }
});

test("inventário real inclui Questões, histórico financeiro e jobs operacionais", async () => {
  const migrations = fileURLToPath(new URL("../supabase/migrations/", import.meta.url));
  const tables = await discoverPublicTables(migrations);
  for (const table of [
    "topics",
    "sections",
    "user_progress",
    "user_notes",
    "user_dashboard_preferences",
    "disciplines",
    "questions",
    "question_options",
    "user_question_attempts",
    "payment_subscription_links",
    "ops_job_runs",
  ]) assert.ok(tables.includes(table), `${table} ausente do inventário`);
});

test("configuração off-site mantém a frase fora dos argumentos da tarefa", async () => {
  const configureScript = await readFile(
    fileURLToPath(new URL("../scripts/configure-supabase-backup-offsite.ps1", import.meta.url)),
    "utf8",
  );
  const taskRunner = await readFile(
    fileURLToPath(new URL("../scripts/run-supabase-backup-task.ps1", import.meta.url)),
    "utf8",
  );
  const taskInstaller = await readFile(
    fileURLToPath(new URL("../scripts/install-supabase-backup-task.ps1", import.meta.url)),
    "utf8",
  );

  assert.match(configureScript, /Read-Host[^\r\n]+-AsSecureString/u);
  assert.match(configureScript, /ProtectedData\]::Protect/u);
  assert.match(configureScript, /SetAccessRuleProtection\(\$true, \$false\)/u);
  assert.match(configureScript, /\.SetAccessControl\(\$acl\)/u);
  assert.doesNotMatch(configureScript, /\bSet-Acl\b/u);
  assert.match(configureScript, /\[switch\]\$UseExistingSecret/u);
  assert.match(taskRunner, /ProtectedData\]::Unprotect/u);
  assert.match(taskRunner, /Remove-Item Env:PRO_BACKUP_RECOVERY_PASSPHRASE/u);
  assert.match(taskRunner, /\[Array\]::Clear\(\$plainBytes/u);
  assert.match(taskInstaller, /run-supabase-backup-task\.ps1/u);
  assert.doesNotMatch(taskInstaller, /PRO_BACKUP_RECOVERY_PASSPHRASE=/u);
});
