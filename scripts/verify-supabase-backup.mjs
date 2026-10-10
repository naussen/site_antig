import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
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
  unprotectKeyWithPassphrase,
} from "./supabase-backup-core.mjs";

function argumentValue(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : null;
}

async function main() {
  const backupArgument = argumentValue("--backup");
  if (!backupArgument) throw new Error("Use --backup <arquivo.probackup>.");
  const recoveryKey = argumentValue("--recovery-key");
  if (recoveryKey && !process.env.PRO_BACKUP_RECOVERY_PASSPHRASE?.trim()) {
    throw new Error("PRO_BACKUP_RECOVERY_PASSPHRASE é obrigatória para a chave portátil.");
  }
  const pair = recoveryKey
    ? { backupPath: backupArgument, keyPath: recoveryKey }
    : resolveBackupPair(backupArgument, argumentValue("--key"));
  const temporaryRoot = await createTemporaryDirectory("pro-resumos-restore-test-");
  const tarPath = join(temporaryRoot, "payload.tar");
  const restoreDirectory = join(temporaryRoot, "restored");

  try {
    const key = recoveryKey
      ? await unprotectKeyWithPassphrase(
          pair.keyPath,
          process.env.PRO_BACKUP_RECOVERY_PASSPHRASE?.trim() ?? ""
        )
      : unprotectKeyWithDpapi(pair.keyPath);
    await decryptArchive(pair.backupPath, tarPath, key);
    key.fill(0);
    assertSafeTarArchive(tarPath);
    await ensureDirectory(restoreDirectory);
    runTar(["-xf", tarPath, "-C", restoreDirectory]);

    const manifestPath = join(restoreDirectory, "manifest.json");
    const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
    const payloadRoot = restoreDirectory;
    assert.equal(manifest.format, "pro-resumos-logical-backup");
    assert.equal(manifest.version, 1);

    for (const file of manifest.files) {
      const path = safePayloadPath(payloadRoot, file.path);
      assert.equal(await sha256File(path), file.sha256, `${file.path}: hash divergente`);
    }
    for (const [table, expectedCount] of Object.entries(manifest.table_counts)) {
      const actual = await countJsonLines(join(payloadRoot, "database", `${table}.jsonl`));
      assert.equal(actual, expectedCount, `${table}: contagem divergente`);
    }
    const authUsersBody = await readFile(join(payloadRoot, "auth", "users.jsonl"), "utf8");
    const authUsers = authUsersBody.split(/\r?\n/u).filter(Boolean).map((line) => JSON.parse(line));
    assert.equal(authUsers.length, manifest.auth_user_count, "Auth: contagem divergente");
    const authIdentityCount = authUsers.reduce(
      (count, user) => count + (user.identities?.length ?? 0),
      0,
    );
    if (Number.isInteger(manifest.auth_identity_count)) {
      assert.equal(authIdentityCount, manifest.auth_identity_count, "Auth: identidades divergentes");
    }

    console.log(JSON.stringify({
      verified: true,
      created_at: manifest.created_at,
      tables: Object.keys(manifest.table_counts).length,
      rows: Object.values(manifest.table_counts).reduce((sum, count) => sum + count, 0),
      auth_users: manifest.auth_user_count,
      auth_identities: authIdentityCount,
      storage_objects: manifest.storage_object_count,
      migrations: manifest.migration_count,
      files_verified: manifest.files.length,
    }));
  } finally {
    await removeTemporaryDirectory(temporaryRoot);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
