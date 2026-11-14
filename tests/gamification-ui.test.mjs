import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { isGamificationOperationalEnabled } from "../src/lib/gamification/config.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

function readWorkspaceFile(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

const GAMIFICATION_SOURCE_FILES = [
  "src/lib/gamification/config.mjs",
  "src/lib/gamification/calendar.mjs",
  "src/lib/gamification/session.mjs",
  "src/lib/gamification/server.ts",
  "src/app/api/study-routine/route.ts",
  "src/components/gamification/today-study-card.tsx",
  "src/components/gamification/study-session-bar.tsx",
];

const UI_COMPONENT_FILES = [
  "src/components/gamification/today-study-card.tsx",
  "src/components/gamification/study-session-bar.tsx",
];

test("ausência de frases proibidas e linguagem punitiva nos textos da rotina", () => {
  const forbiddenPatterns = [
    /dominado/i,
    /aprova[cç][aã]o garantida/i,
    /voc[eê] perdeu tudo/i,
    /zerou sua sequ[eê]ncia/i,
  ];

  for (const relativePath of GAMIFICATION_SOURCE_FILES) {
    const content = readWorkspaceFile(relativePath);
    for (const pattern of forbiddenPatterns) {
      assert.equal(
        pattern.test(content),
        false,
        `${relativePath} não deve conter expressão proibida (${pattern})`,
      );
    }
  }
});

test("ausência de sinks inseguros de XSS e estilos inline arbitrários", () => {
  const unsafePatterns = [
    "dangerouslySetInnerHTML",
    ".innerHTML",
    ".outerHTML",
    "insertAdjacentHTML",
    "document.write",
    "rehype-raw",
    "javascript:",
    "new Function(",
  ];

  for (const relativePath of GAMIFICATION_SOURCE_FILES) {
    const content = readWorkspaceFile(relativePath);
    for (const sink of unsafePatterns) {
      assert.equal(
        content.includes(sink),
        false,
        `${relativePath} não deve conter sink inseguro (${sink})`,
      );
    }
    assert.equal(
      /\beval\s*\(/.test(content),
      false,
      `${relativePath} não deve chamar eval()`,
    );
  }
});

test("rota /api/study-routine aplica same-origin, limite de payload, Zod strict e auth", () => {
  const routeContent = readWorkspaceFile("src/app/api/study-routine/route.ts");
  assert.ok(routeContent.includes("isSameOriginRequest(request)"), "POST deve exigir same-origin");
  assert.ok(routeContent.includes("readJsonBodyLimited("), "POST deve limitar tamanho de body JSON");
  assert.ok(routeContent.includes(".strict()"), "Schemas Zod devem usar .strict()");
  assert.ok(routeContent.includes("getApiContentAccess()"), "Rota deve validar auth + Google + AAL2 + acesso ativo");
  assert.ok(routeContent.includes("RoutineSchemaUnavailableError"), "Rota deve tratar schema pendente com 503");
  assert.ok(routeContent.includes("Cache-Control"), "Respostas autenticadas devem definir no-store");
});

test("componentes usam basePath, tokens de tema, acessibilidade e âncoras #section-", () => {
  for (const relativePath of UI_COMPONENT_FILES) {
    const content = readWorkspaceFile(relativePath);
    assert.ok(
      content.includes('withSiteBasePath("/api/study-routine")'),
      `${relativePath} deve chamar API usando withSiteBasePath`,
    );
    assert.ok(content.includes('aria-live="polite"'), `${relativePath} deve expor aria-live`);
    assert.ok(content.includes('role="status"'), `${relativePath} deve expor role="status"`);
    assert.ok(content.includes('role="alert"'), `${relativePath} deve expor role="alert"`);
    assert.ok(content.includes("motion-reduce:"), `${relativePath} deve respeitar reduced motion`);
    assert.ok(content.includes("var(--bg-card)"), `${relativePath} deve usar tokens de tema`);
    assert.ok(content.includes("var(--border)"), `${relativePath} deve usar --border`);
    assert.ok(content.includes("#section-"), `${relativePath} deve apontar para #section-{id}`);
    assert.equal(
      content.includes("style={{"),
      false,
      `${relativePath} deve priorizar Tailwind v4 com tokens CSS em vez de CSS inline`,
    );
  }
});

test("páginas de Dashboard, Estudo e Configurações integram a rotina e mantêm fallback seguro", () => {
  const dashboard = readWorkspaceFile("src/app/dashboard/page.tsx");
  const studyClient = readWorkspaceFile("src/app/(study)/[topicId]/study-page-client.tsx");
  const settings = readWorkspaceFile("src/app/dashboard/configuracoes/page.tsx");
  const server = readWorkspaceFile("src/lib/gamification/server.ts");

  assert.ok(dashboard.includes("<TodayStudyCard"), "Dashboard deve renderizar TodayStudyCard");
  assert.ok(studyClient.includes("<StudySessionBar"), "Estudo deve renderizar StudySessionBar");
  assert.ok(settings.includes("config-rotina-titulo"), "Configurações deve exibir estado da rotina");
  assert.ok(
    server.includes('process.env.NODE_ENV !== "production"') &&
      server.includes('process.env.STUDY_ROUTINE_DEV_FALLBACK === "1"'),
    "Fallback em memória nunca pode atuar em produção",
  );
  assert.equal(isGamificationOperationalEnabled({ NEXT_PUBLIC_DISABLE_GAMIFICATION: "true" }), false);
  assert.equal(isGamificationOperationalEnabled({ NEXT_PUBLIC_DISABLE_GAMIFICATION: "false" }), true);
});
