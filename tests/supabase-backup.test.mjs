import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  createTemporaryDirectory,
  decryptArchive,
  discoverPublicTables,
  encryptArchive,
  fetchTableRows,
  isPermissionError,
  isTableNotFoundError,
  protectKeyWithPassphrase,
  removeTemporaryDirectory,
  runTar,
  safePayloadPath,
  sha256File,
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

test("caminhos do manifesto não escapam do diretório temporário", async () => {
  const directory = await createTemporaryDirectory("pro-backup-path-test-");
  try {
    assert.equal(safePayloadPath(directory, "database/topics.jsonl"), join(directory, "database", "topics.jsonl"));
    assert.throws(() => safePayloadPath(directory, "../fora.json"), /fora do payload/u);
    assert.throws(() => safePayloadPath(directory, "database\\fora.json"), /Caminho inválido/u);
  } finally {
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

test("backup detalha cada usuário para preservar identidades OAuth", async () => {
  const backup = await readFile(
    fileURLToPath(new URL("../scripts/backup-supabase.mjs", import.meta.url)),
    "utf8",
  );
  assert.match(backup, /auth\.admin\.listUsers/u);
  assert.match(backup, /auth\.admin\.getUserById\(listedUser\.id\)/u);
  assert.match(backup, /writeJsonLines\([^;]+auth[^;]+users\.jsonl[^;]+users\)/su);
});

test("restore destrutivo exige container e projeto Supabase local coincidentes", async () => {
  const restore = await readFile(
    fileURLToPath(new URL("../scripts/restore-supabase-backup-local.mjs", import.meta.url)),
    "utf8",
  );
  assert.match(restore, /--confirm-local-project/u);
  assert.match(restore, /container !== `supabase_db_\$\{project\}`/u);
  assert.match(restore, /com\.supabase\.cli\.project/u);
  assert.match(restore, /session_replication_role = replica/u);
  assert.match(restore, /new Set\(\["127\.0\.0\.1", "localhost", "::1"\]\)/u);
  assert.match(restore, /client\.storage\.createBucket/u);
  assert.match(restore, /\.upload\(object\.object_path/u);
  assert.doesNotMatch(restore, /SUPABASE_SERVICE_ROLE_KEY/u);
});

test("reconstrução preserva CRUD administrativo sem ampliar papéis públicos", async () => {
  const migration = await readFile(
    fileURLToPath(new URL("../supabase/migrations/036_restore_service_role_table_privileges.sql", import.meta.url)),
    "utf8",
  );
  assert.match(migration, /GRANT SELECT, INSERT, UPDATE, DELETE[\s\S]*ON ALL TABLES IN SCHEMA public[\s\S]*TO service_role/u);
  assert.doesNotMatch(migration, /TO\s+(?:PUBLIC|anon|authenticated)/u);
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

function createMockSupabase(tableHandlers) {
  return {
    from(tableName) {
      const handler =
        tableHandlers[tableName] ??
        (() => ({ data: [], error: null }));
      return {
        select() {
          return {
            range(start, end) {
              const res = handler({ table: tableName, start, end });
              return Promise.resolve(res);
            },
          };
        },
      };
    },
  };
}

test("reconhecimento preciso de erros de tabela inexistente vs permissão", () => {
  // 42P01 (Postgres relation does not exist)
  assert.equal(isTableNotFoundError({ code: "42P01", message: 'relation "topics" does not exist' }, "topics"), true);
  // PGRST205 (PostgREST schema cache missing table)
  assert.equal(
    isTableNotFoundError(
      { code: "PGRST205", message: "Could not find the 'public.study_routine_weekly_plans' in the schema cache" },
      "study_routine_weekly_plans",
    ),
    true,
  );
  // Permissão nunca deve ser tratada como tabela ausente
  assert.equal(isTableNotFoundError({ code: "42501", message: "permission denied for table topics" }, "topics"), false);
  assert.equal(isTableNotFoundError({ code: "PGRST301", message: "JWT not authorized" }, "topics"), false);

  // isPermissionError
  assert.equal(isPermissionError({ code: "42501", message: "insufficient_privilege" }), true);
  assert.equal(isPermissionError({ code: "PGRST301", message: "not authorized" }), true);
  assert.equal(isPermissionError({ code: "42P01", message: "relation does not exist" }), false);
});

test("fetchTableRows falha imediatamente em erro de permissão sem tratar como tabela ausente", async () => {
  const supabase = createMockSupabase({
    restricted_table: () => ({
      data: null,
      error: { code: "42501", message: "permission denied for table restricted_table" },
    }),
  });

  await assert.rejects(
    fetchTableRows(supabase, "restricted_table"),
    /Permissão insuficiente ao ler a tabela "restricted_table": \[42501\]/,
  );
});

test("fetchTableRows falha imediatamente em erro de rede ou consulta genérica", async () => {
  const supabase = createMockSupabase({
    failing_table: () => ({
      data: null,
      error: { code: "500", message: "Internal server error" },
    }),
    paged_failing: ({ start }) => {
      if (start === 0) {
        return { data: Array.from({ length: 10 }, (_, i) => ({ id: i })), error: null };
      }
      return { data: null, error: { code: "503", message: "Service unavailable" } };
    },
  });

  await assert.rejects(
    fetchTableRows(supabase, "failing_table"),
    /Falha de consulta ou rede ao ler a tabela "failing_table": \[500\]/,
  );

  await assert.rejects(
    fetchTableRows(supabase, "paged_failing", { pageSize: 10 }),
    /Falha de consulta ou rede ao paginar a tabela "paged_failing": \[503\]/,
  );
});

test("fetchTableRows pagina corretamente tabela com dados e suporta tabela vazia", async () => {
  const totalRows = 1250;
  const allRows = Array.from({ length: totalRows }, (_, i) => ({ id: i + 1, name: `row-${i + 1}` }));
  const calls = [];

  const supabase = createMockSupabase({
    empty_table: () => ({ data: [], error: null }),
    populated_table: ({ start, end }) => {
      calls.push({ start, end });
      const slice = allRows.slice(start, end + 1);
      return { data: slice, error: null };
    },
  });

  const emptyResult = await fetchTableRows(supabase, "empty_table");
  assert.equal(emptyResult.status, "ok");
  assert.equal(emptyResult.rows.length, 0);

  const populatedResult = await fetchTableRows(supabase, "populated_table", { pageSize: 500 });
  assert.equal(populatedResult.status, "ok");
  assert.equal(populatedResult.rows.length, 1250);
  assert.deepEqual(populatedResult.rows[0], { id: 1, name: "row-1" });
  assert.deepEqual(populatedResult.rows[1249], { id: 1250, name: "row-1250" });
  assert.deepEqual(calls, [
    { start: 0, end: 499 },
    { start: 500, end: 999 },
    { start: 1000, end: 1499 },
  ]);
});

test("inventário pré-053: banco sem as 4 tabelas de gamificação exporta existentes e registra missing_tables", async () => {
  const expectedTables = [
    "topics",
    "sections",
    "user_study_routine_preferences",
    "study_routine_weekly_plans",
    "study_routine_sessions",
    "study_routine_session_activities",
  ];
  const routineTables = new Set([
    "user_study_routine_preferences",
    "study_routine_weekly_plans",
    "study_routine_sessions",
    "study_routine_session_activities",
  ]);

  const supabase = createMockSupabase({
    topics: () => ({ data: [{ id: "t1" }, { id: "t2" }], error: null }),
    sections: () => ({ data: [{ id: "s1" }], error: null }),
    user_study_routine_preferences: () => ({
      data: null,
      error: { code: "PGRST205", message: "Could not find table in schema cache" },
    }),
    study_routine_weekly_plans: () => ({
      data: null,
      error: { code: "42P01", message: 'relation "study_routine_weekly_plans" does not exist' },
    }),
    study_routine_sessions: () => ({
      data: null,
      error: { code: "PGRST205", message: "Could not find table in schema cache" },
    }),
    study_routine_session_activities: () => ({
      data: null,
      error: { code: "42P01", message: 'relation "study_routine_session_activities" does not exist' },
    }),
  });

  const tableCounts = {};
  const missingTables = [];
  const untrackedTables = [];
  const expectedSet = new Set(expectedTables);

  for (const table of expectedTables) {
    const res = await fetchTableRows(supabase, table);
    if (res.status === "missing") {
      if (expectedSet.has(table)) missingTables.push(table);
      continue;
    }
    tableCounts[table] = res.rows.length;
    if (!expectedSet.has(table)) untrackedTables.push(table);
  }

  assert.equal(missingTables.length, 4);
  for (const t of routineTables) {
    assert.ok(missingTables.includes(t), `Tabela ${t} deveria constar em missing_tables`);
  }
  assert.deepEqual(untrackedTables, []);
  assert.deepEqual(tableCounts, { topics: 2, sections: 1 });

  const schemaScope = {
    expected_tables_count: expectedTables.length,
    exported_tables_count: Object.keys(tableCounts).length,
    missing_tables: missingTables,
    untracked_tables: untrackedTables,
    remote_schema_discovered: true,
  };
  assert.equal(schemaScope.expected_tables_count, 6);
  assert.equal(schemaScope.exported_tables_count, 2);
});

test("inventário pós-053: banco com as 4 tabelas exporta todas e missing_tables fica vazio", async () => {
  const expectedTables = [
    "topics",
    "sections",
    "user_study_routine_preferences",
    "study_routine_weekly_plans",
    "study_routine_sessions",
    "study_routine_session_activities",
  ];

  const supabase = createMockSupabase({
    topics: () => ({ data: [{ id: "t1" }], error: null }),
    sections: () => ({ data: [{ id: "s1" }], error: null }),
    user_study_routine_preferences: () => ({ data: [{ id: "pref1" }], error: null }),
    study_routine_weekly_plans: () => ({ data: [], error: null }),
    study_routine_sessions: () => ({ data: [], error: null }),
    study_routine_session_activities: () => ({ data: [], error: null }),
  });

  const tableCounts = {};
  const missingTables = [];
  const untrackedTables = [];
  const expectedSet = new Set(expectedTables);

  for (const table of expectedTables) {
    const res = await fetchTableRows(supabase, table);
    if (res.status === "missing") {
      if (expectedSet.has(table)) missingTables.push(table);
      continue;
    }
    tableCounts[table] = res.rows.length;
    if (!expectedSet.has(table)) untrackedTables.push(table);
  }

  assert.deepEqual(missingTables, []);
  assert.deepEqual(untrackedTables, []);
  assert.equal(Object.keys(tableCounts).length, 6);
  assert.equal(tableCounts.user_study_routine_preferences, 1);
  assert.equal(tableCounts.study_routine_weekly_plans, 0);
});

test("divergência entre inventário local e remoto: tabela remota vai para untracked e local ausente vai para missing", async () => {
  const expectedTables = ["topics", "sections", "obsolete_local_table"];
  const remoteTables = ["topics", "sections", "remote_audit_log"];
  const candidateTables = Array.from(new Set([...expectedTables, ...remoteTables])).sort((a, b) => a.localeCompare(b));

  const supabase = createMockSupabase({
    topics: () => ({ data: [{ id: "t1" }], error: null }),
    sections: () => ({ data: [], error: null }),
    obsolete_local_table: () => ({
      data: null,
      error: { code: "42P01", message: 'relation "obsolete_local_table" does not exist' },
    }),
    remote_audit_log: () => ({
      data: [{ id: "log1" }, { id: "log2" }],
      error: null,
    }),
  });

  const tableCounts = {};
  const missingTables = [];
  const untrackedTables = [];
  const expectedSet = new Set(expectedTables);

  for (const table of candidateTables) {
    const res = await fetchTableRows(supabase, table);
    if (res.status === "missing") {
      if (expectedSet.has(table)) missingTables.push(table);
      continue;
    }
    tableCounts[table] = res.rows.length;
    if (!expectedSet.has(table)) untrackedTables.push(table);
  }

  assert.deepEqual(missingTables, ["obsolete_local_table"]);
  assert.deepEqual(untrackedTables, ["remote_audit_log"]);
  assert.deepEqual(tableCounts, {
    remote_audit_log: 2,
    sections: 0,
    topics: 1,
  });
});

test("fluxo completo de exportação, cifragem e validação com verify-supabase-backup", async () => {
  const directory = await createTemporaryDirectory("pro-backup-verify-flow-");
  const staging = join(directory, "staging");
  const payloadTar = join(directory, "payload.tar");
  const backupArchive = join(directory, "backup.probackup");
  const recoveryKey = join(directory, "backup.key.recovery");
  const passphrase = "frase-longa-segura-de-recuperacao-teste-backup-32bytes";
  const key = randomBytes(32);

  try {
    await mkdir(join(staging, "database"), { recursive: true });
    await mkdir(join(staging, "auth"), { recursive: true });

    const topicsPath = join(staging, "database", "topics.jsonl");
    const sectionsPath = join(staging, "database", "sections.jsonl");
    const usersPath = join(staging, "auth", "users.jsonl");

    await writeFile(topicsPath, JSON.stringify({ id: "t1", title: "Dir Const" }) + "\n" + JSON.stringify({ id: "t2", title: "Dir Adm" }) + "\n");
    await writeFile(sectionsPath, "");
    await writeFile(usersPath, JSON.stringify({ id: "u1", email: "aluno@pro.test", identities: [{ id: "id1" }] }) + "\n");

    const files = [
      {
        path: "database/topics.jsonl",
        sha256: await sha256File(topicsPath),
        bytes: (await readFile(topicsPath)).length,
      },
      {
        path: "database/sections.jsonl",
        sha256: await sha256File(sectionsPath),
        bytes: 0,
      },
      {
        path: "auth/users.jsonl",
        sha256: await sha256File(usersPath),
        bytes: (await readFile(usersPath)).length,
      },
    ];

    const manifest = {
      format: "pro-resumos-logical-backup",
      version: 1,
      created_at: new Date().toISOString(),
      scope: ["auth.users", "public.*", "storage.metadata", "migrations"],
      table_counts: { topics: 2, sections: 0 },
      schema_scope: {
        expected_tables_count: 6,
        exported_tables_count: 2,
        missing_tables: [
          "user_study_routine_preferences",
          "study_routine_weekly_plans",
          "study_routine_sessions",
          "study_routine_session_activities",
        ],
        untracked_tables: [],
        remote_schema_discovered: true,
      },
      auth_user_count: 1,
      auth_identity_count: 1,
      storage_bucket_count: 0,
      storage_object_count: 0,
      migration_count: 53,
      files,
    };

    await writeFile(join(staging, "manifest.json"), JSON.stringify(manifest, null, 2));

    runTar(["-cf", payloadTar, "-C", staging, "."]);
    await protectKeyWithPassphrase(key, passphrase, recoveryKey);
    await encryptArchive(payloadTar, backupArchive, key);

    const verifyScript = fileURLToPath(new URL("../scripts/verify-supabase-backup.mjs", import.meta.url));
    const result = spawnSync(
      process.execPath,
      [verifyScript, "--backup", backupArchive, "--recovery-key", recoveryKey],
      {
        encoding: "utf8",
        env: {
          ...process.env,
          PRO_BACKUP_RECOVERY_PASSPHRASE: passphrase,
        },
      },
    );

    assert.equal(result.status, 0, `Verificação falhou: ${result.stderr || result.stdout}`);
    const summary = JSON.parse(result.stdout.trim());
    assert.equal(summary.verified, true);
    assert.equal(summary.tables, 2);
    assert.equal(summary.rows, 2);
    assert.equal(summary.missing_tables, 4);
    assert.equal(summary.untracked_tables, 0);
    assert.equal(summary.files_verified, 3);
  } finally {
    key.fill(0);
    await removeTemporaryDirectory(directory);
  }
});
