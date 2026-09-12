import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const settingsPageSource = await readFile(
  new URL("../src/app/dashboard/configuracoes/page.tsx", import.meta.url),
  "utf8",
);
const preferencesActionSource = await readFile(
  new URL("../src/app/actions/dashboard-preferences.ts", import.meta.url),
  "utf8",
);
const dashboardPageSource = await readFile(
  new URL("../src/app/dashboard/page.tsx", import.meta.url),
  "utf8",
);

test("mensagens de preferências não expõem instruções internas", () => {
  const preferenceSources = [
    settingsPageSource,
    preferencesActionSource,
    dashboardPageSource,
  ].join("\n");

  assert.doesNotMatch(preferenceSources, /aplique as migrations|migration 005|005 e 020/i);
  assert.match(
    settingsPageSource,
    /As preferências estão temporariamente indisponíveis\./,
  );
  assert.match(
    dashboardPageSource,
    /A configuração de matérias está temporariamente indisponível\./,
  );
});

test("diagnóstico de preferências registra somente código seguro e categoria", () => {
  assert.doesNotMatch(
    settingsPageSource,
    /formatSupabaseError\(preferencesError\)/,
  );
  assert.doesNotMatch(
    dashboardPageSource,
    /formatSupabaseError\(preferencesError\)/,
  );

  for (const source of [
    settingsPageSource,
    preferencesActionSource,
    dashboardPageSource,
  ]) {
    assert.match(source, /code: getSafeSupabaseErrorCode\(/);
    assert.match(source, /category:/);
  }
});
