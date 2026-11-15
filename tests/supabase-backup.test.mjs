import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  createTemporaryDirectory,
  decryptArchive,
  discoverPublicTables,
  discoverRemoteCatalog,
  encryptArchive,
  fetchTableRows,
  isPermissionError,
  isTableNotFoundError,
  protectKeyWithPassphrase,
  removeTemporaryDirectory,
  safePayloadPath,
  unprotectKeyWithPassphrase,
} from "../scripts/supabase-backup-core.mjs";
import { runSupabaseBackup } from "../scripts/backup-supabase.mjs";

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

function createCompleteMockSupabase(tableHandlers = {}) {
  const users = [
    {
      id: "u1",
      email: "aluno1@pro.test",
      identities: [{ id: "id1", provider: "google" }],
    },
  ];

  return {
    auth: {
      admin: {
        async listUsers({ page, perPage }) {
          const slice = users.slice((page - 1) * perPage, page * perPage);
          return { data: { users: slice }, error: null };
        },
        async getUserById(id) {
          const u = users.find((item) => item.id === id);
          return { data: { user: u }, error: null };
        },
      },
    },
    storage: {
      async listBuckets() {
        return { data: [], error: null };
      },
      from() {
        return {
          async list() {
            return { data: [], error: null };
          },
          async download() {
            return { data: null, error: new Error("no object") };
          },
        };
      },
    },
    from(tableName) {
      const handler =
        tableHandlers[tableName] ??
        (() => ({ data: [], error: null }));
      return {
        select() {
          return {
            async range(start, end) {
              return handler({ table: tableName, start, end });
            },
          };
        },
      };
    },
  };
}

test("reconhecimento preciso de erros de tabela inexistente vs coluna ausente (42703) e permissão", () => {
  // 42703 (undefined_column) NUNCA é tabela inexistente
  assert.equal(
    isTableNotFoundError({ code: "42703", message: "column topics.missing_column does not exist" }, "topics"),
    false,
  );
  assert.equal(
    isTableNotFoundError({ code: "42703", message: "column topics.missing_column does not exist" }),
    false,
  );
  // Mensagem contendo "column" mesmo sem código não é tabela ausente
  assert.equal(
    isTableNotFoundError({ message: "column topics.missing_column does not exist" }, "topics"),
    false,
  );

  // Erros de permissão e autenticação nunca são tratados como tabela ausente
  assert.equal(isTableNotFoundError({ code: "42501", message: "permission denied for table topics" }, "topics"), false);
  assert.equal(isTableNotFoundError({ code: "PGRST301", message: "JWT not authorized" }, "topics"), false);
  assert.equal(isTableNotFoundError({ code: "500", message: "internal server error" }, "topics"), false);

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

  // Mensagem textual estrita de relação inexistente sem código
  assert.equal(isTableNotFoundError({ message: 'relation "topics" does not exist' }, "topics"), true);
  assert.equal(
    isTableNotFoundError({ message: "could not find the table 'public.topics' in the schema cache" }, "topics"),
    true,
  );
  assert.equal(isTableNotFoundError({ message: "falha generica de conexao" }, "topics"), false);

  // isPermissionError
  assert.equal(isPermissionError({ code: "42501", message: "insufficient_privilege" }), true);
  assert.equal(isPermissionError({ code: "PGRST301", message: "not authorized" }), true);
  assert.equal(isPermissionError({ code: "42P01", message: "relation does not exist" }), false);
  assert.equal(isPermissionError({ code: "42703", message: "undefined_column" }), false);
});

test("descoberta remota rejeita falhas de autenticação e status de erro (401, 403, 500)", async () => {
  const options401 = {
    supabaseUrl: "http://127.0.0.1:54321",
    serviceRoleKey: "key",
    fetchOverride: async () => ({
      status: 401,
      statusText: "Unauthorized",
      ok: false,
    }),
  };
  await assert.rejects(discoverRemoteCatalog(options401), /HTTP 401 Unauthorized/);

  const options403 = {
    supabaseUrl: "http://127.0.0.1:54321",
    serviceRoleKey: "key",
    fetchOverride: async () => ({
      status: 403,
      statusText: "Forbidden",
      ok: false,
    }),
  };
  await assert.rejects(discoverRemoteCatalog(options403), /HTTP 403 Forbidden/);

  const options500 = {
    supabaseUrl: "http://127.0.0.1:54321",
    serviceRoleKey: "key",
    fetchOverride: async () => ({
      status: 500,
      statusText: "Internal Server Error",
      ok: false,
    }),
  };
  await assert.rejects(discoverRemoteCatalog(options500), /HTTP 500 Internal Server Error/);
});

test("descoberta remota rejeita timeout, JSON inválido e schema inesperado", async () => {
  const timeoutOptions = {
    supabaseUrl: "http://127.0.0.1:54321",
    serviceRoleKey: "key",
    fetchOverride: async () => {
      const err = new Error("Request timed out");
      err.name = "TimeoutError";
      throw err;
    },
  };
  await assert.rejects(discoverRemoteCatalog(timeoutOptions), /Timeout de \d+ms/);

  const invalidJsonOptions = {
    supabaseUrl: "http://127.0.0.1:54321",
    serviceRoleKey: "key",
    fetchOverride: async () => ({
      status: 200,
      ok: true,
      async json() {
        throw new Error("Unexpected token < in JSON");
      },
    }),
  };
  await assert.rejects(discoverRemoteCatalog(invalidJsonOptions), /Resposta inválida \(não-JSON\)/);

  const emptySchemaOptions = {
    supabaseUrl: "http://127.0.0.1:54321",
    serviceRoleKey: "key",
    fetchOverride: async () => ({
      status: 200,
      ok: true,
      async json() {
        return {};
      },
    }),
  };
  await assert.rejects(discoverRemoteCatalog(emptySchemaOptions), /Schema inesperado.*definitions ou paths ausentes/);

  const noValidTablesOptions = {
    supabaseUrl: "http://127.0.0.1:54321",
    serviceRoleKey: "key",
    fetchOverride: async () => ({
      status: 200,
      ok: true,
      async json() {
        return { definitions: { "invalid-name!": {} } };
      },
    }),
  };
  await assert.rejects(discoverRemoteCatalog(noValidTablesOptions), /Nenhuma tabela válida foi identificada/);
});

test("descoberta remota carrega tabelas com sucesso de OpenAPI e snapshot", async () => {
  const openApiOptions = {
    supabaseUrl: "http://127.0.0.1:54321",
    serviceRoleKey: "key",
    fetchOverride: async () => ({
      status: 200,
      ok: true,
      async json() {
        return {
          definitions: { topics: {}, sections: {} },
          paths: { "/topics": {}, "/user_progress": {}, "/rpc/some_func": {} },
        };
      },
    }),
  };
  const openApiRes = await discoverRemoteCatalog(openApiOptions);
  assert.equal(openApiRes.source, "postgrest_openapi");
  assert.deepEqual(openApiRes.tables, ["sections", "topics", "user_progress"]);

  const snapshotRes = await discoverRemoteCatalog({
    catalogSnapshot: ["questions", "topics"],
  });
  assert.equal(snapshotRes.source, "catalog_snapshot");
  assert.deepEqual(snapshotRes.tables, ["questions", "topics"]);

  await assert.rejects(
    discoverRemoteCatalog({ catalogSnapshot: ["tabela com espaco!"] }),
    /Nome de tabela inválido no snapshot/,
  );
});

test("fetchTableRows falha imediatamente em erro de permissão (42501) e coluna inexistente (42703)", async () => {
  const supabase = createCompleteMockSupabase({
    restricted_table: () => ({
      data: null,
      error: { code: "42501", message: "permission denied for table restricted_table" },
    }),
    broken_column_table: () => ({
      data: null,
      error: { code: "42703", message: "column topics.missing_col does not exist" },
    }),
  });

  await assert.rejects(
    fetchTableRows(supabase, "restricted_table"),
    /Permissão insuficiente ao ler a tabela "restricted_table": \[42501\]/,
  );

  await assert.rejects(
    fetchTableRows(supabase, "broken_column_table"),
    /Falha de consulta ou rede ao ler a tabela "broken_column_table": \[42703\] column topics\.missing_col does not exist/,
  );
});

test("fetchTableRows pagina corretamente tabela com dados e falha em página posterior", async () => {
  const totalRows = 1250;
  const allRows = Array.from({ length: totalRows }, (_, i) => ({ id: i + 1, name: `row-${i + 1}` }));
  const calls = [];

  const supabase = createCompleteMockSupabase({
    populated_table: ({ start, end }) => {
      calls.push({ start, end });
      const slice = allRows.slice(start, end + 1);
      return { data: slice, error: null };
    },
    paged_failing: ({ start }) => {
      if (start === 0) {
        return { data: Array.from({ length: 500 }, (_, i) => ({ id: i })), error: null };
      }
      return { data: null, error: { code: "503", message: "Service temporarily unavailable" } };
    },
  });

  const populatedResult = await fetchTableRows(supabase, "populated_table", { pageSize: 500 });
  assert.equal(populatedResult.status, "ok");
  assert.equal(populatedResult.rows.length, 1250);
  assert.deepEqual(calls, [
    { start: 0, end: 499 },
    { start: 500, end: 999 },
    { start: 1000, end: 1499 },
  ]);

  await assert.rejects(
    fetchTableRows(supabase, "paged_failing", { pageSize: 500 }),
    /Falha de consulta ou rede ao paginar a tabela "paged_failing": \[503\]/,
  );
});

test("caminho real: tabela existente no remoto e ausente nas migrations locais é exportada em untracked_tables", async () => {
  const directory = await createTemporaryDirectory("pro-backup-untracked-test-");
  const migrationsDir = join(directory, "migrations");
  const outputDir = join(directory, "backups");

  try {
    await mkdir(migrationsDir, { recursive: true });
    await writeFile(join(migrationsDir, "001.sql"), "CREATE TABLE topics (id uuid);");

    const client = createCompleteMockSupabase({
      topics: () => ({ data: [{ id: "t1" }], error: null }),
      remote_audit_log: () => ({ data: [{ id: "log1" }, { id: "log2" }], error: null }),
    });

    const summary = await runSupabaseBackup({
      outputDirectory: outputDir,
      migrationsDirectory: migrationsDir,
      catalogTablesOverride: ["topics", "remote_audit_log"],
      catalogSourceOverride: "postgresql_catalog",
      clientOverride: client,
      supabaseUrl: "http://127.0.0.1:54321",
      serviceRoleKey: "secret-key",
    });

    assert.equal(summary.schema_scope.catalog_verified, true);
    assert.deepEqual(summary.schema_scope.untracked_tables, ["remote_audit_log"]);
    assert.deepEqual(summary.schema_scope.missing_tables, []);
    assert.equal(summary.table_counts.topics, 1);
    assert.equal(summary.table_counts.remote_audit_log, 2);
    assert.equal(summary.schema_scope.exported_tables_count, 2);
  } finally {
    await removeTemporaryDirectory(directory);
  }
});

test("caminho real: tabela prevista localmente e comprovadamente ausente no banco é registrada em missing_tables", async () => {
  const directory = await createTemporaryDirectory("pro-backup-missing-test-");
  const migrationsDir = join(directory, "migrations");
  const outputDir = join(directory, "backups");

  try {
    await mkdir(migrationsDir, { recursive: true });
    await writeFile(
      join(migrationsDir, "001.sql"),
      "CREATE TABLE topics (id uuid);\nCREATE TABLE study_routine_weekly_plans (id uuid);",
    );

    const client = createCompleteMockSupabase({
      topics: () => ({ data: [{ id: "t1" }], error: null }),
      study_routine_weekly_plans: () => ({
        data: null,
        error: { code: "PGRST205", message: "Could not find table in schema cache" },
      }),
    });

    const summary = await runSupabaseBackup({
      outputDirectory: outputDir,
      migrationsDirectory: migrationsDir,
      catalogTablesOverride: ["topics"],
      catalogSourceOverride: "postgresql_catalog",
      clientOverride: client,
      supabaseUrl: "http://127.0.0.1:54321",
      serviceRoleKey: "secret-key",
    });

    assert.equal(summary.schema_scope.catalog_verified, true);
    assert.deepEqual(summary.schema_scope.missing_tables, ["study_routine_weekly_plans"]);
    assert.deepEqual(summary.schema_scope.untracked_tables, []);
    assert.equal(summary.table_counts.topics, 1);
    assert.equal(summary.schema_scope.exported_tables_count, 1);
  } finally {
    await removeTemporaryDirectory(directory);
  }
});

test("caminho real: tabela presente no catálogo mas ausente no PostgREST aborta por inconsistência de cache", async () => {
  const directory = await createTemporaryDirectory("pro-backup-inconsistency-test-");
  const migrationsDir = join(directory, "migrations");
  const outputDir = join(directory, "backups");

  try {
    await mkdir(migrationsDir, { recursive: true });
    await writeFile(join(migrationsDir, "001.sql"), "CREATE TABLE topics (id uuid);\nCREATE TABLE cached_table (id uuid);");

    const client = createCompleteMockSupabase({
      topics: () => ({ data: [{ id: "t1" }], error: null }),
      cached_table: () => ({
        data: null,
        error: { code: "PGRST205", message: "Could not find table in schema cache" },
      }),
    });

    await assert.rejects(
      runSupabaseBackup({
        outputDirectory: outputDir,
        migrationsDirectory: migrationsDir,
        catalogTablesOverride: ["topics", "cached_table"],
        clientOverride: client,
        supabaseUrl: "http://127.0.0.1:54321",
        serviceRoleKey: "secret-key",
      }),
      /Inconsistência de exposição\/cache detectada: a tabela "cached_table" consta no catálogo remoto, mas a API PostgREST retornou ausência de schema/,
    );
  } finally {
    await removeTemporaryDirectory(directory);
  }
});

test("caminho real: erro 42703 contendo nome da tabela e 'does not exist' aborta o backup", async () => {
  const directory = await createTemporaryDirectory("pro-backup-col-error-test-");
  const migrationsDir = join(directory, "migrations");
  const outputDir = join(directory, "backups");

  try {
    await mkdir(migrationsDir, { recursive: true });
    await writeFile(join(migrationsDir, "001.sql"), "CREATE TABLE topics (id uuid);");

    const client = createCompleteMockSupabase({
      topics: () => ({
        data: null,
        error: { code: "42703", message: "column topics.missing_column does not exist" },
      }),
    });

    await assert.rejects(
      runSupabaseBackup({
        outputDirectory: outputDir,
        migrationsDirectory: migrationsDir,
        catalogTablesOverride: ["topics"],
        clientOverride: client,
        supabaseUrl: "http://127.0.0.1:54321",
        serviceRoleKey: "secret-key",
      }),
      /\[42703\] column topics\.missing_column does not exist/,
    );
  } finally {
    await removeTemporaryDirectory(directory);
  }
});

test("caminho real: falha em página posterior aborta o backup", async () => {
  const directory = await createTemporaryDirectory("pro-backup-paged-fail-test-");
  const migrationsDir = join(directory, "migrations");
  const outputDir = join(directory, "backups");

  try {
    await mkdir(migrationsDir, { recursive: true });
    await writeFile(join(migrationsDir, "001.sql"), "CREATE TABLE large_table (id uuid);");

    const client = createCompleteMockSupabase({
      large_table: ({ start }) => {
        if (start === 0) {
          return { data: Array.from({ length: 500 }, (_, i) => ({ id: i })), error: null };
        }
        return { data: null, error: { code: "500", message: "Connection reset by peer" } };
      },
    });

    await assert.rejects(
      runSupabaseBackup({
        outputDirectory: outputDir,
        migrationsDirectory: migrationsDir,
        catalogTablesOverride: ["large_table"],
        clientOverride: client,
        supabaseUrl: "http://127.0.0.1:54321",
        serviceRoleKey: "secret-key",
      }),
      /Falha de consulta ou rede ao paginar a tabela "large_table": \[500\]/,
    );
  } finally {
    await removeTemporaryDirectory(directory);
  }
});

test("caminho real: falha limpa todos os arquivos e não publica backup parcial no disco", async () => {
  const directory = await createTemporaryDirectory("pro-backup-cleanup-test-");
  const migrationsDir = join(directory, "migrations");
  const outputDir = join(directory, "backups");

  try {
    await mkdir(migrationsDir, { recursive: true });
    await writeFile(join(migrationsDir, "001.sql"), "CREATE TABLE topics (id uuid);");

    const client = createCompleteMockSupabase({
      topics: () => ({
        data: null,
        error: { code: "42703", message: "column topics.missing_column does not exist" },
      }),
    });

    await assert.rejects(
      runSupabaseBackup({
        outputDirectory: outputDir,
        migrationsDirectory: migrationsDir,
        catalogTablesOverride: ["topics"],
        clientOverride: client,
        supabaseUrl: "http://127.0.0.1:54321",
        serviceRoleKey: "secret-key",
      }),
    );

    // O diretório de saída não deve conter nenhum artefato parcial
    const remainingFiles = await readdir(outputDir);
    assert.deepEqual(remainingFiles, [], "Diretório de saída contém arquivos parciais após falha");
  } finally {
    await removeTemporaryDirectory(directory);
  }
});

test("caminho real: exportação completa, criptografia e verificação com verify-supabase-backup", async () => {
  const directory = await createTemporaryDirectory("pro-backup-real-e2e-test-");
  const migrationsDir = join(directory, "migrations");
  const outputDir = join(directory, "backups");
  const passphrase = "frase-longa-segura-de-recuperacao-teste-backup-32bytes";

  try {
    await mkdir(migrationsDir, { recursive: true });
    await writeFile(
      join(migrationsDir, "001.sql"),
      "CREATE TABLE topics (id uuid);\nCREATE TABLE sections (id uuid);\nCREATE TABLE study_routine_weekly_plans (id uuid);",
    );

    const client = createCompleteMockSupabase({
      topics: () => ({ data: [{ id: "t1", title: "Constitucional" }, { id: "t2", title: "Administrativo" }], error: null }),
      sections: () => ({ data: [{ id: "s1", title: "Artigo 5" }], error: null }),
      study_routine_weekly_plans: () => ({
        data: null,
        error: { code: "PGRST205", message: "Could not find table in schema cache" },
      }),
      remote_metrics: () => ({ data: [{ id: "m1", value: 42 }], error: null }),
    });

    const summary = await runSupabaseBackup({
      outputDirectory: outputDir,
      migrationsDirectory: migrationsDir,
      catalogTablesOverride: ["topics", "sections", "remote_metrics"],
      catalogSourceOverride: "postgresql_catalog",
      clientOverride: client,
      supabaseUrl: "http://127.0.0.1:54321",
      serviceRoleKey: "secret-key",
      recoveryPassphrase: passphrase,
    });

    assert.equal(summary.schema_scope.catalog_verified, true);
    assert.equal(summary.schema_scope.catalog_source, "postgresql_catalog");
    assert.deepEqual(summary.schema_scope.missing_tables, ["study_routine_weekly_plans"]);
    assert.deepEqual(summary.schema_scope.untracked_tables, ["remote_metrics"]);
    assert.equal(summary.table_counts.topics, 2);
    assert.equal(summary.table_counts.sections, 1);
    assert.equal(summary.table_counts.remote_metrics, 1);

    // Validação com o CLI real verify-supabase-backup.mjs
    const verifyScript = fileURLToPath(new URL("../scripts/verify-supabase-backup.mjs", import.meta.url));
    const result = spawnSync(
      process.execPath,
      [verifyScript, "--backup", summary.backup_file, "--recovery-key", summary.key_file.replace(/\.dpapi$/, ".recovery")],
      {
        encoding: "utf8",
        env: {
          ...process.env,
          PRO_BACKUP_RECOVERY_PASSPHRASE: passphrase,
        },
      },
    );

    assert.equal(result.status, 0, `Verificação CLI falhou: ${result.stderr || result.stdout}`);
    const verifyReport = JSON.parse(result.stdout.trim());
    assert.equal(verifyReport.verified, true);
    assert.equal(verifyReport.catalog_source, "postgresql_catalog");
    assert.equal(verifyReport.tables, 3);
    assert.equal(verifyReport.rows, 4);
    assert.equal(verifyReport.missing_tables, 1);
    assert.equal(verifyReport.untracked_tables, 1);
    assert.equal(verifyReport.auth_users, 1);
  } finally {
    await removeTemporaryDirectory(directory);
  }
});
