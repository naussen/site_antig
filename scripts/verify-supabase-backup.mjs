import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import {
  countJsonLines,
  createTemporaryDirectory,
  decryptArchive,
  ensureDirectory,
  removeTemporaryDirectory,
  resolveBackupPair,
  runTar,
  sha256File,
  unprotectKeyWithDpapi,
} from "./supabase-backup-core.mjs";

function argumentValue(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : null;
}

async function main() {
  const backupArgument = argumentValue("--backup");
  if (!backupArgument) throw new Error("Use --backup <arquivo.probackup>.");
  const pair = resolveBackupPair(backupArgument, argumentValue("--key"));
  const temporaryRoot = await createTemporaryDirectory("pro-resumos-restore-test-");
  const tarPath = join(temporaryRoot, "payload.tar");
  const restoreDirectory = join(temporaryRoot, "restored");

  try {
    const key = unprotectKeyWithDpapi(pair.keyPath);
    await decryptArchive(pair.backupPath, tarPath, key);
    key.fill(0);
    await ensureDirectory(restoreDirectory);
    runTar(["-xf", tarPath, "-C", restoreDirectory]);

    const manifestPath = join(restoreDirectory, "manifest.json");
    const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
    const payloadRoot = restoreDirectory;
    assert.equal(manifest.format, "pro-resumos-logical-backup");
    assert.equal(manifest.version, 1);

    for (const file of manifest.files) {
      const path = join(payloadRoot, ...file.path.split("/"));
      assert.equal(await sha256File(path), file.sha256, `${file.path}: hash divergente`);
    }
    for (const [table, expectedCount] of Object.entries(manifest.table_counts)) {
      const actual = await countJsonLines(join(payloadRoot, "database", `${table}.jsonl`));
      assert.equal(actual, expectedCount, `${table}: contagem divergente`);
    }
    assert.equal(
      await countJsonLines(join(payloadRoot, "auth", "users.jsonl")),
      manifest.auth_user_count,
      "Auth: contagem divergente"
    );

    console.log(JSON.stringify({
      verified: true,
      created_at: manifest.created_at,
      tables: Object.keys(manifest.table_counts).length,
      rows: Object.values(manifest.table_counts).reduce((sum, count) => sum + count, 0),
      auth_users: manifest.auth_user_count,
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
