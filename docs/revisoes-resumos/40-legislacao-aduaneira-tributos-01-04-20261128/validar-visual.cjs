const fs = require("node:fs"), path = require("node:path"), os = require("node:os");
const { createRequire } = require("node:module");
const assert = require("node:assert/strict");

const site = process.env.PRO_SITE_CHECKOUT || "C:/PRO/worktrees/questoes-experiencia-20261122";
const siteRequire = createRequire(path.resolve(site, "package.json"));
const { chromium } = siteRequire("playwright");
const esbuild = require("C:/PRO/site/tmp/netlify-cli/node_modules/esbuild");
const harness = path.resolve(__dirname, "../../../aceite-ondas-1-4/amostra-publicada.tsx");

const EXPECTED_MERMAID_NODES = {
  "tributos-incidentes-no-comercio-exterior-sec-01": 5,
  "tributos-incidentes-no-comercio-exterior-sec-02": 6,
  "tributos-incidentes-no-comercio-exterior-sec-03": 6,
  "tributos-incidentes-no-comercio-exterior-sec-04": 0,
};

const EXPECTED_TABLES = {
  "tributos-incidentes-no-comercio-exterior-sec-01": 2,
  "tributos-incidentes-no-comercio-exterior-sec-02": 0,
  "tributos-incidentes-no-comercio-exterior-sec-03": 0,
  "tributos-incidentes-no-comercio-exterior-sec-04": 0,
};

const EXPECTED_KATEX_TOTAL = {
  "tributos-incidentes-no-comercio-exterior-sec-01": 0,
  "tributos-incidentes-no-comercio-exterior-sec-02": 0,
  "tributos-incidentes-no-comercio-exterior-sec-03": 0,
  "tributos-incidentes-no-comercio-exterior-sec-04": 1,
};

async function main() {
  const filename = process.argv[2];
  const { photo, delta, manifest } = JSON.parse(fs.readFileSync(filename, "utf8"));
  const rows = photo.disciplines.flatMap((d) => d.sections);
  const sections = delta.changes.map((c) => ({ ...rows.find((s) => s.section_id === c.section_id), ...c.after }));
  const scratch = fs.mkdtempSync(path.join(os.tmpdir(), "visual-tributos0104-"));
  const cssDir = path.join(site, ".next/static/css");
  const css = fs.readdirSync(cssDir).filter((n) => n.endsWith(".css")).map((n) => fs.readFileSync(path.join(cssDir, n), "utf8")).join("\n");

  await esbuild.build({
    entryPoints: [harness],
    outdir: scratch,
    bundle: true,
    format: "esm",
    splitting: true,
    entryNames: "app",
    jsx: "automatic",
    alias: { "@": path.join(site, "src") },
    nodePaths: [path.join(site, "node_modules")],
    define: { "process.env.NODE_ENV": '"production"' },
    plugins: [
      {
        name: "dados",
        setup(b) {
          b.onResolve({ filter: /^amostra-publicada$/ }, () => ({ path: "dados", namespace: "fixture" }));
          b.onLoad({ filter: /.*/, namespace: "fixture" }, () => ({ contents: JSON.stringify(sections), loader: "json" }));
        },
      },
    ],
  });

  const browser = await chromium.launch({ channel: "chrome" });
  const checks = [];
  const screenshots = path.join(path.dirname(filename), "capturas");
  fs.mkdirSync(screenshots, { recursive: true });

  try {
    for (const width of [375, 1200]) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      await page.route("http://validacao.local/**", async (route) => {
        const url = new URL(route.request().url());
        if (url.pathname !== "/") {
          const asset = path.basename(url.pathname);
          return fs.existsSync(path.join(scratch, asset))
            ? route.fulfill({ path: path.join(scratch, asset), contentType: "text/javascript" })
            : route.fulfill({ status: 404, body: "" });
        }
        const theme = url.searchParams.get("theme");
        assert.ok(["light", "dark", "sepia"].includes(theme));
        return route.fulfill({
          contentType: "text/html; charset=utf-8",
          body: `<!doctype html><html data-theme="${theme}"><meta name="viewport" content="width=device-width, initial-scale=1"><style>${css}</style><script>localStorage.setItem("study-platform-theme","${theme}")</script><div id="root"></div><script type="module" src="/app.js"></script></html>`,
        });
      });

      for (const theme of ["light", "dark", "sepia"]) {
        for (const s of sections) {
          await page.goto("http://validacao.local/?" + new URLSearchParams({ theme, id: s.section_id }));
          await page.locator("#shot-root article h1").first().waitFor();
          if (s.mermaid_mindmap) {
            await page.locator(".mermaid-viewer__viewport svg").first().waitFor({ timeout: 15000 });
          }
          await page.waitForTimeout(900);
          if (s.mermaid_mindmap) {
            await page.getByRole("button", { name: "Aumentar zoom do mapa mental", exact: true }).click();
            await page.getByRole("button", { name: "Restaurar zoom do mapa mental", exact: true }).click();
            await page.getByRole("button", { name: "Abrir mapa mental sobreposto", exact: true }).click();
            await page.getByRole("dialog", { name: "Mapa mental em visualização ampliada" }).waitFor();
            await page.getByRole("button", { name: "Fechar mapa mental sobreposto", exact: true }).click();
            await page.getByRole("dialog").waitFor({ state: "detached" });
          }
          await page.waitForTimeout(500);
          const result = await page.locator("#shot-root article").evaluate((a) => ({
            title: a.querySelector("h1").textContent,
            theme: document.documentElement.dataset.theme,
            overflow: a.scrollWidth - a.clientWidth,
            katexErrors: a.querySelectorAll(".katex-error").length,
            katexTotalCount: a.querySelectorAll(".katex").length,
            tablesRendered: a.querySelectorAll(".markdown-table-scroll table").length,
            tableScrollRegions: a.querySelectorAll(".markdown-table-scroll").length,
            mermaidErrors: a.querySelectorAll('.mermaid-viewer [role="alert"]').length,
            mermaidSvgNodes: a.querySelectorAll(".mermaid-viewer__viewport svg g.node").length,
            calloutsRendered: a.querySelectorAll('div[role="alert"]').length,
            rawUnescapedDollarBackslash: a.textContent.includes("\\$") || a.textContent.includes("extBC") || a.textContent.includes("extValor"),
            overflowContainers: [...a.querySelectorAll(".katex-display,.markdown-table-scroll,pre,.mermaid-viewer")]
              .filter((n) => n.getBoundingClientRect().right > a.getBoundingClientRect().right + 2)
              .map((n) => ({ tag: n.className || n.tagName, text: n.textContent.slice(0, 80), right: n.getBoundingClientRect().right }))
              .slice(0, 12),
          }));
          const expectedNodes = EXPECTED_MERMAID_NODES[s.section_id];
          const expectedTables = EXPECTED_TABLES[s.section_id];
          const expectedKatexTotal = EXPECTED_KATEX_TOTAL[s.section_id];
          await page.screenshot({ path: path.join(screenshots, `${s.section_id}-${theme}-${width}.png`), fullPage: true });
          checks.push({
            id: s.section_id,
            width,
            theme,
            ...result,
            expectedCallouts: s.callouts.length,
            expectedMermaidNodes: expectedNodes,
            expectedTables,
            expectedKatexTotal,
            zoomAndOverlay: Boolean(s.mermaid_mindmap),
            ok:
              result.title === s.title &&
              result.theme === theme &&
              result.overflow <= 2 &&
              result.overflowContainers.length === 0 &&
              result.katexErrors === 0 &&
              result.katexTotalCount === expectedKatexTotal &&
              result.tablesRendered === expectedTables &&
              result.tableScrollRegions === expectedTables &&
              result.mermaidErrors === 0 &&
              result.mermaidSvgNodes === expectedNodes &&
              result.calloutsRendered === s.callouts.length &&
              !result.rawUnescapedDollarBackslash,
          });
        }
      }
      await page.close();
    }
  } finally {
    await browser.close();
  }

  fs.writeFileSync(filename.replace(/\.json$/, "-visual.json"), JSON.stringify({ manifest_sha256: manifest.manifest_sha256, checks }, null, 2) + "\n");
  assert.ok(checks.every((x) => x.ok), JSON.stringify(checks.filter((x) => !x.ok)));
  console.log(checks.length, "verificações visuais aprovadas");
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
