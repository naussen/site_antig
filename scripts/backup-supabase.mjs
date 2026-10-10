import { createHash, randomBytes } from "node:crypto";
import { copyFile, mkdir, readdir, rename, rm, stat, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
import {
  backupBaseName,
  createTemporaryDirectory,
  discoverPublicTables,
  encryptArchive,
  ensureDirectory,
  protectKeyWithDpapi,
  protectKeyWithPassphrase,
  removeTemporaryDirectory,
  runTar,
  sha256File,
  writeJson,
  writeJsonLines,
} from "./supabase-backup-core.mjs";

const PAGE_SIZE = 500;
const DEFAULT_OUTPUT = "C:\\PRO\\backups\\pro-resumos";
const DEFAULT_RETENTION_DAYS = 30;

function argumentValue(name, fallback) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : fallback;
}

function requiredEnvironment(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Variável obrigatória ausente: ${name}`);
  return value;
}

async function selectAll(supabase, table) {
  const rows = [];
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .range(offset, offset + PAGE_SIZE - 1);
    if (error) throw new Error(`${table}: ${error.code ?? "query_failed"}`);
    rows.push(...(data ?? []));
    if ((data?.length ?? 0) < PAGE_SIZE) return rows;
  }
}

async function listAuthUsers(supabase) {
  const listedUsers = [];
  for (let page = 1; ; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw new Error(`Auth: ${error.code ?? "list_users_failed"}`);
    listedUsers.push(...data.users);
    if (data.users.length < 1000) break;
  }

  const users = [];
  for (const listedUser of listedUsers) {
    const { data, error } = await supabase.auth.admin.getUserById(listedUser.id);
    if (error || !data.user) {
      throw new Error(`Auth: ${error?.code ?? "get_user_failed"}`);
    }
    users.push(data.user);
  }
  return users;
}

async function listStorageObjects(supabase, bucketId, prefix = "") {
  const files = [];
  for (let offset = 0; ; offset += 100) {
    const { data, error } = await supabase.storage.from(bucketId).list(prefix, {
      limit: 100,
      offset,
      sortBy: { column: "name", order: "asc" },
    });
    if (error) throw new Error(`Storage ${bucketId}/${prefix}: ${error.message}`);
    for (const item of data ?? []) {
      const objectPath = prefix ? `${prefix}/${item.name}` : item.name;
      if (item.id || item.metadata) files.push({ path: objectPath, metadata: item.metadata ?? null });
      else files.push(...(await listStorageObjects(supabase, bucketId, objectPath)));
    }
    if ((data?.length ?? 0) < 100) return files;
  }
}

function encodedObjectPath(bucketId, objectPath) {
  return join(
    "storage",
    encodeURIComponent(bucketId),
    ...objectPath.split("/").map((part) => encodeURIComponent(part))
  );
}

async function copyMigrations(stagingDirectory) {
  const sourceDirectory = join(process.cwd(), "supabase", "migrations");
  const destinationDirectory = join(stagingDirectory, "migrations");
  await mkdir(destinationDirectory, { recursive: true });
  const files = (await readdir(sourceDirectory)).filter((name) => name.endsWith(".sql")).sort();
  for (const name of files) {
    await copyFile(join(sourceDirectory, name), join(destinationDirectory, name));
  }
  return files.length;
}

async function hashPayloadFiles(stagingDirectory) {
  const results = [];
  async function walk(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const absolute = join(directory, entry.name);
      if (entry.isDirectory()) await walk(absolute);
      else if (entry.name !== "manifest.json") {
        results.push({
          path: relative(stagingDirectory, absolute).replaceAll("\\", "/"),
          bytes: (await stat(absolute)).size,
          sha256: await sha256File(absolute),
        });
      }
    }
  }
  await walk(stagingDirectory);
  return results.sort((a, b) => a.path.localeCompare(b.path));
}

async function enforceRetention(outputDirectory, retentionDays) {
  const cutoff = Date.now() - retentionDays * 86_400_000;
  for (const name of await readdir(outputDirectory)) {
    if (!/^pro-resumos-.*\.(?:probackup|probackup\.key\.(?:dpapi|recovery)|summary\.json)$/u.test(name)) continue;
    const path = join(outputDirectory, name);
    if ((await stat(path)).mtimeMs < cutoff) await rm(path, { force: true });
  }
}

async function copyOffsite(files, destinationDirectory) {
  await ensureDirectory(destinationDirectory);
  for (const source of files) {
    const destination = join(destinationDirectory, source.split(/[\\/]/u).at(-1));
    const temporary = `${destination}.partial`;
    await copyFile(source, temporary);
    if (await sha256File(source) !== await sha256File(temporary)) {
      await rm(temporary, { force: true });
      throw new Error("A cópia off-site falhou na verificação de integridade.");
    }
    await rename(temporary, destination);
  }
}

async function main() {
  const outputDirectory = argumentValue("--output", DEFAULT_OUTPUT);
  const migrationsDirectory = resolve(process.cwd(), "supabase", "migrations");
  const publicTables = await discoverPublicTables(migrationsDirectory);
  const retentionDays = Number(argumentValue("--retention-days", DEFAULT_RETENTION_DAYS));
  if (!Number.isInteger(retentionDays) || retentionDays < 7) {
    throw new Error("A retenção deve ser um número inteiro de pelo menos 7 dias.");
  }

  const supabaseUrl = requiredEnvironment("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = requiredEnvironment("SUPABASE_SERVICE_ROLE_KEY");
  const projectRef = new URL(supabaseUrl).hostname.split(".")[0];
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });

  await ensureDirectory(outputDirectory);
  const baseName = backupBaseName();
  const backupPath = join(outputDirectory, `${baseName}.probackup`);
  const keyPath = `${backupPath}.key.dpapi`;
  const recoveryKeyPath = `${backupPath}.key.recovery`;
  const summaryPath = join(outputDirectory, `${baseName}.summary.json`);
  const temporaryRoot = await createTemporaryDirectory("pro-resumos-backup-");
  const stagingDirectory = join(temporaryRoot, "payload");
  const tarPath = join(temporaryRoot, "payload.tar");
  await mkdir(stagingDirectory, { recursive: true });

  try {
    const tableCounts = {};
    for (const table of publicTables) {
      const rows = await selectAll(supabase, table);
      tableCounts[table] = rows.length;
      await writeJsonLines(join(stagingDirectory, "database", `${table}.jsonl`), rows);
    }

    const users = await listAuthUsers(supabase);
    await writeJsonLines(join(stagingDirectory, "auth", "users.jsonl"), users);

    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    if (bucketsError) throw new Error(`Storage buckets: ${bucketsError.message}`);
    await writeJson(join(stagingDirectory, "storage", "buckets.json"), buckets ?? []);

    const storageObjects = [];
    for (const bucket of buckets ?? []) {
      const objects = await listStorageObjects(supabase, bucket.id);
      for (const object of objects) {
        const { data, error } = await supabase.storage.from(bucket.id).download(object.path);
        if (error || !data) throw new Error(`Download Storage ${bucket.id}/${object.path} falhou.`);
        const destination = join(stagingDirectory, encodedObjectPath(bucket.id, object.path));
        await ensureDirectory(dirname(destination));
        const bytes = Buffer.from(await data.arrayBuffer());
        await writeFile(destination, bytes, { flag: "wx" });
        storageObjects.push({
          bucket_id: bucket.id,
          object_path: object.path,
          archive_path: relative(stagingDirectory, destination).replaceAll("\\", "/"),
          bytes: bytes.length,
          sha256: createHash("sha256").update(bytes).digest("hex"),
          metadata: object.metadata,
        });
      }
    }
    await writeJson(join(stagingDirectory, "storage", "objects.json"), storageObjects);

    const migrationCount = await copyMigrations(stagingDirectory);
    const payloadFiles = await hashPayloadFiles(stagingDirectory);
    const manifest = {
      format: "pro-resumos-logical-backup",
      version: 1,
      created_at: new Date().toISOString(),
      project_ref: projectRef,
      encryption: "AES-256-GCM; key protected with Windows DPAPI CurrentUser",
      limitations: [
        "Auth password hashes, OAuth provider secrets and active sessions are not exposed by the Admin API.",
        "Database functions, policies and schema are restored from the versioned migrations.",
      ],
      table_counts: tableCounts,
      auth_user_count: users.length,
      auth_identity_count: users.reduce((count, user) => count + (user.identities?.length ?? 0), 0),
      storage_bucket_count: (buckets ?? []).length,
      storage_object_count: storageObjects.length,
      migration_count: migrationCount,
      files: payloadFiles,
    };
    await writeJson(join(stagingDirectory, "manifest.json"), manifest);

    runTar(["-cf", tarPath, "-C", stagingDirectory, "."]);
    const encryptionKey = randomBytes(32);
    protectKeyWithDpapi(encryptionKey, keyPath);
    const recoveryPassphrase = process.env.PRO_BACKUP_RECOVERY_PASSPHRASE?.trim();
    if (recoveryPassphrase) {
      await protectKeyWithPassphrase(encryptionKey, recoveryPassphrase, recoveryKeyPath);
    }
    await encryptArchive(tarPath, backupPath, encryptionKey);
    encryptionKey.fill(0);

    const summary = {
      ...manifest,
      files: undefined,
      backup_file: backupPath,
      key_file: keyPath,
      portable_recovery_key: Boolean(recoveryPassphrase),
      backup_bytes: (await stat(backupPath)).size,
      backup_sha256: await sha256File(backupPath),
    };
    await writeFile(summaryPath, `${JSON.stringify(summary, null, 2)}\n`, {
      encoding: "utf8",
      flag: "wx",
    });
    const offsiteDirectory = process.env.PRO_BACKUP_OFFSITE_DIRECTORY?.trim();
    if (offsiteDirectory && !recoveryPassphrase) {
      throw new Error("Backup off-site exige PRO_BACKUP_RECOVERY_PASSPHRASE.");
    }
    if (offsiteDirectory) {
      await copyOffsite([backupPath, recoveryKeyPath, summaryPath], offsiteDirectory);
    }
    await enforceRetention(outputDirectory, retentionDays);
    console.log(JSON.stringify(summary));
  } catch (error) {
    await rm(backupPath, { force: true });
    await rm(keyPath, { force: true });
    await rm(recoveryKeyPath, { force: true });
    await rm(summaryPath, { force: true });
    throw error;
  } finally {
    await removeTemporaryDirectory(temporaryRoot);
  }
}

async function notifyBackupFailure() {
  const webhookUrl = process.env.OPS_ALERT_WEBHOOK_URL?.trim();
  if (!webhookUrl) return;
  try {
    const url = new URL(webhookUrl);
    if (url.protocol !== "https:") throw new Error("invalid_alert_url");
    await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text: "PRO Concursos: o backup diário do Supabase falhou." }),
      signal: AbortSignal.timeout(5_000),
    });
  } catch {
    console.error("Falha ao enviar alerta operacional do backup.");
  }
}

main().catch(async (error) => {
  console.error(error instanceof Error ? error.message : String(error));
  await notifyBackupFailure();
  process.exitCode = 1;
});
