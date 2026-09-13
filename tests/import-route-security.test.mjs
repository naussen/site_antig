import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const routeSource = await readFile(
  new URL("../src/app/api/import/route.ts", import.meta.url),
  "utf8"
);
const contentAdminSource = await readFile(
  new URL("../scripts/content-admin.mjs", import.meta.url),
  "utf8"
);
const topicRouteSource = await readFile(
  new URL("../src/app/api/topics/[topicId]/route.ts", import.meta.url),
  "utf8"
);
const sectionRouteSource = await readFile(
  new URL("../src/app/api/sections/[sectionId]/route.ts", import.meta.url),
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

test("substituição destrutiva usa governança e RPC atômica", () => {
  const governanceIndex = routeSource.indexOf("assertDestructiveImportAllowed({");
  const rpcIndex = routeSource.indexOf('supabase.rpc("apply_content_import"');

  assert.ok(governanceIndex >= 0);
  assert.ok(rpcIndex > governanceIndex);
  assert.match(routeSource, /dry_run/);
  assert.match(routeSource, /content_change|changeManifest|change_manifest/);
  assert.doesNotMatch(routeSource, /\.from\("sections"\)[\s\S]{0,120}\.delete\(/);
});

test("CLI arquiva conteúdo e não mantém hard delete editorial", () => {
  assert.match(contentAdminSource, /rpc\("archive_content_topic"/);
  assert.match(contentAdminSource, /rpc\("archive_content_section"/);
  assert.match(contentAdminSource, /rpc\("apply_content_import"/);
  assert.doesNotMatch(contentAdminSource, /from\("topics"\)\.delete\(/);
  assert.doesNotMatch(contentAdminSource, /from\("sections"\)\.delete\(/);
});

test("rotas administrativas arquivam conteúdo sem expor detalhes internos", () => {
  assert.match(topicRouteSource, /rpc\("archive_content_topic"/);
  assert.match(sectionRouteSource, /rpc\("archive_content_section"/);
  assert.doesNotMatch(topicRouteSource, /\.delete\(\)/);
  assert.doesNotMatch(sectionRouteSource, /\.delete\(\)/);
  assert.doesNotMatch(topicRouteSource, /details:/);
  assert.doesNotMatch(sectionRouteSource, /details:/);
});
