import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import test from "node:test";

import {
  hasGoogleIdentity,
  hasGoogleSession,
  hasOAuthAuthentication,
} from "../src/lib/auth/google-only.mjs";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");

test("aceita somente usuários com provedor Google declarado", () => {
  assert.equal(hasGoogleIdentity(null), false);
  assert.equal(hasGoogleIdentity({ app_metadata: {} }), false);
  assert.equal(hasGoogleIdentity({ app_metadata: { providers: ["email"] } }), false);
  assert.equal(hasGoogleIdentity({ app_metadata: { providers: ["email", "google"] } }), true);
});

test("exige que a sessão atual tenha sido iniciada por OAuth", () => {
  const googleUser = { app_metadata: { providers: ["email", "google"] } };
  assert.equal(hasOAuthAuthentication({ amr: [{ method: "password" }] }), false);
  assert.equal(hasOAuthAuthentication({ amr: [{ method: "oauth" }] }), true);
  assert.equal(hasGoogleSession(googleUser, { amr: ["oauth", "totp"] }), true);
  assert.equal(hasGoogleSession(googleUser, { amr: ["password", "totp"] }), false);
});

test("login público e administrativo usam somente Google OAuth", () => {
  const publicLogin = read("../src/components/auth/login-form.tsx");
  const adminLogin = read("../src/components/auth/admin-login-form.tsx");
  const sources = `${publicLogin}\n${adminLogin}`;

  assert.match(publicLogin, /signInWithOAuth/);
  assert.match(adminLogin, /signInWithOAuth/);
  assert.match(sources, /provider:\s*["']google["']/);
  assert.doesNotMatch(
    sources,
    /signInWithPassword|signInWithOtp|\.signUp\(|resetPasswordForEmail|type=["']password["']/
  );
});

test("callback, proxy e guardas rejeitam sessões sem identidade Google", () => {
  for (const path of [
    "../src/app/auth/callback/route.ts",
    "../src/proxy.ts",
    "../src/app/dashboard/layout.tsx",
    "../src/lib/content-access.ts",
    "../src/lib/note-image-access.ts",
  ]) {
    assert.match(read(path), /hasGoogleSession/);
  }
});

test("bootstrap administrativo não cria conta nem senha", () => {
  const bootstrap = read("../scripts/bootstrap-admin.mjs");
  assert.match(bootstrap, /hasGoogleIdentity/);
  assert.doesNotMatch(bootstrap, /randomBytes|createUser\(|password\s*:/);
});

test("área de conta não mantém componente de recuperação por senha", () => {
  assert.equal(
    existsSync(new URL("../src/app/dashboard/conta/password-recovery-button.tsx", import.meta.url)),
    false
  );
  assert.doesNotMatch(read("../src/app/dashboard/conta/page.tsx"), /PasswordRecovery|redefinir senha/i);
});
