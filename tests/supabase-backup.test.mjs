import test from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import {
  createTemporaryDirectory,
  decryptArchive,
  encryptArchive,
  removeTemporaryDirectory,
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
