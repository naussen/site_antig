import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const navigationSource = await readFile(
  new URL("../src/components/navigation/dashboard-navigation.tsx", import.meta.url),
  "utf8",
);

test("acionadores móveis acompanham o estado aberto no nome acessível", () => {
  assert.match(
    navigationSource,
    /const mobileNavigationLabel = mobileOpen\s*\? "Fechar navegação"\s*: "Abrir navegação";/,
  );
  assert.equal(
    navigationSource.match(/aria-label=\{mobileNavigationLabel\}/g)?.length,
    2,
  );
  assert.equal(
    navigationSource.match(/title=\{mobileNavigationLabel\}/g)?.length,
    2,
  );
  assert.equal(
    navigationSource.match(/onClick=\{toggleMobileNavigation\}/g)?.length,
    2,
  );
});
