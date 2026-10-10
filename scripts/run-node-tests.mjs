import { readdir } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { join } from "node:path";

const testsDirectory = join(process.cwd(), "tests");
const testFiles = (await readdir(testsDirectory))
  .filter((name) => name.endsWith(".test.mjs"))
  .sort()
  .map((name) => join("tests", name));

if (testFiles.length === 0) throw new Error("Nenhum teste Node foi encontrado.");

const result = spawnSync(process.execPath, ["--test", ...testFiles], {
  cwd: process.cwd(),
  env: process.env,
  stdio: "inherit",
  windowsHide: true,
});

if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
