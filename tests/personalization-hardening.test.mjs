import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("tema é validado, persistido por conta e aplicado no HTML inicial", async () => {
  const [migration, route, layout, provider] = await Promise.all([
    read("supabase/migrations/028_add_user_theme_preference.sql"),
    read("src/app/api/preferences/theme/route.ts"),
    read("src/app/layout.tsx"),
    read("src/components/theme-provider.tsx"),
  ]);

  assert.match(migration, /CHECK \(theme IN \('light', 'dark', 'sepia'\)\)/);
  assert.match(route, /auth\.getUser\(\)/);
  assert.match(route, /user_id: user\.id, theme/);
  assert.match(route, /isSameOriginRequest/);
  assert.match(layout, /data-theme=\{initialTheme\}/);
  assert.match(provider, /addEventListener\("storage"/);
});

test("edição de nota exige a versão carregada", async () => {
  const source = await read("src/app/dashboard/notas/note-card.tsx");
  assert.match(source, /\.eq\("updated_at", updatedAt\)/);
  assert.match(source, /alterada em outra aba ou dispositivo/);
});

test("área de notas preserva identidade e alvos táteis acessíveis", async () => {
  const [page, card, hero] = await Promise.all([
    read("src/app/dashboard/notas/page.tsx"),
    read("src/app/dashboard/notas/note-card.tsx"),
    read("src/components/dashboard/dashboard-page-hero.tsx"),
  ]);

  assert.match(page, /Suas notas de estudo/);
  assert.match(page, /DashboardPageHero/);
  assert.match(hero, /catalog-hero-start/);
  assert.match(page, /notesSummary/);
  assert.match(card, /min-h-11/);
  assert.match(card, /focus-visible:outline-\[var\(--accent\)\]/);
});

test("módulos auxiliares compartilham identidade sem apagar suas funções", async () => {
  const [hero, planner, notes, settings, account, subscription] = await Promise.all([
    read("src/components/dashboard/dashboard-page-hero.tsx"),
    read("src/app/dashboard/planner/page.tsx"),
    read("src/app/dashboard/notas/page.tsx"),
    read("src/app/dashboard/configuracoes/page.tsx"),
    read("src/app/dashboard/conta/page.tsx"),
    read("src/app/dashboard/assinatura/page.tsx"),
  ]);

  assert.match(hero, /catalog-hero-start/);
  assert.match(hero, /children\?: ReactNode/);
  for (const source of [planner, notes, settings, account, subscription]) {
    assert.match(source, /DashboardPageHero/);
  }
  assert.match(planner, /PlannerClient/);
  assert.match(notes, /NoteCard/);
  assert.match(settings, /PreferencesForm/);
  assert.match(account, /PrivacyRequestForm/);
  assert.match(subscription, /CancelSubscriptionButton/);
});

test("navegação e ações principais mantêm alvo tátil no mobile", async () => {
  const [backLink, navigation, themes, questions, landing, institutional, support] = await Promise.all([
    read("src/components/navigation/dashboard-back-link.tsx"),
    read("src/components/navigation/dashboard-navigation.tsx"),
    read("src/components/theme-switcher.tsx"),
    read("src/app/dashboard/questoes/questions-client.tsx"),
    read("src/components/landing/landing-page-content.tsx"),
    read("src/app/(institutional)/layout.tsx"),
    read("src/app/(institutional)/suporte/page.tsx"),
  ]);

  assert.match(backLink, /min-h-11/);
  assert.match(navigation, /h-11 w-11/);
  assert.match(themes, /h-11[\s\S]*lg:h-9/);
  assert.match(questions, /h-11 w-11[\s\S]*sm:h-10 sm:w-10/);
  assert.match(landing, /inline-flex min-h-11 items-center/);
  assert.match(institutional, /inline-flex min-h-11 items-center/);
  assert.match(support, /inline-flex min-h-11 items-center/);
});

test("datas das notas são estáveis entre servidor e navegador", async () => {
  const [formatter, card, panel] = await Promise.all([
    read("src/lib/format-date.ts"),
    read("src/app/dashboard/notas/note-card.tsx"),
    read("src/components/study/notes-panel.tsx"),
  ]);

  assert.match(formatter, /timeZone: "America\/Sao_Paulo"/);
  assert.match(card, /formatBrazilDateTime\(updatedAt\)/);
  assert.match(panel, /formatBrazilDateTime\(note\.updated_at\)/);
  assert.doesNotMatch(card, /updatedAt\)\.toLocaleString/);
  assert.doesNotMatch(panel, /note\.updated_at\)\.toLocaleString/);
});

test("logos acima da dobra priorizam somente a variante visível", async () => {
  const [logo, navigation, login] = await Promise.all([
    read("src/components/brand/pro-logo.tsx"),
    read("src/components/navigation/dashboard-navigation.tsx"),
    read("src/app/login/page.tsx"),
  ]);

  assert.match(logo, /fetchPriority=\{highPriority \? "high" : "auto"\}/);
  assert.match(navigation, /variant=\{isCollapsed \? "icon" : "full"\}[\s\S]*highPriority/);
  assert.match(login, /variant="full"[\s\S]*highPriority/);
  assert.doesNotMatch(logo, /loading="eager"/);
  assert.doesNotMatch(logo, /preload=/);
});

test("limpeza de imagens é autenticada, idempotente e reconciliável", async () => {
  const [deleteRoute, reconcileRoute, reconciler] = await Promise.all([
    read("src/app/api/note-images/[imageId]/route.ts"),
    read("src/app/api/note-images/reconcile/route.ts"),
    read("src/components/note-image-reconciler.tsx"),
  ]);

  assert.match(deleteRoute, /releaseError/);
  assert.match(reconcileRoute, /authorizeNoteImageRequest/);
  assert.match(reconcileRoute, /ORPHAN_GRACE_PERIOD_MS/);
  assert.match(reconcileRoute, /referencedIds\.has\(image\.id\)/);
  assert.match(reconciler, /RECONCILIATION_INTERVAL_MS/);
});

test("teste remoto cobre realces e metadados de imagens", async () => {
  const source = await read("scripts/test-rls-two-users.mjs");
  assert.match(source, /assertOwnRows\(user\.client, "user_text_highlights"/);
  assert.match(source, /assertOwnRows\(user\.client, "user_note_images"/);
  assert.match(source, /usuário A não deve alterar realce de B/);
  assert.match(source, /usuário A não deve ler metadados de imagem de B/);
});
