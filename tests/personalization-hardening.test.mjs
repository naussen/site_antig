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
