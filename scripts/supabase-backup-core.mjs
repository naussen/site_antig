import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { once } from "node:events";
import {
  createReadStream,
  createWriteStream,
  existsSync,
} from "node:fs";
import { mkdtemp, mkdir, open, readFile, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, dirname, join } from "node:path";
import { spawnSync } from "node:child_process";
import { pipeline } from "node:stream/promises";

export const BACKUP_MAGIC = Buffer.from("PROBACKUP1", "ascii");
export const BACKUP_IV_BYTES = 12;
export const BACKUP_TAG_BYTES = 16;

export const PUBLIC_TABLES = Object.freeze([
  "content_change_manifests",
  "content_unit_revisions",
  "law_flashcards",
  "law_versions",
  "laws",
  "legal_fragments",
  "legis_editorial_audit",
  "payment_access_blocks",
  "payment_provider_transactions",
  "payment_webhook_events",
  "privacy_requests",
  "sections",
  "study_plan_items",
  "study_plans",
  "topic_id_redirects",
  "topic_legal_fragment_relations",
  "topics",
  "user_dashboard_preferences",
  "user_entitlements",
  "user_law_flashcard_answers",
  "user_law_progress",
  "user_legal_highlights",
  "user_legal_notes",
  "user_note_images",
  "user_notes",
  "user_progress",
  "user_text_highlights",
]);

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
