import { createCipheriv, createDecipheriv, createHash, randomBytes, scryptSync } from "node:crypto";
import { once } from "node:events";
import {
  createReadStream,
  createWriteStream,
  existsSync,
} from "node:fs";
import { mkdtemp, mkdir, open, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve, sep } from "node:path";
import { spawnSync } from "node:child_process";
import { pipeline } from "node:stream/promises";

export const BACKUP_MAGIC = Buffer.from("PROBACKUP1", "ascii");
export const BACKUP_IV_BYTES = 12;
export const BACKUP_TAG_BYTES = 16;
export const RECOVERY_KEY_MAGIC = Buffer.from("PROKEY1", "ascii");
const RECOVERY_SALT_BYTES = 16;

export async function discoverPublicTables(migrationsDirectory) {
  const tables = new Set();
  const files = (await readdir(migrationsDirectory)).filter((name) => name.endsWith(".sql")).sort();
  for (const file of files) {
    const source = await readFile(join(migrationsDirectory, file), "utf8");
    const pattern = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:public\.)?([a-z_][a-z0-9_]*)\s*\(/giu;
    for (const match of source.matchAll(pattern)) tables.add(match[1]);
  }
  if (tables.size === 0) throw new Error("Nenhuma tabela public foi encontrada nas migrations.");
  return [...tables].sort((a, b) => a.localeCompare(b));
}

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function isTableNotFoundError(error, tableName = "") {
  if (!error) return false;
  const code = error.code ? String(error.code).trim() : "";

  // 1. Códigos conhecidos que comprovadamente NÃO são ausência de tabela
  if (code === "42703") return false; // undefined_column
  if (code === "42501") return false; // insufficient_privilege
  if (code === "PGRST301") return false; // JWT / unauthorized

  // 2. Códigos conhecidos de ausência de tabela
  if (code === "42P01") return true; // undefined_table (PostgreSQL)
  if (code === "PGRST205") return true; // not found in schema cache (PostgREST)

  // 3. Qualquer outro código conhecido não deve ser classificado como tabela ausente
  if (code.length > 0) return false;

  // 4. Sem código: análise textual estrita
  const message = error.message ? String(error.message).trim() : "";
  if (!message) return false;

  // Se a mensagem mencionar coluna, NUNCA é erro de tabela ausente
  if (/\bcolum(?:n|na)\b/i.test(message)) return false;

  const name = tableName.trim();
  if (name.length > 0) {
    const escaped = escapeRegExp(name);
    const relPattern = new RegExp(`\\b(?:relation|table)\\s+["']?(?:public\\.)?${escaped}["']?\\s+does not exist\\b`, "i");
    const cachePattern = new RegExp(`could not find the (?:table|relation)\\s+['"]?(?:public\\.)?${escaped}['"]?\\s+in the schema cache\\b`, "i");
    return relPattern.test(message) || cachePattern.test(message);
  }

  return (
    /\b(?:relation|table)\s+["']?(?:public\.)?[a-z_][a-z0-9_]*["']?\s+does not exist\b/i.test(message) ||
    /could not find the (?:table|relation)\\s+['"]?(?:public\.)?[a-z_][a-z0-9_]*['"]?\\s+in the schema cache\b/i.test(message)
  );
}

export function isPermissionError(error) {
  if (!error) return false;
  const code = error.code ? String(error.code).trim() : "";
  if (code === "42501" || code === "PGRST301") return true;
  const message = (error.message ?? "").toLowerCase();
  return (
    message.includes("permission denied") ||
    message.includes("insufficient_privilege") ||
    message.includes("violates row-level security") ||
    message.includes("not authorized") ||
    message.includes("access denied")
  );
}

async function queryPostgresCatalog(connectionString) {
  const { Client } = await import("pg");
  const client = new Client({ connectionString });
  await client.connect();
  try {
    const res = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);
    return res.rows.map((row) => row.table_name);
  } finally {
    await client.end().catch(() => {});
  }
}

export async function discoverRemoteCatalog(options = {}) {
  // 1. Injeção direta de catálogo (mock / testes unitários)
  if (options.catalogTablesOverride) {
    const tables = [...new Set(options.catalogTablesOverride)].sort((a, b) => a.localeCompare(b));
    return {
      source: options.catalogSourceOverride || "override",
      tables,
    };
  }

  // 2. Conexão direta PostgreSQL (DATABASE_URL / SUPABASE_DB_URL / POSTGRES_URL)
  const connectionString = options.databaseUrl || process.env.DATABASE_URL || process.env.SUPABASE_DB_URL || process.env.POSTGRES_URL;
  if (connectionString) {
    try {
      const tables = await queryPostgresCatalog(connectionString);
      if (!Array.isArray(tables) || tables.length === 0) {
        throw new Error("Nenhuma tabela encontrada no schema public via conexão PostgreSQL.");
      }
      return {
        source: "postgresql_catalog",
        tables: [...new Set(tables)].sort((a, b) => a.localeCompare(b)),
      };
    } catch (error) {
      throw new Error(`Falha ao consultar catálogo PostgreSQL via conexão direta: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // 3. Snapshot de catálogo administrativo verificado
  const snapshotSource = options.catalogSnapshot || options.catalogSnapshotPath || process.env.PRO_BACKUP_CATALOG_SNAPSHOT;
  if (snapshotSource) {
    try {
      let rawTables = snapshotSource;
      if (typeof snapshotSource === "string") {
        if (existsSync(snapshotSource)) {
          rawTables = JSON.parse(await readFile(snapshotSource, "utf8"));
        } else {
          try {
            rawTables = JSON.parse(snapshotSource);
          } catch {
            throw new Error(`Arquivo de snapshot de catálogo não encontrado: ${snapshotSource}`);
          }
        }
      }
      if (!Array.isArray(rawTables) || rawTables.length === 0) {
        throw new Error("O snapshot de catálogo deve ser uma lista não-vazia de tabelas.");
      }
      for (const t of rawTables) {
        if (typeof t !== "string" || !/^[a-z_][a-z0-9_]*$/i.test(t)) {
          throw new Error(`Nome de tabela inválido no snapshot de catálogo: "${t}"`);
        }
      }
      return {
        source: "catalog_snapshot",
        tables: [...new Set(rawTables)].sort((a, b) => a.localeCompare(b)),
      };
    } catch (error) {
      throw new Error(`Falha ao carregar snapshot do catálogo: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // 4. Supabase PostgREST API
  const supabaseUrl = options.supabaseUrl || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = options.serviceRoleKey || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Nenhuma fonte de catálogo remoto configurada (DATABASE_URL, PRO_BACKUP_CATALOG_SNAPSHOT ou NEXT_PUBLIC_SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY).");
  }

  const timeoutMs = Number.isInteger(options.timeoutMs) && options.timeoutMs > 0 ? options.timeoutMs : 10_000;
  const endpoint = new URL("/rest/v1/", supabaseUrl);
  let response;
  try {
    const fetchFn = options.fetchOverride ?? fetch;
    response = await fetchFn(endpoint, {
      method: "GET",
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        Accept: "application/openapi+json, application/json",
      },
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (error) {
    const isTimeout = error?.name === "TimeoutError" || error?.name === "AbortError";
    if (isTimeout) {
      throw new Error(`Timeout de ${timeoutMs}ms ao consultar catálogo remoto via PostgREST.`);
    }
    throw new Error(`Falha de rede ao consultar catálogo remoto via PostgREST: ${error instanceof Error ? error.message : String(error)}`);
  }

  if (response.status === 401 || response.status === 403) {
    const statusText = response.statusText ? ` ${response.statusText}` : "";
    throw new Error(`Falha de autenticação/permissão ao consultar catálogo remoto via PostgREST: HTTP ${response.status}${statusText}`);
  }

  if (!response.ok) {
    const statusText = response.statusText ? ` ${response.statusText}` : "";
    throw new Error(`Falha ao consultar catálogo remoto via PostgREST: HTTP ${response.status}${statusText}`);
  }

  let spec;
  try {
    spec = await response.json();
  } catch {
    throw new Error("Resposta inválida (não-JSON) ao consultar catálogo remoto via PostgREST.");
  }

  if (spec === null || typeof spec !== "object" || Array.isArray(spec)) {
    throw new Error("Schema inesperado na resposta OpenAPI do catálogo remoto (objeto esperado).");
  }

  const hasDefinitions = spec.definitions && typeof spec.definitions === "object" && !Array.isArray(spec.definitions);
  const hasPaths = spec.paths && typeof spec.paths === "object" && !Array.isArray(spec.paths);

  if (!hasDefinitions && !hasPaths) {
    throw new Error("Schema inesperado na resposta OpenAPI do catálogo remoto (definitions ou paths ausentes).");
  }

  const tables = new Set();
  if (hasDefinitions) {
    for (const name of Object.keys(spec.definitions)) {
      if (/^[a-z_][a-z0-9_]*$/iu.test(name)) {
        tables.add(name);
      }
    }
  }
  if (hasPaths) {
    for (const path of Object.keys(spec.paths)) {
      const match = path.match(/^\/([a-z_][a-z0-9_]*)$/iu);
      if (match && match[1].toLowerCase() !== "rpc") {
        tables.add(match[1]);
      }
    }
  }

  if (tables.size === 0) {
    throw new Error("Nenhuma tabela válida foi identificada na especificação OpenAPI do catálogo remoto.");
  }

  return {
    source: "postgrest_openapi",
    tables: [...tables].sort((a, b) => a.localeCompare(b)),
  };
}

export async function discoverRemotePublicTables(supabaseUrl, serviceRoleKey, timeoutMs = 10_000) {
  const result = await discoverRemoteCatalog({ supabaseUrl, serviceRoleKey, timeoutMs });
  return result.tables;
}

export async function fetchTableRows(supabase, table, options = {}) {
  const pageSize = Number.isInteger(options.pageSize) && options.pageSize > 0 ? options.pageSize : 500;
  const { data, error } = await supabase
    .from(table)
    .select("*")
    .range(0, pageSize - 1);

  if (error) {
    if (isTableNotFoundError(error, table)) {
      return { status: "missing", table, error };
    }
    if (isPermissionError(error)) {
      const code = error.code ?? "42501";
      const message = error.message ?? "permissão insuficiente";
      throw new Error(`Permissão insuficiente ao ler a tabela "${table}": [${code}] ${message}`);
    }
    const code = error.code ?? "query_failed";
    const message = error.message ?? "erro de consulta";
    throw new Error(`Falha de consulta ou rede ao ler a tabela "${table}": [${code}] ${message}`);
  }

  const rows = [...(data ?? [])];
  if (rows.length < pageSize) {
    return { status: "ok", table, rows };
  }

  for (let offset = pageSize; ; offset += pageSize) {
    const { data: pageData, error: pageError } = await supabase
      .from(table)
      .select("*")
      .range(offset, offset + pageSize - 1);

    if (pageError) {
      if (isPermissionError(pageError)) {
        const code = pageError.code ?? "42501";
        const message = pageError.message ?? "permissão insuficiente";
        throw new Error(`Permissão insuficiente ao paginar a tabela "${table}": [${code}] ${message}`);
      }
      const code = pageError.code ?? "query_failed";
      const message = pageError.message ?? "erro de consulta";
      throw new Error(`Falha de consulta ou rede ao paginar a tabela "${table}": [${code}] ${message}`);
    }

    rows.push(...(pageData ?? []));
    if ((pageData?.length ?? 0) < pageSize) break;
  }

  return { status: "ok", table, rows };
}

function runPowerShell(script, extraEnv) {
  const result = spawnSync(
    "powershell.exe",
    ["-NoLogo", "-NoProfile", "-NonInteractive", "-Command", script],
    {
      encoding: "utf8",
      env: { ...process.env, ...extraEnv },
      windowsHide: true,
    }
  );

  if (result.status !== 0) {
    throw new Error(`Falha no DPAPI do Windows: ${result.stderr.trim() || "erro desconhecido"}`);
  }
  return result.stdout.trim();
}

export function protectKeyWithDpapi(key, keyPath) {
  runPowerShell(
    "Add-Type -AssemblyName System.Security;" +
      "$raw=[Convert]::FromBase64String($env:PRO_BACKUP_KEY_B64);" +
      "$protected=[System.Security.Cryptography.ProtectedData]::Protect($raw,$null,[System.Security.Cryptography.DataProtectionScope]::CurrentUser);" +
      "[IO.File]::WriteAllBytes($env:PRO_BACKUP_KEY_PATH,$protected)",
    {
      PRO_BACKUP_KEY_B64: key.toString("base64"),
      PRO_BACKUP_KEY_PATH: keyPath,
    }
  );
}

export function unprotectKeyWithDpapi(keyPath) {
  const encoded = runPowerShell(
    "Add-Type -AssemblyName System.Security;" +
      "$protected=[IO.File]::ReadAllBytes($env:PRO_BACKUP_KEY_PATH);" +
      "$raw=[System.Security.Cryptography.ProtectedData]::Unprotect($protected,$null,[System.Security.Cryptography.DataProtectionScope]::CurrentUser);" +
      "[Console]::Out.Write([Convert]::ToBase64String($raw))",
    { PRO_BACKUP_KEY_PATH: keyPath }
  );
  return Buffer.from(encoded, "base64");
}

export async function protectKeyWithPassphrase(key, passphrase, keyPath) {
  if (typeof passphrase !== "string" || passphrase.length < 20) {
    throw new Error("PRO_BACKUP_RECOVERY_PASSPHRASE deve ter pelo menos 20 caracteres.");
  }
  const salt = randomBytes(RECOVERY_SALT_BYTES);
  const iv = randomBytes(BACKUP_IV_BYTES);
  const wrappingKey = scryptSync(passphrase, salt, 32);
  const cipher = createCipheriv("aes-256-gcm", wrappingKey, iv);
  const encrypted = Buffer.concat([cipher.update(key), cipher.final()]);
  const payload = Buffer.concat([RECOVERY_KEY_MAGIC, salt, iv, encrypted, cipher.getAuthTag()]);
  wrappingKey.fill(0);
  await writeFile(keyPath, payload, { flag: "wx" });
}

export async function unprotectKeyWithPassphrase(keyPath, passphrase) {
  const payload = await readFile(keyPath);
  const headerBytes = RECOVERY_KEY_MAGIC.length + RECOVERY_SALT_BYTES + BACKUP_IV_BYTES;
  if (payload.length <= headerBytes + BACKUP_TAG_BYTES) throw new Error("Chave de recuperação truncada.");
  if (!payload.subarray(0, RECOVERY_KEY_MAGIC.length).equals(RECOVERY_KEY_MAGIC)) {
    throw new Error("Formato de chave de recuperação desconhecido.");
  }
  let offset = RECOVERY_KEY_MAGIC.length;
  const salt = payload.subarray(offset, offset += RECOVERY_SALT_BYTES);
  const iv = payload.subarray(offset, offset += BACKUP_IV_BYTES);
  const encrypted = payload.subarray(offset, payload.length - BACKUP_TAG_BYTES);
  const tag = payload.subarray(payload.length - BACKUP_TAG_BYTES);
  const wrappingKey = scryptSync(passphrase, salt, 32);
  try {
    const decipher = createDecipheriv("aes-256-gcm", wrappingKey, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(encrypted), decipher.final()]);
  } finally {
    wrappingKey.fill(0);
  }
}

export async function sha256File(path) {
  const hash = createHash("sha256");
  await pipeline(createReadStream(path), hash);
  return hash.digest("hex");
}

export async function encryptArchive(sourcePath, destinationPath, key) {
  const iv = randomBytes(BACKUP_IV_BYTES);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const output = createWriteStream(destinationPath, { flags: "wx" });
  output.write(BACKUP_MAGIC);
  output.write(iv);
  await pipeline(createReadStream(sourcePath), cipher, output, { end: false });
  output.end(cipher.getAuthTag());
  await once(output, "finish");
}

export async function decryptArchive(sourcePath, destinationPath, key) {
  const headerLength = BACKUP_MAGIC.length + BACKUP_IV_BYTES;
  const sourceSize = (await stat(sourcePath)).size;
  if (sourceSize <= headerLength + BACKUP_TAG_BYTES) {
    throw new Error("Arquivo de backup truncado.");
  }

  const header = Buffer.alloc(headerLength);
  const tag = Buffer.alloc(BACKUP_TAG_BYTES);
  const handle = await open(sourcePath, "r");
  try {
    await handle.read(header, 0, header.length, 0);
    await handle.read(tag, 0, tag.length, sourceSize - BACKUP_TAG_BYTES);
  } finally {
    await handle.close();
  }

  if (!header.subarray(0, BACKUP_MAGIC.length).equals(BACKUP_MAGIC)) {
    throw new Error("Formato de backup desconhecido.");
  }

  const iv = header.subarray(BACKUP_MAGIC.length);
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  await pipeline(
    createReadStream(sourcePath, {
      start: headerLength,
      end: sourceSize - BACKUP_TAG_BYTES - 1,
    }),
    decipher,
    createWriteStream(destinationPath, { flags: "wx" })
  );
}

export function runTar(args) {
  const result = spawnSync("tar.exe", args, {
    encoding: "utf8",
    windowsHide: true,
  });
  if (result.status !== 0) {
    throw new Error(`Falha ao processar arquivo TAR: ${result.stderr.trim() || "erro desconhecido"}`);
  }
  return result.stdout.trim();
}

export function assertSafeTarArchive(tarPath) {
  const entries = runTar(["-tf", tarPath]).split(/\r?\n/u).filter(Boolean);
  for (const entry of entries) {
    const normalized = entry.replace(/^\.\/+/, "");
    if (
      entry.includes("\\") ||
      entry.startsWith("/") ||
      /^[a-zA-Z]:/u.test(entry) ||
      normalized.split("/").includes("..")
    ) {
      throw new Error("O TAR contém caminho inseguro.");
    }
  }
}

export function safePayloadPath(root, relativePath) {
  if (typeof relativePath !== "string" || relativePath.includes("\\")) {
    throw new Error("Caminho inválido no manifesto do backup.");
  }
  const base = resolve(root);
  const target = resolve(base, ...relativePath.split("/"));
  if (target !== base && !target.startsWith(`${base}${sep}`)) {
    throw new Error("Caminho fora do payload do backup.");
  }
  return target;
}

export async function createTemporaryDirectory(prefix) {
  return mkdtemp(join(tmpdir(), prefix));
}

export async function ensureDirectory(path) {
  await mkdir(path, { recursive: true });
}

export async function writeJson(path, value) {
  await ensureDirectory(dirname(path));
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, {
    encoding: "utf8",
    flag: "wx",
  });
}

export async function writeJsonLines(path, rows) {
  await ensureDirectory(dirname(path));
  const body = rows.map((row) => JSON.stringify(row)).join("\n");
  await writeFile(path, body ? `${body}\n` : "", {
    encoding: "utf8",
    flag: "wx",
  });
}

export async function countJsonLines(path) {
  const body = await readFile(path, "utf8");
  return body.split(/\r?\n/u).filter(Boolean).length;
}

export function resolveBackupPair(backupPath, keyPath) {
  if (!existsSync(backupPath)) throw new Error(`Backup não encontrado: ${backupPath}`);
  const resolvedKeyPath = keyPath ?? `${backupPath}.key.dpapi`;
  if (!existsSync(resolvedKeyPath)) {
    throw new Error(`Chave DPAPI não encontrada: ${resolvedKeyPath}`);
  }
  return { backupPath, keyPath: resolvedKeyPath };
}

export function backupBaseName(date = new Date()) {
  return `pro-resumos-${date.toISOString().replace(/[:.]/gu, "-")}`;
}

export async function removeTemporaryDirectory(path) {
  await rm(path, { recursive: true, force: true });
}

export function fileName(path) {
  return basename(path);
}
