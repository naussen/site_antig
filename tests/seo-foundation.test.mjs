import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  getPublicUrl,
  INDEXABLE_PUBLIC_PATHS,
  SITE_HOME_URL,
  SITE_ORIGIN,
} from "../src/lib/seo.mjs";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("gera somente URLs públicas canônicas", () => {
  assert.equal(SITE_ORIGIN, "https://proconcursos.com.br");
  assert.equal(SITE_HOME_URL, "https://proconcursos.com.br/");
  assert.deepEqual(INDEXABLE_PUBLIC_PATHS, [
    "/termos",
    "/privacidade",
    "/suporte",
    "/contato",
  ]);
  assert.equal(
    getPublicUrl("/privacidade"),
    "https://proconcursos.com.br/resumos/privacidade",
  );
});

test("publica robots e sitemap na raiz do domínio via Netlify", async () => {
  const [robots, sitemap, robotsRoot, sitemapRoot] = await Promise.all([
    read("src/app/robots.ts"),
    read("src/app/sitemap.ts"),
    read("netlify/edge-functions/robots-root.ts"),
    read("netlify/edge-functions/sitemap-root.ts"),
  ]);

  assert.match(robots, /sitemap:\s*`\$\{SITE_HOME_URL\}sitemap\.xml`/u);
  assert.match(robots, /"\/resumos\/api"/u);
  assert.match(robots, /"\/resumos\/auth"/u);
  assert.match(robots, /"\/resumos\/dashboard"/u);
  assert.doesNotMatch(robots, /resumos\/admin/u);
  assert.match(sitemap, /INDEXABLE_PUBLIC_PATHS/u);
  assert.doesNotMatch(sitemap, /login|admin|dashboard|api|auth/u);
  assert.match(robotsRoot, /new URL\("\/resumos\/robots\.txt", request\.url\)/u);
  assert.match(robotsRoot, /path:\s*"\/robots\.txt"/u);
  assert.match(sitemapRoot, /new URL\("\/resumos\/sitemap\.xml", request\.url\)/u);
  assert.match(sitemapRoot, /path:\s*"\/sitemap\.xml"/u);
});

test("canonicaliza páginas públicas e desindexa áreas operacionais", async () => {
  const [layout, home, landing, login, admin, dashboard, institutional] =
    await Promise.all([
      read("src/app/layout.tsx"),
      read("src/app/page.tsx"),
      read("src/app/landing/page.tsx"),
      read("src/app/login/page.tsx"),
      read("src/app/admin/page.tsx"),
      read("src/app/dashboard/layout.tsx"),
      read("src/app/(institutional)/layout.tsx"),
    ]);

  assert.match(layout, /metadataBase:\s*new URL\(SITE_ORIGIN\)/u);
  assert.match(home, /alternates:\s*\{ canonical: SITE_HOME_URL \}/u);
  assert.match(landing, /alternates:\s*\{ canonical: SITE_HOME_URL \}/u);
  assert.match(institutional, /href=\{SITE_HOME_URL\}/u);

  for (const source of [login, admin, dashboard]) {
    assert.match(source, /index:\s*false/u);
    assert.match(source, /follow:\s*false/u);
    assert.match(source, /nocache:\s*true/u);
  }

  assert.match(admin, /title:\s*"Acesso administrativo"/u);
  assert.doesNotMatch(admin, /Acesso administrativo \| PRO Resumos/u);
});

test("proxy não intercepta arquivos públicos de metadata", async () => {
  const proxy = await read("src/proxy.ts");

  assert.match(proxy, /ico\|xml\|txt/u);
});
