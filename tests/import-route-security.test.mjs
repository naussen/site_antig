import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const routeSource = await readFile(
  new URL("../src/app/api/import/route.ts", import.meta.url),
  "utf8"
);

test("autentica antes de ler a importação com limite de 1 MiB", () => {
  const authenticationIndex = routeSource.indexOf("if (!isAdminApiRequest(request))");
  const limitedReadIndex = routeSource.indexOf(
    "readJsonBodyLimited(request, MAX_IMPORT_BODY_BYTES)"
  );

  assert.match(routeSource, /const MAX_IMPORT_BODY_BYTES = 1024 \* 1024;/);
  assert.ok(authenticationIndex >= 0);
  assert.ok(limitedReadIndex > authenticationIndex);
  assert.match(routeSource, /err instanceof RequestBodyError/);
  assert.doesNotMatch(routeSource, /request\.json\s*\(/);
});
