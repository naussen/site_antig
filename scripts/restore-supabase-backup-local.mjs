import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { createClient } from "@supabase/supabase-js";
import {
  countJsonLines,
  createTemporaryDirectory,
  decryptArchive,
  ensureDirectory,
  assertSafeTarArchive,
  removeTemporaryDirectory,
  resolveBackupPair,
  runTar,
  safePayloadPath,
  sha256File,
  unprotectKeyWithDpapi,
} from "./supabase-backup-core.mjs";

const MAX_OUTPUT_BYTES = 4 * 1024 * 1024;

function argumentValue(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : null;
}

function requiredArgument(name) {
  const value = argumentValue(name)?.trim();
  if (!value) throw new Error(`Use ${name} <valor>.`);
  return value;
}

function run(command, args, input, stage = command) {
  const result = spawnSync(command, args, {
    encoding: "utf8",
    input,
    maxBuffer: MAX_OUTPUT_BYTES,
    windowsHide: true,
  });
  if (result.status !== 0) {
    const diagnostic = result.stderr
      .split(/\r?\n/u)
      .find((line) => /^ERROR:/u.test(line))
      ?.replace(/'[^']*'/gu, "'<redacted>'")
      .replace(/[0-9a-f]{8}-[0-9a-f-]{27,}/giu, "<redacted-uuid>");
    throw new Error(
      `Falha na etapa isolada ${stage} (código ${result.status ?? "unknown"})` +
      `${diagnostic ? `: ${diagnostic}` : "."}`,
    );
  }
  return result.stdout.trim();
}

function quoteIdentifier(value) {
  if (!/^[a-z_][a-z0-9_]*$/u.test(value)) throw new Error("Identificador SQL inesperado no backup.");
  return `"${value}"`;
}

function dollarQuotedJson(value) {
  const body = JSON.stringify(value);
  let delimiter;
  do delimiter = `$pro_restore_${randomBytes(6).toString("hex")}$`;
  while (body.includes(delimiter));
  return `${delimiter}${body}${delimiter}::jsonb`;
}

function readJsonLines(body) {
  return body.split(/\r?\n/u).filter(Boolean).map((line) => JSON.parse(line));
}

function psql(container, sql, stage) {
  return run("docker.exe", [
    "exec", "-i", container,
    "psql", "-X", "-qAt", "-v", "ON_ERROR_STOP=1", "-U", "postgres", "-d", "postgres",
  ], sql, stage);
}

function assertIsolatedContainer(container, project) {
  if (container !== `supabase_db_${project}` || !/^[a-zA-Z0-9_.-]+$/u.test(project)) {
    throw new Error("O destino deve ser o container local do projeto confirmado.");
  }
  const label = run("docker.exe", [
    "inspect", container,
    "--format", "{{index .Config.Labels \"com.supabase.cli.project\"}}",
  ], undefined, "validação do projeto local");
  if (label !== project) throw new Error("O container não pertence ao projeto Supabase local confirmado.");
  const running = run(
    "docker.exe",
    ["inspect", container, "--format", "{{.State.Running}}"],
    undefined,
    "validação do container local",
  ).toLowerCase();
  if (running !== "true") throw new Error("O container Supabase local não está em execução.");
}

function publicInsertStatement(table, rows, columns) {
  if (rows.length === 0) return "";
  const available = new Set(Object.keys(rows[0]));
  const insertable = columns.filter((column) => column.generated === "NEVER" && available.has(column.column));
  if (insertable.length === 0) throw new Error(`${table}: nenhuma coluna restaurável.`);
  const identifiers = insertable.map((column) => quoteIdentifier(column.column)).join(", ");
  const override = insertable.some((column) => column.identity) ? " OVERRIDING SYSTEM VALUE" : "";
  return `INSERT INTO public.${quoteIdentifier(table)} (${identifiers})${override}\n` +
    `SELECT ${identifiers} FROM jsonb_populate_recordset(NULL::public.${quoteIdentifier(table)}, ${dollarQuotedJson(rows)});`;
}

function mapAuthUsers(users) {
  return users.map((user) => ({
    id: user.id,
    aud: user.aud ?? "authenticated",
    role: user.role ?? "authenticated",
    email: user.email ?? null,
    email_confirmed_at: user.email_confirmed_at ?? null,
    last_sign_in_at: user.last_sign_in_at ?? null,
    raw_app_meta_data: user.app_metadata ?? {},
    raw_user_meta_data: user.user_metadata ?? {},
    created_at: user.created_at,
    updated_at: user.updated_at,
    phone: user.phone || null,
    is_sso_user: false,
    is_anonymous: Boolean(user.is_anonymous),
  }));
}

function mapAuthIdentities(users) {
  return users.flatMap((user) => (user.identities ?? []).map((identity) => ({
    provider_id: identity.id,
    user_id: user.id,
    identity_data: identity.identity_data ?? {},
    provider: identity.provider,
    last_sign_in_at: identity.last_sign_in_at ?? null,
    created_at: identity.created_at ?? user.created_at,
    updated_at: identity.updated_at ?? user.updated_at,
    id: identity.identity_id,
  })));
}

function qualifiedIdentifier(schema, table) {
  return `${quoteIdentifier(schema)}.${quoteIdentifier(table)}`;
}

function validateForeignKeys(container) {
  const constraints = JSON.parse(psql(container, `
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'name', constraint_data.name,
      'child_schema', constraint_data.child_schema,
      'child_table', constraint_data.child_table,
      'parent_schema', constraint_data.parent_schema,
      'parent_table', constraint_data.parent_table,
      'child_columns', constraint_data.child_columns,
      'parent_columns', constraint_data.parent_columns
    )), '[]'::jsonb)
    FROM (
      SELECT
        constraint_row.conname AS name,
        child_namespace.nspname AS child_schema,
        child_table.relname AS child_table,
        parent_namespace.nspname AS parent_schema,
        parent_table.relname AS parent_table,
        (
          SELECT jsonb_agg(attribute.attname ORDER BY key_column.ordinality)
          FROM unnest(constraint_row.conkey) WITH ORDINALITY AS key_column(attnum, ordinality)
          JOIN pg_attribute AS attribute
            ON attribute.attrelid = constraint_row.conrelid
           AND attribute.attnum = key_column.attnum
        ) AS child_columns,
        (
          SELECT jsonb_agg(attribute.attname ORDER BY key_column.ordinality)
          FROM unnest(constraint_row.confkey) WITH ORDINALITY AS key_column(attnum, ordinality)
          JOIN pg_attribute AS attribute
            ON attribute.attrelid = constraint_row.confrelid
           AND attribute.attnum = key_column.attnum
        ) AS parent_columns
      FROM pg_constraint AS constraint_row
      JOIN pg_class AS child_table ON child_table.oid = constraint_row.conrelid
      JOIN pg_namespace AS child_namespace ON child_namespace.oid = child_table.relnamespace
      JOIN pg_class AS parent_table ON parent_table.oid = constraint_row.confrelid
      JOIN pg_namespace AS parent_namespace ON parent_namespace.oid = parent_table.relnamespace
      WHERE constraint_row.contype = 'f'
        AND child_namespace.nspname IN ('public', 'auth')
    ) AS constraint_data;
  `, "inventário de chaves estrangeiras"));

  for (const constraint of constraints) {
    const childColumns = constraint.child_columns.map(quoteIdentifier);
    const parentColumns = constraint.parent_columns.map(quoteIdentifier);
    const present = childColumns.map((column) => `child.${column} IS NOT NULL`).join(" AND ");
    const match = childColumns.map((column, index) =>
      `parent.${parentColumns[index]} = child.${column}`
    ).join(" AND ");
    const violations = Number(psql(container, `
      SELECT count(*)
      FROM ${qualifiedIdentifier(constraint.child_schema, constraint.child_table)} AS child
      WHERE ${present}
        AND NOT EXISTS (
          SELECT 1
          FROM ${qualifiedIdentifier(constraint.parent_schema, constraint.parent_table)} AS parent
          WHERE ${match}
        );
    `, `validação da chave estrangeira ${constraint.name}`));
    assert.equal(violations, 0, `${constraint.name}: referências órfãs após restore`);
  }
  return constraints.length;
}

function simulateContentAccess(container, userId, appRole, aal, grantActive = false) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu.test(userId)) {
    throw new Error("UUID inválido na fixture local restaurada.");
  }
  const claims = {
    sub: userId,
    role: "authenticated",
    aal,
    app_metadata: appRole ? { role: appRole } : {},
  };
  return JSON.parse(psql(container, `
    BEGIN;
    ${grantActive ? `
      INSERT INTO public.user_entitlements (
        user_id, provider, provider_subscription_id, status, provider_updated_at
      ) VALUES (
        '${userId}'::uuid, 'mercado_pago', 'local-restore-drill', 'active', now()
      )
      ON CONFLICT (user_id) DO UPDATE SET
        status = 'active', access_until = NULL, provider_updated_at = now();
    ` : ""}
    SELECT set_config('request.jwt.claims', ${dollarQuotedJson(claims)}::text, true);
    SET LOCAL ROLE authenticated;
    SELECT jsonb_build_object(
      'access', public.has_active_content_access(),
      'sections', (SELECT count(*) FROM public.sections)
    );
    ROLLBACK;
  `, `smoke RLS ${appRole ?? "subscriber"}/${aal}`)
    .split(/\r?\n/u)
    .filter((line) => line.startsWith("{"))
    .at(-1));
}

function validateContentAccess(container) {
  const fixtures = JSON.parse(psql(container, `
    SELECT jsonb_build_object(
      'subscriber', (
        SELECT users.id FROM auth.users AS users
        WHERE COALESCE(users.raw_app_meta_data ->> 'role', '') <> 'admin'
        LIMIT 1
      ),
      'inactive', (
        SELECT users.id FROM auth.users AS users
        WHERE COALESCE(users.raw_app_meta_data ->> 'role', '') <> 'admin'
          AND NOT EXISTS (
            SELECT 1 FROM public.user_entitlements AS entitlement
            WHERE entitlement.user_id = users.id
          )
        LIMIT 1
      ),
      'admin', (
        SELECT id FROM auth.users
        WHERE raw_app_meta_data ->> 'role' = 'admin'
        LIMIT 1
      )
    );
  `, "seleção das fixtures restauradas"));
  assert.ok(fixtures.subscriber && fixtures.inactive && fixtures.admin, "Restore sem perfis suficientes para o smoke RLS.");

  const active = simulateContentAccess(container, fixtures.subscriber, null, "aal1", true);
  const inactive = simulateContentAccess(container, fixtures.inactive, null, "aal1");
  const adminAal1 = simulateContentAccess(container, fixtures.admin, "admin", "aal1");
  const adminAal2 = simulateContentAccess(container, fixtures.admin, "admin", "aal2");
  assert.equal(active.access, true, "assinante restaurado deve acessar");
  assert.ok(Number(active.sections) > 0, "assinante restaurado deve ler seções");
  assert.equal(inactive.access, false, "usuário restaurado sem assinatura deve ser bloqueado");
  assert.equal(Number(inactive.sections), 0, "RLS deve ocultar seções do usuário sem assinatura");
  assert.equal(adminAal1.access, false, "administrador restaurado AAL1 deve ser bloqueado");
  assert.equal(Number(adminAal1.sections), 0, "RLS deve ocultar seções do administrador AAL1");
  assert.equal(adminAal2.access, true, "administrador restaurado AAL2 deve acessar");
  assert.ok(Number(adminAal2.sections) > 0, "administrador restaurado AAL2 deve ler seções");
  return 4;
}

async function restoreStorage(root, manifest) {
  const status = JSON.parse(run(
    "supabase.exe",
    ["status", "-o", "json"],
    undefined,
    "leitura do Supabase local",
  ));
  const apiUrl = new URL(status.API_URL);
  if (!new Set(["127.0.0.1", "localhost", "::1"]).has(apiUrl.hostname) || !status.SECRET_KEY) {
    throw new Error("A API de Storage do destino não é local.");
  }
  const client = createClient(apiUrl.href, status.SECRET_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const buckets = JSON.parse(await readFile(join(root, "storage", "buckets.json"), "utf8"));
  for (const bucket of buckets) {
    const { error } = await client.storage.createBucket(bucket.id, {
      public: Boolean(bucket.public),
      fileSizeLimit: bucket.file_size_limit ?? undefined,
      allowedMimeTypes: bucket.allowed_mime_types ?? undefined,
    });
    if (error) throw new Error("Falha ao recriar bucket no Storage local.");
  }

  const objects = JSON.parse(await readFile(join(root, "storage", "objects.json"), "utf8"));
  for (const object of objects) {
    const bytes = await readFile(safePayloadPath(root, object.archive_path));
    const { error } = await client.storage.from(object.bucket_id).upload(object.object_path, bytes, {
      contentType: object.metadata?.mimetype ?? "application/octet-stream",
      upsert: false,
    });
    if (error) throw new Error("Falha ao recriar objeto no Storage local.");
  }
  assert.equal(buckets.length, manifest.storage_bucket_count, "Storage: inventário de buckets divergente");
  assert.equal(objects.length, manifest.storage_object_count, "Storage: inventário de objetos divergente");
}

async function verifyPayload(root, manifest) {
  assert.equal(manifest.format, "pro-resumos-logical-backup");
  assert.equal(manifest.version, 1);
  for (const file of manifest.files) {
    const path = safePayloadPath(root, file.path);
    assert.equal(await sha256File(path), file.sha256, `${file.path}: hash divergente`);
  }
  for (const [table, expected] of Object.entries(manifest.table_counts)) {
    assert.equal(
      await countJsonLines(join(root, "database", `${table}.jsonl`)),
      expected,
      `${table}: contagem divergente`,
    );
  }
}

async function main() {
  const backup = requiredArgument("--backup");
  const container = requiredArgument("--db-container");
  const project = requiredArgument("--confirm-local-project");
  assertIsolatedContainer(container, project);

  const temporaryRoot = await createTemporaryDirectory("pro-resumos-local-restore-");
  const tarPath = join(temporaryRoot, "payload.tar");
  const root = join(temporaryRoot, "payload");
  const startedAt = Date.now();

  try {
    const pair = resolveBackupPair(backup, argumentValue("--key"));
    const key = unprotectKeyWithDpapi(pair.keyPath);
    await decryptArchive(pair.backupPath, tarPath, key);
    key.fill(0);
    assertSafeTarArchive(tarPath);
    await ensureDirectory(root);
    runTar(["-xf", tarPath, "-C", root]);

    const manifest = JSON.parse(await readFile(join(root, "manifest.json"), "utf8"));
    await verifyPayload(root, manifest);
    const schema = JSON.parse(psql(container, `
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'table', table_name,
        'column', column_name,
        'generated', is_generated,
        'identity', identity_generation
      ) ORDER BY table_name, ordinal_position), '[]'::jsonb)
      FROM information_schema.columns
      WHERE table_schema = 'public';
    `, "leitura do schema local"));
    const columnsByTable = Map.groupBy(schema, (column) => column.table);
    for (const table of Object.keys(manifest.table_counts)) {
      if (!columnsByTable.has(table)) throw new Error(`${table}: tabela ausente no destino local.`);
    }

    const users = readJsonLines(await readFile(join(root, "auth", "users.jsonl"), "utf8"));
    const identities = mapAuthIdentities(users);
    const expectedIdentityCount = manifest.auth_identity_count ?? identities.length;
    if (users.length !== manifest.auth_user_count || identities.length !== expectedIdentityCount || identities.length === 0) {
      throw new Error("O backup Auth não contém usuários e identidades suficientes para o restore.");
    }

    const publicStatements = [];
    for (const table of Object.keys(manifest.table_counts)) {
      const rows = readJsonLines(await readFile(join(root, "database", `${table}.jsonl`), "utf8"));
      const statement = publicInsertStatement(table, rows, columnsByTable.get(table));
      if (statement) publicStatements.push(statement);
    }

    const publicTables = Object.keys(manifest.table_counts)
      .map((table) => `public.${quoteIdentifier(table)}`)
      .join(", ");
    const userColumns = [
      "id", "aud", "role", "email", "email_confirmed_at", "last_sign_in_at",
      "raw_app_meta_data", "raw_user_meta_data", "created_at", "updated_at", "phone",
      "is_sso_user", "is_anonymous",
    ].map(quoteIdentifier).join(", ");
    const identityColumns = [
      "provider_id", "user_id", "identity_data", "provider", "last_sign_in_at",
      "created_at", "updated_at", "id",
    ].map(quoteIdentifier).join(", ");

    psql(container, [
      "BEGIN;",
      "SET LOCAL session_replication_role = replica;",
      `TRUNCATE ${publicTables} RESTART IDENTITY CASCADE;`,
      "TRUNCATE storage.objects;",
      "DELETE FROM storage.buckets;",
      "DELETE FROM auth.identities;",
      "DELETE FROM auth.users;",
      `INSERT INTO auth.users (${userColumns}) SELECT ${userColumns} FROM jsonb_populate_recordset(NULL::auth.users, ${dollarQuotedJson(mapAuthUsers(users))});`,
      `INSERT INTO auth.identities (${identityColumns}) SELECT ${identityColumns} FROM jsonb_populate_recordset(NULL::auth.identities, ${dollarQuotedJson(identities)});`,
      ...publicStatements,
      "COMMIT;",
    ].join("\n"), "carga do backup local");

    const restoredCounts = JSON.parse(psql(container, `
      SELECT jsonb_object_agg(table_name, row_count)
      FROM (
        ${Object.keys(manifest.table_counts).map((table) =>
          `SELECT '${table}'::text AS table_name, count(*)::bigint AS row_count FROM public.${quoteIdentifier(table)}`
        ).join("\nUNION ALL\n")}
      ) AS counts;
    `, "contagem das tabelas restauradas"));
    for (const [table, expected] of Object.entries(manifest.table_counts)) {
      assert.equal(Number(restoredCounts[table]), expected, `${table}: restore incompleto`);
    }

    await restoreStorage(root, manifest);

    const authCounts = JSON.parse(psql(container, `
      SELECT jsonb_build_object(
        'users', (SELECT count(*) FROM auth.users),
        'identities', (SELECT count(*) FROM auth.identities),
        'buckets', (SELECT count(*) FROM storage.buckets),
        'objects', (SELECT count(*) FROM storage.objects)
      );
    `, "contagem de Auth e Storage"));
    assert.equal(Number(authCounts.users), users.length, "Auth: usuários divergentes");
    assert.equal(Number(authCounts.identities), identities.length, "Auth: identidades divergentes");
    assert.equal(Number(authCounts.buckets), manifest.storage_bucket_count, "Storage: buckets divergentes");
    assert.equal(Number(authCounts.objects), manifest.storage_object_count, "Storage: objetos divergentes");
    const foreignKeysValidated = validateForeignKeys(container);
    const accessScenariosValidated = validateContentAccess(container);

    console.log(JSON.stringify({
      restored: true,
      isolated_project: project,
      tables: Object.keys(manifest.table_counts).length,
      rows: Object.values(manifest.table_counts).reduce((sum, count) => sum + count, 0),
      auth_users: users.length,
      auth_identities: identities.length,
      storage_buckets: Number(authCounts.buckets),
      storage_objects: Number(authCounts.objects),
      foreign_keys_validated: foreignKeysValidated,
      access_scenarios_validated: accessScenariosValidated,
      duration_seconds: Math.round((Date.now() - startedAt) / 100) / 10,
    }));
  } finally {
    await removeTemporaryDirectory(temporaryRoot);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
