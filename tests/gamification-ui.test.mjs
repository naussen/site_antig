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
  "src/lib/gamification/repository.mjs",
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
  const route = readWorkspaceFile("src/app/api/study-routine/route.ts");
  const repository = readWorkspaceFile("src/lib/gamification/repository.mjs");
  const todayCard = readWorkspaceFile("src/components/gamification/today-study-card.tsx");
  const sessionBar = readWorkspaceFile("src/components/gamification/study-session-bar.tsx");

  assert.ok(dashboard.includes("<TodayStudyCard"), "Dashboard deve renderizar TodayStudyCard");
  assert.ok(studyClient.includes("<StudySessionBar"), "Estudo deve renderizar StudySessionBar");
  assert.ok(settings.includes("config-rotina-titulo"), "Configurações deve exibir estado da rotina");
  assert.ok(
    settings.includes("loadSettingsRoutineStatus"),
    "Configurações deve carregar estado da rotina via loadSettingsRoutineStatus",
  );
  assert.ok(
    server.includes('process.env.NODE_ENV !== "production"') &&
      server.includes('process.env.STUDY_ROUTINE_DEV_FALLBACK === "1"'),
    "Fallback em memória nunca pode atuar em produção",
  );
  assert.ok(
    server.includes("mergeDevFallbackCompletedUnitIds") &&
      server.includes("createDevFallbackRepository") &&
      server.includes("hydrateDashboardRecommendationIfNeeded"),
    "Fallback dev deve permanecer isolado em memória e hidratar recomendação",
  );
  assert.equal(
    server.includes("user_progress") && server.includes(".upsert("),
    false,
    "server.ts não deve executar upsert em user_progress no fallback dev",
  );
  assert.equal(
    repository.includes("user_progress") && repository.includes(".upsert("),
    false,
    "repository.mjs não deve executar upsert direto em user_progress no fallback dev",
  );
  assert.ok(
    server.includes("demoFallbackActive") && route.includes("demoFallbackActive"),
    "Estado e API da rotina devem sinalizar demoFallbackActive explicitamente",
  );
  assert.ok(
    todayCard.includes("Modo de demonstração local") &&
      sessionBar.includes("Modo de demonstração local") &&
      settings.includes("Modo de demonstração local"),
    "UI deve exibir aviso discreto quando o modo de demonstração em memória estiver ativo",
  );
  const implDoc = readWorkspaceFile("docs/GAMIFICACAO_IMPLEMENTACAO.md");
  assert.equal(
    implDoc.includes("tenta sincronizar `user_progress` ao concluir sessão"),
    false,
    "GAMIFICACAO_IMPLEMENTACAO.md não deve afirmar escrita de fallback em user_progress",
  );
  assert.ok(
    implDoc.includes("não gravam progresso no Supabase") &&
      implDoc.includes("fora da rotina demonstrativa"),
    "GAMIFICACAO_IMPLEMENTACAO.md deve explicitar isolamento do fallback e distinguir ações convencionais",
  );
  assert.ok(
    todayCard.includes("optionsByBudget?.[selectedBudget]"),
    "TodayStudyCard deve atualizar prévia ao trocar orçamento (5, 15, 30 min)",
  );
  assert.ok(
    sessionBar.includes('activeSession.status === "interrupted"') &&
      sessionBar.includes("handleResumeSession") &&
      sessionBar.includes("Sessão pausada"),
    "StudySessionBar deve exibir estado pausado e retomada direta na barra",
  );
  assert.equal(isGamificationOperationalEnabled({ NEXT_PUBLIC_DISABLE_GAMIFICATION: "true" }), false);
  assert.equal(isGamificationOperationalEnabled({ NEXT_PUBLIC_DISABLE_GAMIFICATION: "false" }), true);
});

test("migration 053 reconciliada, repositório usa RPCs transacionais e sem escrita direta", () => {
  const pgTest = readWorkspaceFile("tests/gamification-postgres.test.mjs");
  assert.equal(
    pgTest.includes("origin/" + "main") || pgTest.includes("git show") || pgTest.includes("execFileSync"),
    false,
    "gamification-postgres.test.mjs não deve depender de histórico Git ou referência externa mutável",
  );
  assert.ok(
    pgTest.includes("7eb374d01bd527f95c10501bd4e0c5febacb2115855a7915780f1719a85a9256") &&
      pgTest.includes("fdb3933d300b7b0ab56cdb7f0885f080f3dbe9ad818338f2eeba854465f074e0"),
    "gamification-postgres.test.mjs deve validar SHA-256 das fixtures SQL versionadas 026 e 052",
  );
  assert.equal(
    fs.existsSync(path.join(ROOT, "supabase/migrations/052_create_study_routine_gamification.sql")),
    false,
    "Migration 052 colidia com main e não deve existir",
  );
  const migration053 = readWorkspaceFile("supabase/migrations/053_create_study_routine_gamification.sql");
  const repository = readWorkspaceFile("src/lib/gamification/repository.mjs");

  assert.ok(
    migration053.includes("REVOKE ALL PRIVILEGES ON TABLE")
      && migration053.includes("FROM PUBLIC, anon, authenticated;"),
    "Migration 053 deve revogar escrita direta nas tabelas de rotina",
  );
  assert.ok(
    migration053.includes("trigger_enforce_session_has_activities"),
    "Migration 053 deve exigir ao menos uma atividade no COMMIT da sessão",
  );
  assert.ok(repository.includes('rpc("create_study_routine_session"'));
  assert.ok(repository.includes('rpc("save_study_routine_preferences"'));
  assert.ok(repository.includes('rpc("complete_study_routine_session"'));
  assert.equal(repository.includes("setTimeout"), false);
});

test("estado persistenceAvailable=false explica bloqueio antes do onboarding, desabilita controles e evita '0 de 3 dias' sem rotina ativa", () => {
  const todayCard = readWorkspaceFile("src/components/gamification/today-study-card.tsx").replace(
    /\r\n/g,
    "\n",
  );
  const sessionBar = readWorkspaceFile("src/components/gamification/study-session-bar.tsx").replace(
    /\r\n/g,
    "\n",
  );

  for (const [label, content] of [
    ["today-study-card.tsx", todayCard],
    ["study-session-bar.tsx", sessionBar],
  ]) {
    assert.ok(
      content.includes("const hasActivatedRoutine =") &&
        content.includes("persistenceAvailable && !snapshot.needsOnboarding && Boolean(snapshot.currentPlan)"),
      `${label} deve condicionar contagem semanal a rotina ativada com persistência disponível`,
    );
  }

  assert.ok(
    todayCard.includes("useState(\n    persistenceAvailable && initialSnapshot.needsOnboarding") ||
      todayCard.includes("useState(persistenceAvailable && initialSnapshot.needsOnboarding)"),
    "TodayStudyCard não deve abrir configuração por padrão quando persistenceAvailable é false",
  );
  assert.ok(
    todayCard.includes("((persistenceAvailable && snapshot.needsOnboarding) || configOpen)") &&
      todayCard.includes("<fieldset\n            disabled={!persistenceAvailable || Boolean(busyAction)}") &&
      todayCard.includes('href="#library-title"'),
    "TodayStudyCard deve ocultar/desabilitar campos de onboarding e preservar atalho ao acervo quando indisponível",
  );
  assert.ok(
    todayCard.indexOf("A persistência da rotina semanal está temporariamente indisponível") <
      todayCard.indexOf("<form"),
    "TodayStudyCard deve explicar o bloqueio de persistência antes do formulário de onboarding",
  );
  assert.ok(
    todayCard.includes(") : !hasActivatedRoutine ? (") &&
      todayCard.indexOf(") : !hasActivatedRoutine ? (") <
        todayCard.indexOf("{weeklyProgress.completedDaysCount} de {weeklyProgress.targetDays} dias") &&
      todayCard.includes("{hasActivatedRoutine && (\n        <div className=\"mt-4\">"),
    "TodayStudyCard deve exibir contagem semanal e grade de dias apenas quando hasActivatedRoutine for true",
  );

  assert.ok(
    sessionBar.indexOf("Persistência da rotina temporariamente indisponível") <
      sessionBar.indexOf("Iniciar sessão neste tópico"),
    "StudySessionBar deve exibir o aviso de persistência indisponível antes dos controles de sessão",
  );
  assert.ok(
    sessionBar.includes("Rotina semanal ainda não ativada") &&
      sessionBar.includes("disabled={!persistenceAvailable || Boolean(busyAction)}"),
    "StudySessionBar não deve exibir 0 de N dias antes da ativação e deve desabilitar controles quando indisponível",
  );
});
