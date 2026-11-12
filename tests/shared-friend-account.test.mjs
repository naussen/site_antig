import test from "node:test";
import assert from "node:assert/strict";
import { hasMemberSession } from "../src/lib/auth/member-session.mjs";
import { SHARED_ACCOUNT_EMAIL } from "../src/lib/auth/shared-account.mjs";
import { passwordForRotation, rotateSharedFriendAccount } from "../scripts/lib/shared-friend-account.mjs";

const env = { SHARED_ACCOUNT_ROTATION_SECRET: "x".repeat(40), RESEND_API_KEY: "fake", SHARED_ACCOUNT_MAIL_FROM: "test@example.com" };
const user = { id: "shared-id", email: SHARED_ACCOUNT_EMAIL, app_metadata: { shared_account: true } };

test("exceção aceita apenas identidade compartilhada confiável e sessão por senha", () => {
  const claims = { sub: user.id, amr: [{ method: "password" }] };
  assert.equal(hasMemberSession(user, claims), true);
  for (const altered of [
    { ...user, email: "other@example.com" },
    { ...user, app_metadata: { role: "admin", shared_account: true } },
    { ...user, app_metadata: {}, user_metadata: { shared_account: true } },
  ]) assert.equal(hasMemberSession(altered, claims), false);
  assert.equal(hasMemberSession(user, { ...claims, sub: "other-id" }), false);
  assert.equal(hasMemberSession(user, { ...claims, amr: ["recovery"] }), false);
  assert.equal(hasMemberSession({ app_metadata: { providers: ["google"] } }, { amr: ["oauth"] }), true);
});

test("senha forte é estável para retries e muda entre rotações", () => {
  assert.throws(() => passwordForRotation("short", "id"));
  const password = passwordForRotation(env.SHARED_ACCOUNT_ROTATION_SECRET, "one");
  assert.ok(password.length >= 40);
  assert.equal(password, passwordForRotation(env.SHARED_ACCOUNT_ROTATION_SECRET, "one"));
  assert.notEqual(password, passwordForRotation(env.SHARED_ACCOUNT_ROTATION_SECRET, "two"));
});

function fake({ due = true, rotated = false, missing = false, invalid = false, mfa = false } = {}) {
  const calls = [];
  const state = { rotation_id: "rotation-id", user_id: missing ? null : user.id, rotated_at: rotated ? "2026-11-11T00:00:00Z" : null };
  const ok = (data) => ({ data, error: null });
  const client = {
    rpc: async () => { calls.push("claim"); return ok(due ? [state] : []); },
    auth: { admin: {
      getUserById: async () => ok({ user: invalid ? { ...user, app_metadata: {} } : { ...user, factors: mfa ? [{ status: "verified" }] : [] } }),
      listUsers: async () => ok({ users: [] }),
      createUser: async () => { calls.push("create"); return ok({ user }); },
      updateUserById: async (_, data) => { calls.push({ password: data.password }); return ok({ user }); },
    } },
    from: (table) => ({
      update: (data) => ({ eq: async () => { calls.push({ table, ...data }); return ok(null); } }),
      upsert: async (data) => { calls.push({ table, ...data }); return ok(null); },
    }),
  };
  return { client, calls };
}

test("não altera conta sem serviço de entrega configurado ou antes do vencimento", async () => {
  const { client, calls } = fake({ due: false });
  await assert.rejects(rotateSharedFriendAccount(client, {}));
  assert.deepEqual(calls, []);
  assert.equal(await rotateSharedFriendAccount(client, env), "not_due");
  assert.deepEqual(calls, ["claim"]);
});

test("cria uma identidade comum, concede estudo e envia somente ao administrador", async () => {
  const { client, calls } = fake({ missing: true });
  let mail;
  assert.equal(await rotateSharedFriendAccount(client, env, async (_, request) => {
    mail = JSON.parse(request.body);
    return { ok: true };
  }), "delivered");
  assert.equal(calls.filter((call) => call === "create").length, 1);
  assert.deepEqual(mail.to, ["nvpezat@gmail.com"]);
  assert.ok(mail.text.includes(passwordForRotation(env.SHARED_ACCOUNT_ROTATION_SECRET, "rotation-id")));
  assert.ok(calls.some((call) => call.table === "user_entitlements" && call.status === "active"));
  assert.ok(calls.some((call) => call.delivered_at));
  assert.equal(calls.at(-1).lease_until, null);
});

test("entrega pendente repete a mesma senha sem nova rotação", async () => {
  const { client, calls } = fake({ rotated: true });
  await assert.rejects(rotateSharedFriendAccount(client, env, async () => ({ ok: false })));
  assert.equal(calls.some((call) => call.password), false);
  assert.equal(calls.some((call) => call.delivered_at), false);
  assert.equal(calls.at(-1).lease_until, null);
  assert.equal(await rotateSharedFriendAccount(client, env, async () => ({ ok: true })), "delivered");
});

test("recusa identidade incorreta ou MFA sem modificar senha nem enviar", async () => {
  for (const options of [{ invalid: true }, { mfa: true }]) {
    const { client, calls } = fake(options);
    await assert.rejects(rotateSharedFriendAccount(client, env, async () => assert.fail("não enviar")));
    assert.equal(calls.some((call) => call.password), false);
  }
});
