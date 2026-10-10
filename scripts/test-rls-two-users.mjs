import assert from "node:assert/strict";
import { createHmac, randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !anonKey || !serviceRoleKey) throw new Error("Configuração Supabase ausente para o teste RLS.");

const options = { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } };
let admin;
const runId = randomUUID();
const createdUserIds = [];
const privacyRequestIds = [];
const paymentBlockIds = [];
let assertionsPassed = false;

function assertPublicKeyIsUsable() {
  if (!anonKey.startsWith("sb_publishable_")) {
    throw new Error(
      "A chave pública local é legada; atualize NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY antes de criar fixtures RLS.",
    );
  }
}

async function createTestUser(label) {
  const { data, error } = await admin.auth.admin.createUser({
    email: `rls-${label}-${runId}@example.com`,
    email_confirm: true,
  });
  if (error || !data.user) throw new Error(`Falha ao criar usuário de teste ${label}.`);
  createdUserIds.push(data.user.id);

  const { data: linkData, error: linkError } =
    await admin.auth.admin.generateLink({
      type: "magiclink",
      email: data.user.email,
    });
  if (linkError || !linkData.properties?.hashed_token) {
    throw new Error(`Falha ao gerar credencial efêmera para usuário de teste ${label}.`);
  }

  const client = createClient(url, anonKey, options);
  const { error: signInError } = await client.auth.verifyOtp({
    type: "magiclink",
    token_hash: linkData.properties.hashed_token,
  });
  if (signInError) {
    throw new Error(`Falha ao autenticar usuário de teste ${label}: ${signInError.code ?? "unknown"}/${signInError.status ?? "no-status"}/${signInError.message}.`);
  }
  return { id: data.user.id, email: data.user.email, client };
}

function decodeBase32(value) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = "";
  for (const character of value.toUpperCase().replace(/=+$/u, "")) {
    const index = alphabet.indexOf(character);
    if (index < 0) throw new Error("Segredo TOTP de teste inválido.");
    bits += index.toString(2).padStart(5, "0");
  }

  const bytes = [];
  for (let index = 0; index + 8 <= bits.length; index += 8) {
    bytes.push(Number.parseInt(bits.slice(index, index + 8), 2));
  }
  return Buffer.from(bytes);
}

function createTotpCode(secret, timestamp = Date.now()) {
  const counter = Math.floor(timestamp / 30_000);
  const buffer = Buffer.alloc(8);
  buffer.writeBigUInt64BE(BigInt(counter));
  const digest = createHmac("sha1", decodeBase32(secret)).update(buffer).digest();
  const offset = digest[digest.length - 1] & 0x0f;
  const code = (digest.readUInt32BE(offset) & 0x7fffffff) % 1_000_000;
  return code.toString().padStart(6, "0");
}

async function assertContentAccess(user, expected, message) {
  const { data, error } = await user.client.rpc("has_active_content_access");
  assert.equal(error, null, `${message}: consulta deve funcionar`);
  assert.equal(data, expected, message);
  await assertLibraryAccess(user.client, expected, message);
}

async function assertLibraryAccess(client, expected, message) {
  const { data, error } = await client.from("sections").select("section_id").limit(1);
  if (!expected && error) {
    assert.equal(error.code, "42501", `${message}: negação direta deve usar privilégio insuficiente`);
    return;
  }
  assert.equal(error, null, `${message}: leitura do acervo deve ser avaliada por RLS`);
  assert.equal((data?.length ?? 0) > 0, expected, `${message}: RLS do acervo deve acompanhar o gate`);
}

async function applyEntitlement(userId, status, accessUntil, sequence) {
  const { data, error } = await admin.rpc("apply_payment_entitlement", {
    p_user_id: userId,
    p_provider: "mercado_pago",
    p_provider_subscription_id: `rls-${runId}-matrix`,
    p_status: status,
    p_access_until: accessUntil,
    p_provider_updated_at: new Date(Date.now() + sequence * 60_000).toISOString(),
  });
  assert.equal(error, null, `matriz ${status}: atualização deve funcionar`);
  assert.equal(data, true, `matriz ${status}: atualização deve ser aplicada`);
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
    const stale = data.users.filter((user) => /^rls-(?:a|b|admin)-[0-9a-f-]+@example\.(?:com|test)$/i.test(user.email ?? ""));
    for (const user of stale) await admin.auth.admin.deleteUser(user.id);
    if (data.users.length < 1000) break;
    page += 1;
  }
}

try {
  assertPublicKeyIsUsable();
  admin = createClient(url, serviceRoleKey, options);
  await cleanupStaleTestUsers();
  const { data: section, error: sectionError } = await admin
    .from("sections").select("section_id, content_unit_id").is("archived_at", null).limit(1).single();
  if (sectionError || !section) throw new Error("Nenhuma seção ativa disponível para a fixture RLS.");
  await assertLibraryAccess(createClient(url, anonKey, options), false, "visitante anônimo não deve ler o acervo");
  const userA = await createTestUser("a");
  const userB = await createTestUser("b");
  const adminUser = await createTestUser("admin");
  const { error: adminRoleError } = await admin.auth.admin.updateUserById(adminUser.id, {
    app_metadata: { role: "admin" },
  });
  assert.equal(adminRoleError, null, "fixture administrativa deve receber o papel admin");
  const plannerStartDate = "2026-09-21";
  const highlightIds = { a: randomUUID(), b: randomUUID() };
  const imageIds = { a: randomUUID(), b: randomUUID() };

  const [planA, planB] = await Promise.all([
    mustInsert("study_plans", { user_id: userA.id, title: "Planner A", start_date: plannerStartDate, weeks_count: 2 }),
    mustInsert("study_plans", { user_id: userB.id, title: "Planner B", start_date: plannerStartDate, weeks_count: 2 }),
  ]);

  await Promise.all([
    mustInsert("study_plan_items", { plan_id: planA.id, user_id: userA.id, discipline: "A", study_date: plannerStartDate, start_minute: 360, end_minute: 420 }),
    mustInsert("study_plan_items", { plan_id: planB.id, user_id: userB.id, discipline: "B", study_date: plannerStartDate, start_minute: 360, end_minute: 420 }),
  ]);

  const fixtures = await Promise.all([
    mustInsert("user_notes", { user_id: userA.id, section_id: section.section_id, content_unit_id: section.content_unit_id, content: "fixture-a" }),
    mustInsert("user_notes", { user_id: userB.id, section_id: section.section_id, content_unit_id: section.content_unit_id, content: "fixture-b" }),
    mustInsert("user_progress", { user_id: userA.id, section_id: section.section_id, content_unit_id: section.content_unit_id, completed: true }),
    mustInsert("user_progress", { user_id: userB.id, section_id: section.section_id, content_unit_id: section.content_unit_id, completed: false }),
    mustInsert("user_dashboard_preferences", { user_id: userA.id, visible_disciplines: ["A"] }),
    mustInsert("user_dashboard_preferences", { user_id: userB.id, visible_disciplines: ["B"] }),
    mustInsert("user_text_highlights", { id: highlightIds.a, user_id: userA.id, section_id: section.section_id, content_unit_id: section.content_unit_id, color: "yellow", start_offset: 0, end_offset: 1, selected_text: "A", prefix: "", suffix: "" }),
    mustInsert("user_text_highlights", { id: highlightIds.b, user_id: userB.id, section_id: section.section_id, content_unit_id: section.content_unit_id, color: "blue", start_offset: 0, end_offset: 1, selected_text: "B", prefix: "", suffix: "" }),
    mustInsert("user_note_images", { id: imageIds.a, user_id: userA.id, storage_path: `${userA.id}/${imageIds.a}.webp` }),
    mustInsert("user_note_images", { id: imageIds.b, user_id: userB.id, storage_path: `${userB.id}/${imageIds.b}.webp` }),
    mustInsert("user_entitlements", { user_id: userA.id, provider: "mercado_pago", provider_subscription_id: `rls-${runId}-a`, status: "active" }),
    mustInsert("user_entitlements", { user_id: userB.id, provider: "mercado_pago", provider_subscription_id: `rls-${runId}-b`, status: "pending" }),
    mustInsert("privacy_requests", { user_id: userA.id, contact_email: userA.email, request_type: "access", message: "solicitação RLS do usuário A" }),
    mustInsert("privacy_requests", { user_id: userB.id, contact_email: userB.email, request_type: "deletion", message: "solicitação RLS do usuário B" }),
  ]);
  privacyRequestIds.push(fixtures[12].id, fixtures[13].id);

  for (const user of [userA, userB]) {
    await assertOwnRows(user.client, "user_notes", user.id);
    await assertOwnRows(user.client, "user_progress", user.id);
    await assertOwnRows(user.client, "user_dashboard_preferences", user.id);
    await assertOwnRows(user.client, "user_text_highlights", user.id);
    await assertOwnRows(user.client, "user_note_images", user.id);
    await assertOwnRows(user.client, "user_entitlements", user.id);
    await assertOwnRows(user.client, "privacy_requests", user.id);
    await assertOwnRows(user.client, "study_plans", user.id);
    await assertOwnRows(user.client, "study_plan_items", user.id);
  }

  await assertContentAccess(userA, true, "entitlement ativo deve liberar usuário A antes do bloqueio");
  await assertContentAccess(userB, false, "entitlement pendente não deve liberar usuário B");

  await applyEntitlement(userB.id, "expired", new Date(Date.now() - 60_000).toISOString(), 1);
  await assertContentAccess(userB, false, "entitlement expirado não deve liberar usuário B");
  await applyEntitlement(userB.id, "canceled", new Date(Date.now() + 3_600_000).toISOString(), 2);
  await assertContentAccess(userB, true, "cancelamento deve preservar acesso até o prazo futuro");
  await applyEntitlement(userB.id, "canceled", new Date(Date.now() - 60_000).toISOString(), 3);
  await assertContentAccess(userB, false, "cancelamento com prazo vencido deve bloquear o acesso");
  await applyEntitlement(userB.id, "active", null, 4);
  await assertContentAccess(userB, true, "entitlement ativo sem prazo deve liberar usuário B");

  await assertContentAccess(adminUser, false, "administrador em AAL1 não deve contornar o gate");
  const { data: factor, error: enrollmentError } = await adminUser.client.auth.mfa.enroll({
    factorType: "totp",
    friendlyName: `rls-${runId}`,
  });
  assert.equal(enrollmentError, null, "fixture administrativa deve cadastrar TOTP");
  assert.ok(factor?.id && factor.totp?.secret, "cadastro TOTP deve retornar fator e segredo");
  const { error: verificationError } = await adminUser.client.auth.mfa.challengeAndVerify({
    factorId: factor.id,
    code: createTotpCode(factor.totp.secret),
  });
  assert.equal(verificationError, null, "fixture administrativa deve elevar a sessão para AAL2");
  await assertContentAccess(adminUser, true, "administrador em AAL2 deve acessar sem entitlement");

  const paymentBlock = await mustInsert("payment_access_blocks", {
    user_id: userA.id,
    provider: "mercado_pago",
    provider_subscription_id: `rls-${runId}-a`,
    resource_id: `rls-chargeback-${runId}`,
    reason: "chargeback",
    provider_updated_at: new Date().toISOString(),
  });
  paymentBlockIds.push(paymentBlock.id);

  await assertContentAccess(userA, false, "chargeback ativo deve revogar o acesso de usuário A");

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

  const { data: foreignHighlightUpdate, error: foreignHighlightUpdateError } = await userA.client
    .from("user_text_highlights")
    .update({ color: "red" })
    .eq("id", highlightIds.b)
    .select("id");
  assert.equal(foreignHighlightUpdateError, null, "RLS não deve revelar o realce alheio");
  assert.equal(foreignHighlightUpdate?.length, 0, "usuário A não deve alterar realce de B");

  const { data: foreignImageRead, error: foreignImageReadError } = await userA.client
    .from("user_note_images")
    .select("id")
    .eq("id", imageIds.b);
  assert.equal(foreignImageReadError, null, "RLS não deve revelar metadados da imagem alheia");
  assert.equal(foreignImageRead?.length, 0, "usuário A não deve ler metadados de imagem de B");

  const forgedImageId = randomUUID();
  const { error: forgedImageInsertError } = await userA.client.from("user_note_images").insert({
    id: forgedImageId,
    user_id: userA.id,
    storage_path: `${userA.id}/${forgedImageId}.webp`,
  });
  assert.ok(forgedImageInsertError, "browser não deve reservar metadados de imagem diretamente");

  const { error: forgedInsertError } = await userA.client.from("user_progress").insert({
    user_id: userB.id,
    section_id: section.section_id,
    content_unit_id: section.content_unit_id,
    completed: true,
  });
  assert.equal(forgedInsertError?.code, "42501", "usuário A não deve gravar progresso em nome de B");

  const { error: forgedPlannerInsertError } = await userA.client.from("study_plan_items").insert({
    plan_id: planB.id,
    user_id: userB.id,
    discipline: "A",
    study_date: plannerStartDate,
    start_minute: 420,
    end_minute: 480,
  });
  assert.ok(forgedPlannerInsertError, "usuário A não deve criar horário no planner de B");

  const { error: overlappingItemError } = await userA.client.from("study_plan_items").insert({
    plan_id: planA.id,
    user_id: userA.id,
    discipline: "A",
    study_date: plannerStartDate,
    start_minute: 390,
    end_minute: 450,
  });
  assert.equal(overlappingItemError?.code, "23P01", "horários sobrepostos devem ser rejeitados pelo banco");

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

if (assertionsPassed) console.log("RLS, estados de acesso e AAL administrativo validados; fixtures removidas.");
