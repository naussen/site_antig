import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("gateway da branch encaminha somente o prefixo legis ao origin da zona", async () => {
  const config = await readFile(new URL("../netlify.toml", import.meta.url), "utf8");
  assert.match(config, /from = "\/legis"/u);
  assert.match(config, /from = "\/legis\/\*"/u);
  assert.match(config, /to = "https:\/\/pro-legis-mvp\.netlify\.app\/legis"/u);
  assert.match(config, /to = "https:\/\/pro-legis-mvp\.netlify\.app\/legis\/:splat"/u);
  assert.match(config, /status = 200/gu);
  assert.doesNotMatch(config, /from = "\/resumos/u);
});
