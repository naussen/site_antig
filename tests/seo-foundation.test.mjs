import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { serializeJsonLd } from "../src/lib/json-ld.mjs";
import {
  applyPublicCachePolicy,
  PUBLIC_BROWSER_CACHE_CONTROL,
  PUBLIC_CDN_CACHE_CONTROL,
} from "../src/lib/public-cache-policy.mjs";
import { isPublicPageRequest } from "../src/lib/public-request-paths.mjs";
import {
  BRAND_LOGO_URL,
  createPublicPageMetadata,
  getPublicUrl,
  INDEXABLE_PUBLIC_PATHS,
  SITE_HOME_URL,
  SITE_NAME,
  SITE_ORIGIN,
  SOCIAL_IMAGE_URL,
} from "../src/lib/seo.mjs";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("gera somente URLs públicas canônicas", () => {
  assert.equal(SITE_ORIGIN, "https://proconcursos.com.br");
  assert.equal(SITE_HOME_URL, "https://proconcursos.com.br/");
  assert.equal(SITE_NAME, "PRO Concursos");
  assert.equal(BRAND_LOGO_URL, "https://proconcursos.com.br/resumos/brand/pro-concursos-logo-dark.png");
  assert.equal(SOCIAL_IMAGE_URL, "https://proconcursos.com.br/resumos/brand/pro-concursos-social.png");
  assert.deepEqual(INDEXABLE_PUBLIC_PATHS, [
    "/sobre",
    "/metodologia-editorial",
    "/politica-de-ia",
    "/correcoes",
    "/guias",
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

test("gera metadata social consistente com o canonical", () => {
  const metadata = createPublicPageMetadata({
    title: "Privacidade",
    description: "Política de privacidade.",
    path: "/privacidade",
  });

  assert.equal(
    metadata.alternates.canonical,
    "https://proconcursos.com.br/resumos/privacidade",
  );
  assert.equal(metadata.openGraph.url, metadata.alternates.canonical);
  assert.equal(metadata.openGraph.siteName, SITE_NAME);
  assert.equal(metadata.openGraph.images[0].url, SOCIAL_IMAGE_URL);
  assert.equal(metadata.openGraph.images[0].width, 1200);
  assert.equal(metadata.openGraph.images[0].height, 630);
  assert.equal(metadata.twitter.card, "summary_large_image");
  assert.deepEqual(metadata.twitter.images, [SOCIAL_IMAGE_URL]);
});

test("serializa JSON-LD sem permitir fechamento de script", () => {
  const value = { text: "</script>&\u2028\u2029" };
  const serialized = serializeJsonLd(value);

  assert.doesNotMatch(serialized, /[<>&\u2028\u2029]/u);
  assert.deepEqual(JSON.parse(serialized), value);
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
  assert.match(home, /createPublicPageMetadata/u);
  assert.match(home, /path:\s*"\/"/u);
  assert.match(landing, /createPublicPageMetadata/u);
  assert.match(landing, /path:\s*"\/"/u);
  assert.match(institutional, /href=\{SITE_HOME_URL\}/u);

  for (const source of [login, admin, dashboard]) {
    assert.match(source, /index:\s*false/u);
    assert.match(source, /follow:\s*false/u);
    assert.match(source, /nocache:\s*true/u);
  }

  assert.match(admin, /title:\s*"Acesso administrativo"/u);
  assert.doesNotMatch(admin, /Acesso administrativo \| PRO Resumos/u);
});

test("publica JSON-LD verificável sem sink HTML inseguro", async () => {
  const [structuredData, landing] = await Promise.all([
    read("src/components/seo/site-structured-data.tsx"),
    read("src/components/landing/landing-page-content.tsx"),
  ]);

  assert.match(structuredData, /"@type": "Organization"/u);
  assert.match(structuredData, /"@type": "WebSite"/u);
  assert.match(structuredData, /serializeJsonLd/u);
  assert.doesNotMatch(structuredData, /dangerouslySetInnerHTML/u);
  assert.match(landing, /<SiteStructuredData \/>/u);
});

test("mantém contraste mínimo nos textos pequenos da landing", async () => {
  const landing = await read("src/components/landing/landing-page-content.tsx");

  for (const lowContrastClass of [
    "text-white/35",
    "text-white/40",
    "text-[#6c5ce7]",
    "text-[#9898aa]",
    "text-[#b56f00]",
    "text-[#8b6914]",
    "text-[#8b7e6a]",
    "text-[#928743]",
  ]) {
    assert.equal(landing.includes(lowContrastClass), false, lowContrastClass);
  }
});

test("ignora Supabase somente em páginas públicas e métodos seguros", async () => {
  for (const path of [
    "/landing",
    "/landing/",
    "/sobre",
    "/metodologia-editorial",
    "/politica-de-ia",
    "/correcoes",
    "/guias",
    "/guias/como-estudar-por-resumos",
    "/termos",
    "/privacidade",
    "/suporte",
    "/contato",
  ]) {
    assert.equal(isPublicPageRequest("GET", path), true, path);
    assert.equal(isPublicPageRequest("HEAD", path), true, path);
    assert.equal(isPublicPageRequest("POST", path), false, path);
  }

  for (const path of [
    "/",
    "/login",
    "/admin",
    "/dashboard",
    "/api/import",
    "/auth/callback",
    "/contato-malicioso",
    "/contato/extra",
    "/%63ontato",
  ]) {
    assert.equal(isPublicPageRequest("GET", path), false, path);
  }

  const proxy = await read("src/proxy.ts");
  assert.ok(
    proxy.indexOf("isPublicPageRequest(request.method, localPath)") <
      proxy.indexOf("createServerClient("),
  );

  const rootLayout = await read("src/app/layout.tsx");
  assert.match(rootLayout, /resolveCookieTheme/u);
  assert.match(rootLayout, /SESSION_AWARE_REQUEST_HEADER/u);
  assert.match(rootLayout, /resolveInitialTheme/u);
  assert.match(proxy, /publicHeaders\.delete\(SESSION_AWARE_REQUEST_HEADER\)/u);
  assert.match(proxy, /publicHeaders\.set\(PUBLIC_PAGE_REQUEST_HEADER, "1"\)/u);
  assert.match(proxy, /applyPublicCachePolicy\(publicResponse\.headers\)/u);
  assert.match(proxy, /sessionAwareHeaders\.set\(SESSION_AWARE_REQUEST_HEADER, "1"\)/u);
});

test("aplica cache compartilhado somente pela política pública", () => {
  const headers = new Headers();

  applyPublicCachePolicy(headers);

  assert.equal(
    headers.get("Netlify-CDN-Cache-Control"),
    PUBLIC_CDN_CACHE_CONTROL,
  );
  assert.equal(headers.get("Cache-Control"), PUBLIC_BROWSER_CACHE_CONTROL);
  assert.match(PUBLIC_BROWSER_CACHE_CONTROL, /max-age=0/u);
  assert.match(PUBLIC_BROWSER_CACHE_CONTROL, /s-maxage=300/u);
  assert.match(PUBLIC_BROWSER_CACHE_CONTROL, /must-revalidate/u);
  assert.match(PUBLIC_CDN_CACHE_CONTROL, /s-maxage=300/u);
  assert.match(PUBLIC_CDN_CACHE_CONTROL, /stale-while-revalidate=3600/u);
});

test("renderiza páginas públicas sem personalização por cookie", async () => {
  const [layout, publicPaths, proxy] = await Promise.all([
    read("src/app/layout.tsx"),
    read("src/lib/public-request-paths.mjs"),
    read("src/proxy.ts"),
  ]);

  assert.match(publicPaths, /PUBLIC_PAGE_REQUEST_HEADER/u);
  assert.match(proxy, /PUBLIC_PAGE_REQUEST_HEADER/u);
  assert.match(layout, /isPublicPage\s*\? DEFAULT_THEME/u);
});

test("propaga cabeçalhos privados quando o Supabase renova cookies", async () => {
  const proxy = await read("src/proxy.ts");

  assert.match(proxy, /setAll\(cookiesToSet, cacheHeaders\)/u);
  assert.match(proxy, /Object\.entries\(cacheHeaders\)/u);
  assert.match(proxy, /copySessionResponseMetadata/u);
  assert.match(proxy, /"cache-control"/u);
  assert.match(proxy, /"expires"/u);
  assert.match(proxy, /"pragma"/u);
});

test("proxy não intercepta arquivos públicos de metadata", async () => {
  const proxy = await read("src/proxy.ts");

  assert.match(proxy, /ico\|xml\|txt/u);
});

test("autoridade editorial é transparente e não inventa credenciais", async () => {
  const [about, methodology, aiPolicy, corrections] = await Promise.all([
    read("src/app/(institutional)/sobre/page.tsx"),
    read("src/app/(institutional)/metodologia-editorial/page.tsx"),
    read("src/app/(institutional)/politica-de-ia/page.tsx"),
    read("src/app/(institutional)/correcoes/page.tsx"),
  ]);

  assert.match(about, /Naussen Cosme Velho Pezat/u);
  assert.match(about, /não representa título acadêmico/u);
  assert.match(methodology, /comparadas com as fontes selecionadas/u);
  assert.match(aiPolicy, /não é fonte jurídica/u);
  assert.match(corrections, /Nenhuma correção editorial foi registrada/u);

  for (const source of [about, methodology, aiPolicy, corrections]) {
    assert.doesNotMatch(
      source,
      /revisado por especialista|produzido por juristas|conteúdo certificado|garantia de aprovação/iu,
    );
  }
});

test("publica hub e guia com conteúdo, schema e transparência", async () => {
  const [hub, guide] = await Promise.all([
    read("src/app/(institutional)/guias/page.tsx"),
    read("src/app/(institutional)/guias/como-estudar-por-resumos/page.tsx"),
  ]);

  assert.match(hub, /Guias de estudo para concursos/u);
  assert.match(hub, /como-estudar-por-resumos/u);
  assert.match(guide, /"@type": "LearningResource"/u);
  assert.match(guide, /"@type": "BreadcrumbList"/u);
  assert.match(guide, /isAccessibleForFree: true/u);
  assert.match(guide, /serializeJsonLd/u);
  assert.match(guide, /index: false/u);
  assert.match(guide, /pendente de validação final/u);
  assert.doesNotMatch(guide, /dangerouslySetInnerHTML/u);
});
