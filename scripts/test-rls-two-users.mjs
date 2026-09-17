import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !anonKey || !serviceRoleKey) throw new Error("Configuração Supabase ausente para o teste RLS.");

const options = { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } };
const admin = createClient(url, serviceRoleKey, options);
const runId = randomUUID();
const password = `Rls-${randomBytes(24).toString("base64url")}aA1!`;
const createdUserIds = [];
const privacyRequestIds = [];
const paymentBlockIds = [];
let assertionsPassed = false;

async function createTestUser(label) {
  const { data, error } = await admin.auth.admin.createUser({
    email: `rls-${label}-${runId}@example.com`,
    password,
    email_confirm: true,
  });
  if (error || !data.user) throw new Error(`Falha ao criar usuário de teste ${label}.`);
  createdUserIds.push(data.user.id);

  const client = createClient(url, anonKey, options);
  const { error: signInError } = await client.auth.signInWithPassword({ email: data.user.email, password });
  if (signInError) {
    throw new Error(`Falha ao autenticar usuário de teste ${label}: ${signInError.code ?? "unknown"}/${signInError.status ?? "no-status"}/${signInError.message}.`);
  }
  return { id: data.user.id, email: data.user.email, client };
}

async function mustInsert(table, row) {
  const { data, error } = await admin.from(table).insert(row).select("*").single();
  if (error) throw new Error(`Falha ao preparar fixture em ${table}: ${error.code ?? "unknown"}.`);
  return data;
}

async function assertOwnRows(client, table, ownUserId) {
  const { data, error } = await client.from(table).select("user_id");
  assert.equal(error, null, `${table}: SELECT deve ser permitido`);
  assert.deepEqual((data ?? []).map((row) => row.user_id), [ownUserId], `${table}: somente a linha própria deve estar visível`);
}

async function cleanupStaleTestUsers() {
  let page = 1;
  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw new Error("Falha ao auditar fixtures Auth antigas.");
    const stale = data.users.filter((user) => /^rls-[ab]-[0-9a-f-]+@example\.(?:com|test)$/i.test(user.email ?? ""));
    for (const user of stale) await admin.auth.admin.deleteUser(user.id);
    if (data.users.length < 1000) break;
    page += 1;
  }
}

try {
  await cleanupStaleTestUsers();
  const { data: section, error: sectionError } = await admin
    .from("sections").select("section_id, content_unit_id").is("archived_at", null).limit(1).single();
  if (sectionError || !section) throw new Error("Nenhuma seção ativa disponível para a fixture RLS.");
  const userA = await createTestUser("a");
  const userB = await createTestUser("b");

  const fixtures = await Promise.all([
    mustInsert("user_notes", { user_id: userA.id, section_id: section.section_id, content_unit_id: section.content_unit_id, content: "fixture-a" }),
    mustInsert("user_notes", { user_id: userB.id, section_id: section.section_id, content_unit_id: section.content_unit_id, content: "fixture-b" }),
    mustInsert("user_progress", { user_id: userA.id, section_id: section.section_id, content_unit_id: section.content_unit_id, completed: true }),
    mustInsert("user_progress", { user_id: userB.id, section_id: section.section_id, content_unit_id: section.content_unit_id, completed: false }),
    mustInsert("user_dashboard_preferences", { user_id: userA.id, visible_disciplines: ["A"] }),
    mustInsert("user_dashboard_preferences", { user_id: userB.id, visible_disciplines: ["B"] }),
    mustInsert("user_entitlements", { user_id: userA.id, provider: "mercado_pago", provider_subscription_id: `rls-${runId}-a`, status: "active" }),
    mustInsert("user_entitlements", { user_id: userB.id, provider: "mercado_pago", provider_subscription_id: `rls-${runId}-b`, status: "pending" }),
    mustInsert("privacy_requests", { user_id: userA.id, contact_email: userA.email, request_type: "access", message: "solicitação RLS do usuário A" }),
    mustInsert("privacy_requests", { user_id: userB.id, contact_email: userB.email, request_type: "deletion", message: "solicitação RLS do usuário B" }),
  ]);
  privacyRequestIds.push(fixtures[8].id, fixtures[9].id);

  for (const user of [userA, userB]) {
    await assertOwnRows(user.client, "user_notes", user.id);
    await assertOwnRows(user.client, "user_progress", user.id);
    await assertOwnRows(user.client, "user_dashboard_preferences", user.id);
    await assertOwnRows(user.client, "user_entitlements", user.id);
    await assertOwnRows(user.client, "privacy_requests", user.id);
  }

  const { data: accessBeforeBlock, error: accessBeforeBlockError } = await userA.client.rpc("has_active_content_access");
  assert.equal(accessBeforeBlockError, null, "usuário A deve conseguir consultar o próprio acesso");
  assert.equal(accessBeforeBlock, true, "entitlement ativo deve liberar usuário A antes do bloqueio");

  const paymentBlock = await mustInsert("payment_access_blocks", {
    user_id: userA.id,
    provider: "mercado_pago",
    provider_subscription_id: `rls-${runId}-a`,
    resource_id: `rls-chargeback-${runId}`,
    reason: "chargeback",
    provider_updated_at: new Date().toISOString(),
  });
  paymentBlockIds.push(paymentBlock.id);

  const { data: accessAfterBlock, error: accessAfterBlockError } = await userA.client.rpc("has_active_content_access");
  assert.equal(accessAfterBlockError, null, "usuário A deve conseguir reconsultar o próprio acesso");
  assert.equal(accessAfterBlock, false, "chargeback ativo deve revogar o acesso de usuário A");

  const { data: replayApplied, error: replayError } = await admin.rpc("apply_payment_entitlement", {
    p_user_id: userA.id,
    p_provider: "mercado_pago",
    p_provider_subscription_id: `rls-${runId}-a`,
    p_status: "active",
    p_access_until: null,
    p_provider_updated_at: new Date(Date.now() + 60_000).toISOString(),
  });
  assert.equal(replayError, null, "service role deve conseguir chamar a função de entitlement");
  assert.equal(replayApplied, false, "evento ativo posterior não deve contornar chargeback pendente");

  const { error: blockReadError } = await userA.client.from("payment_access_blocks").select("id");
  assert.ok(blockReadError, "browser não deve consultar bloqueios financeiros internos");

  const { data: foreignUpdate, error: foreignUpdateError } = await userA.client
    .from("user_notes").update({ content: "tentativa indevida" }).eq("user_id", userB.id).select("id");
  assert.equal(foreignUpdateError, null, "UPDATE filtrado por RLS não deve revelar a existência da nota alheia");
  assert.equal(foreignUpdate?.length, 0, "usuário A não deve alterar nota do usuário B");

  const { error: forgedInsertError } = await userA.client.from("user_progress").insert({
    user_id: userB.id,
    section_id: section.section_id,
    content_unit_id: section.content_unit_id,
    completed: true,
  });
  assert.equal(forgedInsertError?.code, "42501", "usuário A não deve gravar progresso em nome de B");

  const { error: entitlementUpdateError } = await userA.client
    .from("user_entitlements").update({ status: "active" }).eq("user_id", userA.id);
  assert.ok(entitlementUpdateError, "browser não deve alterar entitlement nem do próprio usuário");

  const { error: privacyInsertError } = await userA.client.from("privacy_requests").insert({
    user_id: userA.id,
    contact_email: userA.email,
    request_type: "access",
    message: "tentativa de contornar o endpoint",
  });
  assert.ok(privacyInsertError, "browser não deve inserir solicitação LGPD diretamente");

  assertionsPassed = true;
} finally {
  if (paymentBlockIds.length) {
    const { error } = await admin.from("payment_access_blocks").delete().in("id", paymentBlockIds);
    if (error) throw new Error("Falha ao remover fixtures de bloqueio financeiro.");
  }
  if (privacyRequestIds.length) {
    const { error } = await admin.from("privacy_requests").delete().in("id", privacyRequestIds);
    if (error) throw new Error("Falha ao remover fixtures de privacidade.");
  }
  for (const userId of createdUserIds.reverse()) {
    const { error } = await admin.auth.admin.deleteUser(userId);
    if (error) throw new Error("Falha ao remover fixture Auth.");
  }
}

if (assertionsPassed) console.log("RLS de dois usuários: 18 verificações aprovadas em produção; fixtures removidas.");
